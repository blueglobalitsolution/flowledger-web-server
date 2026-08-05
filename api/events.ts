import { Request, Response, Router } from 'express';
import type { AuthPayload } from './auth';

const clients = new Set<Response>();

export function broadcastChange(): void {
  for (const res of clients) {
    try {
      res.write('data: changed\n\n');
    } catch {
      clients.delete(res);
    }
  }
}

export function broadcastEvent(type: string, payload?: unknown): void {
  for (const res of clients) {
    try {
      res.write(`event: ${type}\n`);
      res.write(`data: ${payload === undefined ? '{}' : JSON.stringify(payload)}\n\n`);
    } catch {
      clients.delete(res);
    }
  }
}

function parseToken(raw: string | undefined): AuthPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, 'base64').toString()) as AuthPayload;
  } catch {
    return null;
  }
}

export const eventsRouter: Router = Router();

eventsRouter.get('/events', (req: Request, res: Response) => {
  const payload = parseToken(req.query.token as string | undefined);
  if (!payload || !['user', 'admin', 'superadmin'].includes(payload.role)) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  res.write('retry: 3000\n\n');

  clients.add(res);
  req.on('close', () => {
    clients.delete(res);
  });
});
