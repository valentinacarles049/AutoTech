import { Router } from 'express';
import { login, logout, getSession } from '../controllers/auth.controller';

const router = Router();

// HU-01: Iniciar sesión (establece cookie auth_token)
router.post('/login', login);

// HU-02: Cerrar sesión (elimina cookie auth_token)
router.post('/logout', logout);

// Verificación de sesión activa mediante cookie
router.get('/me', getSession);

// Verificación de estado del módulo de autenticación
router.get('/status', (req, res) => {
  res.json({
    service: 'AutoTech Auth API',
    stories: ['HU-01 Iniciar sesión', 'HU-02 Cerrar sesión'],
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

export default router;
