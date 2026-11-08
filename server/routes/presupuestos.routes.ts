import { Router } from 'express';
import {
  registrarPresupuesto,
  modificarPresupuesto,
  verificarVencimientoPresupuesto,
  listarPresupuestos,
  configurarFidelizacionCliente,
  testCleanupPresupuestos
} from '../controllers/presupuestos.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-19: Listar presupuestos
router.get('/', listarPresupuestos);

// HU-19: Registrar presupuesto de reparación (Protegido por Rol Responsable de Recepción y Administrador)
router.post(
  '/',
  requireAuth,
  requireRole('Responsable de Recepción', 'Administrador del sistema'),
  registrarPresupuesto
);

router.post(
  '/registrar',
  requireAuth,
  requireRole('Responsable de Recepción', 'Administrador del sistema'),
  registrarPresupuesto
);

// Alternativa pública para fallback/testing
router.post('/public-register', registrarPresupuesto);

// HU-19 Criterio 4 y 5: Modificar presupuesto (sólo mientras esté en estado "Emitido")
router.put('/:id', modificarPresupuesto);
router.put('/', modificarPresupuesto);
router.post('/modificar', modificarPresupuesto);
router.post('/:id/modificar', modificarPresupuesto);

// HU-19 Criterio 5: Verificar vencimiento del presupuesto sin respuesta del cliente
router.post('/verificar-vencimiento', verificarVencimientoPresupuesto);
router.post('/:id/verificar-vencimiento', verificarVencimientoPresupuesto);
router.post('/vencimiento', verificarVencimientoPresupuesto);

// Configurar descuento de fidelización de cliente (Antecedentes BDD HU-19)
router.post('/fidelizacion-cliente', configurarFidelizacionCliente);

// Limpieza para tests BDD
router.post('/test-cleanup', testCleanupPresupuestos);
router.delete('/test-cleanup', testCleanupPresupuestos);

export default router;

