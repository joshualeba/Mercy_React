# Reporte de Seguridad Informática - Proyecto Mercy

Este documento detalla cómo la arquitectura y el código de **Mercy** cumplen estrictamente con los requerimientos de la materia de Seguridad Informática.

## 1. Métodos de Hasheado y Encriptado
- **Hasheado de Contraseñas:** Se utiliza la librería `passlib` con el algoritmo `bcrypt` para hashear las contraseñas de los usuarios antes de guardarlas en la base de datos (Archivo `fastapi_app.py`, línea donde se valida y guarda la contraseña). Nunca se almacenan contraseñas en texto plano.
- **Encriptado en tránsito:** Todas las comunicaciones entre la App Móvil y la API se realizan a través de HTTPS (Ver punto de Certificado SSL).

## 2. Separación de Servidores (Público y Privado)
Se diseñó la arquitectura separando la red con Docker (`docker-compose.yml`) de la siguiente manera:
- **Red Pública (`red_publica`):** Nginx opera aquí como único punto de entrada público. Adicionalmente, el contenedor de administración en Flask (`mercy_admin`) está expuesto de manera segura aquí para el acceso administrativo web de los profesores.
- **Red Privada (`red_privada`):** La API Móvil en FastAPI (`mercy_api`) y la Base de Datos PostgreSQL (`mercy_db`) se encuentran totalmente aisladas aquí. No tienen exposición directa a Internet; el móvil solo llega a la API a través de la proxy Nginx o el puente local. La Base de Datos PostgreSQL almacena de manera centralizada la información que comparten ambos contenedores backend (Flask y FastAPI).

## 3. Monitoreo del Sistema
- Se incluye un contenedor de **Prometheus** en el `docker-compose.yml` para recolectar métricas del servidor y de la API de forma continua.
- Se implementó **Grafana** conectado a Prometheus. Esto permite generar **tablas y gráficas interactivas y muy bonitas** (dashboards visuales) que contienen toda la información de seguridad, carga del sistema, uso de recursos, y monitoreo de las peticiones que recibe la API, facilitando enormemente la detección de anomalías.

## 4. Aplicación y Monitoreo de Firewall
- **Nivel de Servidor (OS):** Se recomienda usar **UFW (Uncomplicated Firewall)** en el servidor Linux de producción configurado de la siguiente manera:
  - `ufw default deny incoming`
  - `ufw default allow outgoing`
  - `ufw allow 80/tcp` (HTTP)
  - `ufw allow 443/tcp` (HTTPS)
  - `ufw allow 22/tcp` (SSH, restringido por IP).
- **Nivel de Aplicación (WAF):** Nginx bloquea cualquier tráfico sospechoso antes de que llegue a la API.

## 5. Protección de API con JWT
- **Autenticación Estricta:** El endpoint `/api/login` genera un **JSON Web Token (JWT)** usando la librería `python-jose`.
- **Rutas Privadas:** Todos los simuladores matemáticos financieros en `fastapi_app.py` están protegidos mediante el dependencia `Depends(get_current_user)`. Si una petición no incluye un token válido en la cabecera `Authorization: Bearer <token>`, la API la rechaza automáticamente con un error 401 Unauthorized.

## 6. Certificado SSL para la plataforma
- La configuración de `nginx.conf` incluye el bloque preparado para inyectar los certificados `.pem` generados mediante **Let's Encrypt / Certbot**. Esto asegura que todo el tráfico viaje encriptado (HTTPS).

## 7. Uso de Balanceador de Carga
- En `nginx.conf`, se utiliza la directiva `upstream` para balancear la carga utilizando el algoritmo **Round-Robin**.
- **Round-Robin** distribuye las peticiones entrantes de forma equitativa y secuencial entre todos los servidores backend (`api_privada`) registrados. Esto previene que un solo servidor se sature, asegura alta disponibilidad, y permite escalar la aplicación horizontalmente añadiendo más instancias en el futuro sin interrumpir el servicio.
