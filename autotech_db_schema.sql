-- ============================================================
-- BASE DE DATOS: autotech_db
-- AUTOTECH S.A. - ESQUEMA DE BASE DE DATOS POSTGRESQL (MVP)
-- Alineado 100% con el Diagrama de Clases UML del Proyecto
-- Compatible con: PostgreSQL Local (pgAdmin, DBeaver, psql), Docker, Supabase, Neon, etc.
-- ============================================================

-- Si estás usando PostgreSQL local (pgAdmin o terminal psql), podés crear la base ejecutando:
-- CREATE DATABASE autotech_db;
-- \c autotech_db;

-- Habilitar extensión para UUIDs (compatible con cualquier PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: ESTADO DE TURNO (UML: EstadoTurno)
CREATE TABLE IF NOT EXISTS estado_turnos (
  id SERIAL PRIMARY KEY,
  descripcion_estado VARCHAR(50) NOT NULL UNIQUE
);

-- Estados iniciales
INSERT INTO estado_turnos (descripcion_estado) VALUES 
('Pendiente de Confirmación (24hs)'),
('Confirmado'),
('En Taller'),
('Cancelado')
ON CONFLICT (descripcion_estado) DO NOTHING;


-- 2. TABLA: CLIENTES (UML: Cliente)
CREATE TABLE IF NOT EXISTS clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_documento VARCHAR(20) NOT NULL DEFAULT 'CUIT', -- DNI, CUIT, Pasaporte
  nro_documento VARCHAR(30) NOT NULL UNIQUE,
  razon_social VARCHAR(150) NOT NULL, -- Nombre y Apellido o Razón Social
  email VARCHAR(120),
  telefono VARCHAR(50) NOT NULL,
  fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
  estado VARCHAR(20) DEFAULT 'Activo'
);


-- 3. TABLA: VEHÍCULOS (UML: Vehiculo)
-- Relación: 1 Cliente tiene 1..* Vehículos
CREATE TABLE IF NOT EXISTS vehiculos (
  dominio VARCHAR(15) PRIMARY KEY, -- Patente única (ej: AF-123-ZZ)
  cliente_id UUID NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  marca VARCHAR(50) NOT NULL,
  modelo VARCHAR(80) NOT NULL,
  anio INT NOT NULL,
  kilometraje_actual INT NOT NULL DEFAULT 0,
  estado VARCHAR(30) DEFAULT 'Activo'
);


-- 4. TABLA: TURNOS (UML: Turno)
-- Relaciones:
--   1 Vehículo tiene 1..* Turnos
--   1 Turno tiene 1 EstadoTurno
CREATE TABLE IF NOT EXISTS turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_dominio VARCHAR(15) NOT NULL REFERENCES vehiculos(dominio) ON DELETE CASCADE,
  estado_turno_id INT NOT NULL REFERENCES estado_turnos(id),
  fecha_hora_propuesta TIMESTAMP NOT NULL,
  motivo_consulta TEXT NOT NULL,
  es_emergencia BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- 5. TABLA: PRESUPUESTOS (UML: Presupuesto)
-- Relación: 1 Turno tiene 0..1 Presupuesto
CREATE TABLE IF NOT EXISTS presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nro_presupuesto VARCHAR(30) UNIQUE NOT NULL,
  turno_id UUID NOT NULL UNIQUE REFERENCES turnos(id) ON DELETE CASCADE,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  monto_estimado NUMERIC(12, 2) NOT NULL,
  validez_dias INT NOT NULL DEFAULT 7 -- Días de validez de la cotización
);


-- ============================================================
-- POLÍTICAS DE ACCESO (ROW LEVEL SECURITY - RLS)
-- Permitir lectura y escritura para la aplicación cliente
-- ============================================================
ALTER TABLE estado_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública clientes" ON clientes FOR SELECT USING (true);
CREATE POLICY "Inserción pública clientes" ON clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización clientes" ON clientes FOR UPDATE USING (true);

CREATE POLICY "Lectura pública vehiculos" ON vehiculos FOR SELECT USING (true);
CREATE POLICY "Inserción pública vehiculos" ON vehiculos FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización vehiculos" ON vehiculos FOR UPDATE USING (true);

CREATE POLICY "Lectura pública turnos" ON turnos FOR SELECT USING (true);
CREATE POLICY "Inserción pública turnos" ON turnos FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización turnos" ON turnos FOR UPDATE USING (true);

CREATE POLICY "Lectura pública estado_turnos" ON estado_turnos FOR SELECT USING (true);
CREATE POLICY "Lectura pública presupuestos" ON presupuestos FOR SELECT USING (true);
CREATE POLICY "Inserción pública presupuestos" ON presupuestos FOR INSERT WITH CHECK (true);


-- ============================================================
-- DATOS SEMILLA (SEED DATA DE EJEMPLO)
-- Carga inicial para probar la aplicación de inmediato
-- ============================================================
DO $$
DECLARE
  cli1_id UUID;
  cli2_id UUID;
  cli3_id UUID;
  turno1_id UUID;
BEGIN
  -- Insertar Clientes
  INSERT INTO clientes (tipo_documento, nro_documento, razon_social, email, telefono)
  VALUES ('CUIT', '30-71234567-9', 'Transportes Rápido S.R.L.', 'contacto@transportesrapido.com.ar', '0351-4889900')
  RETURNING id INTO cli1_id;

  INSERT INTO clientes (tipo_documento, nro_documento, razon_social, email, telefono)
  VALUES ('CUIT', '30-68994123-4', 'Agropecuaria El Ombú', 'administracion@elombu.com.ar', '0353-4123456')
  RETURNING id INTO cli2_id;

  INSERT INTO clientes (tipo_documento, nro_documento, razon_social, email, telefono)
  VALUES ('DNI', '20-33445566-8', 'Esteban Morales', 'esteban.morales@gmail.com', '0351-155987654')
  RETURNING id INTO cli3_id;

  -- Insertar Vehículos asociados
  INSERT INTO vehiculos (dominio, cliente_id, marca, modelo, anio, kilometraje_actual)
  VALUES 
  ('AF-123-ZZ', cli1_id, 'Toyota', 'Hilux 2.8 D-4D', 2022, 64200),
  ('AE-456-CC', cli1_id, 'Mercedes-Benz', 'Sprinter 516', 2021, 112500),
  ('AC-789-DD', cli1_id, 'Volkswagen', 'Amarok V6 3.0', 2020, 89000),
  ('AD-991-LK', cli2_id, 'Ford', 'Ranger 3.2 TDCi Limited', 2019, 104000),
  ('AD-332-LM', cli3_id, 'Ford', 'Ranger 3.2 TDCi XLT', 2019, 98400);

  -- Insertar Turno Inicial
  INSERT INTO turnos (vehiculo_dominio, estado_turno_id, fecha_hora_propuesta, motivo_consulta, es_emergencia)
  VALUES ('AF-123-ZZ', 1, NOW() + INTERVAL '1 day', 'Service programado 60.000km y pastillas de freno', FALSE)
  RETURNING id INTO turno1_id;

  -- Insertar Presupuesto Inicial
  INSERT INTO presupuestos (nro_presupuesto, turno_id, monto_estimado, validez_dias)
  VALUES ('PRES-2026-001', turno1_id, 322465.00, 7);

END $$;
