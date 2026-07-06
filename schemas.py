from pydantic import BaseModel, EmailStr
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
