import { Router } from 'express';
import { 
  registrarCliente, 
  listarClientes, 
  buscarClientes, 
  verificarDocumento, 
  eliminarClienteTest,
  modificarCliente,
  restaurarClienteTest
} from '../controllers/clientes.controller';
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

// HU-06: Modificar Cliente (Protegido por Rol Responsable de Atención al Cliente y Admin)
router.put(
  '/:id',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  modificarCliente
);

router.put(
  '/',
  requireAuth,
  requireRole('Responsable de Atención al Cliente', 'Administrador del sistema'),
  modificarCliente
);

// Fallback abierto para sincronización local si es necesario
router.put('/public-update/:id?', modificarCliente);

// Listado de clientes
router.get('/', listarClientes);

// Comprobación rápida de existencia de documento
router.get('/verificar-doc', verificarDocumento);

// Limpieza y restauración para tests automatizados
router.post('/test-cleanup', eliminarClienteTest);
router.delete('/test-cleanup', eliminarClienteTest);
router.post('/test-restore', restaurarClienteTest);

export default router;
