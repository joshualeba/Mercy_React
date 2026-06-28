import os
from dotenv import load_dotenv

# cargar variables de entorno desde .env
load_dotenv()

# aviso en consola si el archivo .env no existe localmente
if not os.path.exists('.env'):
    print("--- aviso: no se encontró el archivo .env localmente. asegúrate de crearlo basándote en .env.example ---")

from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.exc import IntegrityError
from werkzeug.security import generate_password_hash, check_password_hash
from email_validator import validate_email, EmailNotValidError
from datetime import datetime
import re
from authlib.integrations.flask_client import OAuth
import uuid
from groq import Groq
import traceback
from werkzeug.middleware.proxy_fix import ProxyFix



# Helpers para formato de fecha en español
def formato_fecha_es(fecha):
    if not fecha:
        return 'Sin datos'
    if isinstance(fecha, str):
        try:
            fecha = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S.%f')
        except:
            return fecha
    meses = {
        1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
        5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
        9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
    }
    return f"{fecha.day:02d} de {meses[fecha.month]} de {fecha.year}"

def formato_fecha_hora_es(fecha):
    if not fecha:
        return 'Sin datos'
    if isinstance(fecha, str):
        try:
            fecha = datetime.strptime(fecha, '%Y-%m-%d %H:%M:%S.%f')
        except:
            return fecha
    meses = {
        1: 'enero', 2: 'febrero', 3: 'marzo', 4: 'abril',
        5: 'mayo', 6: 'junio', 7: 'julio', 8: 'agosto',
        9: 'septiembre', 10: 'octubre', 11: 'noviembre', 12: 'diciembre'
    }
    fecha_str = f"{fecha.day:02d} de {meses[fecha.month]} de {fecha.year}"
    hora_str = fecha.strftime('%I:%M %p')
    return f"{fecha_str}, {hora_str}"


# sección: configuración de la aplicación flask
app = Flask(__name__,
            template_folder=os.path.abspath('.'),
            static_folder=os.path.abspath('.'))

# Configuración del proxy para Render (https)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1)

app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'banksecret')

# --- CAMBIO: configuración de sqlalchemy ---
# reemplaza pyodbc con flask_sqlalchemy

# configuración de la conexión a la base de datos (SQLite)
# Esto crea un archivo 'instance/mercy.db' o 'mercy.db' en tu carpeta
import os
# configuración de la base de datos: usa la variable de entorno DATABASE_URL (para render) 
# o recurre a sqlite localmente si no existe.
basedir = os.path.abspath(os.path.dirname(__file__))
db_uri = os.environ.get('DATABASE_URL')

if db_uri and db_uri.startswith("postgres://"):
    db_uri = db_uri.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_uri or 'sqlite:///' + os.path.join(basedir, 'mercy.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# inicializa la extensión de sqlalchemy
db = SQLAlchemy(app)

# configuración de oauth
oauth = OAuth(app)
google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        'scope': 'openid email profile'
    }
)

# carpeta para subir imágenes de perfil (aunque no se usa en este ejemplo, se mantiene)


# estas clases representan tus tablas de la base de datos

class DatosP(db.Model):
    __tablename__ = 'DatosP'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255), nullable=False)
    apellidoP = db.Column(db.String(255))
    apellidoM = db.Column(db.String(255))
    fecha_nacimiento = db.Column(db.DateTime, nullable=False, default=datetime.now)
    telefono = db.Column(db.BigInteger)
    # relación uno-a-uno con usuarios
    usuario = db.relationship('Usuarios', back_populates='datosp', uselist=False, lazy=True)

class Usuarios(db.Model):
    __tablename__ = 'usuarios'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id_datosP = db.Column(db.Integer, db.ForeignKey('DatosP.id'), unique=True, nullable=False)
    correo_electronico = db.Column(db.String(255), nullable=False, unique=True)
    contrasena = db.Column(db.String(255), nullable=False)
    fecha_registro = db.Column(db.DateTime, nullable=False, default=datetime.now)
    ultima_sesion = db.Column(db.DateTime)
    test_completado = db.Column(db.Boolean, nullable=False, default=False)
    provider = db.Column(db.String(50), default='local') # 'local' o 'google'
    role = db.Column(db.String(20), default='cliente') # 'superadmin', 'admin', 'cliente'
    
    # relación inversa con datosp
    datosp = db.relationship('DatosP', back_populates='usuario', lazy=True)
    # relación uno-a-muchos con resultados_test
    resultados = db.relationship('ResultadosTest', back_populates='usuario', lazy=True, cascade="all, delete-orphan")

class Tipo_Preguntas(db.Model):
    __tablename__ = 'Tipo_Preguntas'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255))
    preguntas = db.relationship('PreguntasTest', back_populates='tipo_pregunta', lazy=True)

class Dificultades(db.Model):
    __tablename__ = 'Dificultades'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255))
    preguntas = db.relationship('PreguntasTest', back_populates='dificultad', lazy=True)

class Categorias(db.Model):
    __tablename__ = 'Categorias'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(255))
    preguntas = db.relationship('PreguntasTest', back_populates='categoria', lazy=True)

class PreguntasTest(db.Model):
    __tablename__ = 'preguntas_test'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pregunta = db.Column(db.String(None), nullable=False)
    id_tipoPregunta = db.Column(db.Integer, db.ForeignKey('Tipo_Preguntas.id'))
    id_dificultad = db.Column(db.Integer, db.ForeignKey('Dificultades.id'))
    id_categoria = db.Column(db.Integer, db.ForeignKey('Categorias.id'))
    respuesta_texto_correcta = db.Column(db.String(500))
    
    tipo_pregunta = db.relationship('Tipo_Preguntas', back_populates='preguntas', lazy=True)
    dificultad = db.relationship('Dificultades', back_populates='preguntas', lazy=True)
    categoria = db.relationship('Categorias', back_populates='preguntas', lazy=True)
    opciones = db.relationship('OpcionesRespuesta', back_populates='pregunta', lazy=True, cascade="all, delete-orphan")

class OpcionesRespuesta(db.Model):
    __tablename__ = 'opciones_respuesta'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    pregunta_id = db.Column(db.Integer, db.ForeignKey('preguntas_test.id'), nullable=False)
    texto_opcion = db.Column(db.String(500), nullable=False)
    es_correcta = db.Column(db.Boolean, nullable=False)
    
    pregunta = db.relationship('PreguntasTest', back_populates='opciones', lazy=True)

class ResultadosTest(db.Model):
    __tablename__ = 'resultados_test'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    puntuacion = db.Column(db.Integer, nullable=False)
    total_preguntas = db.Column(db.Integer, nullable=False)
    puntuacion_total = db.Column(db.Integer, nullable=False, default=0)
    tiempo_resolucion_segundos = db.Column(db.Numeric(10, 2), nullable=False, default=0.00)
    fecha_realizacion = db.Column(db.DateTime, nullable=False, default=datetime.now)
    
    usuario = db.relationship('Usuarios', back_populates='resultados', lazy=True)

class Sofipos(db.Model):
    __tablename__ = 'sofipos'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nombre = db.Column(db.String(100), nullable=False)
    tasa_anual = db.Column(db.Numeric(5, 2), nullable=False)
    plazo_dias = db.Column(db.Integer, nullable=False)
    nicap = db.Column(db.Numeric(6, 2), nullable=False)
    logo_url = db.Column(db.String(255))
    url_web = db.Column(db.String(255))

