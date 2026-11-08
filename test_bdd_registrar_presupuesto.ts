/**
 * Suite de Pruebas Automatizadas BDD - HU-19: Registrar presupuesto de reparación
 *
 * Historia de usuario:
 * Como responsable de recepción,
 * quiero registrar el presupuesto de un turno finalizado,
 * para informar al cliente el costo de la reparación.
 *
 * Criterios de aceptación:
 * 1. Tiene uno o más ítems de detalle (DetallePresupuesto), cada uno con descripción, cantidad, precio unitario y subtotal (cantidad × precio unitario). Los ítems cubren repuestos y mano de obra.
 * 2. El total es la suma de los subtotales menos el descuento de fidelización del cliente (si no tiene, no se descuenta nada).
 * 3. Indica los días de validez.
 * 4. Al registrarse, el presupuesto queda en estado "Emitido" y se puede modificar mientras siga así.
 * 5. Si se superan los días de validez sin respuesta del cliente, pasa a "Vencido" y ya no se puede modificar.
 */

import {
  localClientsSeed,
  localVehiclesSeed,
  localTurnosSeed,
  localEmployeesSeed,
  localPresupuestosSeed,
  resetTurnoCounter,
  resetPresupuestoCounter
} from './server/db';
import {
  registrarPresupuesto,
  modificarPresupuesto,
  verificarVencimientoPresupuesto,
  configurarFidelizacionCliente
} from './server/controllers/presupuestos.controller';
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
console.log('🧪 EJECUTANDO SUITE BDD: HU-19 REGISTRAR PRESUPUESTO DE REPARACIÓN');
console.log('======================================================================\n');

function resetScenarioTurnosAndPresupuestos() {
  localPresupuestosSeed.length = 0;
  resetPresupuestoCounter(1);
  localTurnosSeed.length = 0;
  resetTurnoCounter(1001);

  // Limpiar descuentos previos en clientes
  localClientsSeed.forEach(c => {
    delete c.descuento_fidelizacion;
  });

  // Antecedente: Existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Finalizado"
  localTurnosSeed.push(
    {
      id: 'turno-juan-finalizado',
      nro_turno: 1001,
      vehiculo_dominio: 'AB123CD',
      cliente_id: 'cli-juan-perez',
      cliente_nombre: 'Juan Pérez',
      cliente_documento: '30123456',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '09:00',
      motivo_consulta: 'Mantenimiento general',
      estado: 'Finalizado',
      es_emergencia: false,
      presupuesto_habilitado: true,
      vehiculo_presentado: true,
      fecha_finalizacion: '15/11/2026'
    },
    {
      id: 'turno-maria-finalizado',
      nro_turno: 1002,
      vehiculo_dominio: 'AC456EF',
      cliente_id: 'cli-maria-gomez',
      cliente_nombre: 'María Gómez',
      cliente_documento: '28999888',
      sucursal: 'Centro',
      fecha: '15/11/2026',
      hora: '10:00',
      motivo_consulta: 'Cambio de frenos',
      estado: 'Finalizado',
      es_emergencia: false,
      presupuesto_habilitado: true,
      vehiculo_presentado: true,
      fecha_finalizacion: '15/11/2026'
    },
    {
      id: 'turno-juan-solicitado',
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
      es_emergencia: false
    }
  );
}

