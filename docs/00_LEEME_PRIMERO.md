# 💰 Mapa Maestro de Documentación — Focus Budget

> 📌 **ÚNICA FUENTE DE VERDAD DEL PROYECTO (OBSIDIAN + ANTIGRAVITY)**  
> Esta carpeta está conectada como un enlace directo (*Junction*) a tu bóveda de Obsidian en:  
> `D:\Proyectos\master-vault\02_Projects\focus-budget\docs`  
> Cualquier cambio que hagas en Obsidian o en Antigravity se refleja instantáneamente en ambos lados.

---

## 🧭 ¿Qué necesitas hacer hoy?

```text
┌────────────────────────────────────────────────────────────────────────┐
│  👉 ¿Quieres continuar programando la app en el nuevo chat?           │
│     ▶ Ve a la carpeta: docs/01_FINAL_MVP/                              │
│     ▶ Lee: HANDOVER_CONTEXT.md (Resumen completo de la conversación)   │
│     ▶ Consulta: 01_PRODUCT_REQUIREMENTS_AND_SCOPE.md                   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 📂 Estructura del Proyecto

```text
D:\Proyectos\focus-budget\
│
├── 💻 code/                             # EL CÓDIGO DE LA APLICACIÓN (PWA)
│   ├── package.json                     # Vite + React 18 + Tailwind CSS + Dexie.js
│   ├── public/                          # Service Worker 100% offline y manifiesto iOS
│   ├── src/                             # Componentes (Dial Monefy, Teclado, Radar, Hija, Préstamos)
│   └── server/                          # Script opcional para sincronización local Wi-Fi con PC/Mac
│
└── 📚 docs/                             # TODA LA DOCUMENTACIÓN (Sincronizada con Obsidian)
    │
    ├── 🗺️ 00_LEEME_PRIMERO.md          # Este archivo (mapa de navegación)
    │
    ├── 🚀 01_FINAL_MVP/                 # ⭐ ESPECIFICACIÓN OFICIAL DEL MVP
    │   ├── HANDOVER_CONTEXT.md          # 📋 Puente de contexto y decisiones acordadas
    │   ├── 01_PRODUCT_REQUIREMENTS_AND_SCOPE.md
    │   │   └─► Requerimientos, reglas de no-fricción TDAH, Hija, Préstamos y Vencimientos.
    │   ├── 02_INFORMATION_AND_DATA_ARCHITECTURE.md
    │   │   └─► Esquema IndexedDB, UUIDs, soft-deletes, ARS/USD y cotización offline.
    │   ├── 03_SCREEN_MAP_AND_UI_COMPONENTS.md
    │   │   └─► Dial Monefy, teclado numérico decimal, radar de vencimientos y modales.
    │   ├── 04_TECHNICAL_ARCHITECTURE_AND_OFFLINE_SYNC.md
    │   │   └─► PWA 100% offline, Service Worker, Google Calendar y protocolo local sync.
    │   └── 05_LOCAL_AI_AND_PROMPT_GUIDE.md
    │       └─► Prompts estructurados para tus modelos locales en PC (LM Studio / Ollama).
    │
    └── 🗄️ 02_HISTORIAL_Y_ARCHIVADOS/    # Notas previas y registros de evolución
```

---

## 🎯 Resumen Ejecutivo del Producto
* **Nombre de la App:** Focus Budget (o MonefyFlow).
* **Target:** iPhone 11 (PWA agregada a pantalla de inicio desde Safari) + PC con Windows y MacBook en la misma red local.
* **Paradigma:** 100% Offline First (IndexedDB), cero necesidad de servidores externos.
* **Diseño TDAH:** Registro en 2 toques, sin montos redondeados, selector de fecha rápida `[Hoy | Ayer | 📅]`, categorías por intención, botón de salvavidas `⏳ Después veo`, barra de desahogo de préstamos y anticipación escalonada de vencimientos.
