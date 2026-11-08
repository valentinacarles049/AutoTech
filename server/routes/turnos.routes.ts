import { Router } from 'express';
import { 
  registrarTurno, 
  listarTurnos, 
  consultarTurnos,
  listarHorariosDisponibles, 
  consultarDisponibilidadHoraria,
  listarSucursales,
  confirmarTurno,
  finalizarTurno,
  registrarAusenciaTurno,
  testCleanupTurnos 
} from '../controllers/turnos.controller';
import {
  registrarPresupuesto,
  modificarPresupuesto,
  verificarVencimientoPresupuesto
} from '../controllers/presupuestos.controller';
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

// HU-15: Finalizar turno (registrar presentación del vehículo) y control de ausencia
router.post('/finalizar', finalizarTurno);
router.post('/:id/finalizar', finalizarTurno);
router.post('/presentacion', finalizarTurno);
router.post('/ausente', registrarAusenciaTurno);
router.post('/:id/ausente', registrarAusenciaTurno);
router.post('/verificar-ausencias', registrarAusenciaTurno);

// HU-19: Registrar presupuesto de un turno finalizado
router.post('/presupuesto', registrarPresupuesto);
router.post('/:id/presupuesto', registrarPresupuesto);
router.put('/:id/presupuesto', modificarPresupuesto);
router.post('/presupuesto/verificar-vencimiento', verificarVencimientoPresupuesto);

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
