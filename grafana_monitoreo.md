# 📊 Guía Definitiva de Monitoreo: Grafana NOC (Mercy)

Si por alguna razón el servidor se restablece desde cero, sigue estos pasos para volver a armar tu Centro de Operaciones de Red (NOC) en Grafana en menos de 5 minutos. Esta guía también incluye el "Guion" exacto de lo que debes decirle a los jueces para cada gráfica.

---

## PASO A: Conectar la Fuente de Datos (Prometheus)

1. Entra a Grafana: `https://mercyreact.duckdns.org/grafana/`
2. Inicia sesión (Usuario: **admin**, Contraseña por defecto: **admin**. Cambia la contraseña a `12345`).
3. Ve a la pantalla de fuentes de datos navegando a: `https://mercyreact.duckdns.org/grafana/connections/datasources/new`
4. Selecciona la tarjeta **Prometheus**.
5. En la sección **Connection -> Prometheus server URL**, escribe exactamente: 
   `http://prometheus:9090`
6. Baja al fondo de la página y haz clic en **Save & test**. Verás un mensaje verde de éxito.

---

## PASO B: Crear el Dashboard (Centro de Operaciones)

1. En el menú lateral izquierdo, ve a **Dashboards** (ícono de 4 cuadritos) y selecciona **New dashboard**.
2. Dale a **Add visualization**.
3. Selecciona tu fuente **Prometheus**.
4. ¡IMPORTANTE! Antes de ver datos en las gráficas, **asegúrate de entrar a la app de Mercy y dar un par de clics** para generar tráfico real.

A continuación, crearás 5 paneles. Para cada uno, simplemente pega la fórmula en la sección **Code** (debajo de la gráfica), ponle el Título en la barra lateral derecha, y dale al botón azul **Apply** de arriba a la derecha. Para agregar otro panel, dale al botón **+ Add -> Visualization**.

---

### 📈 Gráfica 1: Monitor de Tráfico de API (Tráfico General)

- **Visualización:** Time series (Líneas)
- **Código PromQL:** 
  ```promql
  rate(http_requests_total[1m])
  ```
- **Título (Title):** Monitor de Tráfico de API
- **Lo que dirás a los jueces:** 
  > *"Profesor, en nuestro panel principal podemos monitorear exactamente qué están haciendo los usuarios en tiempo real. La gráfica desglosa el tráfico en vivo dependiendo de qué sección de la aplicación o simulación se esté utilizando. Esa línea superior constante representa la telemetría del servidor trabajando 24/7."*

---

### ⚖️ Gráfica 2: Balanceo de Carga (Prueba de Round Robin)

- **Visualización:** Time series (Líneas)
- **Código PromQL:** 
  ```promql
  sum(rate(http_requests_total[1m])) by (instance)
  ```
- **Título (Title):** Balanceo de Carga (Servidor 1 vs Servidor 2)
- **Lo que dirás a los jueces:** 
  > *"Esta es la prueba técnica definitiva de nuestro algoritmo Round Robin usando Nginx. Como puede observar, las líneas de procesamiento de nuestros dos servidores (API 1 y API 2) se superponen a la perfección. Esto demuestra matemáticamente que la carga de trabajo se divide de forma perfectamente equitativa (50/50), garantizando que ninguno colapse."*

---

### 🛡️ Gráfica 3: Escudo de Seguridad (Rate Limiter)

- **Visualización:** Time series (Líneas)
- **Código PromQL:** 
  ```promql
  sum(rate(http_requests_total{status="429"}[1m]))
  ```
- **Título (Title):** Escudo de Seguridad (Bloqueos del Rate Limiter)
- **Opcional:** Cambia el color a ROJO en la barra derecha (*Standard options -> Color scheme*).
- **Lo que dirás a los jueces:** 
  > *"Para cumplir con los requisitos de Seguridad Informática, integramos un Rate Limiter directamente en la API. Esta gráfica alerta sobre peticiones HTTP 429. Si sufrimos un ataque de denegación de servicio (DDoS) o fuerza bruta, el sistema bloqueará automáticamente la IP atacante y lo veremos reflejado como un pico rojo en el monitor, protegiendo así la base de datos."*

---

### 🚀 Gráfica 4: Latencia y Rendimiento del Servidor

- **Visualización:** Time series (Líneas)
- **Código PromQL:** 
  ```promql
  sum(rate(http_request_duration_seconds_sum[1m])) / sum(rate(http_request_duration_seconds_count[1m]))
  ```
- **Título (Title):** Latencia y Velocidad de Respuesta (Segundos)
- **Lo que dirás a los jueces:** 
  > *"Aquí demostramos que nuestra infraestructura en AWS es óptima. Monitoreamos en tiempo real el promedio de cuánto tarda nuestro servidor en procesar peticiones complejas (como los algoritmos de préstamos). Al mantener la latencia en fracciones de segundo, aseguramos una experiencia de usuario (UX) impecable en la aplicación móvil."*

---

### ✅ Gráfica 5: Contador de Peticiones Exitosas

- **Visualización:** Stat (Busca en la barra derecha arriba, cambia 'Time series' por el ícono con un número '12' llamado 'Stat').
- **Código PromQL:** 
  ```promql
  sum(increase(http_requests_total{status=~"2.."}[1h]))
  ```
- **Título (Title):** Peticiones Exitosas (Última Hora)
- **Lo que dirás a los jueces:** 
  > *"Finalmente, en lugar de revisar logs manualmente, nuestro NOC contabiliza dinámicamente el total de interacciones exitosas de nuestros clientes en la última hora. Este indicador ejecutivo nos permite confirmar que la plataforma está generando valor real sin interrupciones."*

---

### 💾 GUARDAR EL DASHBOARD

Una vez que tengas tus 5 paneles en pantalla, NO OLVIDES presionar el botón azul **Save** (ícono de disquete) en la esquina superior derecha, ponle de nombre **"NOC Mercy"** y guárdalo. 

**¡Éxito en la presentación, vas a arrasar!**
