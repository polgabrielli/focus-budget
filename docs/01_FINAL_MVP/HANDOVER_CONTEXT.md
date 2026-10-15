# 📋 Handover Context: Historial y Decisiones de Diseño

> **Para el Agente de Antigravity en el nuevo chat:**  
> Este documento contiene el resumen exacto de toda la conversación previa, los dolores resueltos, las decisiones tomadas y las instrucciones para arrancar a construir el MVP de inmediato.

---

## 1. Perfil del Usuario y Caso de Uso
* **Usuario:** Desarrollador / usuario con TDAH.
* **Dispositivo de uso diario:** iPhone 11.
* **Entorno de desarrollo:** PC con Windows (y MacBook para uso personal/trabajo).
* **Bóveda de Obsidian:** `D:\Proyectos\master-vault\` (conectada a `docs` mediante Junction NTFS).
* **Modelos locales de IA:** LM Studio / Ollama en su PC con Windows.

---

## 2. Decisiones de Producto y Arquitectura

### A. Por qué PWA y no Swift o React Native
* Swift nativo requiere Mac obligatoria para compilar y cuentas pagas de Apple ($99/año) o re-firmas cada 7 días.
* React Native / Expo requiere sincronización Wi-Fi para desarrollo en Expo Go o builds en la nube.
* **PWA Ganadora:** Se crea con React + Vite + Tailwind CSS + Dexie.js (IndexedDB). Se instala desde Safari ("Agregar a inicio"). **Funciona 100% offline, nunca vencen los certificados y corre en la memoria local del iPhone 11.**

### B. Principios de Diseño para TDAH (Fricción Cero)
1. **La Regla de los 2 Toques (Estilo Monefy):**
   * Monto → Ícono de categoría → **Guardado instantáneo**.
   * Sin formularios complejos ni campos obligatorios molestos.
2. **Sin montos sugeridos redondeados:**
   * La realidad cotidiana no tiene montos redondos. Teclado numérico grande, táctil y directo con botón decimal.
3. **Carga diferida de fechas sin fricción:**
   * Barra superior rápida: `[ Hoy (por defecto) ]  [ Ayer ]  [ 📅 Calendario ]`.
   * Permite cargar compras de ayer o días anteriores sin entrar en submenús. Sin campos de hora.
4. **Botón flotante "Deshacer" (5 segundos):**
   * Previene la ansiedad o frustración por toques accidentales o dobles registros.
5. **Categorización por Intención (8 categorías):**
   * 🛒 *Súper y Comida Casa* (indispensable)
   * 🍔 *Delivery y Salidas* (antojo / comodidad)
   * 👶 *Hija* (con sub-etiquetas a 1 toque: Cuota, Niñera, Pañales/Farmacia, Colegio, Ropa/Extras y reporte exclusivo)
   * 🚗 *Movilidad / Transporte*
   * 🏠 *Hogar y Servicios*
   * 🛍️ *Compras y Gustos*
   * 📱 *Suscripciones y Digital*
   * ⏳ *Después veo* (Categoría salvavidas anti-parálisis: si dudas más de 3 segundos, guardas ahí y sigues).
6. **Ingresos (+):**
   * Alternador Gasto (-) / Ingreso (+) en el centro del dial Monefy.
   * Categorías de ingresos: *Sueldo/Honorarios, Freelance/Ventas, Rendimientos/Inversiones, Otros*.
   * Cálculo de Balance Neto = Ingresos - Gastos.
7. **Préstamos y Deudas ("Compromisos"):**
   * "Debo" (pasivos) y "Me deben" (activos a cobrar).
   * Barra de progreso positivo de desahogo/liberación.
   * Pago de cuotas en 1 toque desde el dial principal (descuenta del mes y reduce la deuda).
8. **Radar de Vencimientos con Anticipación Escalonada:**
   * Avisos graduales: 7 días antes, 3 días antes, 1 día antes y el día del vencimiento.
   * Tarjetas horizontales arriba del dial con semáforo amigable.
   * Botón directo "Pagar y Asentar".
   * Sincronización con **Google Calendar** (como el iPhone 11 ya tiene Google Calendar sincronizado en sus cuentas de iOS, la exportación de eventos y `.ics` impacta directo en Google Calendar en la PC y en el teléfono con alarmas nativas).
9. **Multi-moneda con Dólar Oficial Offline:**
   * Selector ARS ($) / USD (US$).
   * Consulta a API de cotización oficial (`dolarapi.com/v1/dolares/oficial`).
   * Guarda la última cotización en IndexedDB con fecha para seguir calculando y convirtiendo en modo avión.
10. **Preparación para Sincronización Local (iPhone + PC + Mac):**
    * Todos los registros usan **UUIDs**.
    * Tienen campos `createdAt`, `updatedAt` y `deletedAt` (borrado lógico).
    * La app PWA es idéntica y responsive para PC y MacBook.
    * Un script simple en Python en `code/server/sync_server.py` permite la sincronización por Wi-Fi de casa.
11. **Puente con Modelos Locales de IA (LM Studio / Ollama):**
    * Exportación a CSV y Excel (.xlsx).
    * Botón "Copiar Prompt para IA" que formatea los gastos de la semana en un texto no-punitivo para análisis en tu PC.

---

## 3. Estado Actual del Proyecto: MVP Completo y Verificado ✅

* **Fase 1 (Completada):** Scaffold React + Vite + Tailwind, Dexie.js (IndexedDB) con esquema UUID + soft delete, Dial Donut estilo Monefy (SVG dinámico), 8 categorías de gasto + 4 de ingreso, selector rápido `[Hoy|Ayer|Fecha]`, botón flotante Deshacer (5 seg) y multi-moneda ARS/USD con cotización oficial en caché offline.
* **Fase 2 (Completada):** Módulo de Préstamos y Deudas ("Debo" vs "Me deben"), barra de Libertad Financiera positiva, amortización en 1 toque vinculada a transacciones diarias, navegación inferior con badges.
* **Fase 3 (Completada):** Radar de Vencimientos en carrusel semáforo horizontal, pago y avance recurrente en 1 toque, sincronización universal con Google Calendar y generador de archivos `.ics` con 4 alarmas escalonadas (-7d, -3d, -1d, 0d).
* **Fase 4 (Completada):** Modal "Reportes & IA" con filtros por mes y reporte dedicado "Hija", exportación CSV (UTF-8 BOM) y Excel nativo (.xlsx), generador de prompts amigables para TDAH en LM Studio / Ollama, y servidor de backup local Wi-Fi en Python (`code/server/sync_server.py`).
* **Calidad y Cobertura de Tests:** 64 tests unitarios y de integración pasando al 100% (14 suites de test con Vitest + Testing Library + fake-indexeddb). Build de producción verificado (`npm run build`).

---

## 4. Guía de Ejecución Rápida

1. **Iniciar la aplicación PWA:**
   ```bash
   cd code
   npm run dev
   ```
   * En PC: Abrir `http://localhost:5173`
   * En iPhone 11: Abrir `http://<IP_DE_TU_PC>:5173` en Safari y tocar **"Compartir" -> "Agregar a pantalla de inicio"** para usarla como app nativa 100% offline.

2. **Ejecutar Tests:**
   ```bash
   cd code
   npm test
   ```

3. **Iniciar Servidor de Backup Wi-Fi en PC (Opcional):**
   * Doble clic en `code/server/run_server.bat` o ejecutar:
     ```bash
     python code/server/sync_server.py
     ```
   * En la app (iPhone o PC), ir al ícono 📊 en el encabezado -> pestaña **Wi-Fi Sync** -> ingresar la IP de la PC y presionar **"Enviar Copia a mi PC"**. Guarda el backup JSON en `code/server/backups/`.

