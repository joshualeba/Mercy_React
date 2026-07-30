import sqlite3
from werkzeug.security import generate_password_hash
from datetime import datetime

conn = sqlite3.connect('mercy.db')
c = conn.cursor()

c.execute("SELECT id FROM usuarios WHERE correo_electronico='joshualeba2109@gmail.com'")
user = c.fetchone()

if user:
    print('Superadmin exists, updating role to superadmin')
    c.execute("UPDATE usuarios SET role='superadmin' WHERE id=?", (user[0],))
else:
    print('Superadmin does not exist, creating...')
    # Insert DatosP first
    c.execute("INSERT INTO DatosP (nombre, apellidoP, fecha_nacimiento, telefono) VALUES (?, ?, ?, ?)",
              ('Joshua', 'Leon', datetime.now(), 1234567890))
    id_datosp = c.lastrowid
    
    # Insert Usuario
    hashed_pw = generate_password_hash('Contraseña123!')
    now = datetime.now()
    c.execute("INSERT INTO usuarios (id_datosP, correo_electronico, contrasena, role, fecha_registro, test_completado) VALUES (?, ?, ?, ?, ?, ?)",
              (id_datosp, 'joshualeba2109@gmail.com', hashed_pw, 'superadmin', now, 0))

conn.commit()
conn.close()
print('Superadmin configured.')
