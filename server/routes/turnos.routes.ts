import { Router } from 'express';
import { 
  registrarTurno, 
  listarTurnos, 
  listarHorariosDisponibles, 
  listarSucursales,
  testCleanupTurnos 
} from '../controllers/turnos.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-09: Registrar solicitud de turno (Protegido por Rol Responsable de Recepción y Administrador)
router.post(
  '/',
  requireAuth,
  requireRole('Responsable de Recepción', 'Administrador del sistema'),
  registrarTurno
);

// Alternativa pública para fallback/testing
router.post('/public-register', registrarTurno);

// Listado de turnos
router.get('/', listarTurnos);

// Consulta de horarios disponibles de la sucursal elegida (HU-09 CA 1)
router.get('/horarios-disponibles', listarHorariosDisponibles);

// Consulta de sucursales
router.get('/sucursales', listarSucursales);

// Limpieza para tests BDD
router.post('/test-cleanup', testCleanupTurnos);
router.delete('/test-cleanup', testCleanupTurnos);

export default router;
