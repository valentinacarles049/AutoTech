# AutoTech S.A. - UI Kit & Design System (React + Tailwind CSS)

Bienvenido a la especificación de diseño y arquitectura UI/UX para el sistema web corporativo de gestión de talleres mecánicos **AutoTech S.A.**

Diseñado con un enfoque de **alta densidad de información (ERP)**, estilo moderno flat design, y soporte nativo para **presentación dual (Modo Claro / Modo Oscuro)**.

---

## 🎨 Paleta y Tokens de Color

| Token Semántico | Valor Hex / Tailwind | Uso / Contexto |
| :--- | :--- | :--- |
| **Brand Primary (Acento)** | `#DC2626` (`red-600`) | Acciones primarias, botones principales, bordes activos, isotipo |
| **Brand Primary Hover** | `#B91C1C` (`red-700`) | Estados hover en botones de acción |
| **Light Background** | `#F8F9FA` | Fondo base en Modo Claro |
| **Light Surface / Cards** | `#FFFFFF` | Contenedores, tarjetas, modales y tablas en Modo Claro |
| **Light Text Primary** | `#0F172A` (`slate-900`) | Títulos, valores numéricos clave y encabezados |
| **Light Borders** | `#E2E8F0` (`slate-200`) | Divisores de tabla, bordes de inputs y cards |
| **Dark Background** | `#1E1E24` (Pizarra Carbón) | Fondo base en Modo Oscuro |
| **Dark Surface / Cards** | `#282832` | Contenedores, tarjetas y modales en Modo Oscuro |
| **Dark Text Primary** | `#F8FAFC` (Blanco Puro) | Textos y valores en Modo Oscuro |
| **Dark Borders** | `#3A3A48` | Divisores y bordes en Modo Oscuro |

---

## 🏷️ Reglas de Negocio Globales: Badges de Estado

Todos los estados del taller utilizan **etiquetas redondeadas (badges)** con las siguientes variantes cromáticas:

1. **Verde (`badge-green`)**:
   - Estados: `"Aprobado"`, `"Activo"`, `"Entregado"`
   - Claro: `bg-emerald-100 text-emerald-800 border-emerald-300`
   - Oscuro: `bg-emerald-950/70 text-emerald-300 border-emerald-700`
2. **Amarillo (`badge-yellow`)**:
   - Estados: `"Pendiente"`, `"En taller"`
   - Claro: `bg-amber-100 text-amber-800 border-amber-300`
   - Oscuro: `bg-amber-950/70 text-amber-300 border-amber-700`
3. **Gris (`badge-gray`)**:
   - Estados: `"Cancelado"`, `"Inactivo"`
   - Claro: `bg-slate-100 text-slate-700 border-slate-300`
   - Oscuro: `bg-slate-800 text-slate-300 border-slate-700`

> **Regla de Formulario**: Todos los campos obligatorios llevan un asterisco rojo (`*` con clase `text-red-600 font-bold`).

---

## 🧭 Navegación Global

- **Header de Usuario (Topbar Principal)**:
  - Ubicado en el área superior de trabajo, respetando la barra lateral izquierda (Sidebar).
  - **Izquierda**: Breadcrumb dinámico con la marca `AutoTech S.A. / [Módulo Actual]` y badge de estado de sede (`● Sucursal Central`).
  - **Extremo Derecho** (alineación horizontal y estética corporativa):
    1. **Toggle de Tema**: Botón con ícono sol/luna para conmutar al instante entre Modo Claro y Modo Oscuro.
    2. **Perfil de Usuario**: Avatar circular con indicador de conexión verde en vivo y texto jerárquico: **"Valen C. - Recepción"**.
    3. **Cerrar Sesión**: Botón con ícono de log out y texto interactivo que redirige fluidamente a la pantalla de Login.
