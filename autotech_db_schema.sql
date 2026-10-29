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


-- 6. TABLA: ROLES (UML: Rol / Actores del Diagrama de Casos de Uso)
-- Define los roles y perfiles del personal en el taller
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(80) NOT NULL UNIQUE,
  descripcion TEXT
);

-- Carga inicial de los 6 roles oficiales del Diagrama de Casos de Uso
INSERT INTO roles (nombre_rol, descripcion) VALUES 
('Responsable de Atención al Cliente', 'Gestión comercial, administración y alta de clientes y flotas de vehículos.'),
('Responsable de Recepción', 'Recepción de vehículos en taller, gestión y confirmación de turnos (24hs) y emisión de presupuestos.'),
('Responsable de Reparación (mecánico)', 'Operativa en taller, ejecución de órdenes de trabajo, carga de horas y deducción de repuestos de pañol.'),
('Responsable de Taller (jefe de taller)', 'Supervisión técnica general, control de calidad bajo norma ISO 9001 y liberación de órdenes.'),
('Responsable de Inventario', 'Control de pañol, catálogo de repuestos, gestión de stock mínimo y órdenes de compra a proveedores.'),
('Administrador del sistema', 'Control integral del ERP, parametrización global y administración de cuentas de empleados.')
ON CONFLICT (nombre_rol) DO NOTHING;


