/**
 * Suite de Pruebas Automatizadas BDD - HU-08: Modificar vehículo
 * 
 * Historia de Usuario:
 * Como responsable de atención al cliente,
 * quiero modificar los datos de un vehículo,
 * para corregir errores o actualizar el kilometraje.
 * 
 * Criterios de Aceptación:
 * 1. La patente modificada no puede repetirse
 * 2. El kilometraje no puede ser menor al registrado
 * 3. Mensaje de confirmación: "Vehículo modificado correctamente"
 */

import { 
  localVehiclesSeed, 
  localEmployeesSeed, 
  localClientsSeed,
  LocalVehicle 
} from './server/db';
import {
  modificarVehiculo,
  listarVehiculos,
  registrarVehiculo,
  verificarPatente,
  normalizePatente
} from './server/controllers/vehiculos.controller';
import { normalizePatente as normalizePatenteFrontend } from './src/utils/patente';
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
console.log('🧪 EJECUTANDO SUITE BDD: HU-08 MODIFICAR VEHÍCULO');
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
const juanPerez = localClientsSeed.find(c => c.nro_documento === '30123456');
assert(
  Boolean(juanPerez),
  'Existe el cliente "Juan Pérez" en el sistema'
);

// Helper para resetear vehículo Juan Pérez a 45000 km
function resetVehiculoJuan(km: number = 45000): LocalVehicle {
  let veh = localVehiclesSeed.find(v => v.dominio.toUpperCase() === 'AB123CD');
  if (!veh) {
    veh = {
      dominio: 'AB123CD',
      cliente_id: juanPerez?.id || 'cli-juan-perez',
      marca: 'Toyota',
      modelo: 'Corolla 2.0 SEG',
      anio: 2022,
      kilometraje_actual: km,
      estado: 'Activo'
    };
    localVehiclesSeed.push(veh);
  } else {
    veh.dominio = 'AB123CD';
    veh.kilometraje_actual = km;
    veh.marca = 'Toyota';
    veh.modelo = 'Corolla 2.0 SEG';
    veh.anio = 2022;
  }
  return veh;
}

const vehiculoJuan = resetVehiculoJuan(45000);
assert(
  Boolean(vehiculoJuan && vehiculoJuan.dominio === 'AB123CD' && vehiculoJuan.kilometraje_actual === 45000),
  'Y existe el vehículo con patente "AB123CD" del cliente "Juan Pérez" con 45000 km registrados',
  `Patente: ${vehiculoJuan?.dominio}, Km: ${vehiculoJuan?.kilometraje_actual}`
);

// ----------------------------------------------------------------------
// 2. ESCENARIO: Actualización exitosa del kilometraje
// ----------------------------------------------------------------------
console.log('\n📋 2. ESCENARIO: Actualización exitosa del kilometraje');

// Cuando busco el vehículo con patente "AB123CD"
const { req: reqSearch, res: resSearch } = createMockReqRes({
  query: { cliente_id: vehiculoJuan.cliente_id }
});
listarVehiculos(reqSearch, resSearch);
const listData = resSearch.getData();
const foundVeh = listData.vehiculos?.find((v: LocalVehicle) => v.dominio.toUpperCase() === 'AB123CD');
assert(
  Boolean(foundVeh && foundVeh.dominio === 'AB123CD'),
  'Cuando busco el vehículo con patente "AB123CD"',
  `Encontrado: ${foundVeh?.marca} ${foundVeh?.modelo} (${foundVeh?.dominio})`
);

// Y cambio el kilometraje a 52000
// Y presiono "Guardar"
const { req: reqModifKm, res: resModifKm } = createMockReqRes({
  params: { patente: 'AB123CD' },
  body: {
    patente: 'AB123CD',
    kilometraje: 52000
  },
  user: {
    username: atencionUser!.username,
    rol: atencionUser!.rol
  }
});
modificarVehiculo(reqModifKm, resModifKm);
const modifKmData = resModifKm.getData();

