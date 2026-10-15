# 🎯 01_PRODUCT_REQUIREMENTS_AND_SCOPE.md — Focus Budget MVP

## 1. Visión del Producto
Una aplicación de finanzas personales, gestión de préstamos y control de vencimientos diseñada para personas con **TDAH**, optimizada para **iPhone 11 (PWA 100% Offline)**, con experiencia táctil inspirada en **Monefy**, categorización por intención, soporte para gastos dedicados de **Hija**, recordatorios escalonados sincronizables con **Google Calendar**, multi-moneda (ARS/USD con dólar oficial offline) y puente con modelos locales de IA en tu PC.

---

## 2. Requerimientos Funcionales por Módulo

### Módulo 1: Carga Rápida y Dial Monefy
* **Dial Central Interactivo:**
  * Dona de distribución visual con colores vivos de alto contraste.
  * Centro con Balance Neto, Total Ingresos (+) y Total Gastos (-).
  * Toggle inmediato para alternar entre registrar Gasto o Ingreso.
* **Teclado Táctil Decimal Grande:**
  * Teclas grandes para evitar errores de tipeo.
  * Soporte fluido para decimales (montos reales, sin redondeos artificiales).
* **Selector de Fecha Rápida (Carga Diferida):**
  * Botones superiores directos: `[ Hoy ]  [ Ayer ]  [ 📅 Calendario ]`.
  * Asignación automática sin campos obligatorios de hora.
* **Botón Flotante "Deshacer":**
  * Ventana de 5 segundos tras registrar cualquier movimiento para revertir con un solo toque.

---

### Módulo 2: Categorización por Intención
* **Gastos:**
  1. 🛒 **Súper y Comida Casa:** Compras de despensa indispensables.
  2. 🍔 **Delivery y Salidas:** Comodidad, antojos, salidas sociales.
  3. 👶 **Hija:** Con sub-etiquetas rápidas `[ Cuota ] [ Niñera ] [ Pañales ] [ Colegio ] [ Ropa ]` y filtro de reporte mensual exclusivo.
  4. 🚗 **Movilidad / Transporte:** Nafta, SUBE, peajes, Uber.
  5. 🏠 **Hogar y Servicios:** Servicios públicos, alquiler, expensas.
  6. 🛍️ **Compras y Gustos:** Compras no esenciales, tecnología, hobbies.
  7. 📱 **Suscripciones y Digital:** Membresías recurrentes mensuales.
  8. ⏳ **"Después veo" (Salvavidas anti-parálisis):** Para guardar en 1 toque ante dudas mayores a 3 segundos.
* **Ingresos:**
  * 💼 Sueldo / Honorarios, 💻 Freelance / Ventas, 📈 Rendimientos, 🎁 Otros.

---

### Módulo 3: Préstamos y Deudas ("Compromisos")
* **Secciones:** "Debo" (pasivos) y "Me deben" (activos a cobrar).
* **Campos:** Contraparte (mamá, banco, amigo), monto total, cuotas (opcional), fecha y notas.
* **Barra de Libertad:** Progreso visual positivo del % amortizado.
* **Vinculación 1-toque:** Al pagar una cuota desde el teclado general, se deduce del gasto mensual y rebaja el saldo de la deuda simultáneamente.

---

### Módulo 4: Radar de Vencimientos y Google Calendar
* **Anticipación Escalonada:** Avisos a los 7 días, 3 días, 1 día y el día del vencimiento.
* **Radar Visual:** Widget superior con semáforo amigable (Verde, Amarillo, Naranja, Rojo suave).
* **Botón Directo "Pagar":** Pre-carga el teclado con monto y categoría para registrar en 1 segundo.
* **Sincronización:** Generación de eventos `.ics` y links directos a Google Calendar (que se sincroniza automáticamente con la cuenta de Gmail de tu iPhone).

---

### Módulo 5: Multi-moneda y Dólar Oficial Offline
* Soporte nativo para **ARS ($)** y **USD (US$)**.
* Consulta automática a API oficial (`dolarapi.com/v1/dolares/oficial`).
* **Caché en IndexedDB:** Conserva la cotización del día para convertir y operar en modo avión sin fallos.

---

### Módulo 6: Exportación y Modelos Locales de IA
* Exportación directa a `.csv` y `.xlsx` (Excel) con selector de filtros (mes, categoría o exclusivo de Hija).
* **Botón "Copiar Prompt para IA Local":** Genera un texto en Markdown optimizado para LM Studio / Ollama con instrucciones de coaching financiero no punitivas.