class DiagnosticosFinancieros(db.Model):
    __tablename__ = 'diagnosticos_financieros'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    ingresos_mensuales = db.Column(db.Numeric(10,2))
    gastos_mensuales = db.Column(db.Numeric(10,2))
    deuda_total = db.Column(db.Numeric(10,2))
    ahorro_actual = db.Column(db.Numeric(10,2))
    puntaje_salud = db.Column(db.Integer)
    nivel_endeudamiento = db.Column(db.Numeric(5,2))
    recomendacion_clave = db.Column(db.String(255))
    fecha_diagnostico = db.Column(db.DateTime, default=datetime.now)

class Glosario(db.Model):
    __tablename__ = 'glosario'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    termino = db.Column(db.String(150), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    categoria = db.Column(db.String(50), nullable=False)

class ActivityLog(db.Model):
    __tablename__ = 'activity_log'

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    fecha = db.Column(db.DateTime, default=datetime.now)
    admin_nombre = db.Column(db.String(100))
    accion = db.Column(db.Text)
    tipo = db.Column(db.String(20)) # 'create', 'update', 'delete', 'login'
    evento_id = db.Column(db.String(20))

def log_activity(tipo, accion):
    try:
        admin_nombre = str(session.get('nombres', 'Sistema'))[:100]
        evento_id = f"EV-{str(uuid.uuid4().hex)[:4].upper()}"
        new_log = ActivityLog(
            admin_nombre=admin_nombre,
            accion=accion,
            tipo=tipo,
            evento_id=evento_id
        )
        db.session.add(new_log)
        db.session.commit()
    except Exception as e:
        print(f"Error logging activity: {e}")
        db.session.rollback()

# 2. Ruta para procesar el diagnóstico
@app.route('/api/calcular_salud', methods=['POST'])
def calcular_salud():
    if 'usuario_autenticado' not in session:
        return jsonify(success=False, message='No autorizado'), 401

    data = request.json
    try:
        ingresos = float(data.get('ingresos', 0))
        gastos = float(data.get('gastos', 0))
        deuda = float(data.get('deuda', 0))
        ahorro = float(data.get('ahorro', 0))
    except ValueError:
        return jsonify(success=False, message="Datos inválidos"), 400

    if ingresos <= 0:
        return jsonify(success=False, message="Los ingresos deben ser mayores a 0 para calcular."), 400

    # --- LÓGICA FINANCIERA AVANZADA ---
    puntaje = 100
    analisis = [] # Aquí guardaremos los consejos detallados

    # 1. ANÁLISIS DE GASTOS FIJOS (Ideal: < 50% de ingresos)
    ratio_gastos = (gastos / ingresos) * 100
    if ratio_gastos > 60:
        puntaje -= 25
        analisis.append({
            "tipo": "gasto",
            "estado": "mal",
            "titulo": "Gastos fijos altos",
            "texto": f"Tus gastos fijos consumen el {ratio_gastos:.0f}% de tu ingreso. Lo ideal es mantenerlos bajo el 50% para tener margen de maniobra."
        })
    elif ratio_gastos > 50:
        puntaje -= 10
        analisis.append({
            "tipo": "gasto",
            "estado": "regular",
            "titulo": "Gastos al límite",
            "texto": "Estás justo en el límite recomendado (50%) de gastos fijos. Intenta no adquirir más compromisos mensuales."
        })
    else:
        analisis.append({
            "tipo": "gasto",
            "estado": "bien",
            "titulo": "Gastos controlados",
            "texto": "¡Excelente! Tus gastos fijos son sostenibles. Tienes gran capacidad para ahorrar o invertir."
        })

    # 2. ANÁLISIS DE DEUDA (Ideal: < 30% de ingresos)
    ratio_deuda = (deuda / ingresos) * 100
    if ratio_deuda > 40:
        puntaje -= 35
        analisis.append({
            "tipo": "deuda",
            "estado": "mal",
            "titulo": "Sobreendeudamiento crítico",
            "texto": f"Destinas el {ratio_deuda:.0f}% de tu dinero a pagar deudas. Esto es peligroso. Prioriza pagar las deudas con mayor tasa de interés (Método Avalancha)."
        })
    elif ratio_deuda > 30:
        puntaje -= 15
        analisis.append({
            "tipo": "deuda",
            "estado": "regular",
            "titulo": "Deuda elevada",
            "texto": "Tu nivel de deuda es manejable pero alto. Evita usar tarjetas de crédito hasta bajar este porcentaje."
        })
    else:
        analisis.append({
            "tipo": "deuda",
            "estado": "bien",
            "titulo": "Deuda saludable",
            "texto": "Tu nivel de endeudamiento es bajo. Esto te da una excelente calificación crediticia potencial."
        })

    # 3. FONDO DE EMERGENCIA (Ideal: > 3 meses de gastos)
    meses_cubiertos = ahorro / gastos if gastos > 0 else 0
    if meses_cubiertos < 1:
        puntaje -= 25
        analisis.append({
            "tipo": "ahorro",
            "estado": "mal",
            "titulo": "Vulnerable ante emergencias",
            "texto": "Tienes menos de un mes de gastos cubierto. Si pierdes tus ingresos hoy, estarías en problemas inmediatos. Tu prioridad #1 debe ser ahorrar."
        })
    elif meses_cubiertos < 3:
        puntaje -= 10
        analisis.append({
            "tipo": "ahorro",
            "estado": "regular",
            "titulo": "Fondo en construcción",
            "texto": f"Tienes cubiertos {meses_cubiertos:.1f} meses de gastos. Vas bien, pero intenta llegar a 3 meses mínimo para mayor seguridad."
        })
    else:
        analisis.append({
            "tipo": "ahorro",
            "estado": "bien",
            "titulo": "Blindaje financiero completo",
            "texto": "¡Felicidades! Tienes un fondo de emergencia sólido. Ahora podrías empezar a pensar en inversiones de mayor riesgo y rendimiento."
        })

    # Asegurar rango y mensaje general
    puntaje = max(0, min(100, puntaje))
    
    if puntaje >= 80:
        msg_general = "¡Tus finanzas están en excelente forma!"
        color_general = "success"
    elif puntaje >= 50:
        msg_general = "Tienes estabilidad, pero hay áreas de riesgo."
        color_general = "warning"
    else:
        msg_general = "Tu salud financiera requiere atención urgente."
        color_general = "danger"

    # --- NUEVO: GUARDAR EL DIAGNÓSTICO EN LA BASE DE DATOS ---
    try:
        user_id = session.get('user_id')
        if user_id:
            nuevo_diag = DiagnosticosFinancieros(
                usuario_id=user_id,
                ingresos_mensuales=ingresos,
                gastos_mensuales=gastos,
                deuda_total=deuda,
                ahorro_actual=ahorro,
                puntaje_salud=puntaje,
                nivel_endeudamiento=(deuda / ingresos * 100) if ingresos > 0 else 0,
                recomendacion_clave=msg_general,
                fecha_diagnostico=datetime.now()
            )
            db.session.add(nuevo_diag)
            db.session.commit()
            
            # Registrar actividad del usuario
            log_activity('create', f"El usuario {session.get('nombres')} ha completado un diagnóstico de salud financiera.")
    except Exception as e:
        db.session.rollback()
        print(f"Error al guardar diagnóstico: {e}")

    return jsonify(
        success=True, 
        puntaje=puntaje, 
        mensaje_general=msg_general,
        analisis_detallado=analisis
    )

@app.route('/sofipos')
def sofipos_view():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('sofipos.html', usuario=usuario_data)

@app.route('/api/sofipos_data', methods=['GET'])
def get_sofipos_data():
    try:
        sofipos_list = Sofipos.query.order_by(Sofipos.tasa_anual.desc()).all()
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
        return jsonify(success=True, data=data)
    except Exception as e:
        return jsonify(success=False, message=str(e))
    
@app.route('/diagnostico')
def diagnostico():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para ver tu diagnóstico.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    
    usuario_data = {
        'nombres': session.get('nombres', 'Usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', '')
    }
    return render_template('diagnostico.html', usuario=usuario_data)

# --- ELIMINADO: get_db_connection() ---
# sqlalchemy maneja las conexiones automáticamente

# sección: rutas principales de la aplicación
@app.route('/')
def index():
    return redirect(url_for('mostrar_pagina_estatica', filename='index.html'))

# Rutas alias para las secciones de la landing page (evita 404 al recargar)
@app.route('/porque-mercy')
@app.route('/servicios')
@app.route('/testimonios')
@app.route('/preguntas-frecuentes')
def landing_sections():
    return render_template('index.html')

@app.route('/registro')
def mostrar_formulario_registro():
    return render_template('registro.html')

@app.route('/registrar_usuario', methods=['POST'])
def registrar_usuario():
    if request.method == 'POST':
        nombres = request.form.get('nombres')
        apellidos = request.form.get('apellidos')
        correo_electronico = request.form.get('correo_electronico').strip().lower()
        contrasena_plana = request.form.get('contrasena')

        if nombres:
            nombres = ' '.join(word.capitalize() for word in nombres.strip().split())
        if apellidos:
            apellidos = ' '.join(word.capitalize() for word in apellidos.strip().split())

        if not nombres or not apellidos or not correo_electronico or not contrasena_plana:
            flash('Todos los campos son obligatorios.', 'error')
            return redirect(url_for('mostrar_formulario_registro'))

        try:
            valid_email = validate_email(correo_electronico, check_deliverability=False) 
            correo_electronico = valid_email.email
        except EmailNotValidError as e:
            print(f"[DEBUG] Error de validación de correo: {e}")
            flash(f'El correo electrónico "{correo_electronico}" no es válido. Por favor, revísalo.', 'error')
            return render_template('registro.html', form_data=request.form)

        contrasena_hasheada = generate_password_hash(contrasena_plana)

        # --- REFACTORIZADO: lógica de creación con orm ---
        try:
            print(f"[DEBUG] Intentando crear usuario: {correo_electronico}")
            # 1. crear la entrada de datos personales
            nuevos_datos = DatosP(
                nombre=nombres,
                apellidoP=apellidos,
                apellidoM='', 
                telefono=None, 
                fecha_nacimiento=datetime.now()
            )
            db.session.add(nuevos_datos)
            
            # 2. crear el usuario y vincularlo
            db.session.flush() 
            
            nuevo_usuario = Usuarios(
                id_datosP=nuevos_datos.id,
                correo_electronico=correo_electronico,
                contrasena=contrasena_hasheada,
                provider='local'
            )
            db.session.add(nuevo_usuario)
            
            # 3. hacer commit de ambas operaciones
            db.session.commit()
            print(f"[DEBUG] Usuario creado con éxito: {correo_electronico}")

            # Registrar actividad de nuevo usuario
            log_activity('create', f"Nuevo registro de usuario: {nombres} {apellidos} ({correo_electronico})")

            flash('¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.', 'success')
            return redirect(url_for('mostrar_formulario_inicio_sesion'))
            
        except IntegrityError: 
            db.session.rollback()
            print("[DEBUG] Error de integridad en la base de datos (posible correo duplicado).")
            # Verificamos si es por correo duplicado para dar un mensaje más útil
            existing_user = Usuarios.query.filter_by(correo_electronico=correo_electronico).first()
            if existing_user:
                if existing_user.provider == 'google':
                    flash('Este correo ya está registrado con Google. Por favor, inicia sesión con Google.', 'error')
                else:
                    flash('El correo electrónico ya está registrado. Por favor, intenta iniciar sesión.', 'error')
            else:
                flash('Error de integridad en la base de datos. Por favor, intenta de nuevo.', 'error')
            
            return render_template('registro.html', form_data=request.form)
        except Exception as e:
            db.session.rollback()
            print(f"[ERROR] Error inesperado en el registro:")
            traceback.print_exc()
            flash(f"Ocurrió un error inesperado en el servidor. Por favor, contacta a soporte si el problema persiste.", 'error')
            return render_template('registro.html', form_data=request.form)
        # 'finally' con 'conn.close()' ya no es necesario

@app.route('/iniciar_sesion')
def mostrar_formulario_inicio_sesion():
    return render_template('iniciar_sesion.html')

@app.route('/login', methods=['POST'])
def login_usuario():
    if request.method == 'POST':
        correo = request.form.get('correo')
        contrasena_ingresada = request.form.get('contrasena')

        if not correo or not contrasena_ingresada:
            return jsonify(success=False, message='Por favor, ingresa tu correo y contraseña.')

        correo = correo.strip().lower()

        # --- REFACTORIZADO: lógica de login con orm ---
        try:
            print(f"[DEBUG] Intento de inicio de sesión para: {correo}")
            # consulta usando el orm
            usuario = Usuarios.query.filter_by(correo_electronico=correo).first()
            
            if usuario and usuario.datosp:
                # VALIDACIÓN: Si es usuario de Google, bloquear login manual
                if usuario.provider == 'google':
                    print(f"[DEBUG] Usuario registrado con Google intentando login manual: {correo}")
                    return jsonify(success=False, message='Esta cuenta está registrada con Google. Por favor, utiliza el botón "Continuar con Google".')

                if check_password_hash(usuario.contrasena, contrasena_ingresada):
                    print(f"[DEBUG] Inicio de sesión exitoso para: {correo}")
                    flash('¡Bienvenido! Has iniciado sesión exitosamente.', 'success')
                    
                    # actualiza la última sesión
                    usuario.ultima_sesion = datetime.now()
                    db.session.commit()
                    
                    # guardar en sesión el resto de los datos necesarios
                    session['usuario_autenticado'] = True
                    session['user_id'] = usuario.id
                    session['nombres'] = usuario.datosp.nombre
                    session['apellidos'] = usuario.datosp.apellidoP
                    session['correo'] = usuario.correo_electronico
                    session['user_role'] = usuario.role
                    session['is_admin'] = (usuario.role in ['admin', 'superadmin'])
                    session['auth_method'] = 'local'
                    session['fecha_registro'] = formato_fecha_es(usuario.fecha_registro)
                    session['ultima_sesion'] = formato_fecha_hora_es(datetime.now())
                    session['test_completado'] = usuario.test_completado

                    if session.get('is_admin'):
                        log_activity('login', f"El administrador {usuario.datosp.nombre} ha iniciado sesión en el panel.")
                        return jsonify(success=True, redirect=url_for('admin_dashboard'))
                    return jsonify(success=True, redirect=url_for('dashboard'))
                else:
                    print(f"[DEBUG] Contraseña incorrecta para: {correo}")
                    return jsonify(success=False, message='La contraseña es incorrecta. Por favor, inténtalo de nuevo.')
            else:
                print(f"[DEBUG] Usuario no encontrado: {correo}")
                return jsonify(success=False, message='El correo electrónico no está registrado.')
            
        except Exception as e:
            print(f"[ERROR] Error inesperado en el inicio de sesión:")
            traceback.print_exc()
            return jsonify(success=False, message='Ocurrió un error inesperado en el servidor.')

    # 'finally' con 'conn.close()' ya no es necesario

# --- RUTAS DE GOOGLE OAUTH ---

@app.route('/login/google')
def login_google():
    redirect_uri = url_for('google_auth', _external=True)
    return google.authorize_redirect(redirect_uri)

@app.route('/auth/google/callback')
def google_auth():
    try:
        token = google.authorize_access_token()
        user_info = token.get('userinfo')
        
        # Si no obtenemos userinfo directamente del token, intentamos consultarlo
        if not user_info:
            user_info = google.get('https://openidconnect.googleapis.com/v1/userinfo').json()

        email = user_info.get('email')
        given_name = user_info.get('given_name', '')
        family_name = user_info.get('family_name', '')
        
        # Verificar si el usuario ya existe
        usuario = Usuarios.query.filter_by(correo_electronico=email).first()

        if not usuario:
            # Crear nuevo usuario
            # Generamos una contraseña aleatoria segura ya que entran por Google
            random_password = str(uuid.uuid4())
            contrasena_hasheada = generate_password_hash(random_password)
            
            nuevos_datos = DatosP(
                nombre=given_name,
                apellidoP=family_name,
                fecha_nacimiento=datetime.now(),
                telefono=None
            )
            db.session.add(nuevos_datos)
            db.session.flush()
            
            nuevo_usuario = Usuarios(
                id_datosP=nuevos_datos.id,
                correo_electronico=email,
                contrasena=contrasena_hasheada, # Contraseña dummy
                test_completado=False,
                provider='google'
            )
            db.session.add(nuevo_usuario)
            db.session.commit()
            flash('¡Cuenta creada exitosamente con Google!', 'success')
            usuario = nuevo_usuario
        else:
            # VALIDACIÓN DE CONFLICTO DE PROVEEDOR
            if usuario.provider == 'local':
                 flash('Ya existe una cuenta manual registrada con este correo. Por favor, inicia sesión con tu contraseña.', 'error')
                 return redirect(url_for('mostrar_formulario_inicio_sesion'))
            
             # actualiza la última sesión
            usuario.ultima_sesion = datetime.now()
            db.session.commit()

        # Iniciar sesión manual
        session['usuario_autenticado'] = True
        session['user_id'] = usuario.id
        # Aseguramos cargar datos si no están en memoria
        if not usuario.datosp:
             # Fallback raro, pero por si acaso
             session['nombres'] = given_name
             session['apellidos'] = family_name
        else:
            session['nombres'] = usuario.datosp.nombre
            session['apellidos'] = usuario.datosp.apellidoP
            
        session['correo'] = email
        session['fecha_registro'] = formato_fecha_es(usuario.fecha_registro)
        session['ultima_sesion'] = formato_fecha_hora_es(datetime.now())
        session['test_completado'] = usuario.test_completado
        session['auth_method'] = 'google'
        
        if email.lower() == "joshualeba2109@gmail.com":
            usuario.role = 'superadmin'
            db.session.commit()
            session['is_admin'] = True
            session['user_role'] = 'superadmin'
            log_activity('login', f"El SuperAdmin {usuario.datosp.nombre} ha iniciado sesión vía Google.")
            return redirect(url_for('admin_dashboard'))
        else:
            session['is_admin'] = True if usuario.role in ['admin', 'superadmin'] else False
            session['user_role'] = usuario.role
            if session['is_admin']:
                log_activity('login', f"El administrador {usuario.datosp.nombre} ha iniciado sesión vía Google.")
                return redirect(url_for('admin_dashboard'))
            return redirect(url_for('dashboard'))

    except Exception as e:
        print(f"Error en Google Auth: {e}")
        flash(f'Error al iniciar sesión con Google: {str(e)}', 'error')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))


