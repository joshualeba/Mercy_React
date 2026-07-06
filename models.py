from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Boolean, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class DatosP(Base):
    __tablename__ = 'DatosP'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    apellidoP = Column(String(255))
    apellidoM = Column(String(255))
    fecha_nacimiento = Column(DateTime, nullable=False, default=datetime.now)
    telefono = Column(BigInteger)
    
    usuario = relationship('Usuarios', back_populates='datosp', uselist=False, lazy='select')

class Usuarios(Base):
    __tablename__ = 'usuarios'

    id = Column(Integer, primary_key=True, autoincrement=True)
    id_datosP = Column(Integer, ForeignKey('DatosP.id'), unique=True, nullable=False)
    correo_electronico = Column(String(255), nullable=False, unique=True)
    contrasena = Column(String(255), nullable=False)
    fecha_registro = Column(DateTime, nullable=False, default=datetime.now)
    ultima_sesion = Column(DateTime)
    test_completado = Column(Boolean, nullable=False, default=False)
    provider = Column(String(50), default='local') 
    role = Column(String(20), default='cliente') 
    
    datosp = relationship('DatosP', back_populates='usuario', lazy='select')
    resultados = relationship('ResultadosTest', back_populates='usuario', lazy='select', cascade="all, delete-orphan")

class Tipo_Preguntas(Base):
    __tablename__ = 'Tipo_Preguntas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255))
    preguntas = relationship('PreguntasTest', back_populates='tipo_pregunta', lazy='select')

class Dificultades(Base):
    __tablename__ = 'Dificultades'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255))
    preguntas = relationship('PreguntasTest', back_populates='dificultad', lazy='select')

class Categorias(Base):
    __tablename__ = 'Categorias'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255))
    preguntas = relationship('PreguntasTest', back_populates='categoria', lazy='select')

class PreguntasTest(Base):
    __tablename__ = 'preguntas_test'

    id = Column(Integer, primary_key=True, autoincrement=True)
    pregunta = Column(String(500), nullable=False)
    id_tipoPregunta = Column(Integer, ForeignKey('Tipo_Preguntas.id'))
    id_dificultad = Column(Integer, ForeignKey('Dificultades.id'))
    id_categoria = Column(Integer, ForeignKey('Categorias.id'))
    respuesta_texto_correcta = Column(String(500))
    
    tipo_pregunta = relationship('Tipo_Preguntas', back_populates='preguntas', lazy='select')
    dificultad = relationship('Dificultades', back_populates='preguntas', lazy='select')
    categoria = relationship('Categorias', back_populates='preguntas', lazy='select')
    opciones = relationship('OpcionesRespuesta', back_populates='pregunta', lazy='select', cascade="all, delete-orphan")

class OpcionesRespuesta(Base):
    __tablename__ = 'opciones_respuesta'

    id = Column(Integer, primary_key=True, autoincrement=True)
    pregunta_id = Column(Integer, ForeignKey('preguntas_test.id'), nullable=False)
    texto_opcion = Column(String(500), nullable=False)
    es_correcta = Column(Boolean, nullable=False)
    
    pregunta = relationship('PreguntasTest', back_populates='opciones', lazy='select')

class ResultadosTest(Base):
    __tablename__ = 'resultados_test'

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    puntuacion = Column(Integer, nullable=False)
    total_preguntas = Column(Integer, nullable=False)
    puntuacion_total = Column(Integer, nullable=False, default=0)
    tiempo_resolucion_segundos = Column(Numeric(10, 2), nullable=False, default=0.00)
    fecha_realizacion = Column(DateTime, nullable=False, default=datetime.now)
    
    usuario = relationship('Usuarios', back_populates='resultados', lazy='select')

class Sofipos(Base):
    __tablename__ = 'sofipos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tasa_anual = Column(Numeric(5, 2), nullable=False)
    plazo_dias = Column(Integer, nullable=False)
    nicap = Column(Numeric(6, 2), nullable=False)
    logo_url = Column(String(255))
    url_web = Column(String(255))

class DiagnosticosFinancieros(Base):
    __tablename__ = 'diagnosticos_financieros'

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    ingresos_mensuales = Column(Numeric(10,2))
    gastos_mensuales = Column(Numeric(10,2))
    deuda_total = Column(Numeric(10,2))
    ahorro_actual = Column(Numeric(10,2))
    puntaje_salud = Column(Integer)
    nivel_endeudamiento = Column(Numeric(5,2))
    recomendacion_clave = Column(String(255))
    fecha_diagnostico = Column(DateTime, default=datetime.now)

class Glosario(Base):
    __tablename__ = 'glosario'

    id = Column(Integer, primary_key=True, autoincrement=True)
    termino = Column(String(150), nullable=False)
    descripcion = Column(Text, nullable=False)
    categoria = Column(String(50), nullable=False)

class ActivityLog(Base):
    __tablename__ = 'activity_log'

    id = Column(Integer, primary_key=True, autoincrement=True)
    fecha = Column(DateTime, default=datetime.now)
    admin_nombre = Column(String(100))
    accion = Column(Text)
    tipo = Column(String(20))
    evento_id = Column(String(20))
