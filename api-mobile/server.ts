import express from 'express';
import cors from 'cors';
import { authRouter } from './auth';
import { dataRouter } from '../api/routers/data';
import { aiRouter } from '../api/routers/ai';
import { eventsRouter } from '../api/events';

const PORT = 3001;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use(cors()); // Allow all for mobile API, or configure as needed

  // Mount the auth endpoints specifically for mobile
  app.use('/auth', authRouter);

  // Mount all other data/ledger endpoints from the main API
  app.use('/', dataRouter);
  app.use('/', aiRouter);
  app.use('/', eventsRouter);

  app.get('/', (req, res) => {
    res.json({
      status: 'ok',
      message: 'FlowLedger Mobile API is running.',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FlowLedger Mobile API Gateway running on http://localhost:${PORT}`);
  });
}

startServer();