@app.route('/admin_dashboard')
def admin_dashboard():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        flash('Acceso denegado. Se requieren permisos de administración.', 'error')
        return redirect(url_for('dashboard'))
    
    user_id = session.get('user_id')
    usuario = Usuarios.query.get(user_id)
    
    # Redirección de seguridad: si es cliente pero is_admin está en sesión (error raro)
    if usuario and usuario.role == 'cliente':
        session['is_admin'] = False
        return redirect(url_for('dashboard'))
    
    # Estadísticas reales para el administrador
    total_usuarios = Usuarios.query.count()
    total_test_completados = Usuarios.query.filter_by(test_completado=True).count()
    total_diagnosticos = DiagnosticosFinancieros.query.count()
    
    # Todos los administradores pueden ver a todos los usuarios en la lista
    usuarios_lista = Usuarios.query.all()
    
    admin_data = {
        'id': usuario.id if usuario else 0,
        'nombres': usuario.datosp.nombre if usuario and usuario.datosp else 'Administrador',
        'apellidos': usuario.datosp.apellidoP if usuario and usuario.datosp else '',
        'correo': usuario.correo_electronico if usuario else '',
        'rol': usuario.role if usuario else 'cliente',
        'auth_method': session.get('auth_method', 'google')
    }
    
    # Datos reales de crecimiento (últimos 7 días)
    try:
        from sqlalchemy import func
        from datetime import timedelta
        hoy = datetime.now()
        hace_7_dias = hoy - timedelta(days=6)
        
        # Consulta optimizada por fecha
        raw_growth = db.session.query(
            func.date(Usuarios.fecha_registro).label('dia'),
            func.count(Usuarios.id).label('cantidad')
        ).filter(Usuarios.fecha_registro >= hace_7_dias).group_by('dia').all()
        
        growth_map = {str(d): c for d, c in raw_growth}
        labels = []
        counts = []
        meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        
        for i in range(6, -1, -1):
            target_date = hoy - timedelta(days=i)
            labels.append(f"{target_date.day} {meses[target_date.month-1]}")
            counts.append(growth_map.get(target_date.strftime('%Y-%m-%d'), 0))
    except Exception as e:
        print(f"Error calculando crecimiento: {e}")
        labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
        counts = [0, 0, 0, 0, 0, 0, 0]

    return render_template('admin_dashboard.html', 
        admin=admin_data, 
        stats={
            'total_usuarios': total_usuarios,
            'total_test': total_test_completados,
            'total_diagnosticos': total_diagnosticos
        }, 
        usuarios=usuarios_lista,
        growth_labels=labels,
        growth_data=counts
    )

