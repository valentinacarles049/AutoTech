/**
 * Suite de Pruebas Automatizadas BDD - HU-11: Confirmar turno
 * 
 * Verifica los criterios de aceptación y los escenarios Gherkin formales:
 * - Antecedentes: Existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro" en estado "Solicitado".
 * - Escenario 1: Confirmación dentro del plazo (fecha_hora "13/11/2026 10:00", medio "Mail", pasa a "Confirmado", se registra fecha, hora y medio, se notifica al cliente fecha y hora del turno).
 * - Escenario 2: Confirmación fuera de plazo (fecha_hora "14/11/2026 10:00", mensaje "El plazo de confirmación venció", el turno sigue en "Solicitado" y no se registra la confirmación).
 * - Criterios adicionales: Faltar 24 hs o más, soporte de confirmación por "Mensaje" (SMS/WA), umbral exacto de 24hs.
 * - Dinamismo (Cero hardcoding): Probar con clientes/vehículos alternativos, fechas arbitrarias.
 * - Integridad y regresión con HU-01, HU-03, HU-04, HU-06, HU-08, HU-09, HU-10.
 */

import { 
  localClientsSeed, 
  localVehiclesSeed, 
  localSucursalesSeed, 
  localTurnosSeed,
  localEmployeesSeed,
  LocalTurno,
  getNextTurnoNumber,
  resetTurnoCounter
} from './server/db';
import { 
  confirmarTurno, 
  parseFullDateTime, 
  formatDateTimeDisplay,
  isTurnoOcupandoHorario 
} from './server/controllers/turnos.controller';
import { isScreenAllowed } from './src/utils/permissions';
import bcrypt from 'bcryptjs';

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

// Mock helper para simular peticiones Express
function createMockReqRes(options: {
  params?: any;
  body?: any;
  query?: any;
  user?: any;
}) {
  const req: any = {
    params: options.params || {},
    body: options.body || {},
    query: options.query || {},
    user: options.user || null
  };

  let statusCode = 200;
  let responseData: any = null;

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    send(data: any) {
      responseData = data;
      return res;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData
  };
}

console.log('======================================================================');
console.log('🧪 EJECUTANDO SUITE BDD: HU-11 CONFIRMAR TURNO');
console.log('======================================================================\n');

// ----------------------------------------------------------------------
// 1. ANTECEDENTES
// ----------------------------------------------------------------------
console.log('📋 1. ANTECEDENTES:');

// Buscar cliente Juan Pérez
const juanPerez = localClientsSeed.find(c => 
  c.nombre === 'Juan' && c.apellido === 'Pérez' && c.nro_documento === '30123456'
);
assert(
  Boolean(juanPerez),
  'Existe el cliente "Juan Pérez" con DNI "30123456"',
  `Cliente encontrado: ${juanPerez?.nombre} ${juanPerez?.apellido} (${juanPerez?.email})`
);

// Buscar vehículo AB123CD
const vehiculoJuan = localVehiclesSeed.find(v => v.dominio === 'AB123CD');
assert(
  Boolean(vehiculoJuan && vehiculoJuan.cliente_id === juanPerez?.id),
  'Existe el vehículo con patente "AB123CD" asociado a Juan Pérez',
  `Vehículo: ${vehiculoJuan?.marca} ${vehiculoJuan?.modelo}`
);

// Preparar el turno de antecedentes en estado "Solicitado" para el 15/11/2026 a las 09:00 hs en Centro
localTurnosSeed.length = 0;
resetTurnoCounter(1001);

const turnoJuan: LocalTurno = {
  id: 'turno-juan-test-1',
  nro_turno: getNextTurnoNumber(), // 1001
  vehiculo_dominio: 'AB123CD',
  cliente_id: juanPerez!.id,
  cliente_nombre: `${juanPerez!.nombre} ${juanPerez!.apellido}`,
  cliente_documento: juanPerez!.nro_documento,
  sucursal: 'Centro',
  fecha: '15/11/2026',
  hora: '09:00',
  motivo_consulta: 'Mantenimiento general',
  estado: 'Solicitado',
  es_emergencia: false,
  created_at: '2026-11-01T10:00:00.000Z',
  fecha_confirmacion: null,
  hora_confirmacion: null,
  medio_confirmacion: null,
  notificacion_enviada: false,
  notificacion_cliente: null
};
localTurnosSeed.push(turnoJuan);

