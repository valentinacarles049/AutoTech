/**
 * Suite de Pruebas Automatizadas BDD - HU-06: Modificar cliente
 * 
 * Historia de Usuario:
 * Como responsable de atención al cliente,
 * quiero modificar los datos de un cliente,
 * para mantener actualizada su información de contacto.
 * 
 * Criterios de Aceptación:
 * 1. No se puede modificar el tipo y número de documento a uno ya existente
 * 2. Se validan los mismos campos obligatorios que en el alta
 * 3. Mensaje de confirmación: "Cliente modificado correctamente"
 */

import { 
  localClientsSeed, 
  localEmployeesSeed, 
  LocalClient 
} from './server/db';
import { modificarCliente, buscarClientes } from './server/controllers/clientes.controller';
import { isScreenAllowed, getAllowedScreens } from './src/utils/permissions';
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
  cookies?: any;
}) {
  const req: any = {
    params: options.params || {},
    body: options.body || {},
    query: options.query || {},
    user: options.user || null,
    cookies: options.cookies || {}
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
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    }
  };

  return { req, res };
}

console.log('======================================================================');
console.log('🧪 EJECUTANDO SUITE BDD: HU-06 MODIFICAR CLIENTE');
console.log('======================================================================\n');

// ----------------------------------------------------------------------
// 1. ANTECEDENTES
// ----------------------------------------------------------------------
console.log('📋 1. ANTECEDENTES:');

// Rol Responsable de Atención al Cliente
const atencionUser = localEmployeesSeed.find(e => e.rol === 'Responsable de Atención al Cliente' && e.activo);
assert(
  Boolean(atencionUser && isScreenAllowed('comercial', atencionUser.rol)),
  'Dado que inicié sesión con el rol "Responsable de Atención al Cliente"',
  `Usuario: ${atencionUser?.username}`
);

// Verificar cliente Juan Pérez
let juanPerez = localClientsSeed.find(c => c.nro_documento === '30123456');
if (!juanPerez) {
  juanPerez = {
    id: 'cli-juan-perez',
    nro_cliente: 1005,
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    nro_documento: '30123456',
    email: 'juan.perez@gmail.com',
    telefono: '0351-154987654',
    fecha_alta: '2026-02-10',
    estado: 'Activo',
    nivel_fidelizacion: null
  };
  localClientsSeed.push(juanPerez);
}

assert(
  Boolean(juanPerez && juanPerez.tipo_documento === 'DNI' && juanPerez.nro_documento === '30123456'),
  'Y existe el cliente "Juan Pérez" con tipo de documento "DNI" y número "30123456"',
  `Cliente: ${juanPerez.nombre} ${juanPerez.apellido} - DNI: ${juanPerez.nro_documento}`
);

// ----------------------------------------------------------------------
// 2. ESCENARIO 1: Modificación exitosa de los datos de contacto
// ----------------------------------------------------------------------
console.log('\n📋 2. ESCENARIO 1: Modificación exitosa de los datos de contacto');

// Cuando busco al cliente por DNI "30123456" (HU-05)
const { req: reqSearch, res: resSearch } = createMockReqRes({
  query: { documento: '30123456' }
});
buscarClientes(reqSearch, resSearch);
const searchData = resSearch.getData();
assert(
  resSearch.getStatusCode() === 200 && searchData.count === 1 && searchData.clientes[0].nro_documento === '30123456',
  'Cuando busco al cliente por DNI "30123456"',
  `Encontrado: ${searchData.clientes?.[0]?.nombre} ${searchData.clientes?.[0]?.apellido}`
);

// Y cambio el mail a "jperez@example.com" y el teléfono a "3515001122"
// Y presiono "Guardar"
const { req: reqModif, res: resModif } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'jperez@example.com',
    telefono: '3515001122'
  },
  user: {
    username: atencionUser!.username,
    rol: atencionUser!.rol
  }
});

modificarCliente(reqModif, resModif);
const modifData = resModif.getData();

assert(
  resModif.getStatusCode() === 200 && modifData.message === 'Cliente modificado correctamente',
  'Entonces el sistema muestra el mensaje "Cliente modificado correctamente"',
  `Respuesta: ${modifData?.message}`
);

const juanActualizado = localClientsSeed.find(c => c.nro_documento === '30123456');
assert(
  Boolean(
    juanActualizado &&
    juanActualizado.email === 'jperez@example.com' &&
    juanActualizado.telefono === '3515001122'
  ),
  'Y el cliente "Juan Pérez" queda con el mail "jperez@example.com" y el teléfono "3515001122"',
  `Mail: ${juanActualizado?.email}, Teléfono: ${juanActualizado?.telefono}`
);

// ----------------------------------------------------------------------
// 3. ESCENARIO 2: Documento que ya pertenece a otro cliente
// ----------------------------------------------------------------------
console.log('\n📋 3. ESCENARIO 2: Documento que ya pertenece a otro cliente');

