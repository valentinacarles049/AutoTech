import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { isSupabaseConnected } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares globales
app.use(cors());
app.use(express.json());

// Logging simple de peticiones en consola
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Rutas de la API
app.use('/api/auth', authRoutes);

// Health check general
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoTech S.A. - Backend ERP API',
    version: '1.0.0',
    database: isSupabaseConnected ? 'Supabase / PostgreSQL Configurado' : 'Modo Local / Fallback Activo',
    timestamp: new Date().toISOString()
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Servidor Backend AutoTech escuchando en: http://localhost:${PORT}`);
  console.log(`📡 Endpoint HU-01 Login: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🩺 Health Check:         GET  http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});
