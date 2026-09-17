-- Extensión necesaria para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Clientes / Tenants
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    phone_number_id VARCHAR(100) UNIQUE NOT NULL,
    whatsapp_token TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    active_tools JSONB DEFAULT '["get_available_slots", "book_appointment"]'::jsonb,
    config JSONB DEFAULT '{"business_start": "09:00", "business_end": "18:00", "slot_duration_minutes": 60}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por número de teléfono en webhooks entrantes
CREATE INDEX IF NOT EXISTS idx_tenants_phone_number_id ON tenants(phone_number_id);

-- Tabla de Hilos de Conversación
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_phone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_phone)
);

-- Tabla de Mensajes (Historial conversacional)
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'system', 'user', 'assistant', 'tool'
    content TEXT,
    tool_call_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Tabla de Turnos / Citas (Vertical Funcional de Turnos)
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_phone VARCHAR(50) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'confirmed', -- 'confirmed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_time ON appointments(tenant_id, start_time);
