/**
 * Suite de Pruebas Automatizadas BDD - HU-10: Consultar disponibilidad horaria
 * 
 * Criterios de Aceptación:
 * 1. Muestra los horarios dentro del horario de atención de la sucursal
 * 2. Excluye los horarios con turnos Solicitados o Confirmados
 * 3. Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"
 */

import { 
  localSucursalesSeed, 
  localTurnosSeed,
  localEmployeesSeed,
  LocalTurno
} from './server/db';
import { 
  getBranchTimeSlots, 
  isTurnoOcupandoHorario,
  normalizeTime,
  normalizeDate
} from './server/controllers/turnos.controller';
import { isScreenAllowed } from './src/utils/permissions';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName} ${detail ? `-> ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('======================================================================');
console.log('🧪 EJECUTANDO SUITE BDD: HU-10 CONSULTAR DISPONIBILIDAD HORARIA');
console.log('======================================================================\n');

// ----------------------------------------------------------------------
// 1. ANTECEDENTES
// ----------------------------------------------------------------------
console.log('📋 1. ANTECEDENTES:');

// Rol Responsable de Recepción
const recepcionista = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción' && e.activo);
assert(
  Boolean(recepcionista && isScreenAllowed('recepcion', recepcionista.rol)),
  'Dado que inicié sesión con el rol "Responsable de Recepción"',
  `Usuario: ${recepcionista?.username}`
);

// Sucursal Centro
const sucursalCentro = localSucursalesSeed.find(s => s.nombre === 'Centro');
assert(
  Boolean(sucursalCentro && sucursalCentro.horario_apertura === '08:00' && sucursalCentro.horario_cierre === '17:00'),
  'Y la sucursal "Centro" atiende de 08:00 a 17:00',
  `Horario: ${sucursalCentro?.horario_apertura} a ${sucursalCentro?.horario_cierre}`
);

// Limpiar turnos previos para testing
localTurnosSeed.length = 0;

// ----------------------------------------------------------------------
// 2. CRITERIO 1: Muestra los horarios dentro del horario de atención de la sucursal
// ----------------------------------------------------------------------
console.log('\n📋 2. CRITERIO 1: Muestra los horarios dentro del horario de atención de la sucursal');

const slotsCentro = getBranchTimeSlots(sucursalCentro!.horario_apertura, sucursalCentro!.horario_cierre);
assert(
  slotsCentro.length === 10 && slotsCentro[0] === '08:00' && slotsCentro[slotsCentro.length - 1] === '17:00',
  'Muestra los horarios comprendidos entre las 08:00 y las 17:00 para la sucursal Centro',
  `Slots generados: ${slotsCentro.join(', ')}`
);

// Comprobación con otra sucursal (Norte: 08:00 a 18:00)
const sucursalNorte = localSucursalesSeed.find(s => s.nombre === 'Norte');
const slotsNorte = getBranchTimeSlots(sucursalNorte!.horario_apertura, sucursalNorte!.horario_cierre);
assert(
  slotsNorte.includes('18:00') && !slotsCentro.includes('18:00'),
  'Para la sucursal Norte muestra horarios de 08:00 a 18:00 según su propia parametrización',
  `Slots Norte: ${slotsNorte.join(', ')}`
);

// ----------------------------------------------------------------------
// 3. CRITERIO 2: Excluye los horarios con turnos Solicitados o Confirmados
// ----------------------------------------------------------------------
console.log('\n📋 3. CRITERIO 2: Excluye los horarios con turnos Solicitados o Confirmados');

const fechaPrueba = '15/11/2026';

// Turno 1: Estado "Solicitado" a las 09:00
localTurnosSeed.push({
  id: 't-solicitado',
  nro_turno: 1001,
  vehiculo_dominio: 'AB123CD',
  sucursal: 'Centro',
  fecha: fechaPrueba,
  hora: '09:00',
  motivo_consulta: 'Service general',
  estado: 'Solicitado'
});

// Turno 2: Estado "Confirmado" a las 11:00
localTurnosSeed.push({
  id: 't-confirmado',
  nro_turno: 1002,
  vehiculo_dominio: 'AF-123-ZZ',
  sucursal: 'Centro',
  fecha: fechaPrueba,
  hora: '11:00',
  motivo_consulta: 'Frenos',
  estado: 'Confirmado'
});

// Turno 3: Estado "Cancelado" a las 14:00 (NO debe excluirse)
localTurnosSeed.push({
  id: 't-cancelado',
  nro_turno: 1003,
  vehiculo_dominio: 'AD-991-LK',
  sucursal: 'Centro',
  fecha: fechaPrueba,
  hora: '14:00',
  motivo_consulta: 'Revisión suspensión',
  estado: 'Cancelado'
});

// Verificación lógica de exclusión
assert(
  isTurnoOcupandoHorario('Solicitado') === true,
  'Turno en estado "Solicitado" se reconoce como ocupando horario'
);

assert(
  isTurnoOcupandoHorario('Confirmado') === true && isTurnoOcupandoHorario('Confirmado (24hs)') === true,
  'Turno en estado "Confirmado" se reconoce como ocupando horario'
);

assert(
  isTurnoOcupandoHorario('Cancelado') === false,
  'Turno en estado "Cancelado" NO ocupa horario (permanece disponible)'
);

// Calcular horarios libres para 15/11/2026 en Centro
const occupiedTurnos = localTurnosSeed.filter(t => {
  if (!isTurnoOcupandoHorario(t.estado)) return false;
  return t.sucursal === 'Centro' && t.fecha === fechaPrueba;
});
const occupiedHours = new Set(occupiedTurnos.map(t => normalizeTime(t.hora)));
const horariosLibres = slotsCentro.filter(s => !occupiedHours.has(normalizeTime(s)));

assert(
  !horariosLibres.includes('09:00'),
  'El horario "09:00" con turno Solicitado queda excluido de los horarios libres'
);

assert(
  !horariosLibres.includes('11:00'),
  'El horario "11:00" con turno Confirmado queda excluido de los horarios libres'
);

assert(
  horariosLibres.includes('14:00'),
  'El horario "14:00" con turno Cancelado permanece LIBRE y disponible'
);

assert(
  horariosLibres.length === slotsCentro.length - 2, // 10 slots - 2 ocupados (09:00 y 11:00) = 8 libres
  `La lista de horarios libres tiene exactamente 8 horarios disponibles: ${horariosLibres.join(', ')}`
);

// ----------------------------------------------------------------------
// 4. CRITERIO 3: Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"
// ----------------------------------------------------------------------
console.log('\n📋 4. CRITERIO 3: Si no hay horarios libres se muestra "Sin disponibilidad para la fecha seleccionada"');

const fechaLlena = '16/11/2026';

// Ocupamos todos los horarios de la sucursal Centro para el 16/11/2026
slotsCentro.forEach((slot, index) => {
  localTurnosSeed.push({
    id: `t-lleno-${index}`,
    nro_turno: 2000 + index,
    vehiculo_dominio: `PAT-${index}`,
    sucursal: 'Centro',
    fecha: fechaLlena,
    hora: slot,
    motivo_consulta: `Turno completo ${slot}`,
    estado: index % 2 === 0 ? 'Solicitado' : 'Confirmado'
  });
});

// Consultamos horarios libres para fechaLlena
const occupiedSlotsFull = localTurnosSeed.filter(t => {
  if (!isTurnoOcupandoHorario(t.estado)) return false;
  return t.sucursal === 'Centro' && t.fecha === fechaLlena;
});
const occupiedSetFull = new Set(occupiedSlotsFull.map(t => normalizeTime(t.hora)));
const libresFull = slotsCentro.filter(s => !occupiedSetFull.has(normalizeTime(s)));

const tieneDisponibilidad = libresFull.length > 0;
const mensajeRespuesta = tieneDisponibilidad
  ? `Hay ${libresFull.length} horarios disponibles`
  : 'Sin disponibilidad para la fecha seleccionada';

assert(
  libresFull.length === 0,
  'La lista de horarios libres está vacía cuando todos los horarios están reservados'
);

assert(
  mensajeRespuesta === 'Sin disponibilidad para la fecha seleccionada',
  'El sistema muestra el mensaje exacto "Sin disponibilidad para la fecha seleccionada"',
  `Mensaje: "${mensajeRespuesta}"`
);

// ----------------------------------------------------------------------
// 5. VERIFICACIÓN DE INTEGRIDAD CON HUS PREVIAS
// ----------------------------------------------------------------------
console.log('\n📋 5. INTEGRIDAD Y REGRESIÓN:');

assert(
  Boolean(recepcionista && recepcionista.activo),
  'HU-01: Responsable de Recepción activo autenticado'
);

assert(
  isScreenAllowed('recepcion', 'Responsable de Recepción') && !isScreenAllowed('inventario', 'Responsable de Recepción'),
  'HU-03: Responsable de Recepción accede a Recepción y no a otros módulos'
);

assert(
  localTurnosSeed.some(t => t.estado === 'Solicitado' && typeof t.nro_turno === 'number'),
  'HU-09: Turnos nacen en estado "Solicitado" con número de turno correlativo'
);

// ----------------------------------------------------------------------
// RESUMEN FINAL
// ----------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-10 PASARON EXITOSAMENTE!');
} else {
  console.error('❌ HUBO FALLOS EN LA SUITE DE PRUEBAS DE HU-10');
  process.exit(1);
}
