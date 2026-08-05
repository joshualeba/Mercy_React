from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import os
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Header

from database import engine, get_db, Base
import models
import schemas

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mercy API")

# Prometheus Monitoring
from prometheus_fastapi_instrumentator import Instrumentator
Instrumentator(should_group_status_codes=False).instrument(app).expose(app)

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

API_KEY_SECRETA = "MERCY_API_KEY_SUPER_SECRET"

def validar_api_key(x_api_key: str = Header(None)):
    if x_api_key != API_KEY_SECRETA:
        raise HTTPException(status_code=401, detail="API Key Inválida o no enviada. Acceso Denegado.")
    return x_api_key

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Password Hashing
import bcrypt

def verify_password(plain_password: str, hashed_password: str):
    if not isinstance(hashed_password, bytes):
        hashed_password = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password)

def get_password_hash(password: str):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

# JWT Configuration
SECRET_KEY = os.environ.get("FLASK_SECRET_KEY", "banksecret") # Using same secret key for now
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 days

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@app.post("/api/registro")
@limiter.limit("5/minute")
def registrar_usuario(request: Request, user: schemas.UserRegister, db: Session = Depends(get_db), api_key: str = Depends(validar_api_key)):
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
@limiter.limit("10/minute")
def login(request: Request, user: schemas.UserLogin, db: Session = Depends(get_db), api_key: str = Depends(validar_api_key)):
    db_user = db.query(models.Usuarios).filter(models.Usuarios.correo_electronico == user.correo.lower()).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="El correo electrónico no está registrado, por favor, primero crea una cuenta.")
        
    if db_user.provider == 'google':
        raise HTTPException(status_code=400, detail="Tu cuenta fue creada con Google. Actualmente la app móvil solo admite inicio de sesión por correo y contraseña. Si no tienes contraseña, créala desde la plataforma web.")
        
    role_str = db_user.role.strip().lower() if db_user.role else ''
    if role_str == 'superadmin':
        raise HTTPException(status_code=403, detail="Esta cuenta es de Super Admin. La aplicación móvil es exclusiva para clientes. Por favor, ingresa a tu portal administrativo web.")
    elif role_str == 'admin':
        raise HTTPException(status_code=403, detail="Esta cuenta tiene privilegios de Administrador. La aplicación móvil es exclusiva para clientes. Por favor, ingresa a tu portal administrativo web.")
        
    is_valid = False
    try:
        if db_user.contrasena.startswith('$2'):
            if verify_password(user.contrasena, db_user.contrasena):
                is_valid = True
        else:
            from werkzeug.security import check_password_hash
            if check_password_hash(db_user.contrasena, user.contrasena):
                is_valid = True
    except Exception:
        pass
        
    if not is_valid:
        raise HTTPException(status_code=401, detail="La contraseña ingresada es incorrecta. Por favor, verifica tus datos e inténtalo nuevamente.")
    
    # Update last login
    db_user.ultima_sesion = datetime.now()
    db.commit()
    
    access_token = create_access_token(
        data={"sub": str(db_user.id), "role": db_user.role}
    )
    
    # Extraer el nombre de DatosP
    nombre_usuario = db_user.datosp.nombre if db_user.datosp else "Usuario"
    apellido_p = db_user.datosp.apellidoP if db_user.datosp and db_user.datosp.apellidoP else ""
    nombre_completo = f"{nombre_usuario} {apellido_p}".strip()

    return {
        "success": True,
        "access_token": access_token,
        "token_type": "bearer",
        "nombre": nombre_usuario,
        "user": {
            "id": db_user.id,
            "nombre": nombre_usuario,
            "apellidoP": apellido_p,
            "nombre_completo": nombre_completo,
            "correo": db_user.correo_electronico,
            "rol": db_user.role
        }
    }

