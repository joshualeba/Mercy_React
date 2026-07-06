import traceback
from database import SessionLocal
import models
from datetime import datetime
from fastapi_app import get_password_hash

def test_insert():
    db = SessionLocal()
    try:
        nuevos_datos = models.DatosP(
            nombre="Test",
            apellidoP="Test",
            apellidoM='',
            fecha_nacimiento=datetime.now()
        )
        db.add(nuevos_datos)
        db.flush()
        
        nuevo_usuario = models.Usuarios(
            id_datosP=nuevos_datos.id,
            correo_electronico="test_error@gmail.com",
            contrasena=get_password_hash("Password123!"),
            provider='local'
        )
        db.add(nuevo_usuario)
        db.commit()
        print("Success")
    except Exception as e:
        print("ERROR:")
        traceback.print_exc()
    finally:
        db.close()

test_insert()