// Dado que existe el cliente "María Gómez" con tipo de documento "DNI" y número "28999888"
let mariaGomez = localClientsSeed.find(c => c.nro_documento === '28999888');
if (!mariaGomez) {
  mariaGomez = {
    id: 'cli-maria-gomez',
    nro_cliente: 1006,
    nombre: 'María',
    apellido: 'Gómez',
    tipo_documento: 'DNI',
    nro_documento: '28999888',
    email: 'maria.gomez@gmail.com',
    telefono: '0351-156112233',
    fecha_alta: '2026-02-15',
    estado: 'Activo',
    nivel_fidelizacion: null
  };
  localClientsSeed.push(mariaGomez);
}

assert(
  Boolean(mariaGomez && mariaGomez.tipo_documento === 'DNI' && mariaGomez.nro_documento === '28999888'),
  'Dado que existe el cliente "María Gómez" con tipo de documento "DNI" y número "28999888"',
  `Cliente: ${mariaGomez.nombre} ${mariaGomez.apellido} - DNI: ${mariaGomez.nro_documento}`
);

// Cuando busco al cliente por DNI "30123456"
// Y cambio el número de documento a "28999888"
// Y presiono "Guardar"
const { req: reqDup, res: resDup } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '28999888', // DNI de María Gómez
    mail: 'jperez@example.com',
    telefono: '3515001122'
  },
  user: {
    username: atencionUser!.username,
    rol: atencionUser!.rol
  }
});

modificarCliente(reqDup, resDup);
const dupData = resDup.getData();

assert(
  resDup.getStatusCode() === 409 && dupData.error === 'Ya existe un cliente con ese tipo y número de documento',
  'Entonces el sistema muestra el mensaje "Ya existe un cliente con ese tipo y número de documento"',
  `Código HTTP: ${resDup.getStatusCode()}, Error: ${dupData?.error}`
);

const juanConservado = localClientsSeed.find(c => c.id === juanPerez.id);
assert(
  Boolean(juanConservado && juanConservado.nro_documento === '30123456'),
  'Y el cliente "Juan Pérez" conserva el DNI "30123456"',
  `DNI actual en memoria: ${juanConservado?.nro_documento}`
);

// ----------------------------------------------------------------------
// 4. CRITERIO 2: Validación de los mismos campos obligatorios que en el alta
// ----------------------------------------------------------------------
console.log('\n📋 4. CRITERIO 2: Validación de campos obligatorios y formato');

// Campo nombre vacío
const { req: reqSinNombre, res: resSinNombre } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: '',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'jperez@example.com',
    telefono: '3515001122'
  }
});
modificarCliente(reqSinNombre, resSinNombre);
assert(
  resSinNombre.getStatusCode() === 400 && 
  resSinNombre.getData().error === 'Los campos nombre, apellido, tipo y número de documento, mail y teléfono son obligatorios',
  'Rechaza si falta el campo obligatorio "nombre"',
  resSinNombre.getData().error
);

// Campo apellido vacío
const { req: reqSinApellido, res: resSinApellido } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: '',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'jperez@example.com',
    telefono: '3515001122'
  }
});
modificarCliente(reqSinApellido, resSinApellido);
assert(
  resSinApellido.getStatusCode() === 400,
  'Rechaza si falta el campo obligatorio "apellido"'
);

// Campo tipo_documento vacío
const { req: reqSinTipoDoc, res: resSinTipoDoc } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: '',
    numero_documento: '30123456',
    mail: 'jperez@example.com',
    telefono: '3515001122'
  }
});
modificarCliente(reqSinTipoDoc, resSinTipoDoc);
assert(
  resSinTipoDoc.getStatusCode() === 400,
  'Rechaza si falta el campo obligatorio "tipo_documento"'
);

// Campo numero_documento vacío
const { req: reqSinNroDoc, res: resSinNroDoc } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '',
    mail: 'jperez@example.com',
    telefono: '3515001122'
  }
});
modificarCliente(reqSinNroDoc, resSinNroDoc);
assert(
  resSinNroDoc.getStatusCode() === 400,
  'Rechaza si falta el campo obligatorio "numero_documento"'
);

// Campo mail vacío
const { req: reqSinMail, res: resSinMail } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: '',
    telefono: '3515001122'
  }
});
modificarCliente(reqSinMail, resSinMail);
assert(
  resSinMail.getStatusCode() === 400,
  'Rechaza si falta el campo obligatorio "mail"'
);

// Campo teléfono vacío
const { req: reqSinTel, res: resSinTel } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'jperez@example.com',
    telefono: ''
  }
});
modificarCliente(reqSinTel, resSinTel);
assert(
  resSinTel.getStatusCode() === 400,
  'Rechaza si falta el campo obligatorio "teléfono"'
);

