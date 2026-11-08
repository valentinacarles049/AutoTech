import { Router } from 'express';
import { 
  registrarTurno, 
  listarTurnos, 
  consultarTurnos,
  listarHorariosDisponibles, 
  consultarDisponibilidadHoraria,
  listarSucursales,
  confirmarTurno,
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

// HU-11: Confirmar turno (Cliente confirma vía link de mail/mensaje o recepción)
router.post('/confirmar', confirmarTurno);
router.post('/:id/confirmar', confirmarTurno);
router.post('/public-confirm', confirmarTurno);

// HU-12: Consultar / Listar turnos filtrando por estado, fecha y sucursal
router.get('/', listarTurnos);
router.get('/consultar', consultarTurnos);

// HU-10: Consultar disponibilidad horaria de la sucursal elegida
router.get('/disponibilidad', consultarDisponibilidadHoraria);
router.get('/horarios-disponibles', listarHorariosDisponibles);

// Consulta de sucursales
router.get('/sucursales', listarSucursales);

// Limpieza para tests BDD
router.post('/test-cleanup', testCleanupTurnos);
router.delete('/test-cleanup', testCleanupTurnos);

export default router;
