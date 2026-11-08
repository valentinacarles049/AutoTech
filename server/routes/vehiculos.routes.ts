import { Router } from 'express';
import { 
  registrarVehiculo, 
  listarVehiculos, 
  verificarPatente, 
  testCleanupVehiculos,
  modificarVehiculo,
  restaurarVehiculoTest
} from '../controllers/vehiculos.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-07: Registrar Vehículo (Protegido por Rol Responsable de Atención al Cliente y Admin)
router.post(
  '/',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  registrarVehiculo
);

// Alternativa pública para fallback/testing
router.post('/public-register', registrarVehiculo);

// HU-08: Modificar Vehículo (Protegido por Rol Responsable de Atención al Cliente y Admin)
router.put(
  '/:patente',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  modificarVehiculo
);

router.put(
  '/',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  modificarVehiculo
);

// Alternativa pública para fallback/testing de modificación
router.put('/public-update{/:patente}', modificarVehiculo);

// Listado de vehículos (opcionalmente filtrado por cliente_id)
router.get('/', listarVehiculos);

// Comprobación rápida de existencia de patente
router.get('/verificar-patente', verificarPatente);

// Limpieza y restauración de datos de prueba para tests BDD
router.post('/test-cleanup', testCleanupVehiculos);
router.delete('/test-cleanup', testCleanupVehiculos);
router.post('/test-restore', restaurarVehiculoTest);

export default router;
