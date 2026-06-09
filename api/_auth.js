// Session helpers + JSON body reader. Underscore-prefixed -> not a route.
import jwt from 'jsonwebtoken';
const SECRET = process.env.SESSION_SECRET || 'dev-insecure-change-me';
const COOKIE = 'ah_session';
const MAXAGE = 7 * 24 * 3600;

export function setSession(res, user) {
  const token = jwt.sign(user, SECRET, { expiresIn: '7d' });
  res.setHeader('Set-Cookie',
    `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; Max-Age=${MAXAGE}; SameSite=Lax; Secure`);
}
export function clearSession(res) {
  res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax; Secure`);
}
export function getUser(req) {
  try {
    const cookie = req.headers.cookie || '';
    const m = cookie.match(/(?:^|;\s*)ah_session=([^;]+)/);
    if (!m) return null;
    return jwt.verify(decodeURIComponent(m[1]), SECRET);
  } catch { return null; }
}
export function readJson(req) {
  return new Promise(resolve => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let data = '';
    req.on('data', c => (data += c));
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { resolve({}); } });
    req.on('error', () => resolve({}));
  });
}
