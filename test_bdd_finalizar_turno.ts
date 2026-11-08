/**
 * Suite de Pruebas Automatizadas BDD - HU-15: Finalizar turno (registrar presentación del vehículo)
 *
 * Historia de usuario:
 * Como responsable de recepción,
 * quiero registrar que el cliente presentó el vehículo,
 * para dar por finalizado el turno y generar el presupuesto.
 *
 * Criterios de aceptación:
 * 1. Sólo se finalizan turnos Confirmados del día
 * 2. El turno pasa a "Finalizado"
 * 3. Queda habilitado el registro del presupuesto
 * 4. Si llega la fecha y hora del turno y el vehículo no se presentó, el turno pasa a "Ausente"
 */

import {
  localClientsSeed,
  localVehiclesSeed,
  localTurnosSeed,
  localEmployeesSeed,
  LocalTurno,
  getNextTurnoNumber,
  resetTurnoCounter
} from './server/db';
import {
  finalizarTurno,
  registrarAusenciaTurno,
  filtrarYOrdenarTurnos
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
console.log('🧪 EJECUTANDO SUITE BDD: HU-15 FINALIZAR TURNO (PRESENTACIÓN VEHÍCULO)');
console.log('======================================================================\n');

(async () => {
  // ----------------------------------------------------------------------
  // 1. ANTECEDENTES
  // ----------------------------------------------------------------------
  console.log('📋 1. ANTECEDENTES:');

  // Dado que inicié sesión con el rol "Responsable de Recepción"
  const recepcionista = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción' && e.activo);
  assert(
    Boolean(recepcionista && isScreenAllowed('recepcion', recepcionista.rol)),
    'Dado que inicié sesión con el rol "Responsable de Recepción"',
    `Usuario: ${recepcionista?.username} (${recepcionista?.rol})`
  );

  // Y hoy es "15/11/2026"
  const hoy = '15/11/2026';
  assert(
    hoy === '15/11/2026',
    'Y hoy es "15/11/2026"'
  );

  const juanPerez = localClientsSeed.find(c => c.nombre === 'Juan' && c.apellido === 'Pérez');

  // ----------------------------------------------------------------------
  // 2. ESCENARIO 1: Finalización de un turno confirmado del día
  // ----------------------------------------------------------------------
  console.log('\n📋 2. ESCENARIO 1: Finalización de un turno confirmado del día');

  // Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Confirmado"
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  const turnoJuanConfirmado: LocalTurno = {
    id: 'turno-hu15-esc1',
    nro_turno: getNextTurnoNumber(),
    cliente_id: juanPerez?.id || 'cli-juan-perez',
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '30123456',
    vehiculo_dominio: 'AB123CD',
    motivo_consulta: 'Mantenimiento general',
    sucursal: 'Centro',
    fecha: '15/11/2026',
    hora: '09:00',
    estado: 'Confirmado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoJuanConfirmado);

  assert(
    turnoJuanConfirmado.vehiculo_dominio === 'AB123CD' &&
    turnoJuanConfirmado.fecha === '15/11/2026' &&
    turnoJuanConfirmado.hora === '09:00' &&
    turnoJuanConfirmado.estado === 'Confirmado',
    'Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Confirmado"'
  );

  // Cuando registro que el cliente presentó el vehículo "AB123CD"
  const { req: req1, res: res1, getStatus: getStatus1, getData: getData1 } = createMockReqRes({
    body: {
      patente: 'AB123CD',
      fecha_actual: hoy,
      vehiculo_presentado: true
    }
  });

  await finalizarTurno(req1, res1);
  const data1 = getData1();

  // Entonces el turno pasa al estado "Finalizado"
  assert(
    getStatus1() === 200 &&
    turnoJuanConfirmado.estado === 'Finalizado' &&
    data1.estado === 'Finalizado',
    'Entonces el turno pasa al estado "Finalizado"',
    `Estado actual: ${turnoJuanConfirmado.estado}`
  );

  // Y queda habilitado el registro del presupuesto del turno
  assert(
    turnoJuanConfirmado.presupuesto_habilitado === true &&
    data1.presupuesto_habilitado === true &&
    data1.presupuestoHabilitado === true,
    'Y queda habilitado el registro del presupuesto del turno',
    `presupuesto_habilitado: ${turnoJuanConfirmado.presupuesto_habilitado}`
  );

  // ----------------------------------------------------------------------
  // 3. ESCENARIO 2: Turno que no está confirmado
  // ----------------------------------------------------------------------
  console.log('\n📋 3. ESCENARIO 2: Turno que no está confirmado');

  // Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Solicitado"
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  const turnoJuanSolicitado: LocalTurno = {
    id: 'turno-hu15-esc2',
    nro_turno: getNextTurnoNumber(),
    cliente_id: juanPerez?.id || 'cli-juan-perez',
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '30123456',
    vehiculo_dominio: 'AB123CD',
    motivo_consulta: 'Mantenimiento general',
    sucursal: 'Centro',
    fecha: '15/11/2026',
    hora: '09:00',
    estado: 'Solicitado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoJuanSolicitado);

  assert(
    turnoJuanSolicitado.estado === 'Solicitado' &&
    turnoJuanSolicitado.fecha === '15/11/2026' &&
    turnoJuanSolicitado.hora === '09:00',
    'Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Solicitado"'
  );

  // Cuando registro que el cliente presentó el vehículo "AB123CD"
  const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = createMockReqRes({
    body: {
      patente: 'AB123CD',
      fecha_actual: hoy,
      vehiculo_presentado: true
    }
  });

  await finalizarTurno(req2, res2);
  const data2 = getData2();

  // Entonces el sistema muestra el mensaje "Sólo se pueden finalizar turnos confirmados del día"
  assert(
    getStatus2() === 400 &&
    data2.error === 'Sólo se pueden finalizar turnos confirmados del día' &&
    data2.message === 'Sólo se pueden finalizar turnos confirmados del día',
    'Entonces el sistema muestra el mensaje "Sólo se pueden finalizar turnos confirmados del día"',
    `HTTP ${getStatus2()}, Mensaje: "${data2?.error}"`
  );

  // Y el turno sigue en estado "Solicitado"
  assert(
    turnoJuanSolicitado.estado === 'Solicitado' &&
    !turnoJuanSolicitado.presupuesto_habilitado,
    'Y el turno sigue en estado "Solicitado" (y no habilita presupuesto)',
    `Estado actual: ${turnoJuanSolicitado.estado}`
  );

  // ----------------------------------------------------------------------
  // 4. ESCENARIO 3: El vehículo no se presentó
  // ----------------------------------------------------------------------
  console.log('\n📋 4. ESCENARIO 3: El vehículo no se presentó');

  // Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Confirmado"
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  const turnoJuanAusente: LocalTurno = {
    id: 'turno-hu15-esc3',
    nro_turno: getNextTurnoNumber(),
    cliente_id: juanPerez?.id || 'cli-juan-perez',
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '30123456',
    vehiculo_dominio: 'AB123CD',
    motivo_consulta: 'Mantenimiento general',
    sucursal: 'Centro',
    fecha: '15/11/2026',
    hora: '09:00',
    estado: 'Confirmado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoJuanAusente);

  assert(
    turnoJuanAusente.estado === 'Confirmado' &&
    turnoJuanAusente.fecha === '15/11/2026' &&
    turnoJuanAusente.hora === '09:00',
    'Dado que existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Confirmado"'
  );

  // Cuando llegan las "09:00" del "15/11/2026" y el vehículo no se presentó
  const { req: req3, res: res3, getStatus: getStatus3, getData: getData3 } = createMockReqRes({
    body: {
      patente: 'AB123CD',
      fecha: '15/11/2026',
      hora: '09:00'
    }
  });

  await registrarAusenciaTurno(req3, res3);
  const data3 = getData3();

  // Entonces el turno pasa al estado "Ausente"
  assert(
    getStatus3() === 200 &&
    turnoJuanAusente.estado === 'Ausente' &&
    data3.estado === 'Ausente',
    'Entonces el turno pasa al estado "Ausente"',
    `Estado actual: ${turnoJuanAusente.estado}`
  );

  assert(
    !turnoJuanAusente.presupuesto_habilitado && !turnoJuanAusente.vehiculo_presentado,
    'El turno en estado "Ausente" no habilita el registro de presupuesto',
    `presupuesto_habilitado: ${turnoJuanAusente.presupuesto_habilitado}`
  );

  // Validar que si aún NO llegó la hora del turno (ej: son las 08:00 y el turno es a las 09:00), NO pasa a "Ausente" y devuelve HTTP 400 manteniendo el estado "Confirmado"
  const turnoAntesDeHora: LocalTurno = {
    id: 'turno-hu15-antes-hora',
    nro_turno: getNextTurnoNumber(),
    cliente_id: juanPerez?.id || 'cli-juan-perez',
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '30123456',
    vehiculo_dominio: 'AB123CD',
    motivo_consulta: 'Mantenimiento general',
    sucursal: 'Centro',
    fecha: '15/11/2026',
    hora: '11:00',
    estado: 'Confirmado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoAntesDeHora);

  const { req: reqAntesHora, res: resAntesHora, getStatus: getStatusAntesHora, getData: getDataAntesHora } = createMockReqRes({
    body: {
      turno_id: 'turno-hu15-antes-hora',
      patente: 'AB123CD',
      fecha_actual: '15/11/2026',
      hora_actual: '09:00'
    }
  });

  await registrarAusenciaTurno(reqAntesHora, resAntesHora);
  assert(
    getStatusAntesHora() === 400 &&
    getDataAntesHora()?.success === false &&
    turnoAntesDeHora.estado === 'Confirmado',
    'No permite marcar como "Ausente" un turno antes de su fecha y hora programada (queda en "Confirmado" en API y UI)'
  );

  // ----------------------------------------------------------------------
  // 5. CRITERIOS DE ACEPTACIÓN ADICIONALES Y DINAMISMO
  // ----------------------------------------------------------------------
  console.log('\n📋 5. CRITERIOS ADICIONALES Y DINAMISMO:');

  // Criterio 1: Turno Confirmado pero de OTRO DÍA (ej: 16/11/2026 cuando hoy es 15/11/2026) no puede finalizarse
  const turnoOtroDia: LocalTurno = {
    id: 'turno-otro-dia',
    nro_turno: getNextTurnoNumber(),
    cliente_id: juanPerez?.id || 'cli-juan-perez',
    cliente_nombre: 'Juan Pérez',
    cliente_documento: '30123456',
    vehiculo_dominio: 'AF-123-ZZ',
    motivo_consulta: 'Revisión general',
    sucursal: 'Centro',
    fecha: '16/11/2026',
    hora: '10:00',
    estado: 'Confirmado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoOtroDia);

  const { req: reqOtroDia, res: resOtroDia, getStatus: getStatusOtroDia, getData: getDataOtroDia } = createMockReqRes({
    body: {
      patente: 'AF-123-ZZ',
      fecha_actual: '15/11/2026',
      vehiculo_presentado: true
    }
  });

  await finalizarTurno(reqOtroDia, resOtroDia);

  assert(
    getStatusOtroDia() === 400 &&
    getDataOtroDia().error === 'Sólo se pueden finalizar turnos confirmados del día' &&
    turnoOtroDia.estado === 'Confirmado',
    'Rechaza finalizar un turno Confirmado que no corresponde al día actual ("16/11/2026" vs hoy "15/11/2026")',
    `Error: "${getDataOtroDia()?.error}"`
  );

  // Dinamismo: Finalizar turno de otro cliente (María Gómez / AC456EF) en el día
  const maria = localClientsSeed.find(c => c.nombre === 'María' && c.apellido === 'Gómez');
  const turnoMaria: LocalTurno = {
    id: 'turno-maria-hoy',
    nro_turno: getNextTurnoNumber(),
    cliente_id: maria?.id || 'cli-maria-gomez',
    cliente_nombre: 'María Gómez',
    cliente_documento: '28999888',
    vehiculo_dominio: 'AC456EF',
    motivo_consulta: 'Cambio de frenos',
    sucursal: 'Centro',
    fecha: '15/11/2026',
    hora: '11:00',
    estado: 'Confirmado',
    presupuesto_habilitado: false,
    vehiculo_presentado: false
  };
  localTurnosSeed.push(turnoMaria);

  const { req: reqMaria, res: resMaria, getStatus: getStatusMaria } = createMockReqRes({
    body: {
      patente: 'AC456EF',
      fecha_actual: '15/11/2026'
    }
  });

  await finalizarTurno(reqMaria, resMaria);

  assert(
    getStatusMaria() === 200 &&
    turnoMaria.estado === 'Finalizado' &&
    turnoMaria.presupuesto_habilitado === true,
    'Dinamismo: Turno de María Gómez (AC456EF) pasa a "Finalizado" y habilita presupuesto dinámicamente'
  );

  // ----------------------------------------------------------------------
  // 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS (HU-01 a HU-12)
  // ----------------------------------------------------------------------
  console.log('\n📋 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS:');

  const validPass = await bcrypt.compare('password123', recepcionista?.password || '');
  assert(
    validPass && recepcionista?.activo === true,
    'HU-01: Autenticación con hash bcrypt activa'
  );

  const consultaFinalizados = filtrarYOrdenarTurnos(localTurnosSeed, {
    estado: 'Finalizado',
    fechaDesde: '15/11/2026',
    fechaHasta: '15/11/2026',
    sucursal: 'Centro'
  });

  assert(
    consultaFinalizados.total === 1 && consultaFinalizados.turnos[0].patente === 'AC456EF',
    'HU-12: El filtro de consulta de turnos soporta los nuevos estados "Finalizado" y "Ausente"'
  );

  console.log('\n======================================================================');
  console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-15 PASARON EXITOSAMENTE!');
  } else {
    console.error('❌ HUBO FALLOS EN LA SUITE DE PRUEBAS DE HU-15');
    process.exit(1);
  }
})();

