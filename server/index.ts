import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import clientesRoutes from './routes/clientes.routes';
import vehiculosRoutes from './routes/vehiculos.routes';
import turnosRoutes from './routes/turnos.routes';
import presupuestosRoutes from './routes/presupuestos.routes';
import { isSupabaseConnected } from './db';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const distIndexPath = path.join(distDir, 'index.html');

const app = express();
const PORT = Number(process.env.PORT || 4000);
const HOST = process.env.HOST || '0.0.0.0';

const configuredOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedDevPorts = new Set(['3000', '4000', '4173', '5173']);

// Middlewares globales (soporta localhost, Vite dev/preview, red LAN y orígenes configurados en CORS_ORIGIN)
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (configuredOrigins.includes('*') || configuredOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    try {
      const parsed = new URL(origin);
      const isLocalHost =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        parsed.hostname === '::1';
      const isPrivateLan =
        /^192\.168\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
        /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname) ||
        /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(parsed.hostname);
      if ((isLocalHost || isPrivateLan) && (!parsed.port || allowedDevPorts.has(parsed.port))) {
        callback(null, true);
        return;
      }
    } catch {
      // Origen inválido
    }
    callback(new Error(`Origen CORS no permitido: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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
app.use('/api/clientes', clientesRoutes);
app.use('/api/vehiculos', vehiculosRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/presupuestos', presupuestosRoutes);

// Health check general
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AutoTech S.A. - Backend ERP API',
    version: '1.0.0',
    database: isSupabaseConnected ? 'Supabase / PostgreSQL Configurado' : 'Modo Local / Fallback Activo',
    frontendServed: fs.existsSync(distIndexPath) && process.env.SERVE_STATIC !== 'false',
    timestamp: new Date().toISOString()
  });
});

// 404 explícito para endpoints /api inexistentes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint de API no encontrado' });
});

// Modo producción / servidor único Node: servir build compilado (`dist/`) y fallback SPA (compatible Express 5)
const shouldServeStatic = process.env.SERVE_STATIC !== 'false' && fs.existsSync(distIndexPath);
if (shouldServeStatic) {
  app.use(express.static(distDir));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || path.extname(req.path)) {
      next();
      return;
    }
    res.sendFile(distIndexPath);
  });
}

// Iniciar servidor
app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log('====================================================');
  console.log(`🚀 Servidor AutoTech escuchando en: http://${displayHost}:${PORT}`);
  if (shouldServeStatic) {
    console.log(`🌐 Frontend SPA (dist/):  http://${displayHost}:${PORT}/`);
  } else {
    console.log(`ℹ️  Build dist/ no activo aquí (para producción ejecutá: npm run build && npm start)`);
  }
  console.log(`🗄️  Base de datos:        ${isSupabaseConnected ? 'Supabase / PostgreSQL' : 'Memoria Local (Fallback)'}`);
  console.log(`📡 Endpoint Login:        POST http://${displayHost}:${PORT}/api/auth/login`);
  console.log(`🩺 Health Check:          GET  http://${displayHost}:${PORT}/api/health`);
  console.log('====================================================');
});