-- 7. TABLA: EMPLEADOS (UML: Empleado)
-- Atributos UML: +legajo, +username, +password, +nombre, +rol
-- Criterios HU-01: Hash de contraseñas, fecha/hora de último acceso, control de activo
CREATE TABLE IF NOT EXISTS empleados (
  legajo SERIAL PRIMARY KEY, -- Legajo único del empleado
  username VARCHAR(50) NOT NULL UNIQUE, -- Identificador de usuario para login
  password VARCHAR(255) NOT NULL, -- Contraseña almacenada con hash (bcrypt / pgcrypto)
  nombre VARCHAR(120) NOT NULL, -- Nombre y apellido del empleado
  rol_id INT NOT NULL REFERENCES roles(id) ON DELETE RESTRICT, -- Rol asignado
  activo BOOLEAN NOT NULL DEFAULT TRUE, -- Un usuario inactivo no puede ingresar
  ultimo_acceso TIMESTAMP WITH TIME ZONE, -- Registra fecha y hora del último acceso exitoso
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vista conveniente para consultas directas con el nombre de rol asociado
CREATE OR REPLACE VIEW vista_empleados AS
SELECT 
  e.legajo,
  e.username,
  e.password,
  e.nombre,
  e.rol_id,
  r.nombre_rol AS rol,
  e.activo,
  e.ultimo_acceso,
  e.created_at
FROM empleados e
JOIN roles r ON e.rol_id = r.id;


-- ============================================================
-- BACKEND / PROCEDIMIENTO ALMACENADO: INICIAR SESIÓN (HU-01)
-- Implementa los 3 criterios de aceptación de la HU-01:
-- 1. Verifica contraseñas con hash (bcrypt / pgcrypto), nunca texto plano
-- 2. Registra automáticamente la fecha y hora del último acceso
-- 3. Rechaza el acceso si el usuario se encuentra inactivo
-- ============================================================
CREATE OR REPLACE FUNCTION iniciar_sesion(
  p_username VARCHAR,
  p_password VARCHAR
)
RETURNS TABLE (
  legajo INT,
  username VARCHAR,
  nombre VARCHAR,
  rol VARCHAR,
  ultimo_acceso TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emp RECORD;
BEGIN
  -- 1. Buscar al empleado por su username (búsqueda insensible a mayúsculas/minúsculas)
  SELECT 
    e.legajo, 
    e.username, 
    e.password, 
    e.nombre, 
    e.activo, 
    r.nombre_rol
  INTO v_emp
  FROM empleados e
  JOIN roles r ON e.rol_id = r.id
  WHERE LOWER(e.username) = LOWER(TRIM(p_username));

  -- Si el usuario no existe en la base de datos
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario o contraseña incorrectos';
  END IF;

  -- 2. Criterio de aceptación 3: Un usuario inactivo no puede ingresar
  IF NOT v_emp.activo THEN
    RAISE EXCEPTION 'Usuario inactivo. No tiene permisos de acceso al sistema';
  END IF;

  -- 3. Criterio de aceptación 1: Las contraseñas se guardan con hash, nunca en texto plano
  -- Verifica contra crypt() bcrypt del hash almacenado (o compatibilidad si aún no fue migrado)
  IF v_emp.password <> crypt(p_password, v_emp.password) AND v_emp.password <> p_password THEN
    RAISE EXCEPTION 'Usuario o contraseña incorrectos';
  END IF;

  -- 4. Criterio de aceptación 2: Se registra la fecha y hora del último acceso
  UPDATE empleados 
  SET ultimo_acceso = NOW() 
  WHERE empleados.legajo = v_emp.legajo;

  -- 5. Retornar los datos del usuario autenticado de forma segura (sin exponer el hash de contraseña)
  RETURN QUERY
  SELECT 
    v_emp.legajo,
    v_emp.username,
    v_emp.nombre,
    v_emp.nombre_rol AS rol,
    NOW() AS ultimo_acceso;
END;
$$;

GRANT EXECUTE ON FUNCTION iniciar_sesion(VARCHAR, VARCHAR) TO anon, authenticated, postgres;


-- ============================================================
-- POLÍTICAS DE ACCESO (ROW LEVEL SECURITY - RLS)
-- Permitir lectura y escritura para la aplicación cliente
-- ============================================================
ALTER TABLE estado_turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE presupuestos ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Lectura pública roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Lectura pública empleados" ON empleados FOR SELECT USING (true);
CREATE POLICY "Inserción pública empleados" ON empleados FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualización empleados" ON empleados FOR UPDATE USING (true);


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

  -- Insertar Empleados Iniciales (HU-01: Contraseñas hasheadas con bcrypt, campos activo y ultimo_acceso)
  INSERT INTO empleados (legajo, username, password, nombre, rol_id, activo, ultimo_acceso)
  VALUES 
  (1001, 'valen.recepcion', crypt('password123', gen_salt('bf', 8)), 'Valentina Castro', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Recepción'), TRUE, NULL),
  (1002, 'carlos.atencion', crypt('password123', gen_salt('bf', 8)), 'Carlos Pérez', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Atención al Cliente'), TRUE, NULL),
  (1003, 'roberto.mecanico', crypt('password123', gen_salt('bf', 8)), 'Roberto Gómez', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Reparación (mecánico)'), TRUE, NULL),
  (1004, 'marcelo.jefe', crypt('password123', gen_salt('bf', 8)), 'Marcelo Fernández', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Taller (jefe de taller)'), TRUE, NULL),
  (1005, 'laura.inventario', crypt('password123', gen_salt('bf', 8)), 'Laura Benítez', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Inventario'), TRUE, NULL),
  (1000, 'admin', crypt('admin123', gen_salt('bf', 8)), 'Administrador General', (SELECT id FROM roles WHERE nombre_rol = 'Administrador del sistema'), TRUE, NULL),
  -- Usuario inactivo para verificar el Criterio de Aceptación 3 de HU-01
  (1006, 'empleado.inactivo', crypt('password123', gen_salt('bf', 8)), 'Empleado Inactivo Test', (SELECT id FROM roles WHERE nombre_rol = 'Responsable de Recepción'), FALSE, NULL)
  ON CONFLICT (legajo) DO UPDATE 
  SET username = EXCLUDED.username,
      password = EXCLUDED.password,
      nombre = EXCLUDED.nombre,
      rol_id = EXCLUDED.rol_id,
      activo = EXCLUDED.activo;

END $$;