assert(
  resModifKm.getStatusCode() === 200 && modifKmData.message === 'Vehículo modificado correctamente',
  'Entonces el sistema muestra el mensaje "Vehículo modificado correctamente"',
  `Mensaje: ${modifKmData?.message}`
);

const vehiculoActualizado = localVehiclesSeed.find(v => v.dominio.toUpperCase() === 'AB123CD');
assert(
  Boolean(vehiculoActualizado && vehiculoActualizado.kilometraje_actual === 52000),
  'Y el vehículo "AB123CD" queda con 52000 km',
  `Kilometraje actual en memoria: ${vehiculoActualizado?.kilometraje_actual} km`
);

// ----------------------------------------------------------------------
// 3. ESCENARIO: Kilometraje menor al registrado
// ----------------------------------------------------------------------
console.log('\n📋 3. ESCENARIO: Kilometraje menor al registrado');

// Restaurar antecedentes del escenario (45000 km)
resetVehiculoJuan(45000);

// Cuando busco el vehículo con patente "AB123CD"
// Y cambio el kilometraje a 40000
// Y presiono "Guardar"
const { req: reqKmMenor, res: resKmMenor } = createMockReqRes({
  params: { patente: 'AB123CD' },
  body: {
    patente: 'AB123CD',
    kilometraje: 40000
  },
  user: {
    username: atencionUser!.username,
    rol: atencionUser!.rol
  }
});
modificarVehiculo(reqKmMenor, resKmMenor);
const kmMenorData = resKmMenor.getData();

assert(
  resKmMenor.getStatusCode() === 400 && kmMenorData.error === 'El kilometraje no puede ser menor al registrado',
  'Entonces el sistema muestra el mensaje "El kilometraje no puede ser menor al registrado"',
  `Código HTTP: ${resKmMenor.getStatusCode()}, Error: ${kmMenorData?.error}`
);

const vehiculoConservado = localVehiclesSeed.find(v => v.dominio.toUpperCase() === 'AB123CD');
assert(
  Boolean(vehiculoConservado && vehiculoConservado.kilometraje_actual === 45000),
  'Y el vehículo "AB123CD" sigue con 45000 km',
  `Kilometraje conservado: ${vehiculoConservado?.kilometraje_actual} km`
);

// ----------------------------------------------------------------------
// 4. CRITERIO 1: La patente modificada no puede repetirse
// ----------------------------------------------------------------------
console.log('\n📋 4. CRITERIO 1: La patente modificada no puede repetirse');

// Dado que existe el vehículo con patente "AF-123-ZZ"
const vehiculoExistente = localVehiclesSeed.find(v => v.dominio === 'AF-123-ZZ');
assert(
  Boolean(vehiculoExistente),
  'Dado que existe el vehículo con patente "AF-123-ZZ"',
  `Vehículo: ${vehiculoExistente?.marca} ${vehiculoExistente?.modelo} (${vehiculoExistente?.dominio})`
);

// Cuando busco el vehículo con patente "AB123CD"
// Y cambio la patente a "AF-123-ZZ"
// Y presiono "Guardar"
const { req: reqPatenteDup, res: resPatenteDup } = createMockReqRes({
  params: { patente: 'AB123CD' },
  body: {
    patente_original: 'AB123CD',
    patente: 'AF-123-ZZ',
    kilometraje: 45000
  },
  user: {
    username: atencionUser!.username,
    rol: atencionUser!.rol
  }
});
modificarVehiculo(reqPatenteDup, resPatenteDup);
const dupData = resPatenteDup.getData();

assert(
  resPatenteDup.getStatusCode() === 409 && dupData.error === 'Ya existe un vehículo con esa patente en el sistema',
  'Entonces el sistema muestra el mensaje "Ya existe un vehículo con esa patente en el sistema"',
  `Código HTTP: ${resPatenteDup.getStatusCode()}, Error: ${dupData?.error}`
);

