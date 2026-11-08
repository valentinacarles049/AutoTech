/**
 * Suite de Pruebas Automatizadas BDD - HU-12: Consultar turnos por estado y fecha
 *
 * Historia de usuario:
 * Como responsable de recepción o responsable de taller,
 * quiero listar los turnos filtrando por estado, fecha y sucursal,
 * para organizar la atención del día.
 *
 * Criterios de aceptación:
 * 1. Filtros combinables: estado, rango de fechas y sucursal
 * 2. El listado muestra cliente, patente, motivo de consulta, fecha, hora y estado
 * 3. Se puede ordenar por fecha y hora
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
  listarTurnos,
  consultarTurnos,
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
console.log('🧪 EJECUTANDO SUITE BDD: HU-12 CONSULTAR TURNOS POR ESTADO Y FECHA');
console.log('======================================================================\n');

(async () => {
  // ----------------------------------------------------------------------
  // 1. ANTECEDENTES
  // ----------------------------------------------------------------------
  console.log('📋 1. ANTECEDENTES:');

  // Dado que inicié sesión con el rol "Responsable de Recepción" (y soporte para "Responsable de Taller")
  const recepcionista = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción' && e.activo);
  const jefeTaller = localEmployeesSeed.find(e => e.rol.includes('Responsable de Taller') && e.activo);

  assert(
    Boolean(recepcionista && isScreenAllowed('recepcion', recepcionista.rol)),
    'Dado que inicié sesión con el rol "Responsable de Recepción"',
    `Usuario: ${recepcionista?.username} (${recepcionista?.rol})`
  );

  assert(
    Boolean(jefeTaller && isScreenAllowed('recepcion', jefeTaller.rol) && isScreenAllowed('supervision', jefeTaller.rol)),
    'El rol "Responsable de Taller" también tiene permisos habilitados para consultar los turnos',
    `Usuario: ${jefeTaller?.username} (${jefeTaller?.rol})`
  );

  // Preparar los 3 turnos exactos de los Antecedentes Gherkin:
  // | cliente     | patente | motivo                | sucursal | fecha      | hora  | estado     |
  // | Juan Pérez  | AB123CD | Mantenimiento general | Centro   | 15/11/2026 | 11:00 | Confirmado |
  // | María Gómez | AC456EF | Cambio de frenos      | Centro   | 15/11/2026 | 09:00 | Confirmado |
  // | Juan Pérez  | AB123CD | Ruido en el motor     | Centro   | 16/11/2026 | 10:00 | Solicitado |
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  const juanPerez = localClientsSeed.find(c => c.nombre === 'Juan' && c.apellido === 'Pérez');
  const mariaGomez = localClientsSeed.find(c => c.nombre === 'María' && c.apellido === 'Gómez');

  const turnosAntecedentes: LocalTurno[] = [
    {
      id: 'turno-bdd-1',
      nro_turno: getNextTurnoNumber(),
      cliente_id: juanPerez?.id || 'cli-juan-perez',
      cliente_nombre: 'Juan Pérez',
      cliente_documento: '30123456',
      vehiculo_dominio: 'AB123CD',
      motivo_consulta: 'Mantenimiento general',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '11:00',
      estado: 'Confirmado'
    },
    {
      id: 'turno-bdd-2',
      nro_turno: getNextTurnoNumber(),
      cliente_id: mariaGomez?.id || 'cli-maria-gomez',
      cliente_nombre: 'María Gómez',
      cliente_documento: '28999888',
      vehiculo_dominio: 'AC456EF',
      motivo_consulta: 'Cambio de frenos',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '09:00',
      estado: 'Confirmado'
    },
    {
      id: 'turno-bdd-3',
      nro_turno: getNextTurnoNumber(),
      cliente_id: juanPerez?.id || 'cli-juan-perez',
      cliente_nombre: 'Juan Pérez',
      cliente_documento: '30123456',
      vehiculo_dominio: 'AB123CD',
      motivo_consulta: 'Ruido en el motor',
      sucursal: 'Centro',
      fecha: '16/11/2026',
      hora: '10:00',
      estado: 'Solicitado'
    }
  ];

  localTurnosSeed.push(...turnosAntecedentes);

  assert(
    localTurnosSeed.length === 3,
    'Y existen los 3 turnos de antecedentes en el sistema',
    `Turnos cargados: ${localTurnosSeed.map(t => `${t.cliente_nombre} (${t.vehiculo_dominio}) ${t.fecha} ${t.hora} [${t.estado}]`).join(' | ')}`
  );

  // ----------------------------------------------------------------------
  // 2. ESCENARIO 1: Listado filtrado y ordenado
  // ----------------------------------------------------------------------
  console.log('\n📋 2. ESCENARIO 1: Listado filtrado y ordenado');

  // Cuando filtro por estado "Confirmado", fechas del "15/11/2026" al "16/11/2026" y sucursal "Centro"
  // Y ordeno por fecha y hora
  const { req: req1, res: res1, getStatus: getStatus1, getData: getData1 } = createMockReqRes({
    query: {
      estado: 'Confirmado',
      fechaDesde: '15/11/2026',
      fechaHasta: '16/11/2026',
      sucursal: 'Centro',
      ordenar: 'fecha_hora',
      orden: 'asc'
    }
  });

  await listarTurnos(req1, res1);
  const data1 = getData1();

  assert(
    getStatus1() === 200 && data1.total === 2 && data1.turnos.length === 2,
    'Entonces veo 2 turnos que cumplen los filtros combinados',
    `Total devuelto: ${data1?.total}`
  );

  // Verificar Criterio 2: El listado muestra cliente, patente, motivo de consulta, fecha, hora y estado
  const hasAllRequiredFields = data1.turnos.every((t: any) =>
    Boolean(
      (t.cliente || t.cliente_nombre) &&
      (t.patente || t.vehiculo_dominio) &&
      (t.motivo_consulta || t.motivo) &&
      t.fecha &&
      t.hora &&
      t.estado
    )
  );
  assert(
    hasAllRequiredFields,
    'Cada turno del listado muestra cliente, patente, motivo de consulta, fecha, hora y estado',
    `Campos turno 1: ${JSON.stringify({
      cliente: data1.turnos[0]?.cliente,
      patente: data1.turnos[0]?.patente,
      motivo: data1.turnos[0]?.motivo_consulta,
      fecha: data1.turnos[0]?.fecha,
      hora: data1.turnos[0]?.hora,
      estado: data1.turnos[0]?.estado
    })}`
  );

  // Y el primero es el de "María Gómez" a las "09:00" y el segundo el de "Juan Pérez" a las "11:00"
  const primero = data1.turnos[0];
  const segundo = data1.turnos[1];

  assert(
    primero.cliente === 'María Gómez' &&
    primero.patente === 'AC456EF' &&
    primero.motivo_consulta === 'Cambio de frenos' &&
    primero.fecha === '15/11/2026' &&
    primero.hora === '09:00' &&
    primero.estado === 'Confirmado',
    'Y el primero es el de "María Gómez" (AC456EF - Cambio de frenos) el "15/11/2026" a las "09:00"',
    `Primero obtenido: ${primero?.cliente} a las ${primero?.hora}`
  );

  assert(
    segundo.cliente === 'Juan Pérez' &&
    segundo.patente === 'AB123CD' &&
    segundo.motivo_consulta === 'Mantenimiento general' &&
    segundo.fecha === '15/11/2026' &&
    segundo.hora === '11:00' &&
    segundo.estado === 'Confirmado',
    'Y el segundo es el de "Juan Pérez" (AB123CD - Mantenimiento general) el "15/11/2026" a las "11:00"',
    `Segundo obtenido: ${segundo?.cliente} a las ${segundo?.hora}`
  );

  // ----------------------------------------------------------------------
  // 3. ESCENARIO 2: Ningún turno cumple los filtros
  // ----------------------------------------------------------------------
  console.log('\n📋 3. ESCENARIO 2: Ningún turno cumple los filtros');

  // Cuando filtro por estado "Cancelado", fechas del "15/11/2026" al "16/11/2026" y sucursal "Centro"
  const { req: req2, res: res2, getStatus: getStatus2, getData: getData2 } = createMockReqRes({
    query: {
      estado: 'Cancelado',
      fechaDesde: '15/11/2026',
      fechaHasta: '16/11/2026',
      sucursal: 'Centro'
    }
  });

  await consultarTurnos(req2, res2);
  const data2 = getData2();

  assert(
    getStatus2() === 200 && data2.total === 0 && data2.turnos.length === 0,
    'La consulta devuelve 0 turnos cuando ningún turno cumple los filtros',
    `Total devuelto: ${data2?.total}`
  );

  assert(
    data2.mensaje === 'No se encontraron turnos para los filtros seleccionados' &&
    data2.mensaje.startsWith('No se encontraron turnos para los filtros seleccion'),
    'Entonces el sistema muestra el mensaje "No se encontraron turnos para los filtros seleccionados"',
    `Mensaje devuelto: "${data2?.mensaje}"`
  );

  // ----------------------------------------------------------------------
  // 4. CRITERIOS DE ACEPTACIÓN ADICIONALES (COMBINACIONES Y ORDENAMIENTO)
  // ----------------------------------------------------------------------
  console.log('\n📋 4. CRITERIOS DE ACEPTACIÓN ADICIONALES (FILTROS COMBINABLES Y ORDEN):');

  // Filtro solo por rango de fechas (sin filtrar estado) -> debe traer los 3 turnos ordenados cronológicamente
  const resTodosRango = filtrarYOrdenarTurnos(localTurnosSeed, {
    fechaDesde: '15/11/2026',
    fechaHasta: '16/11/2026',
    sucursal: 'Centro',
    orden: 'asc'
  });

  assert(
    resTodosRango.total === 3 &&
    resTodosRango.turnos[0].hora === '09:00' &&
    resTodosRango.turnos[1].hora === '11:00' &&
    resTodosRango.turnos[2].fecha === '16/11/2026' &&
    resTodosRango.turnos[2].hora === '10:00',
    'Filtro por rango de fechas (15/11 al 16/11) sin estado devuelve los 3 turnos ordenados por fecha y hora',
    `Orden: ${resTodosRango.turnos.map(t => `${t.fecha} ${t.hora}`).join(' -> ')}`
  );

  // Ordenamiento descendente por fecha y hora
  const resDesc = filtrarYOrdenarTurnos(localTurnosSeed, {
    estado: 'Confirmado',
    fechaDesde: '15/11/2026',
    fechaHasta: '16/11/2026',
    sucursal: 'Centro',
    orden: 'desc'
  });

  assert(
    resDesc.total === 2 &&
    resDesc.turnos[0].cliente === 'Juan Pérez' &&
    resDesc.turnos[0].hora === '11:00' &&
    resDesc.turnos[1].cliente === 'María Gómez' &&
    resDesc.turnos[1].hora === '09:00',
    'Permite invertir el ordenamiento por fecha y hora (descendente: 11:00 primero, 09:00 segundo)'
  );

  // Filtro por fecha exacta (16/11/2026) y estado "Solicitado"
  const resSolicitado16 = filtrarYOrdenarTurnos(localTurnosSeed, {
    estado: 'Solicitado',
    fechaDesde: '2026-11-16',
    fechaHasta: '2026-11-16',
    sucursal: 'Centro'
  });

  assert(
    resSolicitado16.total === 1 &&
    resSolicitado16.turnos[0].cliente === 'Juan Pérez' &&
    resSolicitado16.turnos[0].motivo_consulta === 'Ruido en el motor',
    'Soporta fechas en formato ISO (YYYY-MM-DD) combinadas con estado "Solicitado"'
  );

  // Filtro por otra sucursal ("Norte") cuando los turnos son de "Centro" -> sin resultados
  const resSucursalNorte = filtrarYOrdenarTurnos(localTurnosSeed, {
    sucursal: 'Norte'
  });

  assert(
    resSucursalNorte.total === 0 &&
    resSucursalNorte.mensaje === 'No se encontraron turnos para los filtros seleccionados',
    'Filtrar por sucursal sin turnos ("Norte") retorna mensaje de sin resultados'
  );

  // ----------------------------------------------------------------------
  // 5. INTEGRIDAD Y REGRESIÓN CON HISTORIAS PREVIAS
  // ----------------------------------------------------------------------
  console.log('\n📋 5. INTEGRIDAD Y REGRESIÓN CON HUS PREVIAS:');

  const validPass = await bcrypt.compare('password123', recepcionista?.password || '');
  assert(
    validPass && recepcionista?.activo === true,
    'HU-01: Autenticación de empleados con hash bcrypt operativa'
  );

  const vehiculoMaria = localVehiclesSeed.find(v => v.dominio === 'AC456EF');
  assert(
    Boolean(vehiculoMaria && vehiculoMaria.cliente_id === mariaGomez?.id),
    'HU-06 / HU-07: Vehículo AC456EF de María Gómez registrado y vinculado en semilla'
  );

  console.log('\n======================================================================');
  console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================================');

  if (passedTests === totalTests) {
    console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-12 PASARON EXITOSAMENTE!');
  } else {
    console.error('❌ HUBO FALLOS EN LA SUITE DE PRUEBAS DE HU-12');
    process.exit(1);
  }
})();