@app.post("/api/calcular_salud")
@limiter.limit("20/minute")
def calcular_salud(request: Request, data: schemas.DiagnosticoIn, db: Session = Depends(get_db), api_key: str = Depends(validar_api_key)):
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

    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = f"Ingresos: ${data.ingresos}. Gastos: ${data.gastos}. Deuda: ${data.deuda}. Ahorro: ${data.ahorro}. Puntaje calculado: {puntaje}/100. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico para mejorar o mantener su salud financiera. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real. Háblame de 'tú' (ej. 'Debes hacer'). NO uses frases introductorias."
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en diagnostico: {e}")

    nivel_endeudamiento = (data.deuda / data.ingresos) * 100 if data.ingresos > 0 else 0

    return {
        "success": True, 
        "puntaje": puntaje, 
        "mensaje_general": msg_general,
        "analisis_detallado": analisis,
        "mensaje_ia": mensaje_ia,
        "nivel_endeudamiento": round(nivel_endeudamiento, 1)
    }

@app.get("/api/sofipos_data")
@limiter.limit("30/minute")
def get_sofipos_data(request: Request, db: Session = Depends(get_db), api_key: str = Depends(validar_api_key)):
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
        from duckduckgo_search import DDGS
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
@limiter.limit("15/minute")
def copiloto_financiero(request: Request, data: schemas.CopilotoRequest, api_key: str = Depends(validar_api_key)):
    if not os.environ.get("GROQ_API_KEY"):
        raise HTTPException(status_code=400, detail="Por favor configura tu GROQ_API_KEY en el archivo .env")

    internet_context = ""
    try:
        from duckduckgo_search import DDGS
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

# ================= RUTAS PARA SIMULADORES (API) =================