// Validación de formato de mail
const { req: reqMailInvalido, res: resMailInvalido } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'correo-sin-arroba',
    telefono: '3515001122'
  }
});
modificarCliente(reqMailInvalido, resMailInvalido);
assert(
  resMailInvalido.getStatusCode() === 400 && resMailInvalido.getData().error === 'El mail debe tener formato válido',
  'Rechaza correo sin formato válido con "El mail debe tener formato válido"',
  resMailInvalido.getData().error
);

// Mantener el propio documento procede sin conflicto de unicidad
const { req: reqPropioDoc, res: resPropioDoc } = createMockReqRes({
  params: { id: juanPerez.id },
  body: {
    nombre: 'Juan',
    apellido: 'Pérez',
    tipo_documento: 'DNI',
    numero_documento: '30123456',
    mail: 'jperez.oficial@autotech.com',
    telefono: '3515998877'
  }
});
modificarCliente(reqPropioDoc, resPropioDoc);
assert(
  resPropioDoc.getStatusCode() === 200 && resPropioDoc.getData().cliente.email === 'jperez.oficial@autotech.com',
  'El cliente puede conservar su propio tipo y número de documento sin error de duplicidad'
);

// ----------------------------------------------------------------------
// 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING)
// ----------------------------------------------------------------------
console.log('\n📋 5. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING):');

// Modificar otro cliente dinámico de la base (Esteban Morales)
const esteban = localClientsSeed.find(c => c.nro_documento === '20-33445566-8');
assert(Boolean(esteban), 'Existe cliente "Esteban Morales" en la base para prueba dinámica');

const { req: reqEsteban, res: resEsteban } = createMockReqRes({
  params: { id: esteban!.id },
  body: {
    nombre: 'Esteban',
    apellido: 'Morales',
    tipo_documento: 'DNI',
    numero_documento: '20-33445566-8',
    mail: 'esteban.nuevo@logistica.com',
    telefono: '0351-4455667',
    razon_social: 'Morales Transportes'
  }
});
modificarCliente(reqEsteban, resEsteban);
assert(
  resEsteban.getStatusCode() === 200 && 
  resEsteban.getData().cliente.email === 'esteban.nuevo@logistica.com' &&
  resEsteban.getData().cliente.razon_social === 'Morales Transportes',
  'Dinamismo: Cualquier cliente puede actualizar sus datos de contacto y razón social de forma individual y persistente'
);

// ----------------------------------------------------------------------
// 6. CONTROL DE ACCESO POR ROL (HU-03 RBAC)
// ----------------------------------------------------------------------
console.log('\n📋 6. CONTROL DE ACCESO POR ROL (HU-03 RBAC):');

const rolAtencion = 'Responsable de Atención al Cliente';
const rolAdmin = 'Administrador del sistema';
const rolRecepcion = 'Responsable de Recepción';
const rolMecanico = 'Responsable de Reparación (mecánico)';

assert(
  isScreenAllowed('comercial', rolAtencion) && isScreenAllowed('nuevo-cliente', rolAtencion),
  'Responsable de Atención al Cliente tiene acceso al módulo Comercial'
);

assert(
  isScreenAllowed('comercial', rolAdmin),
  'Administrador del sistema tiene acceso total irrestricto'
);

assert(
  !isScreenAllowed('comercial', rolRecepcion) && !isScreenAllowed('comercial', rolMecanico),
  'Roles ajenos a atención (Recepción, Mecánico) NO tienen acceso al módulo Comercial'
);

// ----------------------------------------------------------------------
// 7. INTEGRIDAD Y REGRESIÓN CON HISTORIAS PREVIAS
// ----------------------------------------------------------------------
console.log('\n📋 7. INTEGRIDAD Y REGRESIÓN:');

// HU-01: Hash de contraseñas
const emp = localEmployeesSeed[0];
assert(
  bcrypt.compareSync('password123', emp.password),
  'HU-01: Contraseñas de empleados verificadas con hash bcrypt'
);

// HU-04: Alta de cliente con nivel de fidelización inicial null
assert(
  juanPerez.nivel_fidelizacion === null,
  'HU-04: Cliente creado inicialmente sin nivel de fidelización asignado (null)'
);

// HU-05: Búsqueda unificada por documento
const { req: reqBusqDoc, res: resBusqDoc } = createMockReqRes({
  query: { documento: '28999888' }
});
buscarClientes(reqBusqDoc, resBusqDoc);
assert(
  resBusqDoc.getData().count === 1 && resBusqDoc.getData().clientes[0].nombre === 'María',
  'HU-05: Búsqueda por documento devuelve exactamente a María Gómez'
);

console.log('\n======================================================================');
console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-06 PASARON EXITOSAMENTE!\n');
} else {
  console.error('❌ ALGUNAS PRUEBAS FALLARON.');
  process.exitCode = 1;
}