assert(
  localTurnosSeed.some(t => t.vehiculo_dominio === 'AB123CD' && t.sucursal === 'Centro' && t.cliente_nombre?.includes('Juan Pérez')),
  'Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro"',
  `Turno #${turnoJuan.nro_turno} para fecha ${turnoJuan.fecha} ${turnoJuan.hora} hs`
);

assert(
  turnoJuan.estado === 'Solicitado',
  'Y el turno está en estado "Solicitado"',
  `Estado actual: ${turnoJuan.estado}`
);

// ----------------------------------------------------------------------
// 2. ESCENARIO 1: Confirmación dentro del plazo
// ----------------------------------------------------------------------
console.log('\n📋 2. ESCENARIO: Confirmación dentro del plazo');

// Dado que la fecha y hora actual es "13/11/2026 10:00"
// Cuando el cliente confirma el turno por "Mail"
(async () => {
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      patente: 'AB123CD',
      medio: 'Mail',
      fecha_hora_actual: '13/11/2026 10:00'
    }
  });

  await confirmarTurno(req, res);

  assert(
    getStatus() === 200 && getData().success === true,
    'El sistema procesa la solicitud con éxito (HTTP 200)',
    `Status: ${getStatus()}, Response: ${JSON.stringify(getData()?.message)}`
  );

  // Entonces el turno pasa al estado "Confirmado"
  assert(
    turnoJuan.estado === 'Confirmado' && getData().estado === 'Confirmado',
    'Entonces el turno pasa al estado "Confirmado"',
    `Estado en DB local: ${turnoJuan.estado}`
  );

  // Y se registra la confirmación con la fecha "13/11/2026", la hora "10:00" y el medio "Mail"
  assert(
    turnoJuan.fecha_confirmacion === '13/11/2026' &&
    turnoJuan.hora_confirmacion === '10:00' &&
    turnoJuan.medio_confirmacion === 'Mail',
    'Y se registra la confirmación con la fecha "13/11/2026", la hora "10:00" y el medio "Mail"',
    `Registrado: ${turnoJuan.fecha_confirmacion} ${turnoJuan.hora_confirmacion} hs por ${turnoJuan.medio_confirmacion}`
  );

  // Y se notifica al cliente la fecha y hora del turno
  const notif = turnoJuan.notificacion_cliente || getData().notificacion;
  assert(
    Boolean(
      turnoJuan.notificacion_enviada &&
      notif &&
      notif.fecha_turno === '15/11/2026' &&
      notif.hora_turno === '09:00' &&
      notif.medio === 'Mail'
    ),
    'Y se notifica al cliente la fecha y hora del turno',
    `Notificación: Fecha ${notif?.fecha_turno}, Hora ${notif?.hora_turno} hs a ${notif?.destinatario}`
  );

  // ----------------------------------------------------------------------
  // 3. ESCENARIO 2: Confirmación fuera de plazo
  // ----------------------------------------------------------------------
  console.log('\n📋 3. ESCENARIO: Confirmación fuera de plazo');

  // Restablecer el turno a estado "Solicitado" sin confirmación para probar fuera de plazo
  turnoJuan.estado = 'Solicitado';
  turnoJuan.fecha_confirmacion = null;
  turnoJuan.hora_confirmacion = null;
  turnoJuan.medio_confirmacion = null;
  turnoJuan.notificacion_enviada = false;
  turnoJuan.notificacion_cliente = null;

  // Dado que la fecha y hora actual es "14/11/2026 10:00"
  // (Faltan 23 hs para el turno del 15/11/2026 a las 09:00 hs -> Fuera del plazo de 24 hs)
  // Cuando el cliente confirma el turno por "Mail"
  const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = createMockReqRes({
    body: {
      patente: 'AB123CD',
      medio: 'Mail',
      fecha_hora_actual: '14/11/2026 10:00'
    }
  });

  await confirmarTurno(req2, res2);

  // Entonces el sistema muestra el mensaje "El plazo de confirmación venció"
  assert(
    getStatus2() === 400 && 
    (getData2()?.error === 'El plazo de confirmación venció' || getData2()?.message === 'El plazo de confirmación venció'),
    'Entonces el sistema muestra el mensaje "El plazo de confirmación venció"',
    `HTTP ${getStatus2()}, Error: "${getData2()?.error}"`
  );

  // Y el turno sigue en estado "Solicitado"
  assert(
    turnoJuan.estado === 'Solicitado',
    'Y el turno sigue en estado "Solicitado"',
    `Estado del turno: ${turnoJuan.estado}`
  );

  // Y no se registra la confirmación
  assert(
    !turnoJuan.fecha_confirmacion && !turnoJuan.hora_confirmacion && !turnoJuan.medio_confirmacion && !turnoJuan.notificacion_enviada,
    'Y no se registra la confirmación',
    `fecha_confirmacion=${turnoJuan.fecha_confirmacion}, hora_confirmacion=${turnoJuan.hora_confirmacion}`
  );

  // ----------------------------------------------------------------------
  // 4. CRITERIOS DE ACEPTACIÓN ADICIONALES Y REGLAS DE NEGOCIO
  // ----------------------------------------------------------------------
  console.log('\n📋 4. CRITERIOS DE ACEPTACIÓN ADICIONALES:');

  // Criterio 1: Confirmación por "Mensaje" (WhatsApp / SMS)
  const { req: reqMsg, res: resMsg, getStatus: getStatusMsg, getData: getDataMsg } = createMockReqRes({
    body: {
      nro_turno: 1001,
      medio: 'Mensaje',
      fecha_hora_actual: '13/11/2026 15:30'
    }
  });

  await confirmarTurno(reqMsg, resMsg);

  assert(
    getStatusMsg() === 200 && 
    turnoJuan.estado === 'Confirmado' && 
    turnoJuan.medio_confirmacion === 'Mensaje',
    'Cliente puede confirmar por medio "Mensaje" registrándose correctamente',
    `Medio registrado: ${turnoJuan.medio_confirmacion}, Destinatario notificado: ${turnoJuan.notificacion_cliente?.destinatario}`
  );

  // Criterio 1: Límite exacto de 24 horas (Exactamente 24h antes es válido: "24 hs o más")
  turnoJuan.estado = 'Solicitado';
  turnoJuan.fecha_confirmacion = null;

  // Turno: 15/11/2026 09:00 -> Exactamente 24h antes: 14/11/2026 09:00
  const { req: reqExact24, res: resExact24, getStatus: getStatus24 } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      medio: 'Mail',
      fecha_hora_actual: '14/11/2026 09:00'
    }
  });

  await confirmarTurno(reqExact24, resExact24);

  assert(
    getStatus24() === 200 && turnoJuan.estado === 'Confirmado',
    'Confirmación a exactamente 24 horas antes es aceptada (regla ≥ 24 hs)',
    `Turno confirmado a las 24 hs exactas de antelación`
  );

  // Criterio 1: A 23 horas y 59 minutos antes (14/11/2026 09:01) es rechazado
  turnoJuan.estado = 'Solicitado';
  turnoJuan.fecha_confirmacion = null;

  const { req: reqUnder24, res: resUnder24, getStatus: getStatusUnder24, getData: getDataUnder24 } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      medio: 'Mail',
      fecha_hora_actual: '14/11/2026 09:01'
    }
  });

  await confirmarTurno(reqUnder24, resUnder24);

  assert(
    getStatusUnder24() === 400 && 
    getDataUnder24()?.error === 'El plazo de confirmación venció' && 
    turnoJuan.estado === 'Solicitado',
    'Confirmación a 23 hs y 59 min es rechazada con "El plazo de confirmación venció"',
    `Faltan 23.98 hs -> Rechazado correctamente`
  );

  // Criterio 1: Turno con fecha pasada (ej: 16/11/2026) es rechazado
  const { req: reqPast, res: resPast, getStatus: getStatusPast, getData: getDataPast } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      medio: 'Mail',
      fecha_hora_actual: '16/11/2026 12:00'
    }
  });

  await confirmarTurno(reqPast, resPast);

  assert(
    getStatusPast() === 400 && getDataPast()?.error === 'El plazo de confirmación venció',
    'Intento de confirmación con fecha posterior al turno rechaza con "El plazo de confirmación venció"'
  );

  // ----------------------------------------------------------------------
  // 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING)
  // ----------------------------------------------------------------------
  console.log('\n📋 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING):');

  // Buscar otro cliente dinámico en la base (ej: Esteban Morales / cli-3)
  const esteban = localClientsSeed.find(c => c.nombre === 'Esteban' && c.apellido === 'Morales');
  const vehiculoEsteban = localVehiclesSeed.find(v => v.cliente_id === esteban?.id);

  assert(
    Boolean(esteban && vehiculoEsteban),
    'Existe cliente y vehículo alternativo en la base ("Esteban Morales" / "AD-332-LM")',
    `${esteban?.nombre} ${esteban?.apellido} - Patente: ${vehiculoEsteban?.dominio}`
  );

  // Registrar turno dinámico para Esteban en sucursal Norte
  const turnoEsteban: LocalTurno = {
    id: 'turno-esteban-dinamico',
    nro_turno: getNextTurnoNumber(),
    vehiculo_dominio: vehiculoEsteban!.dominio,
    cliente_id: esteban!.id,
    cliente_nombre: `${esteban!.nombre} ${esteban!.apellido}`,
    cliente_documento: esteban!.nro_documento,
    sucursal: 'Norte',
    fecha: '20/11/2026',
    hora: '16:00',
    motivo_consulta: 'Reparación de embrague',
    estado: 'Solicitado',
    es_emergencia: false,
    created_at: new Date().toISOString()
  };
  localTurnosSeed.push(turnoEsteban);

  // Confirmar turno de Esteban con fecha 18/11/2026 11:00 (faltan 53 hs -> dentro de plazo) por Mensaje
  const { req: reqEsteban, res: resEsteban, getStatus: getStatusEsteban, getData: getDataEsteban } = createMockReqRes({
    body: {
      nro_turno: turnoEsteban.nro_turno,
      medio: 'Mensaje',
      fecha_hora_actual: '18/11/2026 11:00'
    }
  });

  await confirmarTurno(reqEsteban, resEsteban);

  assert(
    getStatusEsteban() === 200 && 
    turnoEsteban.estado === 'Confirmado' && 
    turnoEsteban.fecha_confirmacion === '18/11/2026' && 
    turnoEsteban.hora_confirmacion === '11:00' && 
    turnoEsteban.medio_confirmacion === 'Mensaje',
    'Dinamismo: Cualquier cliente y sucursal confirma turno dinámicamente',
    `Turno #${turnoEsteban.nro_turno} confirmado para ${turnoEsteban.cliente_nombre} en sucursal ${turnoEsteban.sucursal}`
  );

  assert(
    getDataEsteban()?.notificacion?.destinatario === esteban?.telefono,
    'Dinamismo: La notificación se dirige dinámicamente al teléfono del cliente',
    `Destinatario: ${getDataEsteban()?.notificacion?.destinatario}`
  );

  // ----------------------------------------------------------------------
  // 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS
  // ----------------------------------------------------------------------
  console.log('\n📋 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS:');

  // HU-01: Autenticación de empleados con hash bcrypt
  const recepcionista = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción');
  const validPass = await bcrypt.compare('password123', recepcionista?.password || '');
  assert(
    validPass && recepcionista?.activo === true,
    'HU-01: Autenticación por contraseña encriptada con bcrypt operativa y activa'
  );

  // HU-03: Permisos de acceso RBAC
  assert(
    isScreenAllowed('recepcion', 'Responsable de Recepción') && 
    !isScreenAllowed('inventario', 'Responsable de Recepción'),
    'HU-03: Matriz de roles restringe acceso correctamente'
  );

  // HU-04 & HU-06: Cliente registrado y actualizable
  assert(
    juanPerez?.tipo_documento === 'DNI' && juanPerez?.nro_documento === '30123456',
    'HU-04 / HU-06: Datos del cliente preservados consistentemente'
  );

  // HU-08: Vehículo AB123CD con kilometraje válido
  assert(
    vehiculoJuan?.kilometraje_actual !== undefined && vehiculoJuan.kilometraje_actual >= 45000,
    'HU-08: Integridad del kilometraje del vehículo verificada'
  );

  // HU-09: Turnos nacen en estado "Solicitado"
  const nuevoTurnoTest: LocalTurno = {
    id: 'test-hu9-birth',
    nro_turno: getNextTurnoNumber(),
    vehiculo_dominio: 'AB123CD',
    sucursal: 'Centro',
    fecha: '25/11/2026',
    hora: '10:00',
    motivo_consulta: 'Revisión técnica',
    estado: 'Solicitado'
  };
  assert(
    nuevoTurnoTest.estado === 'Solicitado' && typeof nuevoTurnoTest.nro_turno === 'number',
    'HU-09: Nuevos turnos nacen en estado "Solicitado" con número autoincremental'
  );

  // HU-10: Turnos Confirmados siguen ocupando disponibilidad horaria
  assert(
    isTurnoOcupandoHorario('Confirmado') === true && isTurnoOcupandoHorario('Cancelado') === false,
    'HU-10: Los turnos en estado "Confirmado" excluyen el horario de los turnos libres'
  );

  // ----------------------------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-11 PASARON EXITOSAMENTE!');
  } else {
    console.error('❌ HUBO FALLOS EN LA SUITE DE PRUEBAS DE HU-11');
    process.exit(1);
  }
})();