@app.route('/api/admin/cambiar_rol', methods=['POST'])
def cambiar_rol_usuario():
    if 'usuario_autenticado' not in session or session.get('user_role') != 'superadmin':
        return jsonify(success=False, message="No tienes permisos para realizar esta acción."), 403
    
    data = request.json
    usuario_id = data.get('usuario_id')
    nuevo_rol = data.get('nuevo_rol') # 'admin' o 'cliente'
    
    if nuevo_rol not in ['admin', 'cliente']:
        return jsonify(success=False, message="Rol no válido."), 400
        
    usuario = Usuarios.query.get(usuario_id)
    if not usuario:
        return jsonify(success=False, message="Usuario no encontrado."), 404
        
    if usuario.correo_electronico.lower() == "joshualeba2109@gmail.com":
        return jsonify(success=False, message="No se puede cambiar el rol del SuperAdmin."), 400
        
    usuario.role = nuevo_rol
    db.session.commit()
    
    # Registrar actividad de cambio de rol
    admin_ejecutor = session.get('nombres', 'SuperAdmin')
    log_activity('update', f"El SuperAdmin {admin_ejecutor} cambió el rol de {usuario.datosp.nombre} a {nuevo_rol.upper()}.")
    
    return jsonify(success=True, message=f"Rol del usuario {usuario.correo_electronico} actualizado a {nuevo_rol}.")

