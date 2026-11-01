import { Router } from 'express';
import { registrarCliente, listarClientes, buscarClientes, verificarDocumento, eliminarClienteTest } from '../controllers/clientes.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-05: Buscar Cliente (por documento, apellido o número de cliente)
router.get('/buscar', buscarClientes);

// HU-04: Registrar Cliente (Protegido por Rol Responsable de Atención al Cliente y Admin)
router.post(
  '/',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  registrarCliente
);

// Alternativa abierta para fallback o sincronización
router.post('/public-register', registrarCliente);

// Listado de clientes
router.get('/', listarClientes);

// Comprobación rápida de existencia de documento
router.get('/verificar-doc', verificarDocumento);

// Limpieza para tests automatizados
router.post('/test-cleanup', eliminarClienteTest);
router.delete('/test-cleanup', eliminarClienteTest);

export default router;
