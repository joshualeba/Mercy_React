# 🎤 Guion de Presentación Técnica: Proyecto Mercy

Este documento contiene la estructura exacta de tu presentación técnica, alineada 100% con la rúbrica de evaluación. Está diseñada para que la expliques mientras los evaluadores interactúan con la app móvil. 

Al final, encontrarás el "Cheat Sheet" (Bloc de Notas) con los comandos para tu demostración en vivo.

---

## 📱 Diapositiva 1: Ecosistema Móvil y Diseño Profesional
**Lo que se muestra en la pantalla (Imágenes):**
- Mockups (capturas) de la aplicación móvil (Simuladores, Login, Tests).
- El ícono de la app y paleta de colores.

**Lo que dirás (Guion):**
> *"Mientras mis compañeros explicaban la teoría, ustedes han tenido la oportunidad de probar la App Móvil de Mercy. Como pueden notar, no es solo un clon de nuestra página web; la app ofrece herramientas de utilidad real, como simuladores financieros interactivos y evaluaciones, con un diseño moderno, transiciones suaves y una navegación sumamente intuitiva y clara. Cada formulario que ven está estrictamente validado, si intentan poner un correo falso o una contraseña insegura, el sistema los detendrá para proteger la integridad de los datos. Todo lo que hacen en la app, se refleja y sincroniza instantáneamente con nuestra plataforma Web."*

**(Rúbrica cubierta: Utilidad real móvil, Diseño profesional, Navegación clara, Validación de datos, Reflejo en contraparte Web, Dispositivos proporcionados).**

---

## ☁️ Diapositiva 2: Infraestructura Cloud y Seguridad Perimetral
**Lo que se muestra en la pantalla (Imágenes):**
- Un diagrama sencillo mostrando: Celular -> Nginx (Firewall/SSL) -> Servidores Privados -> Base de Datos.
- Captura del candadito de conexión segura de la página web (SSL).

**Lo que dirás (Guion):**
> *"Todo este ecosistema está alojado profesionalmente en la nube de Amazon Web Services (AWS). Para proteger la comunicación, implementamos un Certificado SSL de grado bancario (pueden ver el candado de seguridad en nuestra web). Nuestro servidor actúa como un Firewall perimetral de acceso público, el cual intercepta cualquier tráfico malicioso antes de que siquiera toque nuestra verdadera API y Base de Datos, las cuales se encuentran aisladas de forma segura en un servidor privado invisible para el internet público."*

**(Rúbrica cubierta: Alojado en nube, Dos servidores (público y privado), Certificado SSL, Aplicación de Firewall).**

---

## 🔐 Diapositiva 3: Criptografía y Protección de la API
**Lo que se muestra en la pantalla (Imágenes):**
- Captura de pantalla de tu base de datos mostrando las contraseñas convertidas en texto ilegible (Hash).
- Diagrama conceptual de cómo funciona un token JWT.

**Lo que dirás (Guion):**
> *"La seguridad es nuestra prioridad. En nuestra base de datos jamás guardamos contraseñas en texto plano; utilizamos algoritmos de 'Hashing' para encriptarlas de forma irreversible. Además, nuestra API está protegida por Json Web Tokens (JWT). Cuando ustedes inician sesión en el celular, el servidor les otorga una 'llave digital' (el JWT). Si alguien intenta extraer datos financieros sin esta llave, la API simplemente le cerrará la puerta."*

**(Rúbrica cubierta: Métodos de hasheado, Protección de API con JWT).**

---

## ⚖️ Diapositiva 4: Alta Disponibilidad (Balanceador de Carga)
**Lo que se muestra en la pantalla (Imágenes):**
- Captura de tu archivo de configuración mostrando los contenedores `api1` y `api2`.

**Lo que dirás (Guion):**
> *"Sabiendo que las aplicaciones de finanzas requieren estar 100% disponibles, implementamos un Balanceador de Carga. En lugar de tener un solo 'cerebro' procesando todo, clonamos nuestra API en múltiples contenedores. Nuestro balanceador reparte el tráfico equitativamente entre ellos (Round Robin), garantizando que si cientos de usuarios entran al mismo tiempo a calcular un crédito, el sistema no colapse."*

**(Rúbrica cubierta: Balanceador de carga).**

---

## 📊 Diapositiva 5: Monitoreo y Centro de Operaciones (NOC)
**Lo que se muestra en la pantalla (Imágenes):**
- Captura de tu panel de Grafana con todas tus gráficas.

**Lo que dirás (Guion):**
> *"Finalmente, los ingenieros no trabajamos a ciegas. Creamos un Centro de Operaciones utilizando Prometheus y Grafana. Aquí monitoreamos en vivo la salud del ecosistema: vemos el tráfico de red, validamos visualmente que el balanceo de carga sea del 50/50 entre los servidores, e incluso tenemos un monitor del Firewall y 'Rate Limiter' que dispara una alerta roja si detecta un ataque de fuerza bruta."*

**(Rúbrica cubierta: Monitoreo del sistema, Grafana/Prometheus).**

---
---

# 💻 BLOC DE NOTAS: Comandos de Prueba en Vivo (Terminal)

*Copia esto en un Bloc de Notas en tu computadora. Cuando sea momento de hacer la prueba técnica, abre la terminal de Windows o Ubuntu frente a los jueces, pon las letras grandes, y ejecuta estos comandos.*

### Prueba 1: Demostrar que el API está protegida y rechaza intrusos
*Di: "Primero, intentaré acceder a la información privada sin tener sesión iniciada."*
**Comando:**
```bash
curl -i https://mercyreact.duckdns.org/api/verify_session
```
**Resultado esperado:** Mostrará un mensaje de `401 Unauthorized` o `Falta el token de autorización`. *(¡Los jueces verán que es seguro!)*

### Prueba 2: Generar el Hash/JWT iniciando sesión
*Di: "Ahora, iniciaré sesión con un usuario válido para que el servidor me encripte la llave (JWT)."*
**Comando (Cambia el correo y contra por uno real que tengas registrado):**
```bash
curl -X POST https://mercyreact.duckdns.org/api/login -H "Content-Type: application/json" -d "{\"correo\": \"correo@ejemplo.com\", \"contrasena\": \"Secreta1!\"}"
```
**Resultado esperado:** La terminal se llenará de un montón de letras y números ilegibles (Ese es el JWT y la prueba criptográfica). Cópialo.

### Prueba 3: Atacar el Firewall (Rate Limiter)
*Di: "Finalmente, simularé un ataque donde intento saturar el servidor con múltiples peticiones rápidas para ver si nuestro Firewall nos defiende."*
**Comando:**
*(Solo ejecuta el comando de la Prueba 1 súper rápido unas 10 o 15 veces seguidas apretando la 'Flecha arriba' y 'Enter')*
```bash
curl -i https://mercyreact.duckdns.org/api/verify_session
```
**Resultado esperado:** Después de varios intentos, el servidor dejará de contestar con el error normal y arrojará un **`429 Too Many Requests`**. 
*Di: "Como ven, el Firewall ha bloqueado mi IP. Si pasamos al panel de Grafana, veremos un pico rojo alertando del ataque."*