@app.route('/api/admin/usuario_detalle/<int:usuario_id>')
def admin_usuario_detalle(usuario_id):
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    usuario = Usuarios.query.get(usuario_id)
    if not usuario:
        return jsonify(success=False, message="Usuario no encontrado"), 404
        
    # Información del test
    ultimo_resultado = ResultadosTest.query.filter_by(usuario_id=usuario_id).order_by(ResultadosTest.fecha_realizacion.desc()).first()
    test_info = {
        'completado': usuario.test_completado,
        'puntuacion': ultimo_resultado.puntuacion if ultimo_resultado else 0,
        'total': ultimo_resultado.total_preguntas if ultimo_resultado else 0,
        'fecha': formato_fecha_hora_es(ultimo_resultado.fecha_realizacion) if ultimo_resultado else 'Pendiente'
    }
    
    # Información del diagnóstico
    ultimo_diagnostico = DiagnosticosFinancieros.query.filter_by(usuario_id=usuario_id).order_by(DiagnosticosFinancieros.fecha_diagnostico.desc()).first()
    diag_info = {
        'realizado': ultimo_diagnostico is not None,
        'ingresos': float(ultimo_diagnostico.ingresos_mensuales) if ultimo_diagnostico and ultimo_diagnostico.ingresos_mensuales else 0,
        'gastos': float(ultimo_diagnostico.gastos_mensuales) if ultimo_diagnostico and ultimo_diagnostico.gastos_mensuales else 0,
        'puntaje_salud': ultimo_diagnostico.puntaje_salud if ultimo_diagnostico else 0,
        'fecha': formato_fecha_hora_es(ultimo_diagnostico.fecha_diagnostico) if ultimo_diagnostico else 'Pendiente'
    }
    
    return jsonify(
        success=True,
        id=usuario.id,
        nombre=f"{usuario.datosp.nombre} {usuario.datosp.apellidoP}",
        correo=usuario.correo_electronico,
        rol=usuario.role,
        fecha_registro=formato_fecha_es(usuario.fecha_registro),
        ultima_conexion=formato_fecha_hora_es(usuario.ultima_sesion) if usuario.ultima_sesion else 'Sin actividad reciente',
        metodo_auth=usuario.provider.capitalize() if usuario.provider else 'Local',
        test=test_info,
        diagnostico=diag_info
    )

@app.route('/api/admin/eliminar_usuario', methods=['POST'])
def eliminar_usuario():
    if 'usuario_autenticado' not in session or session.get('user_role') != 'superadmin':
        return jsonify(success=False, message="No tienes permisos para realizar esta acción."), 403
    
    data = request.json
    usuario_id = data.get('usuario_id')
    
    usuario = Usuarios.query.get(usuario_id)
    if not usuario:
        return jsonify(success=False, message="Usuario no encontrado."), 404
        
    if usuario.correo_electronico.lower() == "joshualeba2109@gmail.com":
        return jsonify(success=False, message="No se puede eliminar la cuenta del SuperAdmin."), 400
        
    nombre_eliminado = f"{usuario.datosp.nombre} {usuario.datosp.apellidoP}"
    correo_eliminado = usuario.correo_electronico
    
    db.session.delete(usuario)
    db.session.commit()
    
    # Registrar actividad de eliminación
    admin_ejecutor = session.get('nombres', 'SuperAdmin')
    log_activity('delete', f"El SuperAdmin {admin_ejecutor} eliminó permanentemente al usuario {nombre_eliminado} ({correo_eliminado}).")
    
    return jsonify(success=True, message="Usuario eliminado permanentemente.")

# --- RUTAS DE GESTIÓN DE CONTENIDO (GLOSARIO) ---

@app.route('/api/admin/glosario', methods=['GET'])
def admin_get_glosario():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    terminos = Glosario.query.order_by(Glosario.termino).all()
    data = [{
        'id': t.id,
        'termino': t.termino,
        'descripcion': t.descripcion,
        'categoria': t.categoria
    } for t in terminos]
    
    return jsonify(success=True, data=data)

@app.route('/api/admin/glosario/crear', methods=['POST'])
def admin_crear_glosario():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    nuevo_termino = Glosario(
        termino=data.get('termino'),
        descripcion=data.get('descripcion'),
        categoria=data.get('categoria')
    )
    db.session.add(nuevo_termino)
    db.session.commit()
    log_activity('create', f"Creación del término '{nuevo_termino.termino}' en el glosario")
    return jsonify(success=True, message="Término agregado al glosario.")

@app.route('/api/admin/glosario/editar', methods=['POST'])
def admin_editar_glosario():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    termino = Glosario.query.get(data.get('id'))
    if not termino:
        return jsonify(success=False, message="Término no encontrado"), 404
        
    termino.termino = data.get('termino')
    termino.descripcion = data.get('descripcion')
    termino.categoria = data.get('categoria')
    db.session.commit()
    log_activity('update', f"Actualización del término '{termino.termino}' en el glosario")
    return jsonify(success=True, message="Término actualizado correctamente.")

@app.route('/api/admin/glosario/eliminar', methods=['POST'])
def admin_eliminar_glosario():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    termino = Glosario.query.get(data.get('id'))
    if not termino:
        return jsonify(success=False, message="Término no encontrado"), 404
        
    nombre_t = termino.termino
    db.session.delete(termino)
    db.session.commit()
    log_activity('delete', f"Eliminación del término '{nombre_t}' del glosario")
    return jsonify(success=True, message="Término eliminado del glosario.")

@app.route('/api/admin/sofipos', methods=['GET'])
def admin_get_sofipos():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    sofipos = Sofipos.query.order_by(Sofipos.tasa_anual.desc()).all()
    data = [{
        'id': s.id,
        'nombre': s.nombre,
        'tasa_anual': float(s.tasa_anual),
        'plazo_dias': s.plazo_dias,
        'nicap': float(s.nicap),
        'logo_url': s.logo_url,
        'url_web': s.url_web
    } for s in sofipos]
    
    return jsonify(success=True, data=data)

@app.route('/api/admin/sofipos/crear', methods=['POST'])
def admin_crear_sofipo():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    nueva_sofipo = Sofipos(
        nombre=data.get('nombre'),
        tasa_anual=data.get('tasa_anual'),
        plazo_dias=data.get('plazo_dias'),
        nicap=data.get('nicap'),
        logo_url=data.get('logo_url'),
        url_web=data.get('url_web')
    )
    db.session.add(nueva_sofipo)
    db.session.commit()
    log_activity('create', f"Nueva SOFIPO agregada: {nueva_sofipo.nombre}")
    return jsonify(success=True, message="Institución agregada al ranking.")

@app.route('/api/admin/sofipos/editar', methods=['POST'])
def admin_editar_sofipo():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    sofipo = Sofipos.query.get(data.get('id'))
    if not sofipo:
        return jsonify(success=False, message="Institución no encontrada"), 404
        
    sofipo.nombre = data.get('nombre')
    sofipo.tasa_anual = data.get('tasa_anual')
    sofipo.plazo_dias = data.get('plazo_dias')
    sofipo.nicap = data.get('nicap')
    sofipo.logo_url = data.get('logo_url')
    sofipo.url_web = data.get('url_web')
    
    db.session.commit()
    log_activity('update', f"Datos actualizados para {sofipo.nombre}")
    return jsonify(success=True, message="Datos de la institución actualizados.")

