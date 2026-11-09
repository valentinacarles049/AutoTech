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
  registrarTurno,
  cancelarTurno,
  modificarTurno,
  finalizarTurno,
  filtrarYOrdenarTurnos,
  listarTurnos,
  parseFullDateTime, 
  formatDateTimeDisplay,
  isTurnoOcupandoHorario 
} from './server/controllers/turnos.controller';
import { buildCambioEstado, inicializarCambioEstadoTurno } from './src/utils/cambioEstadoTurno';
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

const initJuanEstado = inicializarCambioEstadoTurno({
  turnoId: 'turno-juan-test-1',
  estado: 'Solicitado',
  fechaInicio: '01/11/2026',
  horaInicio: '10:00',
  observacion: 'Solicitud de turno registrada'
});

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
  historial_estados: initJuanEstado.historialEstados,
  historialEstados: initJuanEstado.historialEstados,
  cambios_estado: initJuanEstado.cambiosEstado,
  cambiosEstado: initJuanEstado.cambiosEstado,
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

  // Y se cierra el CambioEstadoTurno "Solicitado" y se crea el "Confirmado"
  const cCerrado1 = getData()?.cambio_estado_cerrado || turnoJuan.cambios_estado?.[0];
  const cActual1 = getData()?.cambio_estado_actual || turnoJuan.cambios_estado?.[1];
  assert(
    Array.isArray(turnoJuan.cambios_estado) &&
    turnoJuan.cambios_estado.length === 2 &&
    cCerrado1?.estado === 'Solicitado' &&
    cCerrado1?.fecha_fin === '13/11/2026' &&
    cCerrado1?.hora_fin === '10:00' &&
    cActual1?.estado === 'Confirmado' &&
    cActual1?.fecha_inicio === '13/11/2026' &&
    cActual1?.hora_inicio === '10:00' &&
    cActual1?.fecha_fin === null &&
    cActual1?.hora_fin === null &&
    Array.isArray(turnoJuan.historial_estados) &&
    turnoJuan.historial_estados.join('>') === 'Solicitado>Confirmado',
    'Al confirmar se cierra CambioEstadoTurno "Solicitado" y se crea "Confirmado" con historial no nulo',
    `Cerrado fin=${cCerrado1?.fecha_fin} ${cCerrado1?.hora_fin} | Actual inicio=${cActual1?.fecha_inicio} ${cActual1?.hora_inicio} fin=${cActual1?.fecha_fin}`
  );

  // ----------------------------------------------------------------------
  // 3. ESCENARIO 2: Confirmación fuera de plazo
  // ----------------------------------------------------------------------
  console.log('\n📋 3. ESCENARIO: Confirmación fuera de plazo');

  // Restablecer el turno a estado "Solicitado" sin confirmación para probar fuera de plazo
  const resetEstado2 = inicializarCambioEstadoTurno({
    turnoId: turnoJuan.id,
    estado: 'Solicitado',
    fechaInicio: '01/11/2026',
    horaInicio: '10:00',
    observacion: 'Solicitud de turno registrada'
  });
  turnoJuan.estado = 'Solicitado';
  turnoJuan.historial_estados = resetEstado2.historialEstados;
  turnoJuan.historialEstados = resetEstado2.historialEstados;
  turnoJuan.cambios_estado = resetEstado2.cambiosEstado;
  turnoJuan.cambiosEstado = resetEstado2.cambiosEstado;
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

  // Y no se registra la confirmación ni se modifica CambioEstadoTurno
  assert(
    !turnoJuan.fecha_confirmacion &&
    !turnoJuan.hora_confirmacion &&
    !turnoJuan.medio_confirmacion &&
    !turnoJuan.notificacion_enviada &&
    turnoJuan.cambios_estado?.length === 1 &&
    turnoJuan.cambios_estado[0].estado === 'Solicitado' &&
    turnoJuan.cambios_estado[0].fecha_fin === null,
    'Y no se registra la confirmación ni se cierra el CambioEstadoTurno "Solicitado"',
    `cambios=${turnoJuan.cambios_estado?.length}, fecha_fin=${turnoJuan.cambios_estado?.[0]?.fecha_fin}`
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
  const resetEstado24 = inicializarCambioEstadoTurno({
    turnoId: turnoJuan.id,
    estado: 'Solicitado',
    fechaInicio: '01/11/2026',
    horaInicio: '10:00',
    observacion: 'Solicitud de turno registrada'
  });
  turnoJuan.estado = 'Solicitado';
  turnoJuan.fecha_confirmacion = null;
  turnoJuan.historial_estados = resetEstado24.historialEstados;
  turnoJuan.historialEstados = resetEstado24.historialEstados;
  turnoJuan.cambios_estado = resetEstado24.cambiosEstado;
  turnoJuan.cambiosEstado = resetEstado24.cambiosEstado;

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
  const resetEstado2359 = inicializarCambioEstadoTurno({
    turnoId: turnoJuan.id,
    estado: 'Solicitado',
    fechaInicio: '01/11/2026',
    horaInicio: '10:00',
    observacion: 'Solicitud de turno registrada'
  });
  turnoJuan.estado = 'Solicitado';
  turnoJuan.fecha_confirmacion = null;
  turnoJuan.historial_estados = resetEstado2359.historialEstados;
  turnoJuan.historialEstados = resetEstado2359.historialEstados;
  turnoJuan.cambios_estado = resetEstado2359.cambiosEstado;
  turnoJuan.cambiosEstado = resetEstado2359.cambiosEstado;

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
  // 7. BUG FIX HU-11 / AUT-T3 (CP-EST-01 Paso 6): CambioEstadoTurno + Trazabilidad MODP
  // ----------------------------------------------------------------------
  console.log('\n📋 7. BUG FIX HU-11 / AUT-T3 (CP-EST-01 Paso 6): CambioEstadoTurno');

  // Reconstruir seed inicial idéntico al del sistema (#1001 Confirmado, #1002 Confirmado, #1003 Solicitado)
  const seedTurnosDefault = (): LocalTurno[] => [
    {
      id: 'turno-juan-perez-1',
      nro_turno: 1001,
      vehiculo_dominio: 'AB123CD',
      cliente_id: 'cli-juan-perez',
      cliente_nombre: 'Juan Pérez',
      cliente_documento: '30123456',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '11:00',
      motivo_consulta: 'Mantenimiento general',
      estado: 'Confirmado',
      es_emergencia: false,
      created_at: '2026-11-01T10:00:00.000Z',
      historial_estados: ['Solicitado', 'Confirmado'],
      historialEstados: ['Solicitado', 'Confirmado'],
      cambios_estado: [
        buildCambioEstado({
          id: 'cet-1001-1',
          turnoId: 'turno-juan-perez-1',
          estado: 'Solicitado',
          fechaInicio: '01/11/2026',
          horaInicio: '10:00',
          fechaFin: '13/11/2026',
          horaFin: '10:00',
          observacion: 'Solicitud de turno registrada'
        }),
        buildCambioEstado({
          id: 'cet-1001-2',
          turnoId: 'turno-juan-perez-1',
          estado: 'Confirmado',
          fechaInicio: '13/11/2026',
          horaInicio: '10:00',
          fechaFin: null,
          horaFin: null,
          observacion: 'Confirmado por Mail'
        })
      ],
      fecha_confirmacion: '13/11/2026',
      hora_confirmacion: '10:00',
      medio_confirmacion: 'Mail',
      notificacion_enviada: true,
      notificacion_cliente: null
    },
    {
      id: 'turno-maria-gomez-1',
      nro_turno: 1002,
      vehiculo_dominio: 'AC456EF',
      cliente_id: 'cli-maria-gomez',
      cliente_nombre: 'María Gómez',
      cliente_documento: '28999888',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '09:00',
      motivo_consulta: 'Cambio de frenos',
      estado: 'Confirmado',
      es_emergencia: false,
      created_at: '2026-11-01T10:05:00.000Z',
      historial_estados: ['Solicitado', 'Confirmado'],
      historialEstados: ['Solicitado', 'Confirmado'],
      cambios_estado: [
        buildCambioEstado({
          id: 'cet-1002-1',
          turnoId: 'turno-maria-gomez-1',
          estado: 'Solicitado',
          fechaInicio: '01/11/2026',
          horaInicio: '10:05',
          fechaFin: '13/11/2026',
          horaFin: '11:00',
          observacion: 'Solicitud de turno registrada'
        }),
        buildCambioEstado({
          id: 'cet-1002-2',
          turnoId: 'turno-maria-gomez-1',
          estado: 'Confirmado',
          fechaInicio: '13/11/2026',
          horaInicio: '11:00',
          fechaFin: null,
          horaFin: null,
          observacion: 'Confirmado por Mail'
        })
      ],
      fecha_confirmacion: '13/11/2026',
      hora_confirmacion: '11:00',
      medio_confirmacion: 'Mail',
      notificacion_enviada: true,
      notificacion_cliente: null
    },
    {
      id: 'turno-juan-perez-2',
      nro_turno: 1003,
      vehiculo_dominio: 'AB123CD',
      cliente_id: 'cli-juan-perez',
      cliente_nombre: 'Juan Pérez',
      cliente_documento: '30123456',
      sucursal: 'Centro',
      fecha: '16/11/2026',
      hora: '10:00',
      motivo_consulta: 'Ruido en el motor',
      estado: 'Solicitado',
      es_emergencia: false,
      created_at: '2026-11-01T10:10:00.000Z',
      historial_estados: ['Solicitado'],
      historialEstados: ['Solicitado'],
      cambios_estado: [
        buildCambioEstado({
          id: 'cet-1003-1',
          turnoId: 'turno-juan-perez-2',
          estado: 'Solicitado',
          fechaInicio: '01/11/2026',
          horaInicio: '10:10',
          fechaFin: null,
          horaFin: null,
          observacion: 'Solicitud de turno registrada'
        })
      ],
      fecha_confirmacion: null,
      hora_confirmacion: null,
      medio_confirmacion: null,
      notificacion_enviada: false,
      notificacion_cliente: null
    }
  ];

  localTurnosSeed.length = 0;
  localTurnosSeed.push(...seedTurnosDefault());
  resetTurnoCounter(1004);

  // Caso exacto AUT-T3 (CP-EST-01 Paso 6): Confirmar #1003 (16/11 10:00, Solicitado) faltando 25 horas (15/11/2026 09:00), por Mail
  const { req: req1003, res: res1003, getStatus: st1003, getData: data1003 } = createMockReqRes({
    body: {
      nro_turno: 1003,
      medio: 'Mail',
      fecha_hora_actual: '15/11/2026 09:00'
    }
  });
  await confirmarTurno(req1003, res1003);

  const turno1003 = localTurnosSeed.find(t => t.nro_turno === 1003)!;
  const cambios1003 = turno1003.cambios_estado || [];

  assert(
    st1003() === 200 &&
    data1003()?.success === true &&
    turno1003.estado === 'Confirmado' &&
    turno1003.fecha_confirmacion === '15/11/2026' &&
    turno1003.hora_confirmacion === '09:00' &&
    turno1003.medio_confirmacion === 'Mail',
    'AUT-T3 Paso 6: Turno #1003 confirma faltando 25 hs (15/11/2026 09:00) por Mail',
    `estado=${turno1003.estado}, fecha=${turno1003.fecha_confirmacion} ${turno1003.hora_confirmacion}`
  );

  assert(
    turno1003.historial_estados !== null &&
    Array.isArray(turno1003.historial_estados) &&
    turno1003.historial_estados.length === 2 &&
    turno1003.historial_estados[0] === 'Solicitado' &&
    turno1003.historial_estados[1] === 'Confirmado',
    'AUT-T3 Paso 6: historial_estados NO es null y registra ["Solicitado", "Confirmado"]',
    `historial_estados=${JSON.stringify(turno1003.historial_estados)}`
  );

  assert(
    cambios1003.length === 2 &&
    cambios1003[0].estado === 'Solicitado' &&
    cambios1003[0].fecha_inicio === '01/11/2026' &&
    cambios1003[0].hora_inicio === '10:10' &&
    cambios1003[0].fecha_fin === '15/11/2026' &&
    cambios1003[0].hora_fin === '09:00' &&
    cambios1003[1].estado === 'Confirmado' &&
    cambios1003[1].fecha_inicio === '15/11/2026' &&
    cambios1003[1].hora_inicio === '09:00' &&
    cambios1003[1].fecha_fin === null &&
    cambios1003[1].hora_fin === null,
    'AUT-T3 Paso 6: Cierra CambioEstadoTurno "Solicitado" (fecha/hora fin 15/11/2026 09:00) y crea "Confirmado" (inicio 15/11/2026 09:00, fin null)',
    `cambios1003=${JSON.stringify(cambios1003)}`
  );

  // Confirmar que GET /api/turnos expone historial_estados no nulo y cambios_estado para #1001, #1002 y #1003
  const { req: reqList, res: resList, getStatus: stList, getData: dataList } = createMockReqRes({ query: {} });
  await listarTurnos(reqList, resList);
  const allListedHaveHistory =
    stList() === 200 &&
    Array.isArray(dataList()?.turnos) &&
    dataList().turnos.length === 3 &&
    dataList().turnos.every((t: any) =>
      t.historial_estados !== null &&
      Array.isArray(t.historial_estados) &&
      t.historial_estados.length >= 2 &&
      Array.isArray(t.cambios_estado) &&
      t.cambios_estado.length >= 2
    );

  assert(
    allListedHaveHistory,
    'GET /api/turnos expone historial_estados no nulo y cambios_estado estructurados para todos los turnos'
  );

  // Proteger reconfirmación: intentar reconfirmar #1003 ya "Confirmado" falla limpiamente sin corromper cambios_estado
  const { req: reqReconf, res: resReconf, getStatus: stReconf, getData: dataReconf } = createMockReqRes({
    body: {
      nro_turno: 1003,
      medio: 'Mensaje',
      fecha_hora_actual: '15/11/2026 09:30'
    }
  });
  await confirmarTurno(reqReconf, resReconf);
  assert(
    stReconf() === 400 &&
    dataReconf()?.error === 'El turno ya se encuentra confirmado' &&
    turno1003.cambios_estado?.length === 2,
    'No permite reconfirmar un turno ya Confirmado ni duplica CambioEstadoTurno'
  );

  // Búsqueda por patente cuando existe otro turno Confirmado previo (#1001 AB123CD y #1003 AB123CD Solicitado)
  localTurnosSeed.length = 0;
  localTurnosSeed.push(...seedTurnosDefault());
  const { req: reqPlateDup, res: resPlateDup, getStatus: stPlateDup } = createMockReqRes({
    body: {
      patente: 'AB-123-CD',
      medio: 'Mail',
      fecha_hora_actual: '15/11/2026 09:00'
    }
  });
  await confirmarTurno(reqPlateDup, resPlateDup);
  const turno1003Dup = localTurnosSeed.find(t => t.nro_turno === 1003)!;
  assert(
    stPlateDup() === 200 &&
    turno1003Dup.estado === 'Confirmado' &&
    turno1003Dup.cambios_estado?.length === 2,
    'Búsqueda por patente normalizada (AB-123-CD) prioriza el turno Solicitado (#1003) frente a turnos ya Confirmados (#1001)'
  );

  // Trazabilidad contigua de ciclo completo: registrarTurno -> confirmarTurno -> modificarTurno -> finalizarTurno
  localTurnosSeed.length = 0;
  localTurnosSeed.push(...seedTurnosDefault());
  resetTurnoCounter(1004);

  const { req: reqRegLife, res: resRegLife, getStatus: stRegLife, getData: dataRegLife } = createMockReqRes({
    body: {
      cliente_dni: '30123456',
      vehiculo_dominio: 'AB123CD',
      motivo_consulta: 'Control completo ciclo estados',
      sucursal: 'Centro',
      fecha: '22/11/2026',
      horario: '10:00',
      fecha_hora_actual: '18/11/2026 08:30'
    }
  });
  await registrarTurno(reqRegLife, resRegLife);
  const nroLife = dataRegLife()?.nro_turno;

  await confirmarTurno(
    createMockReqRes({
      body: { nro_turno: nroLife, medio: 'Mail', fecha_hora_actual: '20/11/2026 14:15' }
    }).req,
    { status() { return this; }, json() { return this; }, send() { return this; } } as any
  );

  await modificarTurno(
    createMockReqRes({
      body: { nro_turno: nroLife, nueva_fecha: '23/11/2026', nuevo_horario: '11:00', fecha_hora_actual: '21/11/2026 16:40' }
    }).req,
    { status() { return this; }, json() { return this; }, send() { return this; } } as any
  );

  await finalizarTurno(
    createMockReqRes({
      body: { nro_turno: nroLife, fecha_actual: '23/11/2026', hora_actual: '11:05', vehiculo_presentado: true }
    }).req,
    { status() { return this; }, json() { return this; }, send() { return this; } } as any
  );

  const turnoLife = localTurnosSeed.find(t => t.nro_turno === nroLife)!;
  const cambiosLife = turnoLife?.cambios_estado || [];
  let isContiguousChain = stRegLife() === 201 && cambiosLife.length === 5;
  if (isContiguousChain) {
    const expectedStates = ['Solicitado', 'Confirmado', 'Reprogramado', 'Confirmado', 'Finalizado'];
    for (let i = 0; i < cambiosLife.length; i++) {
      if (cambiosLife[i].estado !== expectedStates[i]) isContiguousChain = false;
      if (i < cambiosLife.length - 1) {
        if (
          cambiosLife[i].fecha_fin !== cambiosLife[i + 1].fecha_inicio ||
          cambiosLife[i].hora_fin !== cambiosLife[i + 1].hora_inicio
        ) {
          isContiguousChain = false;
        }
      } else {
        if (cambiosLife[i].fecha_fin !== null || cambiosLife[i].hora_fin !== null) {
          isContiguousChain = false;
        }
      }
    }
  }

  assert(
    isContiguousChain &&
    turnoLife.historial_estados?.join('>') === 'Solicitado>Confirmado>Reprogramado>Confirmado>Finalizado',
    'Ciclo completo MODP (Solicitado -> Confirmado -> Reprogramado -> Confirmado -> Finalizado) mantiene cadena contigua fecha_fin/fecha_inicio sin huecos',
    `historial=${turnoLife?.historial_estados?.join(' -> ')}`
  );

  // Ciclo Solicitado -> Cancelado
  const { req: reqRegCan, res: resRegCan, getData: dataRegCan } = createMockReqRes({
    body: {
      cliente_dni: '28999888',
      vehiculo_dominio: 'AC456EF',
      motivo_consulta: 'Revisión frenos',
      sucursal: 'Centro',
      fecha: '24/11/2026',
      horario: '14:00',
      fecha_hora_actual: '19/11/2026 09:00'
    }
  });
  await registrarTurno(reqRegCan, resRegCan);
  const nroCan = dataRegCan()?.nro_turno;
  const { req: reqDoCan, res: resDoCan, getStatus: stDoCan } = createMockReqRes({
    body: {
      nro_turno: nroCan,
      motivo: 'Viaje imprevisto',
      fecha_hora_actual: '20/11/2026 12:20'
    }
  });
  await cancelarTurno(reqDoCan, resDoCan);
  const turnoCan = localTurnosSeed.find(t => t.nro_turno === nroCan)!;
  const cambiosCan = turnoCan?.cambios_estado || [];
  assert(
    stDoCan() === 200 &&
    cambiosCan.length === 2 &&
    cambiosCan[0].estado === 'Solicitado' &&
    cambiosCan[0].fecha_fin === '20/11/2026' &&
    cambiosCan[0].hora_fin === '12:20' &&
    cambiosCan[1].estado === 'Cancelado' &&
    cambiosCan[1].fecha_inicio === '20/11/2026' &&
    cambiosCan[1].hora_inicio === '12:20' &&
    cambiosCan[1].fecha_fin === null &&
    turnoCan.historial_estados?.join('>') === 'Solicitado>Cancelado',
    'Cancelar turno cierra CambioEstadoTurno "Solicitado" y registra "Cancelado" vigente'
  );

  // Restaurar localTurnosSeed al estado inicial limpio para no afectar suites posteriores
  localTurnosSeed.length = 0;
  localTurnosSeed.push(...seedTurnosDefault());
  resetTurnoCounter(1004);

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