from fastapi.security import OAuth2PasswordBearer
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.Usuarios).filter(models.Usuarios.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/api/verify_session")
@limiter.limit("5/minute")
def verify_session(request: Request, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    usuario = get_current_user(token, db)
    role_str = usuario.role.strip().lower() if usuario.role else ''
    if role_str == 'superadmin':
        raise HTTPException(status_code=403, detail="Esta cuenta es de Super Admin. La aplicación móvil es exclusiva para clientes. Por favor, ingresa a tu portal administrativo web.")
    elif role_str == 'admin':
        raise HTTPException(status_code=403, detail="Esta cuenta tiene privilegios de Administrador. La aplicación móvil es exclusiva para clientes. Por favor, ingresa a tu portal administrativo web.")
    return {"success": True, "valid": True}

@app.post("/api/simulador/ahorro")
@limiter.limit("20/minute")
def sim_ahorro(request: Request, data: schemas.SimuladorAhorroIn, current_user: models.Usuarios = Depends(get_current_user)):
    progression = []
    saldo = 0.0
    tasa_mensual = data.tasa_anual / 100 / 12 if data.tasa_anual > 0 else 0
    for mes in range(1, data.meses + 1):
        saldo += data.aporte_mensual
        interes = saldo * tasa_mensual
        saldo += interes
        progression.append({"mes": mes, "saldo": round(saldo, 2), "interes_ganado": round(interes, 2)})
    alcanzado = saldo >= data.meta
    saldo_final = round(saldo, 2)
    
    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            meta_str = 'Sí' if alcanzado else 'No'
            prompt = "Meta: ${}. Aporte mensual: ${}. Plazo: {} meses. Tasa actual: {}%. Saldo final logrado: ${}. ¿Alcanzaste la meta? {}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico. Si no alcancé la meta, dime aproximadamente cuánto más debo aportar o qué instrumento (ej. CETES Directo, SOFIPOs) usar para mejorar mi tasa. Si la alcancé, dame un consejo experto de diversificación. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real, mencionando números o porcentajes. Háblame de 'tú' (ej. 'Te recomiendo', 'Debes hacer'). NO uses frases introductorias.".format(data.meta, data.aporte_mensual, data.meses, data.tasa_anual, saldo_final, meta_str)
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador ahorro: {e}")

    return {
        "meta": data.meta, 
        "saldo_final": saldo_final, 
        "alcanzado": alcanzado, 
        "progresion": progression,
        "mensaje_ia": mensaje_ia
    }

@app.post("/api/simulador/credito")
@limiter.limit("20/minute")
def sim_credito(request: Request, data: schemas.SimuladorCreditoIn, current_user: models.Usuarios = Depends(get_current_user)):
    tasa_mensual = data.tasa_anual / 100 / 12
    if tasa_mensual > 0:
        pago_mensual = data.monto * (tasa_mensual * (1 + tasa_mensual)**data.plazo_meses) / ((1 + tasa_mensual)**data.plazo_meses - 1)
    else:
        pago_mensual = data.monto / data.plazo_meses
    tabla = []
    saldo = data.monto
    for mes in range(1, data.plazo_meses + 1):
        interes = saldo * tasa_mensual
        capital = pago_mensual - interes
        saldo -= capital
        if saldo < 0: saldo = 0
        tabla.append({"mes": mes, "pago_mensual": round(pago_mensual, 2), "capital": round(capital, 2), "interes": round(interes, 2), "saldo_restante": round(saldo, 2)})
        
    total_intereses = round((pago_mensual * data.plazo_meses) - data.monto, 2)
    
    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = "Monto del crédito: ${}. Plazo: {} meses. Tasa anual: {}%. Pago mensual estimado: ${}. Total de intereses a pagar: ${}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico sobre cómo manejar este crédito. Considera estrategias para abonar a capital y el impacto de los intereses. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real, mencionando números. Háblame de 'tú' (ej. 'Te recomiendo', 'Debes hacer'). NO uses frases introductorias.".format(data.monto, data.plazo_meses, data.tasa_anual, round(pago_mensual, 2), total_intereses)
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador credito: {e}")

    return {"pago_mensual": round(pago_mensual, 2), "total_pagado": round(pago_mensual * data.plazo_meses, 2), "total_intereses": total_intereses, "tabla_amortizacion": tabla, "mensaje_ia": mensaje_ia}

@app.post("/api/simulador/inversion")
@limiter.limit("20/minute")
def sim_inversion(request: Request, data: schemas.SimuladorInversionIn, current_user: models.Usuarios = Depends(get_current_user)):
    progression = []
    saldo = data.monto_inicial
    tasa_mensual = data.tasa_anual / 100 / 12 if data.tasa_anual > 0 else 0
    meses_totales = data.anos * 12
    for mes in range(1, meses_totales + 1):
        saldo += data.aporte_mensual
        interes = saldo * tasa_mensual
        saldo += interes
        if mes % 12 == 0:
            progression.append({"ano": mes // 12, "saldo": round(saldo, 2)})
            
    saldo_final = round(saldo, 2)
    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = "Inversión inicial: ${}. Aporte mensual: ${}. Años: {}. Tasa anual: {}%. Saldo final estimado: ${}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico sobre esta proyección de inversión. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real, mencionando números, efecto del interés compuesto o instrumentos de México. Háblame de 'tú' (ej. 'Te recomiendo', 'Debes hacer'). NO uses frases introductorias.".format(data.monto_inicial, data.aporte_mensual, data.anos, data.tasa_anual, saldo_final)
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador inversion: {e}")

    return {"monto_inicial": data.monto_inicial, "saldo_final": saldo_final, "progresion_anual": progression, "mensaje_ia": mensaje_ia}

@app.post("/api/simulador/presupuesto")
@limiter.limit("20/minute")
def sim_presupuesto(request: Request, data: schemas.SimuladorPresupuestoIn, current_user: models.Usuarios = Depends(get_current_user)):
    total_gastos = data.gastos_fijos + data.gastos_variables
    balance = data.ingresos - total_gastos
    estado = "Saludable" if balance > 0 else "Riesgo"
    
    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = "Ingresos: ${}. Gastos fijos: ${}. Gastos variables: ${}. Balance final: ${}. Estado: {}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico para manejar este presupuesto. Si estoy en riesgo, dime exactamente qué debo recortar. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real, mencionando la regla 50/30/20 u otros conceptos. Háblame de 'tú' (ej. 'Debes hacer'). NO uses frases introductorias.".format(data.ingresos, data.gastos_fijos, data.gastos_variables, balance, estado)
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador presupuesto: {e}")

    return {"ingresos": data.ingresos, "total_gastos": total_gastos, "balance": balance, "estado": estado, "mensaje_ia": mensaje_ia}

@app.post("/api/simulador/retiro")
@limiter.limit("20/minute")
def sim_retiro(request: Request, data: schemas.SimuladorRetiroIn, current_user: models.Usuarios = Depends(get_current_user)):
    anos_ahorro = data.edad_retiro - data.edad_actual
    meses_totales = anos_ahorro * 12
    tasa_mensual = data.tasa_anual / 100 / 12 if data.tasa_anual > 0 else 0
    saldo = data.ahorro_actual
    for _ in range(meses_totales):
        saldo += data.aporte_mensual
        interes = saldo * tasa_mensual
        saldo += interes
        
    saldo_final = round(saldo, 2)
    mensaje_ia = ""
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = "Edad actual: {}. Edad de retiro: {}. Ahorro actual: ${}. Aporte mensual: ${}. Tasa anual esperada: {}%. Saldo estimado al retiro: ${}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico sobre este fondo de retiro. Menciona temas reales como Afores o PPRs en México. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real. Háblame de 'tú' (ej. 'Debes hacer'). NO uses frases introductorias.".format(data.edad_actual, data.edad_retiro, data.ahorro_actual, data.aporte_mensual, data.tasa_anual, saldo_final)
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador retiro: {e}")

    return {"edad_retiro": data.edad_retiro, "saldo_estimado": saldo_final, "mensaje_ia": mensaje_ia}

@app.post("/api/simulador/deuda")
@limiter.limit("20/minute")
def sim_deuda(request: Request, data: schemas.SimuladorDeudaIn, current_user: models.Usuarios = Depends(get_current_user)):
    tasa_mensual = data.tasa_anual / 100 / 12
    saldo = data.saldo_total
    meses = 0
    total_intereses = 0.0
    
    mensaje_ia = ""
    if data.pago_mensual <= (saldo * tasa_mensual):
        try:
            from groq import Groq
            import os
            if os.environ.get("GROQ_API_KEY"):
                cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
                prompt = "Deuda: ${}. Tasa anual: {}%. Pago mensual: ${}. El pago mensual no alcanza a cubrir los intereses generados. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y urgente para evitar la bancarrota. Usa 3 viñetas numeradas (1., 2., 3.), sin emojis. Háblame de 'tú'. NO uses frases introductorias.".format(data.saldo_total, data.tasa_anual, data.pago_mensual)
                
                chat_completion = cliente_groq.chat.completions.create(
                    messages=[
                        {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                        {"role": "user", "content": prompt}
                    ],
                    model="llama-3.1-8b-instant",
                    temperature=0.7,
                    max_tokens=250,
                )
                mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
        except:
            pass
        return {"error": "El pago mensual es menor que los intereses. La deuda nunca se pagará.", "mensaje_ia": mensaje_ia}
        
    while saldo > 0 and meses < 1200: # limit to 100 years
        meses += 1
        interes = saldo * tasa_mensual
        total_intereses += interes
        saldo += interes
        saldo -= data.pago_mensual
        if saldo < 0: saldo = 0
        
    try:
        from groq import Groq
        import os
        if os.environ.get("GROQ_API_KEY"):
            cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
            prompt = "Deuda: ${}. Tasa anual: {}%. Pago mensual: ${}. Se tardará {} meses en pagar. Total de intereses que se pagarán: ${}. Dame un 'Mini-Plan de Acción' de 3 pasos profundamente útil y analítico para salir de esta deuda más rápido. Usa 3 viñetas separadas por salto de línea. Utiliza números (1., 2., 3.) para cada viñeta, PROHIBIDO usar emojis. Cada consejo debe tener utilidad real (método bola de nieve, avalancha, etc.). Háblame de 'tú' (ej. 'Debes hacer'). NO uses frases introductorias.".format(data.saldo_total, data.tasa_anual, data.pago_mensual, meses, round(total_intereses, 2))
            
            chat_completion = cliente_groq.chat.completions.create(
                messages=[
                    {"role": "system", "content": "Eres el mejor asesor financiero de México. Hablas directo al usuario en segunda persona (tú). Entregas análisis altamente precisos, útiles y estratégicos en exactamente 3 viñetas numeradas. Cero emojis. Cero rodeos."},
                    {"role": "user", "content": prompt}
                ],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=250,
            )
            mensaje_ia = chat_completion.choices[0].message.content.replace('"', '').replace('*', '')
    except Exception as e:
        print(f"Error IA en simulador deuda: {e}")

    return {"meses_para_pagar": meses, "total_intereses": round(total_intereses, 2), "mensaje_ia": mensaje_ia}

# --- ENDPOINTS MÓVIL (Glosario y Test) ---

@app.get("/api/glosario")
@limiter.limit("5/minute")
def get_glosario(request: Request, db: Session = Depends(get_db)):
    terminos = db.query(models.Glosario).order_by(models.Glosario.termino).all()
    return {"success": True, "terminos": [{"id": t.id, "termino": t.termino, "descripcion": t.descripcion, "categoria": t.categoria} for t in terminos]}

@app.get("/api/preguntas_test")
def get_preguntas_test(request: Request, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    usuario = get_current_user(token, db)
    if not usuario:
        raise HTTPException(status_code=401, detail="No autorizado")
    
    if usuario.test_completado:
        last_result = db.query(models.ResultadosTest).filter_by(usuario_id=usuario.id).order_by(models.ResultadosTest.fecha_realizacion.desc()).first()
        if last_result:
            return {"test_completado": True, "score": last_result.puntuacion_total, "correctas": last_result.puntuacion, "total": last_result.total_preguntas}
        return {"test_completado": True, "score": 0, "correctas": 0, "total": 0}
    
    preguntas_db = db.query(models.PreguntasTest).all()
    # Serialize preguntas and options
    import random
    preguntas_json = []
    for p in preguntas_db:
        if len(p.opciones) > 0:
            opciones = [{"id": o.id, "texto_opcion": o.texto_opcion, "es_correcta": o.es_correcta} for o in p.opciones]
            random.shuffle(opciones)
            preguntas_json.append({"id": p.id, "pregunta": p.pregunta, "opciones": opciones})
    
    random.shuffle(preguntas_json)
    return {"test_completado": False, "preguntas": preguntas_json}

@app.post("/api/submit_test")
async def submit_test(request: Request, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    usuario = get_current_user(token, db)
    if not usuario:
        raise HTTPException(status_code=401, detail="No autorizado")
        
    if usuario.test_completado:
        return {"success": False, "message": "Ya has completado el test"}
        
    payload = await request.json()
    respuestas = payload.get("respuestas", {})
    tiempo = payload.get("tiempo_segundos", 0.0)
    
    correctas = 0
    total = 0
    puntuacion_total = 0
    
    for pregunta_id, data in respuestas.items():
        total += 1
        if isinstance(data, dict):
            opcion_id = data.get("opcionId")
            tiempo_ms = data.get("tiempo_ms", 5000)
        else:
            opcion_id = data
            tiempo_ms = 5000
            
        opcion = db.query(models.OpcionesRespuesta).filter_by(id=opcion_id, pregunta_id=pregunta_id).first()
        if opcion and opcion.es_correcta:
            correctas += 1
            t = tiempo_ms / 1000.0
            pts = 1000 - (t * 30) - (t ** 2 * 40)
            puntuacion_total += max(600, round(pts))
            
    resultado = models.ResultadosTest(
        usuario_id=usuario.id,
        puntuacion=correctas,
        total_preguntas=total,
        puntuacion_total=puntuacion_total,
        tiempo_resolucion_segundos=float(tiempo)
    )
    db.add(resultado)
    usuario.test_completado = True
    db.commit()
    
    return {"success": True, "score": puntuacion_total, "correctas": correctas, "total": total}

@app.get("/api/ranking_test")
def get_ranking_test(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    usuario = get_current_user(token, db)
    if not usuario:
        raise HTTPException(status_code=401, detail="No autorizado")
        
    # Order by puntuacion_total (desc), then by tiempo (asc)
    resultados = db.query(models.ResultadosTest).join(models.Usuarios).order_by(
        models.ResultadosTest.puntuacion_total.desc(),
        models.ResultadosTest.tiempo_resolucion_segundos.asc()
    ).limit(50).all()
    
    ranking = []
    for r in resultados:
        ranking.append({
            "usuario": r.usuario.datosp.nombre if r.usuario.datosp else "Usuario",
            "puntuacion": r.puntuacion,
            "puntuacion_total": r.puntuacion_total,
            "total": r.total_preguntas,
            "tiempo": r.tiempo_resolucion_segundos,
            "es_actual": r.usuario_id == usuario.id
        })
    return {"success": True, "ranking": ranking}



@app.get("/api/radar")
def obtener_radar_financiero(api_key: str = Depends(validar_api_key)):
    if not os.environ.get("GROQ_API_KEY"):
        return {
            "success": False,
            "noticia": "Falta configurar la API Key de Groq en el servidor. Ve a infrastructure/.env y agrega GROQ_API_KEY."
        }

    try:
        from groq import Groq
        import urllib.request
        import xml.etree.ElementTree as ET
        import random
        
        contexto_web = ""
        fecha_noticia = ""
        try:
            url = "https://news.google.com/rss/search?q=finanzas+economia+mexico+2026&hl=es-419&gl=MX&ceid=MX:es-419"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as response:
                xml_data = response.read()
            root = ET.fromstring(xml_data)
            items = root.findall('.//item')
            if items:
                # Elegimos 1 sola noticia para tener una fecha exacta
                selected_item = random.choice(items)
                title = selected_item.find('title').text if selected_item.find('title') is not None else ""
                pubDate = selected_item.find('pubDate').text if selected_item.find('pubDate') is not None else ""
                
                contexto_web = f"- Titular: {title}"
                fecha_noticia = pubDate
        except Exception as rss_e:
            print(f"Error al buscar en RSS: {rss_e}")

        prompt_user = "Resume esta noticia financiera:"
        if contexto_web:
            prompt_user += f"\n\n{contexto_web}"

        cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))
        
        chat_completion = cliente_groq.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "Eres un analista financiero experto. Da UNA sola noticia breve (máx 2 oraciones). REGLAS ESTRICTAS: 1) PROHIBIDO usar frases introductorias (ej. 'Noticia del día:', 'El radar financiero:'). 2) PROHIBIDO usar comillas. 3) Ve directo al grano con la información."
                },
                {
                    "role": "user",
                    "content": prompt_user
                }
            ],
            model="llama-3.1-8b-instant",
            temperature=0.7,
            max_tokens=150,
        )

        respuesta = chat_completion.choices[0].message.content
        # Limpieza adicional por si la IA no obedece
        respuesta = respuesta.replace('"', '').replace('*', '')
        if ":" in respuesta and len(respuesta.split(":")[0]) < 25:
            respuesta = respuesta.split(":", 1)[1].strip()

        return {"success": True, "noticia": respuesta, "fecha": fecha_noticia}
    except Exception as e:
        print(f"Error en Radar Groq: {e}")
        return {
            "success": False,
            "noticia": "Los mercados financieros están estables hoy. Mantén tus inversiones diversificadas."
        }


@app.put("/api/update_profile")
def update_profile(profile_data: schemas.UserUpdateProfile, db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    usuario = get_current_user(token, db)
    if not usuario:
        raise HTTPException(status_code=401, detail="No autorizado")

    # If password is provided, must provide current
    if profile_data.password_nueva:
        if not profile_data.password_actual:
            raise HTTPException(status_code=400, detail="Debe ingresar su contraseña actual para cambiarla.")
        
        # Verify current
        if not verify_password(profile_data.password_actual, usuario.contrasena):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta.")
            
        # Hash new
        usuario.contrasena = get_password_hash(profile_data.password_nueva)
        
    if profile_data.nombre:
        if usuario.datosp:
            parts = profile_data.nombre.strip().split(maxsplit=1)
            usuario.datosp.nombre = parts[0]
            usuario.datosp.apellidoP = parts[1] if len(parts) > 1 else ""
            
    db.commit()
    db.refresh(usuario)
    nombre_completo = f"{usuario.datosp.nombre} {usuario.datosp.apellidoP}".strip() if usuario.datosp else ""
    return {"success": True, "message": "Perfil actualizado correctamente.", "nombre": nombre_completo, "nombre_pila": usuario.datosp.nombre if usuario.datosp else "", "apellido": usuario.datosp.apellidoP if usuario.datosp else ""}
