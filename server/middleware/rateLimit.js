const buckets = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function clientKey(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

export function rateLimitAuth(req, res, next) {
  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);

  if (!bucket || now - bucket.start > WINDOW_MS) {
    bucket = { start: now, count: 0 };
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  if (bucket.count > MAX_ATTEMPTS) {
    const retrySec = Math.ceil((WINDOW_MS - (now - bucket.start)) / 1000);
    res.setHeader('Retry-After', String(retrySec));
    return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' });
  }

  next();
}