const vehiculoPatenteConservada = localVehiclesSeed.find(v => v.dominio.toUpperCase() === 'AB123CD');
assert(
  Boolean(vehiculoPatenteConservada && vehiculoPatenteConservada.dominio === 'AB123CD'),
  'Y el vehículo conserva la patente "AB123CD"'
);

// Conservar la propia patente procede sin conflicto
const { req: reqMismaPatente, res: resMismaPatente } = createMockReqRes({
  params: { patente: 'AB123CD' },
  body: {
    patente: 'AB123CD',
    kilometraje: 46000
  }
});
modificarVehiculo(reqMismaPatente, resMismaPatente);
assert(
  resMismaPatente.getStatusCode() === 200 && resMismaPatente.getData().vehiculo.kilometraje_actual === 46000,
  'Conservar la misma patente no produce conflicto de duplicidad y actualiza el kilometraje a 46000 km'
);

// ----------------------------------------------------------------------
// 4B. BUG FIX HU-08: Patentes equivalentes con o sin guiones y espacios
// ----------------------------------------------------------------------
console.log('\n📋 4B. BUG FIX HU-08: Validación normalizada de patentes (con/sin guiones y espacios):');

// Reproducción exacta del bug: Modificar AC456EF -> AF123ZZ cuando ya existe AF-123-ZZ
const vehAc456 = localVehiclesSeed.find(v => v.dominio === 'AC456EF');
assert(
  Boolean(vehAc456 && vehiculoExistente),
  'Existen ambos vehículos semilla "AC456EF" (sin guiones) y "AF-123-ZZ" (con guiones)'
);

const { req: reqDupSinGuiones, res: resDupSinGuiones } = createMockReqRes({
  params: { patente: 'AC456EF' },
  body: {
    patente_original: 'AC456EF',
    patente: 'AF123ZZ',
    kilometraje: 22000
  }
});
await modificarVehiculo(reqDupSinGuiones, resDupSinGuiones);
assert(
  resDupSinGuiones.getStatusCode() === 409 &&
  resDupSinGuiones.getData().error === 'Ya existe un vehículo con esa patente en el sistema' &&
  localVehiclesSeed.find(v => v.dominio === 'AC456EF') !== undefined,
  'Rechaza cambiar AC456EF a "AF123ZZ" (sin guiones) porque ya existe "AF-123-ZZ" y conserva "AC456EF"',
  `HTTP: ${resDupSinGuiones.getStatusCode()}, Error: ${resDupSinGuiones.getData()?.error}`
);

// Caso con espacios y minúsculas: 'af 123 zz'
const { req: reqDupEspacios, res: resDupEspacios } = createMockReqRes({
  params: { patente: 'AC456EF' },
  body: {
    patente: 'af 123 zz',
    kilometraje: 22000
  }
});
await modificarVehiculo(reqDupEspacios, resDupEspacios);
assert(
  resDupEspacios.getStatusCode() === 409 &&
  resDupEspacios.getData().error === 'Ya existe un vehículo con esa patente en el sistema',
  'Rechaza cambiar AC456EF a "af 123 zz" (espacios y minúsculas) detectando equivalencia con "AF-123-ZZ"'
);

// Caso inverso: Intentar cambiar AF-123-ZZ a "AC-456-EF" (con guiones) cuando ya existe "AC456EF"
const { req: reqDupConGuiones, res: resDupConGuiones } = createMockReqRes({
  params: { patente: 'AF-123-ZZ' },
  body: {
    patente: 'AC-456-EF',
    kilometraje: 64200
  }
});
await modificarVehiculo(reqDupConGuiones, resDupConGuiones);
assert(
  resDupConGuiones.getStatusCode() === 409 &&
  resDupConGuiones.getData().error === 'Ya existe un vehículo con esa patente en el sistema' &&
  localVehiclesSeed.some(v => v.dominio === 'AF-123-ZZ'),
  'Caso inverso: Rechaza cambiar AF-123-ZZ a "AC-456-EF" (agregando guiones) porque ya existe "AC456EF"'
);

