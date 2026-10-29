import { Router } from 'express';
import { login } from '../controllers/auth.controller';

const router = Router();

// HU-01: Iniciar sesión
router.post('/login', login);

// Verificación de estado del módulo de autenticación
router.get('/status', (req, res) => {
  res.json({
    service: 'AutoTech Auth API',
    story: 'HU-01 Iniciar sesión',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

export default router;
