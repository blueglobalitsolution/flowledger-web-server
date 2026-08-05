import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { authRouter } from './auth';
import { aiRouter } from './routers/ai';
import { dataRouter } from './routers/data';
import { adminRouter } from './routers/admin';
import { superAdminRouter } from './routers/superadmin';
import { eventsRouter } from './events';

const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';
// In the production CJS bundle, __dirname is the bundle's dir (root/dist).
// In dev (ESM via tsx, cwd = api/), fall back to cwd for parity.
const distRoot = isProduction ? __dirname : path.join(process.cwd(), 'dist');

function serveModule(app: express.Express, mountPath: string, distDir: string) {
  const full = path.join(distRoot, distDir);
  if (!fs.existsSync(path.join(full, 'index.html'))) return;
  app.use(mountPath, express.static(full));
  app.get(`${mountPath}*`, (req, res) => {
    res.sendFile(path.join(full, 'index.html'));
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // CORS: enabled only when CORS_ORIGINS is set (comma-separated frontend origins).
  // Same-origin local dev/prod needs no CORS.
  const corsOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  if (corsOrigins.length > 0) {
    app.use(cors({ origin: corsOrigins }));
    console.log(`CORS enabled for origins: ${corsOrigins.join(', ')}`);
  }

  // --- API Gateway ---
  app.use('/api/auth', authRouter);
  app.use('/api', eventsRouter);
  app.use('/api', aiRouter);
  app.use('/api', dataRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/superadmin', superAdminRouter);

  // --- Frontend modules (production: serve built apps at path bases) ---
  if (isProduction) {
    serveModule(app, '/admin', 'admin');
    serveModule(app, '/superadmin', 'superadmin');
    const appDist = path.join(distRoot, 'app');
    if (fs.existsSync(path.join(appDist, 'index.html'))) {
      app.use(express.static(appDist));
      app.get('*', (req, res) => {
        res.sendFile(path.join(appDist, 'index.html'));
      });
    }
  } else {
    app.get('/', (req, res) => {
      res.json({
        status: 'ok',
        message: 'FlowLedger API Gateway is running. Frontend modules run on their Vite dev servers (app:5173, admin:5174, superadmin:5175).',
      });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowLedger API Gateway running on http://localhost:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();