@app.route('/api/admin/actividad', methods=['GET'])
def admin_get_actividad():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    logs = ActivityLog.query.order_by(ActivityLog.fecha.desc()).limit(50).all()
    data = [{
        'fecha': formato_fecha_hora_es(l.fecha),
        'admin': l.admin_nombre,
        'accion': l.accion,
        'tipo': l.tipo,
        'id': l.evento_id
    } for l in logs]
    
    return jsonify(success=True, data=data)

@app.route('/api/admin/sofipos/eliminar', methods=['POST'])
def admin_eliminar_sofipo():
    if 'usuario_autenticado' not in session or not session.get('is_admin'):
        return jsonify(success=False, message="No autorizado"), 401
    
    data = request.json
    sofipo = Sofipos.query.get(data.get('id'))
    if not sofipo:
        return jsonify(success=False, message="Institución no encontrada"), 404
    
    nombre_sofipo = sofipo.nombre
    db.session.delete(sofipo)
    db.session.commit()
    log_activity('delete', f"Eliminación de la institución {nombre_sofipo}")
    return jsonify(success=True, message="Institución eliminada del ranking.")


# --- Rutas alias para las URLs virtuales del dashboard ---
# El JS usa history.replaceState() para cambiar la URL al navegar entre secciones.
# Si el usuario navega a otra página y presiona "Regresar", el navegador
# intenta cargar esas URLs directamente. Aquí las capturamos y redirigimos al dashboard.
@app.route('/inicio')
@app.route('/simulaciones')
@app.route('/test-de-conocimientos')
@app.route('/mi-perfil')
def dashboard_redirect():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al dashboard.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    
    if session.get('is_admin'):
        return redirect(url_for('admin_dashboard'))
    
    user_id = session.get('user_id')
    usuario = Usuarios.query.get(user_id)
    
    if not usuario:
        session.clear()
        return redirect(url_for('mostrar_formulario_inicio_sesion'))

    usuario_data = {
        'id': usuario.id,
        'nombres': usuario.datosp.nombre,
        'apellidos': usuario.datosp.apellidoP,
        'correo': usuario.correo_electronico,
        'fecha_registro': formato_fecha_es(usuario.fecha_registro),
        'ultima_sesion': formato_fecha_hora_es(usuario.ultima_sesion),
        'test_completado': usuario.test_completado,
        'auth_method': session.get('auth_method', 'local')
    }
    return render_template('dashboard.html', usuario=usuario_data)

@app.route('/actualizar_perfil', methods=['POST'])
def actualizar_perfil():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para actualizar tu perfil.', 'error')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))

    user_id = session.get('user_id')
    if not user_id:
        flash('Error: No se pudo encontrar el ID de usuario en la sesión.', 'error')
        return redirect(url_for('dashboard'))

    nombres = request.form.get('nombres')
    apellidos = request.form.get('apellidos')
    
    if nombres: nombres = ' '.join(word.capitalize() for word in nombres.strip().split())
    if apellidos: apellidos = ' '.join(word.capitalize() for word in apellidos.strip().split())

    # --- REFACTORIZADO: lógica de actualización con orm ---
    try:
        # 1. encontrar el usuario y sus datos
        usuario = Usuarios.query.get(user_id)
        
        if usuario and usuario.datosp:
            # 2. actualizar los datos en el objeto
            usuario.datosp.nombre = nombres
            usuario.datosp.apellidoP = apellidos
            
            # 3. hacer commit de los cambios
            db.session.commit()

            # Registrar actividad
            log_activity('update', f"El usuario {nombres} ha actualizado sus datos de perfil.")

            session['nombres'] = nombres
            session['apellidos'] = apellidos

            return jsonify(success=True, message='Tu perfil ha sido actualizado exitosamente.')
        else:
            return jsonify(success=False, message='Error: No se pudo encontrar el usuario para actualizar.')
    
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, message=f"Ocurrió un error inesperado al actualizar tu perfil: {e}")
    # 'finally' con 'conn.close()' ya no es necesario

@app.route('/cambiar_contrasena', methods=['POST'])
def cambiar_contrasena():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        return jsonify(success=False, message='Por favor, inicia sesión para cambiar tu contraseña.')

    user_id = session.get('user_id')
    if not user_id:
        return jsonify(success=False, message='Error: No se pudo encontrar el ID de usuario en la sesión.')

    contrasena_actual = request.form.get('contrasena_actual')
    nueva_contrasena = request.form.get('nueva_contrasena')
    confirmar_nueva_contrasena = request.form.get('confirmar_nueva_contrasena')

    # (validaciones de campos se mantienen igual)
    if not contrasena_actual or not nueva_contrasena or not confirmar_nueva_contrasena:
        return jsonify(success=False, message='Todos los campos de contraseña son obligatorios.')
    if nueva_contrasena != confirmar_nueva_contrasena:
        return jsonify(success=False, message='La nueva contraseña y su confirmación no coinciden.')
    if not re.search(r'[A-Z]', nueva_contrasena):
        return jsonify(success=False, message='La nueva contraseña debe contener al menos una letra mayúscula.')
    if not re.search(r'[!@#$%^&*()_+\-=\[\]{};\':"\\|,.<>\/?~]', nueva_contrasena):
        return jsonify(success=False, message='La nueva contraseña debe contener al menos un carácter especial.')
    if not (8 <= len(nueva_contrasena) <= 25):
        return jsonify(success=False, message='La nueva contraseña debe tener entre 8 y 25 caracteres.')

    # --- REFACTORIZADO: lógica de cambio de contraseña con orm ---
    try:
        # 1. encontrar al usuario
        usuario = Usuarios.query.get(user_id)

        if usuario and check_password_hash(usuario.contrasena, contrasena_actual):
            # 2. actualizar la contraseña en el objeto
            usuario.contrasena = generate_password_hash(nueva_contrasena)
            
            # 3. hacer commit
            db.session.commit()
            
            # Registrar actividad
            log_activity('update', f"El usuario {usuario.datosp.nombre} ha cambiado su contraseña.")
            
            return jsonify(success=True, message='Tu contraseña ha sido cambiada exitosamente.')
        else:
            return jsonify(success=False, message='La contraseña actual es incorrecta.')
        
    except Exception as e:
        db.session.rollback()
        return jsonify(success=False, message=f"Ocurrió un error inesperado al cambiar contraseña: {e}")
    # 'finally' con 'conn.close()' ya no es necesario

