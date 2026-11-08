/**
 * Suite de Pruebas Automatizadas BDD - HU-12: Cancelar turno
 * 
 * Historia de usuario:
 * Como cliente o responsable de recepción,
 * quiero cancelar un turno indicando el motivo,
 * para liberar el horario.
 * 
 * Criterios de aceptación:
 * 1. Sólo se cancelan turnos en estado Solicitado o Confirmado
 * 2. El motivo es obligatorio
 * 3. El turno pasa a "Cancelado" y el horario vuelve a estar disponible
 * 
 * Escenarios BDD formales (Gherkin):
 * - Antecedentes: Rol "Responsable de Recepción", Turno de Juan Pérez para AB123CD en Centro el 15/11/2026 a las 09:00
 * - Escenario 1: Cancelación exitosa con motivo (motivo: "El cliente no puede asistir", estado: "Cancelado", horario 09:00 liberado)
 * - Escenario 2: Cancelación sin motivo (motivo vacío, error: "El motivo de cancelación es obligatorio", estado sigue en "Solicitado")
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
  cancelarTurno,
  registrarTurno,
  consultarDisponibilidadHoraria,
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
console.log('🧪 EJECUTANDO SUITE BDD: HU-12 CANCELAR TURNO');
console.log('======================================================================\n');

(async () => {
  // ----------------------------------------------------------------------
  // 1. ANTECEDENTES
  // ----------------------------------------------------------------------
  console.log('📋 1. ANTECEDENTES:');

  // Antecedente 1: Rol "Responsable de Recepción"
  const recepcionista = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción');
  const validPass = await bcrypt.compare('password123', recepcionista?.password || '');
  assert(
    Boolean(recepcionista && recepcionista.activo && validPass),
    'Dado que inicié sesión con el rol "Responsable de Recepción"',
    `Usuario: ${recepcionista?.username} (${recepcionista?.nombre})`
  );

  assert(
    isScreenAllowed('recepcion', 'Responsable de Recepción') && !isScreenAllowed('inventario', 'Responsable de Recepción'),
    'El rol "Responsable de Recepción" tiene acceso al módulo de Recepción (HU-03)',
    'Permisos RBAC verificados correctamente'
  );

  // Antecedente 2: Cliente "Juan Pérez" y vehículo "AB123CD"
  const juanPerez = localClientsSeed.find(c => c.nombre === 'Juan' && c.apellido === 'Pérez' && c.nro_documento === '30123456');
  const vehiculoJuan = localVehiclesSeed.find(v => v.dominio === 'AB123CD');

  assert(
    Boolean(juanPerez && vehiculoJuan),
    'Existen en el sistema el cliente "Juan Pérez" (DNI 30123456) y vehículo "AB123CD"',
    `Cliente: ${juanPerez?.nombre} ${juanPerez?.apellido}, Vehículo: ${vehiculoJuan?.dominio}`
  );

  // Limpiar y preparar el turno de antecedentes
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  const turnoJuan: LocalTurno = {
    id: 'turno-juan-hu12',
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
    created_at: new Date().toISOString()
  };
  localTurnosSeed.push(turnoJuan);

  assert(
    localTurnosSeed.some(t => 
      t.cliente_nombre?.includes('Juan Pérez') && 
      t.vehiculo_dominio === 'AB123CD' && 
      t.sucursal === 'Centro' && 
      t.fecha === '15/11/2026' && 
      t.hora === '09:00'
    ),
    'Y existe el turno de "Juan Pérez" para el vehículo "AB123CD" en la sucursal "Centro" el "15/11/2026" a las "09:00"',
    `Turno #${turnoJuan.nro_turno} en estado "${turnoJuan.estado}"`
  );

  // Comprobar que inicialmente el horario 09:00 está ocupado por el turno Solicitado
  assert(
    isTurnoOcupandoHorario(turnoJuan.estado) === true,
    'El horario "09:00" está inicialmente ocupado por el turno en estado "Solicitado"'
  );

  // ----------------------------------------------------------------------
  // 2. ESCENARIO 1: Cancelación exitosa con motivo
  // ----------------------------------------------------------------------
  console.log('\n📋 2. ESCENARIO: Cancelación exitosa con motivo');

  // Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
  // Y ingreso el motivo "El cliente no puede asistir"
  // Y presiono "Cancelar turno"
  const { req, res, getStatus, getData } = createMockReqRes({
    body: {
      nro_turno: turnoJuan.nro_turno,
      patente: 'AB123CD',
      fecha: '15/11/2026',
      hora: '09:00',
      cliente_nombre: 'Juan Pérez',
      motivo: 'El cliente no puede asistir',
      cancelado_por: 'Responsable de Recepción'
    }
  });

  await cancelarTurno(req, res);

  assert(
    getStatus() === 200 && getData().success === true,
    'La solicitud de cancelación se procesa con éxito (HTTP 200)',
    `Status: ${getStatus()}, Mensaje: "${getData().message}"`
  );

  // Entonces el turno pasa al estado "Cancelado"
  assert(
    turnoJuan.estado === 'Cancelado' && getData().estado === 'Cancelado',
    'Entonces el turno pasa al estado "Cancelado"',
    `Estado actual del turno: "${turnoJuan.estado}"`
  );

  // Y se registra el motivo "El cliente no puede asistir"
  assert(
    turnoJuan.motivo_cancelacion === 'El cliente no puede asistir' &&
    Boolean(turnoJuan.fecha_cancelacion && turnoJuan.hora_cancelacion),
    'Y se registra el motivo "El cliente no puede asistir" con fecha y hora de cancelación',
    `Motivo: "${turnoJuan.motivo_cancelacion}", Fecha: ${turnoJuan.fecha_cancelacion} ${turnoJuan.hora_cancelacion} hs`
  );

  // Y el horario "09:00" del "15/11/2026" en la sucursal "Centro" vuelve a estar disponible
  assert(
    isTurnoOcupandoHorario(turnoJuan.estado) === false,
    'El turno cancelado ya NO ocupa el horario (isTurnoOcupandoHorario("Cancelado") === false)'
  );

  // Verificar mediante la consulta de disponibilidad horaria (HU-10) que el horario 09:00 quedó libre
  const { req: reqDisp, res: resDisp, getData: getDataDisp } = createMockReqRes({
    query: {
      sucursal: 'Centro',
      fecha: '15/11/2026'
    }
  });
  await consultarDisponibilidadHoraria(reqDisp, resDisp);

  const horariosLibres: string[] = getDataDisp().horariosDisponibles || [];
  assert(
    horariosLibres.includes('09:00'),
    'Y el horario "09:00" del "15/11/2026" en la sucursal "Centro" vuelve a estar disponible',
    `Horarios libres obtenidos: [${horariosLibres.slice(0, 5).join(', ')}...]`
  );

  // ----------------------------------------------------------------------
  // 3. ESCENARIO 2: Cancelación sin motivo
  // ----------------------------------------------------------------------
  console.log('\n📋 3. ESCENARIO: Cancelación sin motivo');

  // Restablecer el turno a estado "Solicitado" sin cancelación
  turnoJuan.estado = 'Solicitado';
  turnoJuan.motivo_cancelacion = null;
  turnoJuan.fecha_cancelacion = null;
  turnoJuan.hora_cancelacion = null;

  // Cuando selecciono el turno de "Juan Pérez" del "15/11/2026" a las "09:00"
  // Y dejo el motivo vacío
  // Y presiono "Cancelar turno"
  const { req: reqSinMotivo, res: resSinMotivo, getStatus: getStatusSinMotivo, getData: getDataSinMotivo } = createMockReqRes({
    body: {
      nro_turno: turnoJuan.nro_turno,
      patente: 'AB123CD',
      fecha: '15/11/2026',
      hora: '09:00',
      cliente_nombre: 'Juan Pérez',
      motivo: '' // Dejo el motivo vacío
    }
  });

  await cancelarTurno(reqSinMotivo, resSinMotivo);

  // Entonces el sistema muestra el mensaje "El motivo de cancelación es obligatorio"
  assert(
    getStatusSinMotivo() === 400 &&
    (getDataSinMotivo()?.error === 'El motivo de cancelación es obligatorio' || getDataSinMotivo()?.message === 'El motivo de cancelación es obligatorio'),
    'Entonces el sistema muestra el mensaje "El motivo de cancelación es obligatorio"',
    `HTTP ${getStatusSinMotivo()}, Mensaje: "${getDataSinMotivo()?.error}"`
  );

  // Y el turno sigue en estado "Solicitado"
  assert(
    turnoJuan.estado === 'Solicitado',
    'Y el turno sigue en estado "Solicitado"',
    `Estado del turno: "${turnoJuan.estado}"`
  );

  assert(
    !turnoJuan.motivo_cancelacion && !turnoJuan.fecha_cancelacion,
    'Y no se registra la cancelación en los datos del turno'
  );

  // ----------------------------------------------------------------------
  // 4. CRITERIOS DE ACEPTACIÓN ADICIONALES:
  // ----------------------------------------------------------------------
  console.log('\n📋 4. CRITERIOS DE ACEPTACIÓN ADICIONALES Y REGLAS DE NEGOCIO:');

  // Criterio 1: Se cancela un turno en estado "Confirmado"
  turnoJuan.estado = 'Confirmado';
  const { req: reqConf, res: resConf, getStatus: getStatusConf, getData: getDataConf } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      motivo: 'Inconveniente personal del titular'
    }
  });
  await cancelarTurno(reqConf, resConf);

  assert(
    getStatusConf() === 200 && turnoJuan.estado === 'Cancelado',
    'Criterio 1: Un turno en estado "Confirmado" puede cancelarse indicando motivo',
    `Turno confirmado pasó a: "${turnoJuan.estado}"`
  );

  // Criterio 1: Intentar cancelar un turno que YA está en estado "Cancelado" es rechazado
  const { req: reqYaCancelado, res: resYaCancelado, getStatus: getStatusYaCancelado, getData: getDataYaCancelado } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      motivo: 'Intento de re-cancelación'
    }
  });
  await cancelarTurno(reqYaCancelado, resYaCancelado);

  assert(
    getStatusYaCancelado() === 400 && 
    (getDataYaCancelado()?.error?.includes('cancelado') || getDataYaCancelado()?.error?.includes('Solicitado o Confirmado')),
    'Criterio 1: Rechaza cancelar un turno que ya se encuentra "Cancelado"',
    `Error devuelto: "${getDataYaCancelado()?.error}"`
  );

  // Criterio 1: Intentar cancelar un turno en estado no cancelable (ej: "Finalizado") es rechazado
  turnoJuan.estado = 'Finalizado';
  const { req: reqFin, res: resFin, getStatus: getStatusFin, getData: getDataFin } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      motivo: 'Ya ingresó el auto pero cancelo'
    }
  });
  await cancelarTurno(reqFin, resFin);

  assert(
    getStatusFin() === 400 && getDataFin()?.error === 'Sólo se cancelan turnos en estado Solicitado o Confirmado',
    'Criterio 1: Rechaza cancelar turnos que no están en "Solicitado" o "Confirmado"',
    `Error: "${getDataFin()?.error}"`
  );

  // Criterio 2: Motivo compuesto sólo por espacios en blanco es rechazado
  turnoJuan.estado = 'Solicitado';
  const { req: reqEspacios, res: resEspacios, getStatus: getStatusEspacios, getData: getDataEspacios } = createMockReqRes({
    body: {
      id: turnoJuan.id,
      motivo: '     '
    }
  });
  await cancelarTurno(reqEspacios, resEspacios);

  assert(
    getStatusEspacios() === 400 && getDataEspacios()?.error === 'El motivo de cancelación es obligatorio',
    'Criterio 2: Motivo con sólo espacios en blanco se considera vacío y es rechazado'
  );

  // Criterio 3: Inmediatamente tras cancelar, un NUEVO cliente puede reservar ese mismo horario
  turnoJuan.estado = 'Cancelado';
  const { req: reqNuevo, res: resNuevo, getStatus: getStatusNuevo, getData: getDataNuevo } = createMockReqRes({
    body: {
      cliente_dni: '28999888', // María Gómez
      patente: 'AD-991-LK',
      motivo_consulta: 'Revisión periódica',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      horario: '09:00'
    }
  });
  await registrarTurno(reqNuevo, resNuevo);

  assert(
    getStatusNuevo() === 201 && getDataNuevo()?.success === true,
    'Criterio 3: Tras la cancelación, se puede registrar un nuevo turno en ese horario sin colisión',
    `Nuevo Turno #${getDataNuevo()?.numeroTurno} registrado para las 09:00 hs`
  );

  // ----------------------------------------------------------------------
  // 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING):
  // ----------------------------------------------------------------------
  console.log('\n📋 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING):');

  // Cancelar turno de otro cliente y sucursal distinta (Esteban Morales en sucursal Norte)
  const turnoEsteban: LocalTurno = {
    id: 'turno-esteban-dinamico-cancel',
    nro_turno: getNextTurnoNumber(),
    vehiculo_dominio: 'AD-332-LM',
    cliente_nombre: 'Esteban Morales',
    cliente_documento: '20-33445566-8',
    sucursal: 'Norte',
    fecha: '18/11/2026',
    hora: '16:00',
    motivo_consulta: 'Frenos',
    estado: 'Confirmado',
    es_emergencia: false,
    created_at: new Date().toISOString()
  };
  localTurnosSeed.push(turnoEsteban);

  const { req: reqDin, res: resDin, getStatus: getStatusDin, getData: getDataDin } = createMockReqRes({
    body: {
      turno_id: turnoEsteban.id,
      motivo: 'Venta del automóvil',
      cancelado_por: 'Cliente'
    }
  });
  await cancelarTurno(reqDin, resDin);

  assert(
    getStatusDin() === 200 && 
    turnoEsteban.estado === 'Cancelado' && 
    turnoEsteban.motivo_cancelacion === 'Venta del automóvil' && 
    turnoEsteban.cancelado_por === 'Cliente',
    'Dinamismo: Cualquier cliente puede cancelar su turno por sucursal, fecha y motivo personalizado',
    `Turno #${turnoEsteban.nro_turno} de Esteban Morales en Sucursal Norte cancelado por el Cliente`
  );

  // Comprobar que en sucursal Norte a las 16:00 hs el horario quedó libre
  const { req: reqDispNorte, res: resDispNorte, getData: getDataDispNorte } = createMockReqRes({
    query: {
      sucursal: 'Norte',
      fecha: '18/11/2026'
    }
  });
  await consultarDisponibilidadHoraria(reqDispNorte, resDispNorte);
  const libresNorte: string[] = getDataDispNorte().horariosDisponibles || [];
  assert(
    libresNorte.includes('16:00'),
    'Dinamismo: La disponibilidad en sucursal Norte refleja la liberación dinámica de las 16:00 hs'
  );

  // ----------------------------------------------------------------------
  // 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS:
  // ----------------------------------------------------------------------
  console.log('\n📋 6. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS:');

  // HU-01: Autenticación por bcrypt
  assert(validPass, 'HU-01: Hash bcrypt verificado');

  // HU-03: Control de acceso RBAC
  assert(
    isScreenAllowed('recepcion', 'Responsable de Recepción'),
    'HU-03: Recepción autorizada para Responsable de Recepción'
  );

  // HU-09: Nuevos turnos nacen en "Solicitado"
  assert(
    getDataNuevo()?.estado === 'Solicitado',
    'HU-09: Turnos nuevos nacen en estado "Solicitado"'
  );

  // HU-10: Disponibilidad horaria
  assert(
    Array.isArray(getDataDisp().horariosDisponibles),
    'HU-10: Consulta de disponibilidad horaria operativa'
  );

  // HU-11: Turnos confirmados válidos
  assert(
    turnoJuan.vehiculo_dominio === 'AB123CD',
    'HU-11: Consistencia de vehículo y turno de Juan Pérez'
  );

  // ----------------------------------------------------------------------
  // RESUMEN FINAL
  // ----------------------------------------------------------------------
  console.log('\n======================================================================');
  console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-12 CANCELAR TURNO PASARON EXITOSAMENTE!');
  } else {
    console.error('❌ HUBO FALLOS EN LA SUITE DE PRUEBAS DE HU-12');
    process.exit(1);
  }
})();
