import { Router } from 'express';
import { login, logout, getSession } from '../controllers/auth.controller';
import { requireAuth, requireRole } from '../middleware/auth.middleware';

const router = Router();

// HU-01: Iniciar sesión (establece cookie auth_token)
router.post('/login', login);

// HU-02: Cerrar sesión (elimina cookie auth_token)
router.post('/logout', logout);

// Verificación de sesión activa mediante cookie
router.get('/me', getSession);

// HU-03: Endpoints protegidos por roles (Retornan 403 "Acceso denegado" si el rol no coincide)
router.get('/restringido/comercial', requireAuth, requireRole('Responsable de Atención al Cliente'), (req, res) => {
  res.json({ success: true, modulo: 'Comercial', autorizado: true, user: (req as any).user });
});

router.get('/restringido/recepcion', requireAuth, requireRole('Responsable de Recepción'), (req, res) => {
  res.json({ success: true, modulo: 'Recepción', autorizado: true, user: (req as any).user });
});

router.get('/restringido/operativa', requireAuth, requireRole('Responsable de Reparación (mecánico)'), (req, res) => {
  res.json({ success: true, modulo: 'Operativa de Taller', autorizado: true, user: (req as any).user });
});

router.get('/restringido/supervision', requireAuth, requireRole('Responsable de Taller (jefe de taller)'), (req, res) => {
  res.json({ success: true, modulo: 'Supervisión y Calidad', autorizado: true, user: (req as any).user });
});

router.get('/restringido/inventario', requireAuth, requireRole('Responsable de Inventario'), (req, res) => {
  res.json({ success: true, modulo: 'Inventario y Pañol', autorizado: true, user: (req as any).user });
});

router.get('/restringido/admin', requireAuth, requireRole('Administrador del sistema'), (req, res) => {
  res.json({ success: true, modulo: 'Administración Global', autorizado: true, user: (req as any).user });
});

// Verificación de estado del módulo de autenticación
router.get('/status', (req, res) => {
  res.json({
    service: 'AutoTech Auth API',
    modules: ['Autenticación', 'Sesión', 'Control de Accesos'],
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

export default router;
