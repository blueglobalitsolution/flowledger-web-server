import express from 'express';
import cors from 'cors';
import { authRouter } from './auth';

const PORT = 3001;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.use(cors()); // Allow all for mobile API, or configure as needed

  app.use('/auth', authRouter);

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