# --- NUEVO: ruta para delete (crud completo) ---
@app.route('/eliminar_cuenta', methods=['POST'])
def eliminar_cuenta():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para eliminar tu cuenta.', 'error')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
        
    user_id = session.get('user_id')
    contrasena_ingresada = request.form.get('contrasena_confirmar_eliminar')

    if not contrasena_ingresada:
        flash('Debes ingresar tu contraseña para confirmar la eliminación.', 'error')
        return redirect(url_for('dashboard')) # o donde tengas el modal de eliminar

    try:
        usuario = Usuarios.query.get(user_id)
        
        if usuario and check_password_hash(usuario.contrasena, contrasena_ingresada):
            # tenemos que eliminar datosp primero, o configurar 'cascade'
            # es más simple eliminar ambos manualmente si no hay 'cascade'
            
            datosp = usuario.datosp
            
            # el 'cascade' en el modelo se encarga de los resultados_test
            db.session.delete(usuario)
            if datosp:
                db.session.delete(datosp) # eliminar datosp asociados
            
            db.session.commit()
            
            # Registrar actividad
            log_activity('delete', f"El usuario {session.get('nombres')} ha eliminado su propia cuenta permanentemente.")
            
            session.clear()
            flash('Tu cuenta y todos tus datos han sido eliminados permanentemente.', 'success')
            return redirect(url_for('index'))
        else:
            flash('Contraseña incorrecta. No se pudo eliminar la cuenta.', 'error')
            return redirect(url_for('dashboard')) # o donde tengas el modal

    except Exception as e:
        db.session.rollback()
        flash(f'Ocurrió un error al intentar eliminar tu cuenta: {e}', 'error')
        return redirect(url_for('dashboard'))


@app.route('/logout')
def logout():
    session.clear()
    flash('Has cerrado sesión exitosamente.', 'info')
    return redirect(url_for('mostrar_pagina_estatica', filename='index.html'))

@app.route('/terminos_y_condiciones')
def terminos_y_condiciones():
    return render_template('terminos_y_condiciones.html')



# sección: rutas para simuladores (se mantienen sin cambios)
@app.route('/simulador_ahorro')
def simulador_ahorro():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de ahorro.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('simulador_ahorro.html', usuario=usuario_data)

@app.route('/<path:filename>')
def mostrar_pagina_estatica(filename):
    from flask import send_from_directory
    return send_from_directory(app.root_path, filename)

@app.route('/simulador_credito')
def simulador_credito():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de crédito.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('simulador_credito.html', usuario=usuario_data)

@app.route('/simulador_inversion')
def simulador_inversion():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de inversión.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('simulador_inversion.html', usuario=usuario_data)

@app.route('/simulador_presupuesto_personal')
def simulador_presupuesto_personal():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de presupuesto personal.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('simulador_presupuesto_personal.html', usuario=usuario_data)

@app.route('/simulador_retiro_jubilacion')
def simulador_retiro_jubilacion():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de retiro/jubilación.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('simulador_retiro_jubilacion.html', usuario=usuario_data)

@app.route('/calculadora_deuda')
def calculadora_deuda():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al simulador de retiro/jubilación.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('calculadora_deuda.html', usuario=usuario_data)

# sección: nueva ruta para el glosario
@app.route('/glosario')
@app.route('/glosario.html')
def glosario():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        flash('Por favor, inicia sesión para acceder al glosario.', 'info')
        return redirect(url_for('mostrar_formulario_inicio_sesion'))
    
    terminos = Glosario.query.order_by(Glosario.termino).all()
    
    usuario_data = {
        'nombres': session.get('nombres', 'usuario'),
        'apellidos': session.get('apellidos', ''),
        'correo': session.get('correo', 'correo@ejemplo.com')
    }
    return render_template('glosario.html', usuario=usuario_data, terminos=terminos)


# sección: rutas para el test de conocimientos financieros
@app.route('/api/preguntas_test', methods=['GET'])
def get_preguntas_test():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        return jsonify(message='No autorizado para acceder a las preguntas del test.'), 401

    user_id = session.get('user_id')
    
    # --- REFACTORIZADO: lógica de test con orm ---
    try:
        usuario = Usuarios.query.get(user_id)

        if usuario.test_completado:
            last_result = ResultadosTest.query.filter_by(usuario_id=user_id)\
                .order_by(ResultadosTest.fecha_realizacion.desc())\
                .first()
            
            if last_result:
                return jsonify(
                    test_completado=True,
                    score=last_result.puntuacion,
                    total=last_result.total_preguntas,
                    puntuacion_total=last_result.puntuacion_total,
                    tiempo_resolucion_segundos=float(last_result.tiempo_resolucion_segundos)
                )
            else:
                return jsonify(test_completado=True, score=0, total=0, puntuacion_total=0, tiempo_resolucion_segundos=0.0)

        # cargar preguntas con sus relaciones (opciones, categoria, etc.)
        preguntas_db = PreguntasTest.query\
            .options(db.joinedload(PreguntasTest.opciones))\
            .options(db.joinedload(PreguntasTest.tipo_pregunta))\
            .options(db.joinedload(PreguntasTest.dificultad))\
            .options(db.joinedload(PreguntasTest.categoria))\
            .all()
        
        preguntas = []
        for pt in preguntas_db:
            preguntas.append({
                'id': pt.id,
                'pregunta': pt.pregunta,
                'tipo_pregunta': pt.tipo_pregunta.nombre if pt.tipo_pregunta else None,
                'dificultad': pt.dificultad.nombre if pt.dificultad else None,
                'categoria': pt.categoria.nombre if pt.categoria else None,
                'respuesta_texto_correcta': pt.respuesta_texto_correcta,
                'opciones': [{
                    'id': op.id,
                    'texto': op.texto_opcion,
                    'es_correcta': op.es_correcta
                } for op in pt.opciones]
            })
        
        return jsonify(test_completado=False, preguntas=preguntas)
    
    except Exception as e:
        print(f"Error inesperado al obtener preguntas: {e}")
        return jsonify(message=f"Error inesperado en el servidor: {e}"), 500
    # 'finally' con 'conn.close()' ya no es necesario

@app.route('/api/submit_test', methods=['POST'])
def submit_test():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        return jsonify(message='No autorizado para enviar el test.'), 401

    user_id = session.get('user_id')
    data = request.json
    respuestas_usuario = data.get('respuestas', {})
    puntuacion_total_calculada = data.get('puntuacion_total', 0)
    tiempo_total_segundos = data.get('tiempo_total_segundos', 0.0)
    respuestas_correctas_count = data.get('respuestas_correctas_count', 0) 

    if not respuestas_usuario:
        return jsonify(success=False, message='No se recibieron respuestas.'), 400

    # --- REFACTORIZADO: lógica de envío de test con orm ---
    try:
        usuario = Usuarios.query.get(user_id)

        if usuario.test_completado:
            return jsonify(success=False, message='Ya has completado el test. No puedes enviarlo de nuevo.'), 403

        # Guardar los resultados
        nuevo_resultado = ResultadosTest(
            usuario_id=user_id,
            puntuacion=respuestas_correctas_count,
            total_preguntas=data.get('total_preguntas', 12),
            puntuacion_total=puntuacion_total_calculada,
            tiempo_resolucion_segundos=tiempo_total_segundos
        )
        db.session.add(nuevo_resultado)
        
        # Actualizar al usuario
        usuario.test_completado = True
        
        db.session.commit()
        
        # Registrar actividad de test completado
        log_activity('test', f"El usuario {usuario.datosp.nombre} ha completado el test de conocimientos con {respuestas_correctas_count} aciertos.")
        
        session['test_completado'] = True

        return jsonify(
            success=True,
            score=respuestas_correctas_count, 
            total=data.get('total_preguntas', 12), 
            puntuacion_total=puntuacion_total_calculada, 
            tiempo_resolucion_segundos=tiempo_total_segundos,
            message='Test enviado y guardado exitosamente.'
        )

    except Exception as e:
        db.session.rollback()
        print(f"Error inesperado al enviar test: {e}")
        return jsonify(success=False, message=f"Error inesperado en el servidor: {e}"), 500
    # 'finally' con 'conn.close()' ya no es necesario

