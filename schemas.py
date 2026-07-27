from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List

class UserLogin(BaseModel):
    correo: EmailStr
    contrasena: str

class UserRegister(BaseModel):
    nombres: str
    apellidos: str
    correo_electronico: EmailStr
    contrasena: str

class DiagnosticoIn(BaseModel):
    ingresos: float
    gastos: float
    deuda: float
    ahorro: float

class SofipoOut(BaseModel):
    nombre: str
    tasa: float
    plazo: int
    nicap: float
    logo: Optional[str]
    url: Optional[str]

class ChatMessage(BaseModel):
    role: str
    content: str

class CopilotoRequest(BaseModel):
    mensaje: str
    contexto: Optional[str] = "Navegando en Mercy"
    historial: Optional[List[ChatMessage]] = []

class SimuladorAhorroIn(BaseModel):
    meta: float = Field(..., gt=0)
    aporte_mensual: float = Field(..., gt=0)
    tasa_anual: float = Field(..., ge=0)
    meses: int = Field(..., gt=0)

class SimuladorCreditoIn(BaseModel):
    monto: float = Field(..., gt=0)
    tasa_anual: float = Field(..., gt=0)
    plazo_meses: int = Field(..., gt=0)

class SimuladorInversionIn(BaseModel):
    monto_inicial: float = Field(..., gt=0)
    aporte_mensual: float = Field(..., ge=0)
    tasa_anual: float = Field(..., gt=0)
    anos: int = Field(..., gt=0)

class SimuladorPresupuestoIn(BaseModel):
    ingresos: float = Field(..., gt=0)
    gastos_fijos: float = Field(..., ge=0)
    gastos_variables: float = Field(..., ge=0)

class SimuladorRetiroIn(BaseModel):
    edad_actual: int = Field(..., gt=0, lt=100)
    edad_retiro: int = Field(..., gt=0, le=100)
    ahorro_actual: float = Field(..., ge=0)
    aporte_mensual: float = Field(..., ge=0)
    tasa_anual: float = Field(..., ge=0)

class SimuladorDeudaIn(BaseModel):
    saldo_total: float = Field(..., gt=0)
    tasa_anual: float = Field(..., gt=0)
    pago_mensual: float = Field(..., gt=0)

class UserUpdateProfile(BaseModel):
    nombre: Optional[str] = None
    password_actual: Optional[str] = None
    password_nueva: Optional[str] = None
