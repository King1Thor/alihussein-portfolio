import { q } from '../_db.js';
import { getUser, readJson } from '../_auth.js';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const b = await readJson(req);
    const path = String(b.path || '').slice(0, 300);
    const ref = String(b.ref || '').slice(0, 300);
    const ua = String(req.headers['user-agent'] || '').slice(0, 300);
    const country = req.headers['x-vercel-ip-country'] || null;
    const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
    const device = /Mobi|Android|iPhone|iPad/i.test(ua) ? 'mobile' : 'desktop';
    // privacy-friendly anonymous id: signed-in users by id, else a daily-rotating hash (not reversible to an IP)
    const u = getUser(req);
    const day = new Date().toISOString().slice(0, 10);
    const vid = u ? u.sub
      : crypto.createHash('sha256').update(ip + ua + day + (process.env.SESSION_SECRET || '')).digest('hex').slice(0, 32);
    await q(`insert into pageviews(path,referrer,country,device,visitor_id) values($1,$2,$3,$4,$5)`,
      [path, ref, country, device, vid]);
    res.status(204).end();
  } catch (e) {
    res.status(204).end(); // never break the page over analytics
  }
}
