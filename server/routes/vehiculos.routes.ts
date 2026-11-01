import { Router } from 'express';
import { 
  registrarVehiculo, 
  listarVehiculos, 
  verificarPatente, 
  testCleanupVehiculos 
} from '../controllers/vehiculos.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-06: Registrar Vehículo (Protegido por Rol Responsable de Atención al Cliente y Admin)
router.post(
  '/',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  registrarVehiculo
);

// Alternativa pública para fallback/testing
router.post('/public-register', registrarVehiculo);

// Listado de vehículos (opcionalmente filtrado por cliente_id)
router.get('/', listarVehiculos);

// Comprobación rápida de existencia de patente
router.get('/verificar-patente', verificarPatente);

// Limpieza de datos de prueba para tests BDD
router.post('/test-cleanup', testCleanupVehiculos);
router.delete('/test-cleanup', testCleanupVehiculos);

export default router;