// Verificar también en HU-07 registrarVehiculo y verificarPatente
const { req: reqRegDupNorm, res: resRegDupNorm } = createMockReqRes({
  body: {
    patente: 'AF123ZZ',
    marca: 'Ford',
    modelo: 'Focus',
    anio: 2024,
    cliente_id: juanPerez?.id || 'cli-juan-perez'
  }
});
await registrarVehiculo(reqRegDupNorm, resRegDupNorm);
assert(
  resRegDupNorm.getStatusCode() === 409 &&
  resRegDupNorm.getData().error === 'Ya existe un vehículo con esa patente en el sistema',
  'HU-07 registrarVehiculo: Rechaza alta con patente "AF123ZZ" porque ya existe "AF-123-ZZ"'
);

const { req: reqCheckNorm, res: resCheckNorm } = createMockReqRes({
  query: { patente: 'ac 456-ef' }
});
await verificarPatente(reqCheckNorm, resCheckNorm);
assert(
  resCheckNorm.getStatusCode() === 200 && resCheckNorm.getData().exists === true,
  'verificarPatente reconoce "ac 456-ef" como existente al estar registrado "AC456EF"'
);

// Permitir modificar otros datos del mismo vehículo buscándolo sin guiones sin falso positivo
const kmOrigHilux = vehiculoExistente!.kilometraje_actual;
const { req: reqSelfNorm, res: resSelfNorm } = createMockReqRes({
  params: { patente: 'AF123ZZ' },
  body: {
    kilometraje: kmOrigHilux + 100
  }
});
await modificarVehiculo(reqSelfNorm, resSelfNorm);
assert(
  resSelfNorm.getStatusCode() === 200 &&
  resSelfNorm.getData().vehiculo.dominio === 'AF-123-ZZ' &&
  resSelfNorm.getData().vehiculo.kilometraje_actual === kmOrigHilux + 100,
  'Modificar kilometraje de "AF-123-ZZ" buscándolo como "AF123ZZ" actualiza sin falso conflicto y preserva su dominio'
);
vehiculoExistente!.kilometraje_actual = kmOrigHilux;

// Consistencia Frontend <-> Backend normalizePatente
assert(
  normalizePatente('AF-123-ZZ') === 'AF123ZZ' &&
  normalizePatenteFrontend('af 123 zz') === 'AF123ZZ' &&
  normalizePatente('  ab-123-cd  ') === normalizePatenteFrontend('AB123CD'),
  'Helpers normalizePatente (Backend y Frontend) normalizan guiones, espacios y mayúsculas de forma idéntica'
);

// ----------------------------------------------------------------------
// 5. CORRECCIÓN DE ERRORES: Modificación de marca, modelo y año
// ----------------------------------------------------------------------
console.log('\n📋 5. CORRECCIÓN DE ERRORES (Marca, Modelo, Año):');

const { req: reqErrores, res: resErrores } = createMockReqRes({
  params: { patente: 'AB123CD' },
  body: {
    patente: 'AB123CD',
    kilometraje: 46000,
    marca: 'Toyota',
    modelo: 'Corolla 2.0 SEG Hybrid',
    año: 2023
  }
});
modificarVehiculo(reqErrores, resErrores);
const dataErrores = resErrores.getData();

assert(
  resErrores.getStatusCode() === 200 && 
  dataErrores.vehiculo.modelo === 'Corolla 2.0 SEG Hybrid' &&
  dataErrores.vehiculo.anio === 2023,
  'Permite modificar datos del vehículo para corregir errores (modelo a "Corolla 2.0 SEG Hybrid", año a 2023)'
);

// ----------------------------------------------------------------------
// 6. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING)
// ----------------------------------------------------------------------
console.log('\n📋 6. COMPROBACIÓN DE DINAMISMO (CERO HARDCODING):');

