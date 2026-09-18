import rateLimit from 'express-rate-limit';

function limiter(windowMs: number, max: number, message: string) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited', message },
  });
}

export const globalLimiter = limiter(15 * 60 * 1000, 300, 'Too many requests. Please wait and try again.');
export const createShareLimiter = limiter(60 * 60 * 1000, 8, 'Too many secure drops from this network. Try again later.');
export const accessLimiter = limiter(15 * 60 * 1000, 40, 'Too many access attempts. Please wait.');
export const sensitiveLimiter = limiter(15 * 60 * 1000, 8, 'Too many verification attempts. Please wait.');
export const downloadLimiter = limiter(15 * 60 * 1000, 20, 'Too many download requests. Please wait.');
