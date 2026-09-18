import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../security/validate.ts';
import { config } from '../config.ts';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.code, message: err.message });
  }

  const multerErr = err as { code?: string; message?: string };
  if (multerErr?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file_too_large', message: 'Encrypted file exceeds the upload limit.' });
  }

  if (!config.isProd) {
    console.error(err);
  } else {
    console.error('request_failed');
  }

  return res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again.' });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'not_found', message: 'Not found.' });
}
