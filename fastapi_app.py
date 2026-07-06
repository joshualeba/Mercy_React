from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os

from database import engine, get_db, Base
import models
import schemas

# Create tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mercy API")

# Configure CORS for React Native and Admin Web
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Configuration
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "banksecret") # Using same secret key for now
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/api/registro")
def registrar_usuario(user: schemas.UserRegister, db: Session = Depends(get_db)):
    db_user = db.query(models.Usuarios).filter(models.Usuarios.correo_electronico == user.correo_electronico.lower()).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    # Crear Datos Personales
    nuevos_datos = models.DatosP(
        nombre=user.nombres,
        apellidoP=user.apellidos,
        apellidoM='',
        fecha_nacimiento=datetime.now()
    )
    db.add(nuevos_datos)
    db.flush()
    
    # Crear Usuario
    nuevo_usuario = models.Usuarios(
        id_datosP=nuevos_datos.id,
        correo_electronico=user.correo_electronico.lower(),
        contrasena=get_password_hash(user.contrasena),
        provider='local'
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {"success": True, "message": "Usuario registrado exitosamente"}

@app.post("/api/login")
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(models.Usuarios).filter(models.Usuarios.correo_electronico == user.correo.lower()).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="El correo electrónico no está registrado, por favor, primero crea una cuenta.")
        
    if db_user.provider == 'google':
        raise HTTPException(status_code=400, detail="Esta cuenta está registrada con Google.")
        
    if not verify_password(user.contrasena, db_user.contrasena):
        # Allow checking werkzeug hashes from previous flask app
        from werkzeug.security import check_password_hash
        if check_password_hash(db_user.contrasena, user.contrasena):
            # Update to passlib hash silently if desired, skipped for simplicity
            pass
        else:
            raise HTTPException(status_code=401, detail="La contraseña es incorrecta")
    
    # Update last login
    db_user.ultima_sesion = datetime.now()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(db_user.id), "role": db_user.role}
    )
    
    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": db_user.id,
            "nombre": db_user.datosp.nombre if db_user.datosp else "",
            "correo": db_user.correo_electronico,
            "rol": db_user.role
        }
    }

@app.post("/api/calcular_salud")
def calcular_salud(data: schemas.DiagnosticoIn, db: Session = Depends(get_db)):
    if data.ingresos <= 0:
        raise HTTPException(status_code=400, detail="Los ingresos deben ser mayores a 0")
        
    puntaje = 100
    analisis = []

    # 1. ANÁLISIS DE GASTOS FIJOS
    ratio_gastos = (data.gastos / data.ingresos) * 100
    if ratio_gastos > 60:
        puntaje -= 25
        analisis.append({
            "tipo": "gasto", "estado": "mal", "titulo": "Gastos fijos altos",
            "texto": f"Tus gastos fijos consumen el {ratio_gastos:.0f}% de tu ingreso. Lo ideal es mantenerlos bajo el 50%."
        })
    elif ratio_gastos > 50:
        puntaje -= 10
        analisis.append({
            "tipo": "gasto", "estado": "regular", "titulo": "Gastos al límite",
            "texto": "Estás justo en el límite recomendado (50%) de gastos fijos."
        })
    else:
        analisis.append({
            "tipo": "gasto", "estado": "bien", "titulo": "Gastos controlados",
            "texto": "¡Excelente! Tus gastos fijos son sostenibles."
        })

    # 2. ANÁLISIS DE DEUDA
    ratio_deuda = (data.deuda / data.ingresos) * 100
    if ratio_deuda > 40:
        puntaje -= 35
        analisis.append({
            "tipo": "deuda", "estado": "mal", "titulo": "Sobreendeudamiento crítico",
            "texto": f"Destinas el {ratio_deuda:.0f}% de tu dinero a pagar deudas."
        })
    elif ratio_deuda > 30:
        puntaje -= 15
        analisis.append({
            "tipo": "deuda", "estado": "regular", "titulo": "Deuda elevada",
            "texto": "Tu nivel de deuda es manejable pero alto."
        })
    else:
        analisis.append({
            "tipo": "deuda", "estado": "bien", "titulo": "Deuda saludable",
            "texto": "Tu nivel de endeudamiento es bajo."
        })

    # 3. FONDO DE EMERGENCIA
    meses_cubiertos = data.ahorro / data.gastos if data.gastos > 0 else 0
    if meses_cubiertos < 1:
        puntaje -= 25
        analisis.append({
            "tipo": "ahorro", "estado": "mal", "titulo": "Vulnerable ante emergencias",
            "texto": "Tienes menos de un mes de gastos cubierto."
        })
    elif meses_cubiertos < 3:
        puntaje -= 10
        analisis.append({
            "tipo": "ahorro", "estado": "regular", "titulo": "Fondo en construcción",
            "texto": f"Tienes cubiertos {meses_cubiertos:.1f} meses de gastos."
        })
    else:
        analisis.append({
            "tipo": "ahorro", "estado": "bien", "titulo": "Blindaje financiero completo",
            "texto": "¡Felicidades! Tienes un fondo de emergencia sólido."
        })

    puntaje = max(0, min(100, puntaje))
    
    if puntaje >= 80:
        msg_general = "¡Tus finanzas están en excelente forma!"
    elif puntaje >= 50:
        msg_general = "Tienes estabilidad, pero hay áreas de riesgo."
    else:
        msg_general = "Tu salud financiera requiere atención urgente."

    return {
        "success": True, 
        "puntaje": puntaje, 
        "mensaje_general": msg_general,
        "analisis_detallado": analisis
    }