// Modificar otro vehículo cualquiera (Ford Ranger AD-332-LM)
const vehiculoRanger = localVehiclesSeed.find(v => v.dominio === 'AD-332-LM');
assert(Boolean(vehiculoRanger), 'Existe vehículo "AD-332-LM" en la base para prueba dinámica');

const kmAnteriorRanger = vehiculoRanger!.kilometraje_actual;
const nuevoKmRanger = kmAnteriorRanger + 5000;

const { req: reqRanger, res: resRanger } = createMockReqRes({
  params: { patente: 'AD-332-LM' },
  body: {
    kilometraje: nuevoKmRanger
  }
});
modificarVehiculo(reqRanger, resRanger);
assert(
  resRanger.getStatusCode() === 200 && resRanger.getData().vehiculo.kilometraje_actual === nuevoKmRanger,
  `Dinamismo: Vehículo "AD-332-LM" actualiza su kilometraje dinámicamente de ${kmAnteriorRanger} a ${nuevoKmRanger} km`
);

// Rechazar si se intenta bajar el kilometraje de AD-332-LM
const { req: reqRangerBajo, res: resRangerBajo } = createMockReqRes({
  params: { patente: 'AD-332-LM' },
  body: {
    kilometraje: kmAnteriorRanger - 1000
  }
});
modificarVehiculo(reqRangerBajo, resRangerBajo);
assert(
  resRangerBajo.getStatusCode() === 400 && resRangerBajo.getData().error === 'El kilometraje no puede ser menor al registrado',
  'Dinamismo: La regla de no permitir kilometraje menor aplica a cualquier vehículo del catálogo'
);

// ----------------------------------------------------------------------
// 7. CONTROL DE ACCESO POR ROL (HU-03 RBAC)
// ----------------------------------------------------------------------
console.log('\n📋 7. CONTROL DE ACCESO POR ROL (HU-03 RBAC):');

const rolAtencion = 'Responsable de Atención al Cliente';
const rolAdmin = 'Administrador del sistema';
const rolRecepcion = 'Responsable de Recepción';
const rolMecanico = 'Responsable de Reparación (mecánico)';

assert(
  isScreenAllowed('comercial', rolAtencion),
  'Responsable de Atención al Cliente tiene acceso al módulo Comercial para modificar vehículos'
);

assert(
  isScreenAllowed('comercial', rolAdmin),
  'Administrador del sistema tiene acceso total irrestricto'
);

assert(
  !isScreenAllowed('comercial', rolRecepcion) && !isScreenAllowed('comercial', rolMecanico),
  'Otros roles (Recepción, Mecánico) no pueden acceder al módulo Comercial'
);

// ----------------------------------------------------------------------
// 8. INTEGRIDAD Y REGRESIÓN
// ----------------------------------------------------------------------
console.log('\n📋 8. INTEGRIDAD Y REGRESIÓN CON HISTORIAS PREVIAS:');

// HU-01: Hash de contraseñas
const emp = localEmployeesSeed[0];
assert(
  bcrypt.compareSync('password123', emp.password),
  'HU-01: Contraseñas de empleados verificadas con hash bcrypt'
);

// HU-06: Modificar cliente
const juanModif = localClientsSeed.find(c => c.nro_documento === '30123456');
assert(
  Boolean(juanModif && juanModif.nombre === 'Juan' && juanModif.apellido === 'Pérez'),
  'HU-06: Cliente Juan Pérez mantiene consistencia tras operaciones vehiculares'
);

console.log('\n======================================================================');
console.log(`🏁 RESULTADO: ${passedTests} de ${totalTests} pruebas pasadas con éxito (${Math.round((passedTests / totalTests) * 100)}%)`);
console.log('======================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ¡TODOS LOS ESCENARIOS BDD Y CRITERIOS DE HU-08 PASARON EXITOSAMENTE!\n');
} else {
  console.error('❌ ALGUNAS PRUEBAS FALLARON.');
  process.exitCode = 1;
}