@app.route('/api/ranking', methods=['GET'])
def get_ranking():
    if 'usuario_autenticado' not in session or not session['usuario_autenticado']:
        return jsonify(message='No autorizado para acceder al ranking.'), 401

    user_id = session.get('user_id')
    
    # --- REFACTORIZADO: lógica de ranking con orm ---
    try:
        # obtener el top 10 del ranking
        top_ranking_db = ResultadosTest.query\
            .join(ResultadosTest.usuario)\
            .join(Usuarios.datosp)\
            .order_by(ResultadosTest.puntuacion_total.desc(), ResultadosTest.tiempo_resolucion_segundos.asc())\
            .limit(50)\
            .all()

        ranking = []
        for i, rt in enumerate(top_ranking_db):
            ranking.append({
                'posicion': i + 1,
                'nombre': f"{rt.usuario.datosp.nombre} {rt.usuario.datosp.apellidoP}",
                'puntuacion_total': rt.puntuacion_total,
                'tiempo_resolucion_segundos': float(rt.tiempo_resolucion_segundos),
                'aciertos': rt.puntuacion,
                'total_preguntas': rt.total_preguntas,
                'user_id': rt.usuario_id
            })

        # obtener el resultado del usuario actual
        user_in_top_10 = any(rt.usuario_id == user_id for rt in top_ranking_db)
        user_result = None
        user_position = -1

        if not user_in_top_10:
            user_raw_result = ResultadosTest.query.filter_by(usuario_id=user_id).first()

            if user_raw_result:
                user_result = {
                    'nombres': user_raw_result.usuario.datosp.nombre,
                    'apellidos': user_raw_result.usuario.datosp.apellidoP,
                    'puntuacion_total': user_raw_result.puntuacion_total,
                    'tiempo_resolucion_segundos': float(user_raw_result.tiempo_resolucion_segundos),
                    'respuestas_correctas': user_raw_result.puntuacion
                }
                
                # calcular la posición del usuario
                # (esta consulta es más simple con sql puro, pero se puede hacer con el orm)
                user_position = db.session.query(ResultadosTest.id)\
                    .filter(ResultadosTest.puntuacion_total > user_raw_result.puntuacion_total)\
                    .count() + 1

        return jsonify(success=True, ranking=ranking, user_result=user_result, user_position=user_position, current_user_id=user_id)

    except Exception as e:
        print(f"Error inesperado al obtener ranking: {e}")
        return jsonify(success=False, message=f"Error inesperado en el servidor: {e}"), 500
    # 'finally' con 'conn.close()' ya no es necesario

# --- CHATBOT COPILOTO IA ---
@app.route('/api/copiloto', methods=['POST'])
def copiloto_financiero():
    if not os.environ.get("GROQ_API_KEY"):
        return jsonify({"success": False, "respuesta": "Por favor configura tu GROQ_API_KEY en el archivo .env"}), 400

    data = request.json
    mensaje_usuario = data.get('mensaje', '')
    contexto_pagina = data.get('contexto', 'Navegando en Mercy')
    historial = data.get('historial', [])

    internet_context = ""
    try:
        from ddgs import DDGS
        resultados_busqueda = DDGS().text(mensaje_usuario + " finanzas mexico rendimientos", max_results=3)
        if resultados_busqueda:
            internet_context = "\n\nRESULTADOS EN TIEMPO REAL (Úsalos para responder con datos actuales, como el GAT nominal/real o rendimientos de Nu, Ualá, Klar, etc.):\n"
            for res in resultados_busqueda:
                internet_context += f"- {res.get('body')}\n"
    except Exception as e:
        print("Error en búsqueda en internet DDGS: ", e)

    system_prompt = f"""Eres 'Mercy IA', el copiloto experto en finanzas de la plataforma "Mercy".
Tu misión es educar y resolver de forma clara, directa y útil las dudas de finanzas e inversiones.
Contexto actual de la pantalla del usuario: {contexto_pagina}.{internet_context}

REGLAS IMPORTANTES:
1. LOGITUD PERFECTA: No te explayes demasiado ni seas excesivamente corto. Sé directo, amable y explica justo lo necesario para dar valor.
2. Tienes profundo conocimiento de conceptos financieros y ahora acceso a datos actuales gracias al contexto de arriba.
3. ESTILO DE LISTAS ESTRICTO: Tienes estrictamente prohibido usar asteriscos (*) o guiones (-) para hacer viñetas o listas. Si necesitas enlistar algo, debes usar código HTML con <ul> y <li>.
Ejemplo:
<ul>
<li>Tasa de rendimiento anual</li>
<li>Beneficio del GAT real</li>
</ul>
4. Mantén tus títulos o resaltos con markdown normal (como **negritas**), pero para viñetas solo usa HTML.
5. Si te pide un paso a paso para conseguir una API, explícale que puede obtener una "Tavily API Key" gratuita registrándose en su página web y copiar esa key en su proyecto de backend, pero que POR AHORA tú ya tienes conexión nativa a internet interconectada y no ocupa buscarla en otro lugar."""

    try:
        from groq import Groq
        cliente_groq = Groq(api_key=os.environ.get("GROQ_API_KEY"))

        mensajes = [{"role": "system", "content": system_prompt}]
        for msg in historial:
            role = msg.get('role')
            content = msg.get('content')
            if role in ['user', 'assistant'] and content:
                mensajes.append({"role": role, "content": content})
        mensajes.append({"role": "user", "content": mensaje_usuario})

        chat_completion = cliente_groq.chat.completions.create(
            messages=mensajes,
            model="llama-3.3-70b-versatile", 
            temperature=0.7,
        )
        
        respuesta_ia = chat_completion.choices[0].message.content
        return jsonify({"success": True, "respuesta": respuesta_ia, "respuesta_cruda": respuesta_ia})

    except Exception as e:
        print(f"Error AI: {e}")
        return jsonify({"success": False, "respuesta": f"Hubo un error de conexión con mi cerebro. Intenta de nuevo más tarde."}), 500

@app.route('/api/noticia_financiera', methods=['GET'])
def noticia_financiera():
    if not os.environ.get("GROQ_API_KEY"):
        return jsonify({"success": False, "respuesta": "API key de Groq no configurada."}), 500

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
            temperature=0.9, # Higher temperature for more variance
        )
        return jsonify({"success": True, "respuesta": chat_completion.choices[0].message.content.strip()})
    except Exception as e:
        print("Error noticia_financiera:", e)
        return jsonify({"success": False, "respuesta": "Revisa tus finanzas cada semana para mantenerte seguro."})

# Inicialización automática de base de datos
with app.app_context():
    # 1. Crear las tablas físicas si no existen (esencial para Render/producción)
    db.create_all()
    print("Tablas verificadas en db.")
    
    # 2. Verificar si hay datos clave (por ejemplo, si existen categorías)
    # Si la tabla Categorias está vacía, asumimos que es una base de datos recién creada.
    categoria_existente = Categorias.query.first()
    if not categoria_existente:
        print("La base de datos está vacía. Ejecutando la semilla de inicialización...")
        try:
            from semilla import hard_reset_database
            hard_reset_database()
            print("Semilla inyectada correctamente en el arranque automático.")
        except Exception as e:
            print(f"ATENCIÓN: Hubo un problema al inyectar la semilla en producción: {e}")

# sección: ejecución de la aplicación (entorno local)
if __name__ == '__main__':
    app.run(debug=True)