- **Sidebar (Menú Lateral Izquierdo)**: Siempre visible (excepto en pantalla de Login) con los 5 módulos:
  1. `1. Comercial` (Gestión de Clientes, CUIT, Contratos y Flotas)
  2. `2. Recepción` (Agendamiento de Turnos, Presupuestos y Checklist de Ingreso)
  3. `3. Operativa Taller` (Terminal de Mecánico, Carga de Horas, Descuento de Pañol)
  4. `4. Supervisión` (Jefe de Taller, Control de Calidad ISO, Aprobación/Rechazo de OTs)
  5. `5. Inventario y Red` (Data Grid de Repuestos, Stock Físico, Solicitud de Compra)

---

## 📱 Las Pantallas Prototipadas en el UI Kit

1. **Login**: Diseño split-screen fiel a la imagen corporativa: panel izquierdo rojo borgoña con el logo oficial de AutoTech S.A. (engranaje y trazas de circuito tecnológico), descripción del sistema de turnos en Córdoba Capital, bullets de características y fotografía del Chevrolet Cruze. Panel derecho con marca de agua de siluetas de autos, badge de sprint y tarjeta flotante central "Iniciar sesión" con inputs y botón rojo "Ingresar".
2. **Dashboard / Base**: Panel gerencial de KPIs (`Turnos de hoy`, `Órdenes en proceso`, `Listas para entrega`, `Ocupación de taller`) y tabla activa de bahías de trabajo.
3. **Comercial (Sin Modal)**: Vista Maestro-Detalle limpia y despejada. A la izquierda, tabla densa de Clientes con búsqueda rápida y botón `+ Nuevo Cliente`. A la derecha, tarjeta de Vehículos Asociados con ficha de resumen del cliente seleccionado (flotas, convenio, historial) y listado de unidades.
4. **Comercial (Con Modal Activa)**: La misma vista Maestro-Detalle con la ventana modal superpuesta sobre un fondo oscuro translúcido (`backdrop-blur`) para "Registrar Nuevo Cliente".
5. **Recepción (Turnos y Presupuestos)**: Formulario en tarjetas con selectores de Cliente y Vehículo, tabla editable de servicios/horas/costos, y el **Alert Box amarillo** destacado: *"Alerta: El turno requiere confirmación 24hs previas"*.
6. **Operativa Taller (Vista Mecánico)**: Grilla de OTs asignadas, control numérico para `Horas trabajadas`, y buscador rápido para descontar repuestos del pañol central.
7. **Supervisión (Jefe de Taller)**: Tabla de control de calidad de OTs finalizadas con botones de acción rápida: Verde (`Aprobar`) y Rojo (`Rechazar`).
8. **Inventario**: Data Grid de catálogo de repuestos con SKU, descripción, stock actual vs mínimo, y botón primario superior derecho `Generar Solicitud de Compra`.

---

## ⚡ Estructura para el Proyecto React

El scaffolding inicial ya se encuentra configurado en `src/`:

```
AutoTech/
├── src/
│   ├── theme/
│   │   └── tokens.ts           # Definiciones de colores, tipografía, bordes y badges
│   ├── types/
│   │   └── autotech.ts         # Tipos TypeScript (Client, Vehicle, WorkOrder, SparePart)
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Badge.tsx       # Componente de badge con estados verde/amarillo/gris
│   │   │   ├── Button.tsx      # Botones con variante primaria roja corporativa
│   │   │   ├── Modal.tsx       # Modal flotante con fondo translúcido y borde rojo
│   │   │   └── Alert.tsx       # Alert box amarillo para advertencias de recepción
│   │   └── layout/
│   │       ├── Header.tsx      # Header corporativo con toggle y avatar
│   │       └── Sidebar.tsx     # Menú lateral con los 5 módulos requeridos
│   └── index.ts
└── README.md
```

### Prototipo Interactivo
El prototipo visual interactivo con formato de **Presentación Dual (Mitad superior Modo Claro / Mitad inferior Modo Oscuro)** se encuentra generado y listo para visualizar.
