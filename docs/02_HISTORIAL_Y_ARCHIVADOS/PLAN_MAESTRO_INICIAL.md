# Plan Maestro Inicial: App de Finanzas, Préstamos y Vencimientos (Monefy Style + TDAH + 100% Offline)

> Documento archivado del plan maestro acordado en la sesión de diseño inicial.

## Goal Description
Construir una Progressive Web App (PWA) de finanzas personales, préstamos y control de vencimientos optimizada para **iPhone 11**, diseñada con principios cognitivos para **TDAH (fricción cero, sin parálisis por análisis, dopamina positiva)**, que funcione **100% offline** y se sincronice con tu ecosistema (Google Calendar en tu iPhone y modelos locales de IA en tu PC).

---

## 1. Módulos y Especificaciones Funcionales

### A. Pantalla Principal: Dial Monefy Mejorado & Carga en 2 Toques
* **Radar de Vencimientos (Barra superior):** Tarjetas deslizables con los próximos pagos ordenados por urgencia y alertas escalonadas (7d, 3d, 1d, hoy). Botón directo *"✓ Pagar"*.
* **Barra de Fecha Rápida:** `[ Hoy (por defecto) ]  [ Ayer ]  [ 📅 Elegir fecha ]` para carga diferida sin menús complejos.
* **Selector de Moneda:** Alternador rápido `[ ARS ($) | USD (US$) ]`.
* **Dial Central:**
  * Dona circular interactiva con los gastos e ingresos del período.
  * Centro con Balance Neto, Total de Ingresos y Total de Gastos (conmutable entre ARS y USD con cotización oficial).
  * Toggle directo **(-) Gastos / (+) Ingresos**.
* **Teclado Numérico Decimal Grande:** Optimizado para números exactos con tecla decimal (sin sugerencias redondeadas artificiales).
* **Botón flotante "Deshacer" (5 segundos):** Corrige toques accidentales o impulsivos inmediatamente.

---

### B. Sistema de Categorías Anti-Parálisis (Por Intención)

#### Gastos (8 categorías con intención clara y color diferenciado):
1. 🛒 **Súper y Casa:** Alimentos e insumos para cocinar en casa (básico/indispensable).
2. 🍔 **Delivery y Salidas:** Restaurantes, PedidosYa, cafeterías (antojos/comodidad).
3. 👶 **Hija:** Con sub-etiquetas rápidas a 1 toque (sin escribir):  
   `[ Cuota alimentaria ]` `[ Niñera ]` `[ Pañales / Farmacia ]` `[ Colegio / Jardín ]` `[ Ropa / Extras ]`.
4. 🚗 **Movilidad / Transporte:** SUBE, Uber, nafta, estacionamiento, mantenimiento.
5. 🏠 **Hogar y Servicios:** Alquiler, luz, gas, expensas, internet, impuestos.
6. 🛍️ **Compras y Gustos:** Ropa, tecnología, hobbies, compras no indispensables.
7. 📱 **Suscripciones y Digital:** Netflix, Spotify, iCloud, membresías recurrentes.
8. ⏳ **"Después veo" (Salvavidas anti-parálisis):** Para guardar en 1 segundo cuando no sabes la categoría y no trabar la carga.

#### Ingresos:
* 💼 **Sueldo / Honorarios**
* 💻 **Freelance / Ventas**
* 📈 **Rendimientos / Inversiones**
* 🎁 **Otros Ingresos**

---

### C. Módulo de Préstamos y Deudas ("Compromisos")
* **Dos listas claras:**
  * **"Debo" (Pasivos):** Deudas bancarias, dinero prestado por familiares, cuotas de préstamos.
  * **"Me deben" (Activos):** Dinero prestado a amigos o conocidos para no olvidarse de cobrarlo.
* **Barra de Desahogo / Libertad:** Progreso visual en % positivo que muestra cuánto ya se devolvió y cuánto falta liquidar.
* **Vinculación con el gasto diario:** Al registrar el pago de una cuota desde el teclado principal, descuenta del saldo del mes Y reduce el saldo adeudado del préstamo en un solo movimiento.

---

### D. Radar de Vencimientos & Sincronización con Google Calendar
* **Anticipación Escalonada:** Avisos a los `7 días`, `3 días`, `1 día` y `el mismo día del vencimiento`.
* **Semáforo Visual:** Verde (>5 días), Amarillo (2 a 4 días), Naranja (Mañana), Rojo suave (Hoy).
* **Sincronización con Calendario:**
  * Generación de eventos directos compatibles con **Google Calendar** y el **Calendario sincronizado de tu iPhone 11** (`.ics` estándar y enlaces universales de Google Calendar).
  * Las alarmas y notificaciones nativas de iOS/Google se activan automáticamente.

---

### E. Multi-Moneda y Cotización Oficial del Dólar (Offline-First)
* Conexión con API de cotización oficial (`dolarapi.com/v1/dolares/oficial`).
* **Caché persistente en IndexedDB:** Almacena la última cotización conocida con fecha.
* **Modo Avión / Sin Internet:** La app continúa convirtiendo y operando con la última cotización sin fallar. Permite edición manual si se desea.

---

### F. Exportación y Puente con Modelos Locales de IA (PC)
* **Descarga directa:** Botón para generar y descargar reportes en `.csv` y `.xlsx` (Excel) con filtros por fecha, por categoría o exclusivo de **"Gastos de mi Hija"**.
* **Generador de Prompts para LM Studio / Ollama:**  
  Botón *"Copiar para IA local"* que crea un prompt estructurado en Markdown con el balance, desvíos y gastos del período, listo para pegar en tu modelo local con instrucciones de análisis amables y no-punitivas.
* **Servidor local opcional en PC (`sync_server.py`):** Script liviano en Python para sincronizar copias de seguridad por la red Wi-Fi de tu casa.
