# Multi-Tenant WhatsApp AI Agent Core (Turnos MVP)

Backend multi-tenant modular construido con **Node.js**, **Express**, **TypeScript**, **PostgreSQL** y **OpenAI GPT-4o-mini (Tool Calling)** para la gestión y reserva automatizada de turnos a través de la **WhatsApp Cloud API (Meta)**.

---

## 🚀 Características Principales

- **Multi-tenancy por Payload:** Un único endpoint `/webhook` gestiona múltiples números y negocios identificando el `phone_number_id` provisto por Meta.
- **Memoria Conversacional y Aislamiento:** Historiales indexados estrictamente por `(tenant_id, user_phone)` con persistencia en PostgreSQL.
- **Tool Calling Desacoplado:** Registro dinámico (`ToolRegistry`) que expone al LLM únicamente las herramientas activas de cada cliente (`tenant.active_tools`).
- **Módulo de Turnos (MVP):**
  - Consulta de slots libres según horario de atención y turnos ocupados (`get_available_slots`).
  - Reserva y confirmación con validación anti-solapamiento (`book_appointment`).
- **Mapeo de Fallbacks:** Respuesta controlada ante audios, fotos u otros formatos no soportados.

---

## 📁 Estructura del Proyecto

```text
├── src/
│   ├── config/
│   │   └── env.ts             # Validación de variables de entorno (dotenv)
│   ├── database/
│   │   ├── index.ts           # Pool de conexión a PostgreSQL (pg)
│   │   └── schema.sql         # DDL de la base de datos (tenants, conversations, etc.)
│   ├── tools/
│   │   ├── index.ts           # Registry y dispatcher de herramientas
│   │   └── appointments.ts    # Implementación de get_available_slots y book_appointment
│   ├── services/
│   │   ├── whatsapp.ts        # Cliente HTTP para WhatsApp Cloud API (Graph API)
│   │   └── agent.ts           # Orquestador del LLM, memoria conversacional y tool loop
│   ├── controllers/
│   │   └── webhook.ts         # Manejo de verificación GET y recepción POST
│   └── server.ts              # Setup de Express y arranque del servicio
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🛠️ Requisitos Previos

- **Node.js** >= 18
- **PostgreSQL** >= 14
- Cuenta de **Meta for Developers** (WhatsApp Cloud API configurada)
- Cuenta y API Key de **OpenAI**

---

## ⚙️ Instalación y Configuración

1. **Instalar dependencias:**
   ```bash
   pnpm install
   # o
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` a partir de `.env.example`:
   ```env
   PORT=3000
   DATABASE_URL=postgresql://usuario:password@localhost:5432/whatsapp_bot_db
   OPENAI_API_KEY=sk-proj-...
   META_VERIFY_TOKEN=webhook_token_secreto
   META_GRAPH_API_VERSION=v19.0
   ```

3. **Inicializar la Base de Datos:**
   Ejecuta las sentencias contenidas en `src/database/schema.sql` en tu base de datos PostgreSQL.

4. **Registrar un Tenant de prueba en la base de datos:**
   ```sql
   INSERT INTO tenants (
     name,
     phone_number_id,
     whatsapp_token,
     system_prompt,
     active_tools,
     config
   ) VALUES (
     'Barbería & Estilo Demo',
     '123456789012345',
     'EAAG...',
     'Sos el asistente virtual de Barbería & Estilo. Tu objetivo es responder cordialmente y ayudar a los clientes a consultar turnos y agendar citas.',
     '["get_available_slots", "book_appointment"]',
     '{"business_start": "09:00", "business_end": "18:00", "slot_duration_minutes": 60}'
   );
   ```

---

## 🏃 Ejecución

- **Modo Desarrollo (con auto-reload):**
  ```bash
  npm run dev
  ```

- **Compilar para Producción:**
  ```bash
  npm run build
  ```

- **Iniciar en Producción:**
  ```bash
  npm start
  ```

---

## 🌐 Endpoints Disponibles

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/` | Información y estado general de la API |
| `GET` | `/api/health` | Diagnóstico de salud y conexión a PostgreSQL |
| `GET` | `/webhook` | Handshake de verificación de Meta Webhooks |
| `POST` | `/webhook` | Recepción de eventos y mensajes entrantes de WhatsApp |

---

## 📚 Documentación Adicional

- [**Manual de Usuario y Operación (`MANUAL_DE_USUARIO.md`)**](./MANUAL_DE_USUARIO.md): Guía paso a paso para dar de alta clientes con problemáticas reales (ej: Inmobiliaria en Argentina, Consultorio con Google Calendar).
- [**Guía de Seguridad y Optimización de Costos (`SEGURIDAD_Y_OPTIMIZACION.md`)**](./SEGURIDAD_Y_OPTIMIZACION.md): Catálogo de herramientas (*Tools*), técnicas de prevención de fugas de datos y control del consumo de tokens.

