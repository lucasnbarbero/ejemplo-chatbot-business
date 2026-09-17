# 📖 Manual de Usuario y Guía de Operación
## Backend Multi-Tenant AI Agent para WhatsApp

Bienvenido al manual operativo del sistema. Este documento te guiará paso a paso para poner en marcha el servidor, conectar la API oficial de WhatsApp (Meta) y dar de alta **nuevos clientes (Tenants)** con personalidades y problemáticas de negocio completamente personalizadas.

---

## 📑 Tabla de Contenidos
1. [¿Cómo funciona este Backend?](#1-cómo-funciona-este-backend)
2. [Puesta en Marcha Rápida](#2-puesta-en-marcha-rápida)
3. [Configuración de Meta for Developers (WhatsApp Cloud API)](#3-configuración-de-meta-for-developers-whatsapp-cloud-api)
4. [Estructura de un Cliente (`Tenant`) en la Base de Datos](#4-estructura-de-un-cliente-tenant-en-la-base-de-datos)
5. [Caso de Ejemplo: Registro de un Cliente con Problemática Distinta (Inmobiliaria en Argentina / Captación y Calificación de Leads)](#5-caso-de-ejemplo-registro-de-un-cliente-con-problemática-distinta-inmobiliaria-en-argentina--captación-y-calificación-de-leads)
6. [Caso de Ejemplo: Registro de un Cliente de Turnos con Google Calendar (Clínica / Consultorio)](#6-caso-de-ejemplo-registro-de-un-cliente-de-turnos-con-google-calendar-clínica--consultorio)
7. [Cómo Agregar Nuevas Herramientas (*Tools*) a Futuro](#7-cómo-agregar-nuevas-herramientas-tools-a-futuro)
8. [Preguntas Frecuentes y Solución de Problemas](#8-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. ¿Cómo funciona este Backend?

El sistema utiliza una arquitectura **Multi-Tenant centralizada**:
- **Un único servidor:** Recibe todos los mensajes de WhatsApp en el endpoint `POST /webhook`.
- **Detección inteligente:** Cuando alguien envía un mensaje, Meta informa a qué número (`phone_number_id`) iba dirigido.
- **Aislamiento total:** El servidor busca a qué cliente pertenece ese número, carga su propio *System Prompt*, su configuración y su historial de chat privado.
- **Inteligencia Artificial:** OpenAI GPT-4o-mini genera la respuesta adecuada y el backend la envía de regreso al usuario por WhatsApp.

```
[Usuario de WhatsApp] 
         ⬇️ (Mensaje)
[WhatsApp Cloud API - Meta]
         ⬇️ (POST /webhook)
[Tu Backend Express] 
   ├── 1. Identifica el Tenant por 'phone_number_id'
   ├── 2. Carga su System Prompt + Historial del usuario
   ├── 3. OpenAI GPT-4o-mini procesa y resuelve (con o sin Tools)
   └── 4. Envía respuesta por WhatsApp usando el Token del Tenant
```

---

## 2. Puesta en Marcha Rápida

### Paso 1: Configurar el archivo `.env`
En la raíz del proyecto, crea tu archivo `.env` con los siguientes datos:
```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/nombre_tu_base_de_datos
OPENAI_API_KEY=sk-proj-tu-api-key-de-openai
META_VERIFY_TOKEN=mi_token_secreto_para_meta_123
META_GRAPH_API_VERSION=v19.0
```

### Paso 2: Crear las tablas en PostgreSQL
Ejecuta en tu cliente de base de datos (DBeaver, pgAdmin, Prisma Studio o consola `psql`) el archivo:
```sql
src/database/schema.sql
```

### Paso 3: Iniciar el servidor
```bash
# Modo desarrollo con recarga automática
npm run dev

# O compilar e iniciar para producción
npm run build
npm start
```

---

## 3. Configuración de Meta for Developers (WhatsApp Cloud API)

Para conectar tu backend con WhatsApp:

1. Ingresa a [Meta for Developers](https://developers.facebook.com/) y entra a tu App con producto **WhatsApp**.
2. Ve a la sección **WhatsApp > Configuration / Configuración**.
3. En la sección **Webhook**:
   - **Callback URL:** `https://tu-dominio-o-ngrok.com/webhook`
   - **Verify Token:** El mismo texto que pusiste en `META_VERIFY_TOKEN` en tu `.env` (ej: `mi_token_secreto_para_meta_123`).
   - Haz clic en **Verify and Save / Verificar y Guardar**.
4. En **Webhook fields**, suscríbete al evento **`messages`**.
5. En **API Setup / Configuración de la API**, obtendrás:
   - **Phone number ID** (ej: `109283746592817`)
   - **WhatsApp Business Account ID**
   - **Access Token** permanente del sistema.

---

## 4. Estructura de un Cliente (`Tenant`) en la Base de Datos

Cada cliente que contrate tu servicio se registra en la tabla `tenants`. No necesitas cambiar una sola línea de código TypeScript; **solo insertar una fila en PostgreSQL**.

### Campos de la tabla `tenants`:
* **`name`**: Nombre descriptivo de la empresa o negocio.
* **`phone_number_id`**: El identificador único del número en Meta.
* **`whatsapp_token`**: El Token de la API de WhatsApp de ese cliente.
* **`system_prompt`**: La personalidad, instrucciones, catálogo, precios, políticas y tono con el que el bot debe responder.
* **`active_tools`**: Array JSON con las herramientas que tiene permitidas usar (ej: `["get_available_slots", "book_appointment"]`, o `[]` si solo atiende consultas).
* **`config`**: Objeto JSON con configuraciones personalizadas (horarios, sucursales, links, credenciales de calendario, etc.).

---

## 5. Caso de Ejemplo: Registro de un Cliente con Problemática Distinta (Inmobiliaria en Argentina / Captación y Calificación de Leads)

Imaginemos que tienes un nuevo cliente: **"Baires Urbana Propiedades"**, una inmobiliaria ubicada en CABA (Ciudad Autónoma de Buenos Aires).

### Su Problemática y Requerimientos de Negocio:
- **No utiliza el sistema clásico de turnos de una agenda.**
- Necesita atender consultas de interesados en **Alquileres tradicionales, Alquileres temporarios amoblados y Venta de propiedades** 24/7.
- **Calificar al interesado:** Averiguar qué tipo de operación busca (alquiler o compra), cantidad de ambientes (monoambiente, 2, 3 o 4 ambientes), barrios de interés (Palermo, Belgrano, Recoleta, Caballito, Núñez) y rango de presupuesto (en ARS o USD).
- **Informar requisitos de alquiler en Argentina:** Garantía propietaria de CABA o seguro de caución (*Finaer, Respaldar, Garantía Ya*), demostración de ingresos que triplique el alquiler, mes de depósito y mes por adelantado.
- **Captar propietarios para tasaciones:** Si alguien desea vender o poner en alquiler su propiedad, solicitar datos clave (barrio, ambientes, estado) y coordinar que un martillero matriculado (CUCICBA) se contacte para la tasación presencial.
- **Tono y modismos:** Español de Argentina rioplatense (voseo educado, cálido y profesional: *"¡Hola! ¿Cómo estás?", "Buscás", "Contame", "Tenés"*).

### Query SQL para registrar a "Baires Urbana Propiedades":

```sql
INSERT INTO tenants (
  name,
  phone_number_id,
  whatsapp_token,
  system_prompt,
  active_tools,
  config
) VALUES (
  'Baires Urbana Propiedades',
  '549113456789012', -- Phone Number ID provisto por Meta para la línea de la inmobiliaria
  'EAAG_TOKEN_PERMANENTE_DE_META_AQUI...',
  'Sos "Martina", la asistente virtual y asesora inmobiliaria de "Baires Urbana Propiedades" (Matrícula CUCICBA Nº 6842).
Tu objetivo es brindar una atención cálida, sumamente profesional y orientada a calificar y asesorar a personas interesadas en alquilar, comprar o tasar propiedades en CABA y Zona Norte.

[Información y Cartera de la Inmobiliaria]
- Zonas de cobertura principal: Palermo (Soho, Hollywood, Chico), Belgrano, Recoleta, Caballito, Colegiales, Núñez y Vicente López.
- Servicios: Alquileres tradicionales (contratos a 2 años con ajuste ICL o IPC), Alquileres temporarios amoblados (contratos de 1 a 3 meses en USD) y Venta de propiedades usadas y desarrollos en pozo.
- Requisitos para Alquiler Tradicional en Argentina:
  1. Demostración de ingresos demostrables (recibo de sueldo o monotributo/responsable inscripto) que tripliquen el valor del alquiler.
  2. Garantía Propietaria de CABA / Familiar directo O Seguro de Caución aprobado (trabajamos con Finaer, Respaldar y Garantía Ya).
  3. 1 mes de depósito en garantía (en USD o ARS según contrato) + 1 mes de adelanto.
- Tasaciones sin cargo: Si un propietario quiere vender o alquilar, se coordina una visita presencial con uno de nuestros martilleros matriculados.
- Oficina: Av. del Libertador 4800, Belgrano, CABA. Horario de atención: Lunes a Viernes de 9:30 a 18:30 hs.
- Portal web de propiedades: https://bairesurbanapropiedades.ejemplo.com

[Guía de Diálogo y Calificación de Leads]
1. Hablá siempre con voseo argentino rioplatense (cordial, educado y fluido). Usá emojis sutiles de inmuebles (🏢, 🏠, 📍, 🔑, ✨).
2. Si el cliente busca ALQUILAR o COMPRAR, averiguá en orden:
   a) ¿Qué tipo de propiedad y cuántos ambientes busca? (ej: monoambiente, 2 ambientes, casa, PH).
   b) ¿En qué barrios o zonas preferentemente?
   c) ¿Cuál es su presupuesto mensual aproximado (o monto máximo de inversión en USD si es compra)?
3. Si consulta por requisitos de alquiler, explicáselos con claridad y empatía.
4. Si desea TASAR su propiedad o ponerla en venta, pedile la ubicación aproximada, cantidad de metros/ambientes y su nombre completo, indicándole que el martillero a cargo de la zona lo contactará para coordinar la visita.
5. Brindá el link de la web para ver el catálogo completo con fotos y recorridos virtuales 360°.',
  '[]'::jsonb, -- active_tools vacío: Opera como asesora inmobiliaria conversacional pura sin tools de turnos
  '{
    "website": "https://bairesurbanapropiedades.ejemplo.com",
    "cucicba_matricula": "6842",
    "email_contacto": "contacto@bairesurbana.com",
    "zonas_principales": ["Palermo", "Belgrano", "Recoleta", "Caballito", "Núñez"]
  }'::jsonb
);
```

### ¿Qué sucede cuando un cliente le escribe por WhatsApp a la Inmobiliaria?

1. **El usuario envía un mensaje:**
   > *"Buenas tardes! Vi una publicación de ustedes en Palermo. Quería saber qué requisitos piden para alquilar un 2 ambientes y si tienen disponible por la zona."*

2. **Procesamiento interno:**
   * Meta dispara el webhook `POST /webhook` enviando el `phone_number_id = '549113456789012'`.
   * El backend busca en PostgreSQL y encuentra a **Baires Urbana Propiedades**.
   * Carga su System Prompt con las reglas del mercado argentino, requisitos de alquiler y el historial del cliente.
   * OpenAI GPT-4o-mini redacta la respuesta contextualizada.

3. **Respuesta automática recibida por el usuario en WhatsApp:**
   > *"¡Hola! Buenas tardes 👋 Te saluda Martina de **Baires Urbana Propiedades** 🏢✨*
   >
   > *En Palermo tenemos excelentes opciones de 2 ambientes disponibles (tanto tradicionales como amoblados temporarios).*
   >
   > *Para un **alquiler tradicional**, los requisitos principales son:*
   > * 1️⃣ **Demostración de ingresos:** Recibos de sueldo o facturación que tripliquen el valor del alquiler.*
   > * 2️⃣ **Garantía:** Garantía propietaria de CABA o seguro de caución (*Finaer, Respaldar o Garantía Ya*).*
   > * 3️⃣ **Mes de adelanto y mes de depósito** en garantía.*
   >
   > *¿Buscás en alguna zona puntual de Palermo (Soho, Hollywood, Botánico) y cuál es tu presupuesto estimado en pesos o dólares? Así te comparto las opciones que mejor se adapten a tu búsqueda 🔑"*

---

## 6. Caso de Ejemplo: Registro de un Cliente de Turnos con Google Calendar (Clínica / Consultorio)

Supongamos que tienes un cliente que es un consultorio odontológico: **"DentalCare Odontología Especializada"**.

### Su Problemática y Requerimientos:
- Desea que los pacientes agenden sus turnos por WhatsApp.
- **Requiere integración directa con Google Calendar:** Cada turno debe crearse automáticamente en el calendario del profesional o de la clínica, evitando solapamientos con citas o eventos personales que el médico ya tenga anotados en Google Calendar.
- Cada profesional o sucursal tiene su propio `google_calendar_id`.

---

### Paso 1: Configuración previa en Google Cloud & Google Calendar
1. En [Google Cloud Console](https://console.cloud.google.com/), crea un proyecto y habilita la **Google Calendar API**.
2. Crea una **Cuenta de Servicio (Service Account)** (ej: `bot-turnos-whatsapp@mi-proyecto.iam.gserviceaccount.com`).
3. El dueño del consultorio abre su **Google Calendar**, entra en *Configuración del calendario > Compartir con personas específicas*, añade el email de la Service Account y le otorga permisos de: **"Realizar cambios en eventos"**.
4. Copia el **ID de calendario** (ej: `consultorio.dentalcare@gmail.com` o el ID generado por Google).

---

### Paso 2: Query SQL para registrar a "DentalCare" con Google Calendar:

```sql
INSERT INTO tenants (
  name,
  phone_number_id,
  whatsapp_token,
  system_prompt,
  active_tools,
  config
) VALUES (
  'DentalCare Odontología Especializada',
  '549115566778899', -- Phone Number ID provisto por Meta para el consultorio
  'EAAG_TOKEN_PERMANENTE_DE_META_AQUI...',
  'Sos "Camila", la asistente virtual del consultorio "DentalCare Odontología Especializada".
Tu función es atender cordialmente a los pacientes, responder dudas sobre tratamientos y agendar turnos de forma automatizada consultando y registrando eventos en Google Calendar.

[Información del Consultorio]
- Especialidades: Odontología general, limpieza dental con ultrasonido, blanqueamiento led, ortodoncia invisible y urgencias por dolor.
- Dirección: Av. Cabildo 2200, 4to piso "B", Belgrano, CABA.
- Horario de atención: Lunes a Viernes de 09:00 a 19:00 hs.
- Duración promedio de la consulta: 45 minutos.

[Instrucciones para Agendamiento con Google Calendar]
1. Cuando el paciente pregunte por turnos o fechas libres, utilizá SIEMPRE la herramienta "get_google_calendar_slots" indicando la fecha en formato YYYY-MM-DD.
2. Presentale al paciente los horarios libres disponibles que devolvió la herramienta de forma clara y ordenada.
3. Una vez que el paciente confirme fecha, hora, nombre y tratamiento, utilizá la herramienta "book_google_calendar_appointment" para agendar el turno directamente en el Google Calendar de la clínica.
4. Confirmale la reserva al paciente indicando la dirección del consultorio y recordándole asistir 10 minutos antes.',
  '["get_google_calendar_slots", "book_google_calendar_appointment"]'::jsonb, -- Tools conectadas a Google Calendar
  '{
    "google_calendar_id": "consultorio.dentalcare@gmail.com",
    "business_start": "09:00",
    "business_end": "19:00",
    "slot_duration_minutes": 45,
    "time_zone": "America/Argentina/Buenos_Aires"
  }'::jsonb
);
```

---

### Paso 3: ¿Cómo funciona la Tool de Google Calendar en el Backend?

El backend lee el `google_calendar_id` directamente del objeto `ctx.tenantConfig.google_calendar_id`. De esta forma, **un único código de herramienta sirve para cientos de médicos y consultorios diferentes**:

```typescript
// Ejemplo de implementación conceptual en src/tools/google_calendar.ts
import { google } from "googleapis";
import { ToolContext } from "./index";

const calendar = google.calendar("v3");

export async function getGoogleCalendarSlots(args: { date: string }, ctx: ToolContext): Promise<string> {
  const calendarId = ctx.tenantConfig.google_calendar_id;
  const timeZone = ctx.tenantConfig.time_zone || "America/Argentina/Buenos_Aires";

  // 1. Consulta eventos existentes en Google Calendar para esa fecha mediante calendar.events.list
  const res = await calendar.events.list({
    calendarId,
    timeMin: `${args.date}T00:00:00Z`,
    timeMax: `${args.date}T23:59:59Z`,
    singleEvents: true,
  });

  // 2. Compara contra business_start y business_end configurados en el Tenant
  // 3. Devuelve los slots libres en formato JSON
  return JSON.stringify({ available_slots: ["10:00", "11:30", "15:00", "16:30"] });
}

export async function bookGoogleCalendarAppointment(
  args: { client_name: string; service_name: string; date: string; time: string },
  ctx: ToolContext
): Promise<string> {
  const calendarId = ctx.tenantConfig.google_calendar_id;
  
  // Inserta el evento directamente en el Google Calendar del cliente
  const event = await calendar.events.insert({
    calendarId,
    requestBody: {
      summary: `Turno: ${args.client_name} - ${args.service_name}`,
      description: `Paciente: ${args.client_name}\nWhatsApp: ${ctx.userPhone}\nServicio: ${args.service_name}`,
      start: { dateTime: `${args.date}T${args.time}:00-03:00` },
      end: { dateTime: `${args.date}T${args.time}:45-03:00` },
    },
  });

  return JSON.stringify({ success: true, event_id: event.data.id });
}
```

---

### 💬 Demostración de Interacción en WhatsApp:

1. **Paciente:** *"Hola! Necesito hacerme una limpieza dental este viernes. ¿Tienen turnos disponibles?"*
2. **Bot (Camila):** *(Ejecuta `get_google_calendar_slots` sobre el calendario `consultorio.dentalcare@gmail.com`)*  
   > *"¡Hola! 👋 ¡Sí, con gusto! Para este viernes tenemos disponibles los siguientes horarios para limpieza dental:*
   > * 🕙 **10:00 hs**
   > * 🕦 **11:30 hs**
   > * 🕒 **15:00 hs**
   > * 🕟 **16:30 hs**
   > 
   > *¿Cuál te queda más cómodo?"*
3. **Paciente:** *"El de las 15:00 hs me viene genial. Mi nombre es Lucas García."*
4. **Bot (Camila):** *(Ejecuta `book_google_calendar_appointment` creando el evento en Google Calendar)*  
   > *"¡Excelente Lucas! Ya te agendé el turno para tu **Limpieza Dental** el **viernes a las 15:00 hs** 🦷✨*
   >
   > *📍 Te esperamos en **Av. Cabildo 2200, 4to piso B (Belgrano)**. Por favor asistí 10 minutos antes. ¡Que tengas un excelente día!"*
5. **Resultado:** En el Google Calendar del odontólogo aparece de forma inmediata el evento agendado con el nombre del paciente y su teléfono celular.

---

## 7. Cómo Agregar Nuevas Herramientas (*Tools*) a Futuro

Si más adelante un cliente necesita una funcionalidad específica (por ejemplo: consultar el estado de un envío por código de seguimiento o ver stock en vivo):

1. **Creas la función en `src/tools/`** (por ejemplo `src/tools/tracking.ts` o `src/tools/ecommerce.ts`):
   ```typescript
   export async function checkOrderStatus(args: { order_id: string }, ctx: ToolContext) {
     // Consulta a API de envíos, base de datos o Shopify
     return JSON.stringify({ status: "En camino", eta: "Mañana antes de las 18hs" });
   }
   ```
2. **La registras en `src/tools/index.ts`** con `registerTool(...)`.
3. **Se la habilitas únicamente al cliente que la necesita** agregando el nombre de la tool a su columna `active_tools` en PostgreSQL:
   ```sql
   UPDATE tenants 
   SET active_tools = '["check_order_status"]'::jsonb 
   WHERE id = 'ID_DEL_TENANT';
   ```

---

## 8. Preguntas Frecuentes y Solución de Problemas

### 1. ¿Cómo pruebo el webhook localmente en mi computadora?
Puedes usar **Ngrok** o **Cloudflare Tunnels**:
```bash
# Con ngrok
ngrok http 3000
```
Copia la URL HTTPS que te genera (ej: `https://abc1234.ngrok-free.app/webhook`) y pégala en Meta Developers.

### 2. ¿Cómo sé si el servidor está respondiendo correctamente?
Abre en tu navegador o envía un `GET` a:
- `http://localhost:3000/` ➡️ Debe responder estado `"running"`.
- `http://localhost:3000/api/health` ➡️ Debe responder `"database": "connected"`.

### 3. ¿Qué pasa si el cliente envía un audio o una foto?
El controlador de webhook (`src/controllers/webhook.ts`) detecta si el tipo de mensaje no es texto y le responde amablemente al usuario indicándole que por el momento la atención automatizada opera mediante mensajes de texto, evitando que el bot se cuelgue o arroje un error.

### 4. ¿Cómo cambio el comportamiento o personalidad de un cliente existente?
Solo debes hacer un `UPDATE` en la tabla `tenants` modificando el `system_prompt`. El cambio surte efecto **en el siguiente mensaje de forma instantánea**, sin necesidad de reiniciar el servidor.

