# Project Brief: Multi-Tenant AI Agent for WhatsApp (Turnos MVP & Modular Base)

## 1. Visión del Proyecto y Objetivo
El objetivo es construir un backend multi-tenant modular en Node.js/TypeScript con Express, PostgreSQL y OpenAI (Function Calling) que procese mensajes de WhatsApp Cloud API. 

El propósito principal es:
1. **Servir de MVP de demostración comercial:** Un bot funcional de gestión de citas y turnos listo para mostrar a potenciales clientes desde un celular real.
2. **Servir de plataforma base extensible:** Una arquitectura desacoplada donde sumar un cliente nuevo no requiera cambios en la lógica central, sino simplemente registrar un nuevo `phone_number_id`, configurar su prompt y asignarle un set de herramientas modulares (ej. turnos, catálogo e-commerce, calificación de leads).

---

## 2. Alcance del MVP (Scope)

### Dentro del Alcance (In-Scope)
- **Multi-tenancy por Payload:** Un único webhook `/webhook` que identifica la empresa receptora vía `phone_number_id` provisto por Meta.
- **Persistencia Aislada:** Sesiones e historiales de conversación vinculados estrictamente por la combinación `(tenant_id, user_phone)`.
- **Motor de Orquestación LLM:** Inyección dinámica de `system_prompt`, fecha/hora actual y ventana de memoria (últimos 10 mensajes).
- **Tool Calling Desacoplado:** Registro de herramientas (`ToolRegistry`) modular.
- **Vertical Funcional de Turnos (MVP Demo):**
  - Consultar slots disponibles según horario laboral configurable (`get_available_slots`).
  - Confirmar y persistir turnos evitando solapamientos (`book_appointment`).
- **Mapeo de Fallbacks:** Rechazo o respuesta controlada para mensajes no soportados (imágenes, audios).

### Fuera del Alcance (Out-of-Scope para este MVP)
- Dashboard o UI administrativa (la gestión de tenants y turnos se realiza directamente en la BD o mediante herramientas tipo DBeaver/Prisma Studio).
- Autenticación compleja de usuarios finales.
- Integraciones complejas a Google Calendar, Shopify o CRMs (se programarán como herramientas adicionales cuando un cliente de ese rubro pague por ello).
- Pagos automáticos integrados.

---

## 3. Arquitectura y Principios de Diseño

1. **Webhook Dispatcher Unificado:**
   - Meta envía un `POST` a `/webhook`. El backend responde inmediatamente `200 OK` (para evitar reintentos y timeouts de Meta) y luego procesa el evento de forma asíncrona.
   - Extrae `metadata.phone_number_id` y busca el tenant en la tabla `tenants`. Si no existe, se descarta el mensaje de forma segura.

2. **Aislamiento de Contexto y Sesión:**
   - Cada tenant contiene su propio `whatsapp_token`, `system_prompt`, lista de `active_tools` y un JSONB `config` donde residen reglas de negocio (ej. horarios de atención, duración de citas).
   - Los turnos y las conversaciones están indexados por `tenant_id`.

3. **Invocación Funcional Modular (Tool Pattern):**
   - El orquestador del LLM solo recibe definiciones de herramientas habilitadas para ese tenant.
   - Toda función de negocio implementa una firma común: `(args, context: ToolContext) => Promise<string>`, donde el contexto provee el `tenantId`, `userPhone` y `tenantConfig`.

---

## 4. Estructura de Directorios del Proyecto

```text
whatsapp-ai-core/
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

## 5. Modelo de Datos (PostgreSQL)

### `tenants`
| Campo | Tipo | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | **PK**, `DEFAULT uuid_generate_v4()` |
| `name` | `VARCHAR(255)` | Nombre del cliente/empresa |
| `phone_number_id` | `VARCHAR(100)` | **UNIQUE**, ID del número de WhatsApp en Meta |
| `whatsapp_token` | `TEXT` | Token de acceso a WhatsApp Cloud API |
| `system_prompt` | `TEXT` | Prompt base y personalidad del asistente |
| `active_tools` | `JSONB` | Herramientas habilitadas (`[]`) |
| `config` | `JSONB` | Configuración adicional (horarios, duración de turnos, etc.) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

### `conversations`
| Campo | Tipo | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | **PK**, `DEFAULT uuid_generate_v4()` |
| `tenant_id` | `UUID` | **FK** -> `tenants.id` (`ON DELETE CASCADE`) |
| `user_phone` | `VARCHAR(50)` | Número de WhatsApp del usuario final |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |
| `updated_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

> **Restricción única:** `UNIQUE (tenant_id, user_phone)`

### `messages`
| Campo | Tipo | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | **PK**, `DEFAULT uuid_generate_v4()` |
| `conversation_id` | `UUID` | **FK** -> `conversations.id` (`ON DELETE CASCADE`) |
| `role` | `VARCHAR(20)` | `'system'` \| `'user'` \| `'assistant'` \| `'tool'` |
| `content` | `TEXT` | Contenido del mensaje (nullable) |
| `tool_call_id` | `VARCHAR(100)` | ID de la llamada a la tool (nullable) |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

### `appointments`
| Campo | Tipo | Restricciones / Descripción |
| :--- | :--- | :--- |
| `id` | `UUID` | **PK**, `DEFAULT uuid_generate_v4()` |
| `tenant_id` | `UUID` | **FK** -> `tenants.id` (`ON DELETE CASCADE`) |
| `client_phone` | `VARCHAR(50)` | Teléfono del cliente |
| `client_name` | `VARCHAR(255)` | Nombre del cliente |
| `service_name` | `VARCHAR(255)` | Servicio solicitado |
| `start_time` | `TIMESTAMPTZ` | Fecha y hora de inicio |
| `end_time` | `TIMESTAMPTZ` | Fecha y hora de fin |
| `status` | `VARCHAR(50)` | Estado: `'confirmed'` \| `'cancelled'` |
| `created_at` | `TIMESTAMPTZ` | `DEFAULT NOW()` |

---

## 6. Pautas para el Asistente de IA
- **TypeScript Estricto:** Todo el código debe escribirse en TypeScript estricto utilizando Node.js y Express.
- **Separación de Responsabilidades:** Mantener siempre la separación de responsabilidades: no mezclar consultas a base de datos dentro del controlador del webhook ni lógica de llamadas a Meta dentro de los archivos de herramientas.
- **Tolerancia a Fallos y Tipado:** Priorizar la robustez contra fallos silenciosos: tipar argumentos de Tools y manejar excepciones en llamadas de red hacia Meta o OpenAI.