# AutoTech S.A. - Frontend Web ERP (React + TypeScript + Tailwind CSS)

Aplicación frontend completa, interactiva y funcional para el sistema corporativo de gestión de talleres mecánicos **AutoTech S.A.**

Diseñada con enfoque en **alta densidad de información (ERP)**, arquitectura modular de componentes, gestión de estado cliente en memoria y soporte nativo para **Modo Claro / Modo Oscuro**.

---

## 🚀 Inicio Rápido (Desarrollo Frontend)

El proyecto está configurado con **Vite**, **React 18**, **TypeScript** y **Tailwind CSS**.

### 1. Iniciar servidor de desarrollo:
```bash
npm run dev
```
La aplicación se abrirá en `http://localhost:3000/`.

### 2. Compilar para producción (Build):
```bash
npm run build
```
Genera la versión optimizada en la carpeta `dist/`.

---

## 🧭 Estructura de la Aplicación Frontend

```
AutoTech/
├── src/
│   ├── assets/
│   │   ├── logo.png             # Logo oficial AutoTech S.A.
│   │   └── car.png              # Imagen estilizada del vehículo
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx       # Topbar con Sol/Luna, avatar "Valen C. - Recepción" y Logout
│   │   │   ├── Sidebar.tsx      # Menú lateral con los 5 módulos fijos + Dashboard
│   │   │   └── MainLayout.tsx   # Envoltorio responsivo global
│   │   └── ui/
│   │       ├── Badge.tsx        # Badges verde / amarillo / gris
│   │       ├── Button.tsx       # Botones corporativos
│   │       ├── Modal.tsx        # Modal translúcido (backdrop-blur)
│   │       └── Alert.tsx        # Alert box 24hs
│   ├── context/
│   │   └── WorkshopContext.tsx  # Estado global reactivo en memoria (Auth, Tema, Clientes, OTs, Stock)
│   ├── screens/
│   │   ├── LoginScreen.tsx      # Login split-screen con auto difuminado y tarjeta flotante
│   │   ├── DashboardScreen.tsx  # Panel gerencial, KPIs y bahías en tiempo real
│   │   ├── ComercialScreen.tsx  # Maestro-Detalle Clientes & Flotas + Modal Nuevo Cliente
│   │   ├── RecepcionScreen.tsx  # Formulario estructurado, Alert 24hs y tabla editable
│   │   ├── OperativaScreen.tsx  # Terminal Mecánico: carga de horas y descuento de pañol
│   │   ├── SupervisionScreen.tsx# Control de calidad ISO con botones Aprobar / Rechazar
│   │   └── InventarioScreen.tsx # Data grid robusta con filtro y Solicitud de Compra
│   ├── theme/
│   │   └── tokens.ts            # Tokens de diseño Tailwind / CSS
│   ├── types/
│   │   └── autotech.ts          # Interfaces TypeScript del dominio automotriz
│   ├── App.tsx                  # Enrutamiento de pantallas según estado de autenticación
│   ├── main.tsx                 # Punto de entrada React con WorkshopProvider
│   └── index.css                # Estilos base, badges globales y scrollbars
├── index.html                   # HTML base de Vite
├── vite.config.ts               # Configuración de Vite
├── tailwind.config.js           # Configuración de paleta corporativa y tema oscuro
└── autotech_ui_kit.html         # Prototipo HTML estático dual original
```

---

## 📱 Pantallas y Funcionalidades del Frontend

1. **Login**:
   - Panel izquierdo en rojo borgoña con logo oficial AutoTech S.A. y vehículo deportivo difuminado con máscara radial suave hacia el fondo.
   - Panel derecho con tarjeta flotante, validación de campos obligatorios (`*`), alternar visibilidad de contraseña y submit que autentica al usuario.

2. **Dashboard**:
   - 4 Tarjetas de KPIs: *Turnos de hoy* (18), *Órdenes en proceso* (08), *Listas para entrega* (05) y *Ocupación de taller* (92%).
   - Monitor de bahías de trabajo y accesos directos.

3. **1. Comercial (Maestro-Detalle)**:
   - Tabla de Clientes con búsqueda reactiva por nombre o CUIT.
   - Detalle de vehículos asociados al cliente seleccionado.
   - Modal flotante *"Registrar Nuevo Cliente"* con backdrop translúcido oscuro, inputs obligatorios con asterisco (`*`) y botones *"Cancelar"* (gris) y *"Guardar Cliente"* (rojo) que actualizan el estado en vivo.
   - Modal para *"Asociar Vehículo"*.

4. **2. Recepción (Turnos y Presupuestos)**:
   - Alert Box amarillo destacado: *"Alerta: El turno requiere confirmación 24hs previas"*.
   - Formulario en tarjetas con selectores vinculados de Cliente y Vehículo, y kilometraje con asterisco.
   - Tabla editable de servicios donde se pueden agregar filas, modificar horas y costo hora, calculando en tiempo real Mano de Obra, Repuestos, IVA (21%) y Total.

5. **3. Operativa Taller (Mecánico MVP)**:
   - Grilla de órdenes asignadas a la bahía activa.
   - **Control numérico interactivo**: permite ingresar y actualizar *Horas trabajadas*.
   - **Buscador/input de descuento de pañol**: descuenta unidades directamente del stock del catálogo y las asigna a la ficha de la OT.

6. **4. Supervisión (Jefe de Taller)**:
   - Control de calidad bajo norma ISO 9001.
   - Checklist de salida (torque verificado, escaneo OBD2, prueba en ruta).
   - **Botones de acción rápida**: Verde (*"Aprobar"*) y Rojo (*"Rechazar"*) con actualización inmediata de estado.

7. **5. Inventario**:
   - Data Grid de repuestos con buscador y filtro por categoría.
   - Indicador de stock crítico cuando las existencias son menores al mínimo.
   - **Botón primario superior derecho**: *"Generar Solicitud de Compra"* con modal de reposición que actualiza las existencias.

8. **Navegación y Topbar Global**:
   - Toggle Sol/Luna para alternar instantáneamente entre Modo Claro y Modo Oscuro con persistencia en `localStorage`.
   - Perfil de usuario *"Valen C. - Recepción"* con punto verde de conexión.
   - Botón *"Cerrar Sesión"* que retorna al Login.

---

## 🗄️ Base de Datos: `autotech_db`

El proyecto incluye el esquema SQL listo para inicializar la base de datos: [`autotech_db_schema.sql`](./autotech_db_schema.sql).

### Instrucciones para levantar la DB:
1. **Crear la base de datos** (en PostgreSQL local, pgAdmin, DBeaver o terminal psql):
   ```sql
   CREATE DATABASE autotech_db;
   \c autotech_db;
   ```
2. **Ejecutar el script**:
   - Abrir el archivo `autotech_db_schema.sql` y ejecutar su contenido.
   - Crea las tablas correspondientes a las clases del MVP (`estado_turnos`, `clientes`, `vehiculos`, `turnos`, `presupuestos`) e inserta datos semilla de prueba para comenzar a operar.