@app.get("/api/sofipos_data")
def get_sofipos_data(db: Session = Depends(get_db)):
    sofipos_list = db.query(models.Sofipos).order_by(models.Sofipos.tasa_anual.desc()).all()
    data = []
    for s in sofipos_list:
        data.append({
            'nombre': s.nombre,
            'tasa': float(s.tasa_anual),
            'plazo': s.plazo_dias,
            'nicap': float(s.nicap) if s.nicap is not None else 0.0,
            'logo': s.logo_url,
            'url': s.url_web
        })
    return {"success": True, "data": data}

@app.get("/api/noticia_financiera")
def noticia_financiera():
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=500, detail="API key de Groq no configurada.")

    import random
    temas = [
        "SOFIPO rendimientos México actual", "Cetes directo tasa actual", 
        "Ahorro para el retiro AFORE tips", "Inflación en México impacto hoy",
        "Estrategias para salir de deudas rápido México", "Bolsa Mexicana de Valores análisis",
        "Mercado inmobiliario y Fibras México", "Criptomonedas tendencias hoy",
        "Bancos vs Fintech tasas de interés", "Fondos indexados S&P 500"
    ]
    tema = random.choice(temas)
    
    enfoques = [
        "un consejo inesperado pero efectivo",
        "una advertencia sobre un riesgo común",
        "una tendencia emergente que pocos están aprovechando",
        "una estadística contundente seguida de una lección práctica",
        "un mito financiero común y por qué es falso"
    ]
    enfoque = random.choice(enfoques)
    
    internet_context = ""
    try:
        from ddgs import DDGS
        resultados = DDGS().text(tema, max_results=2)
        if resultados:
            for r in resultados:
                internet_context += f"- {r['title']}: {r['body']}\n"
    except:
        pass

    try:
        from groq import Groq
        cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        mensajes = [
            {"role": "system", "content": "Eres Mercy IA, una IA financiera. Escribe un titular o tip financiero actualizado de 2 oraciones máximo y sin emojis. Capitaliza estrictamente bien (solo la primera letra al iniciar las oraciones). Ve directo al grano."},
            {"role": "user", "content": f"Tema base: {tema}. Enfoque requerido para que sea único: {enfoque}.\nUsa esta información reciente si sirve:\n{internet_context}\n\nEscribe el tip ahora mismo."}
        ]
        chat_completion = cliente_groq.chat.completions.create(
            messages=mensajes,
            model="llama-3.3-70b-versatile",
            temperature=0.9,
        )
        respuesta_ia = chat_completion.choices[0].message.content
        return {"success": True, "respuesta": respuesta_ia}
    except Exception as e:
        print(f"Error AI: {e}")
        return {"success": False, "respuesta": "Mantén siempre el control de tus finanzas diversificando tus inversiones."}

@app.post("/api/copiloto")
def copiloto_financiero(data: schemas.CopilotoRequest):
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=400, detail="Por favor configura tu GROQ_API_KEY en el archivo .env")

    internet_context = ""
    try:
        from ddgs import DDGS
        resultados_busqueda = DDGS().text(data.mensaje + " finanzas mexico rendimientos", max_results=3)
        if resultados_busqueda:
            internet_context = "\n\nRESULTADOS EN TIEMPO REAL (Úsalos para responder con datos actuales):\n"
            for res in resultados_busqueda:
                internet_context += f"- {res.get('body')}\n"
    except Exception as e:
        print("Error en búsqueda en internet DDGS: ", e)

    system_prompt = f"""Eres 'Mercy IA', el copiloto experto en finanzas de la plataforma "Mercy".
Tu misión es educar y resolver de forma clara, directa y útil las dudas de finanzas e inversiones.
Contexto actual de la pantalla del usuario: {data.contexto}.{internet_context}

REGLAS IMPORTANTES:
1. LONGITUD PERFECTA: No te explayes demasiado ni seas excesivamente corto. Sé directo, amable y explica justo lo necesario para dar valor.
2. Tienes profundo conocimiento de conceptos financieros y ahora acceso a datos actuales gracias al contexto de arriba.
3. No uses formato HTML en la app móvil. Responde con texto plano y viñetas estándar (-)."""

    try:
        from groq import Groq
        cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        mensajes = [{"role": "system", "content": system_prompt}]
        for msg in data.historial:
            mensajes.append({"role": msg.role, "content": msg.content})
            
        mensajes.append({"role": "user", "content": data.mensaje})

        chat_completion = cliente_groq.chat.completions.create(
            messages=mensajes,
            model="llama-3.3-70b-versatile", 
            temperature=0.7,
        )
        
        respuesta_ia = chat_completion.choices[0].message.content
        return {"success": True, "respuesta": respuesta_ia}

    except Exception as e:
        print(f"Error AI: {e}")
        raise HTTPException(status_code=500, detail="Hubo un error de conexión con mi cerebro. Intenta de nuevo más tarde.")