async function runTests() {
  resetScenarioTurnosAndPresupuestos();

  // =========================================================================
  // ANTECEDENTES BDD
  // Dado que inicié sesión con el rol "Responsable de Recepción"
  // Y existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Finalizado"
  // Y el cliente "Juan Pérez" tiene un descuento de fidelización del 10 %
  // =========================================================================
  console.log('📌 Antecedentes: Sesión iniciada como "Responsable de Recepción", turno finalizado y cliente con 10% fidelización');

  const empRecepcion = localEmployeesSeed.find(e => e.rol === 'Responsable de Recepción' && e.activo);
  assert(
    Boolean(empRecepcion) && bcrypt.compareSync('password123', empRecepcion!.password),
    'Autenticación válida con el rol "Responsable de Recepción"'
  );
  assert(
    isScreenAllowed('recepcion', 'Responsable de Recepción'),
    'El rol "Responsable de Recepción" tiene permiso al módulo de Recepción y Presupuestos'
  );

  // Asignar descuento de fidelización del 10 % a "Juan Pérez"
  const mockFidelizacion = createMockReqRes({
    body: {
      cliente_nombre: 'Juan Pérez',
      descuento_fidelizacion: 10
    }
  });
  await configurarFidelizacionCliente(mockFidelizacion.req, mockFidelizacion.res);
  const juanClient = localClientsSeed.find(c => c.nombre === 'Juan' && c.apellido === 'Pérez');
  assert(
    mockFidelizacion.getStatus() === 200 && juanClient?.descuento_fidelizacion === 10,
    'El cliente "Juan Pérez" tiene configurado un descuento de fidelización del 10 %'
  );

  const turnoJuan = localTurnosSeed.find(t => t.id === 'turno-juan-finalizado');
  assert(
    Boolean(turnoJuan) &&
      turnoJuan!.cliente_nombre === 'Juan Pérez' &&
      turnoJuan!.vehiculo_dominio === 'AB123CD' &&
      turnoJuan!.fecha === '15/11/2026' &&
      turnoJuan!.hora === '09:00' &&
      turnoJuan!.estado === 'Finalizado',
    'Existe el turno de "Juan Pérez" para el vehículo "AB123CD" del "15/11/2026" a las "09:00" en estado "Finalizado"'
  );

  // =========================================================================
  // ESCENARIO 1 (BDD Gherkin): Registro exitoso del presupuesto
  //   Cuando registro el presupuesto del turno con los ítems de detalle:
  //     | descripción         | cantidad | precio unitario |
  //     | Aceite 5W30 (litro) | 4        | 9000            |
  //     | Filtro de aceite    | 1        | 8000            |
  //     | Mano de obra        | 1        | 15000           |
  //   Y indico una validez de 15 días
  //   Y presiono "Registrar presupuesto"
  //   Entonces cada ítem queda con su subtotal: 36000, 8000 y 15000
  //   Y el presupuesto muestra un subtotal de 59000, un descuento de 5900 y un total de 53100
  //   Y el presupuesto queda en estado "Emitido"
  // =========================================================================
  console.log('\n📌 Escenario 1 (BDD): Registro exitoso del presupuesto');

  const mockReg1 = createMockReqRes({
    body: {
      turno_id: 'turno-juan-finalizado',
      patente: 'AB123CD',
      fecha_emision: '15/11/2026',
      validez_dias: 15,
      items: [
        { descripcion: 'Aceite 5W30 (litro)', cantidad: 4, precio_unitario: 9000 },
        { descripcion: 'Filtro de aceite', cantidad: 1, precio_unitario: 8000 },
        { descripcion: 'Mano de obra', cantidad: 1, precio_unitario: 15000 }
      ]
    },
    user: { rol: 'Responsable de Recepción' }
  });

  await registrarPresupuesto(mockReg1.req, mockReg1.res);
  const status1 = mockReg1.getStatus();
  const data1 = mockReg1.getData();
  const pres1 = data1?.presupuesto;

  assert(
    status1 === 201 && data1?.success === true && Boolean(pres1),
    'La solicitud "Registrar presupuesto" se procesa exitosamente (HTTP 201)',
    `Recibido status=${status1}, data=${JSON.stringify(data1)}`
  );

  assert(
    Array.isArray(pres1?.items) && pres1.items.length === 3,
    'El presupuesto contiene los 3 ítems de detalle (DetallePresupuesto: repuestos y mano de obra)'
  );

  assert(
    pres1?.items[0]?.descripcion === 'Aceite 5W30 (litro)' &&
      pres1?.items[0]?.cantidad === 4 &&
      pres1?.items[0]?.precio_unitario === 9000 &&
      pres1?.items[0]?.subtotal === 36000,
    'El primer ítem ("Aceite 5W30 (litro)", 4 × 9000) queda con su subtotal: 36000',
    `Subtotal recibido: ${pres1?.items[0]?.subtotal}`
  );

  assert(
    pres1?.items[1]?.descripcion === 'Filtro de aceite' &&
      pres1?.items[1]?.cantidad === 1 &&
      pres1?.items[1]?.precio_unitario === 8000 &&
      pres1?.items[1]?.subtotal === 8000,
    'El segundo ítem ("Filtro de aceite", 1 × 8000) queda con su subtotal: 8000',
    `Subtotal recibido: ${pres1?.items[1]?.subtotal}`
  );

  assert(
    pres1?.items[2]?.descripcion === 'Mano de obra' &&
      pres1?.items[2]?.cantidad === 1 &&
      pres1?.items[2]?.precio_unitario === 15000 &&
      pres1?.items[2]?.subtotal === 15000,
    'El tercer ítem ("Mano de obra", 1 × 15000) queda con su subtotal: 15000',
    `Subtotal recibido: ${pres1?.items[2]?.subtotal}`
  );

  assert(
    pres1?.subtotal === 59000 && data1?.subtotal === 59000,
    'El presupuesto muestra un subtotal de 59000 (36000 + 8000 + 15000)',
    `Subtotal recibido: ${pres1?.subtotal}`
  );

  assert(
    pres1?.descuento === 5900 && pres1?.descuento_monto === 5900 && data1?.descuento === 5900,
    'El presupuesto muestra un descuento de fidelización de 5900 (10 % de 59000)',
    `Descuento recibido: ${pres1?.descuento}`
  );

  assert(
    pres1?.total === 53100 && data1?.total === 53100,
    'El presupuesto muestra un total de 53100 (59000 - 5900)',
    `Total recibido: ${pres1?.total}`
  );

  assert(
    pres1?.validez_dias === 15 && pres1?.validezDias === 15,
    'El presupuesto registra la validez de 15 días (Criterio 3)'
  );

  assert(
    pres1?.estado === 'Emitido' && data1?.estado === 'Emitido',
    'El presupuesto queda en estado "Emitido" (Criterio 4)'
  );

  assert(
    pres1?.puede_modificarse === true && pres1?.puedeModificarse === true,
    'El presupuesto se puede modificar mientras siga en estado "Emitido" (Criterio 4)'
  );

  // =========================================================================
  // CRITERIO 4: Verificar que el presupuesto se puede modificar mientras siga en estado "Emitido"
  // =========================================================================
  console.log('\n📌 Criterio 4: Modificación de un presupuesto en estado "Emitido"');

  const mockModEmitido = createMockReqRes({
    body: {
      presupuesto_id: pres1.id,
      fecha_actual: '20/11/2026', // Dentro de los 15 días de validez (5 días transcurridos)
      validez_dias: 15,
      items: [
        { descripcion: 'Aceite 5W30 (litro)', cantidad: 4, precio_unitario: 9000 },
        { descripcion: 'Filtro de aceite', cantidad: 1, precio_unitario: 8000 },
        { descripcion: 'Mano de obra', cantidad: 1, precio_unitario: 15000 }
      ]
    }
  });

  await modificarPresupuesto(mockModEmitido.req, mockModEmitido.res);
  assert(
    mockModEmitido.getStatus() === 200 && mockModEmitido.getData()?.success === true && mockModEmitido.getData()?.estado === 'Emitido',
    'Permite modificar el presupuesto mientras se encuentre en estado "Emitido" dentro de su validez'
  );

  // =========================================================================
  // ESCENARIO 2 (BDD Gherkin): Presupuesto vencido sin respuesta del cliente
  //   Dado que el presupuesto del turno se emitió el "15/11/2026" con una validez de 15 días
  //   Y el cliente no respondió
  //   Cuando llega el "01/12/2026"
  //   Entonces el presupuesto pasa al estado "Vencido"
  //   Y ya no se puede modificar
  // =========================================================================
  console.log('\n📌 Escenario 2 (BDD): Presupuesto vencido sin respuesta del cliente');

  const mockVencimiento = createMockReqRes({
    body: {
      presupuesto_id: pres1.id,
      turno_id: 'turno-juan-finalizado',
      fecha_actual: '01/12/2026'
    }
  });

  await verificarVencimientoPresupuesto(mockVencimiento.req, mockVencimiento.res);
  const statusVenc = mockVencimiento.getStatus();
  const dataVenc = mockVencimiento.getData();

  assert(
    statusVenc === 200 && dataVenc?.success === true,
    'Se verifica el vencimiento al llegar el "01/12/2026" (16 días después del "15/11/2026", superando los 15 días de validez)'
  );

  assert(
    dataVenc?.estado === 'Vencido' && dataVenc?.presupuesto?.estado === 'Vencido',
    'El presupuesto pasa al estado "Vencido" al superarse los 15 días de validez sin respuesta del cliente',
    `Estado recibido: ${dataVenc?.estado}`
  );

  assert(
    dataVenc?.puede_modificarse === false && dataVenc?.presupuesto?.puedeModificarse === false,
    'El presupuesto vencido indica que ya no se puede modificar (puede_modificarse = false)'
  );

  // Intentar modificar el presupuesto ahora que está en estado "Vencido"
  const mockModVencido = createMockReqRes({
    body: {
      presupuesto_id: pres1.id,
      turno_id: 'turno-juan-finalizado',
      items: [
        { descripcion: 'Ítem modificado inválido', cantidad: 1, precio_unitario: 99999 }
      ]
    }
  });

  await modificarPresupuesto(mockModVencido.req, mockModVencido.res);
  assert(
    mockModVencido.getStatus() === 400 && mockModVencido.getData()?.success === false,
    'El sistema rechaza cualquier intento de modificar un presupuesto en estado "Vencido" (HTTP 400)'
  );

  const presEnMemoria = localPresupuestosSeed.find(p => p.id === pres1.id);
  assert(
    presEnMemoria?.estado === 'Vencido' && presEnMemoria?.total === 53100 && presEnMemoria?.items.length === 3,
    'Los datos e ítems originales del presupuesto vencido permanecen intactos sin modificaciones'
  );

  // =========================================================================
  // CRITERIO 2 (Adicional): Cliente sin descuento de fidelización (no se descuenta nada)
  // =========================================================================
  console.log('\n📌 Criterio 2 (Adicional): Cliente sin descuento de fidelización (no se descuenta nada)');

  const mockSinDescuento = createMockReqRes({
    body: {
      turno_id: 'turno-maria-finalizado',
      patente: 'AC456EF',
      fecha_emision: '15/11/2026',
      validez_dias: 10,
      items: [
        { descripcion: 'Pastillas de freno', cantidad: 2, precio_unitario: 12000 },
        { descripcion: 'Mano de obra frenos', cantidad: 1, precio_unitario: 16000 }
      ]
    }
  });

  await registrarPresupuesto(mockSinDescuento.req, mockSinDescuento.res);
  const dataMaria = mockSinDescuento.getData()?.presupuesto;

  assert(
    mockSinDescuento.getStatus() === 201 &&
      dataMaria?.subtotal === 40000 &&
      dataMaria?.descuento === 0 &&
      dataMaria?.total === 40000,
    'Si el cliente no tiene descuento de fidelización, no se descuenta nada (subtotal 40000, descuento 0, total 40000)'
  );

  // =========================================================================
  // VALIDACIÓN ADICIONAL: No permitir registrar presupuesto de un turno no finalizado
  // =========================================================================
  console.log('\n📌 Validación adicional: Rechazar presupuesto en turno no finalizado');

  const mockTurnoNoFin = createMockReqRes({
    body: {
      turno_id: 'turno-juan-solicitado',
      validez_dias: 15,
      items: [
        { descripcion: 'Diagnóstico', cantidad: 1, precio_unitario: 10000 }
      ]
    }
  });

  await registrarPresupuesto(mockTurnoNoFin.req, mockTurnoNoFin.res);
  assert(
    mockTurnoNoFin.getStatus() === 400 && mockTurnoNoFin.getData()?.success === false,
    'No permite registrar el presupuesto si el turno no está en estado "Finalizado"'
  );

  // Restaurar estado original de localTurnosSeed y localClientsSeed para no afectar otras suites
  localPresupuestosSeed.length = 0;
  resetPresupuestoCounter(1);
  localClientsSeed.forEach(c => {
    delete c.descuento_fidelizacion;
  });

  localTurnosSeed.length = 0;
  localTurnosSeed.push(
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
      fecha_confirmacion: null,
      hora_confirmacion: null,
      medio_confirmacion: null,
      notificacion_enviada: false,
      notificacion_cliente: null
    }
  );
  resetTurnoCounter(1004);

  console.log('\n======================================================================');
  console.log(`✅ RESULTADO FINAL HU-19: ${passedTests}/${totalTests} PRUEBAS PASARON EXITOSAMENTE`);
  console.log('======================================================================\n');
}

runTests().catch(err => {
  console.error('Error ejecutando tests BDD HU-19:', err);
  process.exit(1);
});

