import { getUser, readJson } from '../_auth.js';
import { q } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const u = getUser(req);
    const all = (req.url || '').includes('all=1');
    if (all && u && u.isAdmin) {
      try {
        const rows = await q(
          `select id, visitor_name, visitor_email, body, approved, created_at from guestbook order by created_at desc limit 100`);
        return res.status(200).json({ entries: rows, admin: true });
      } catch (e) { return res.status(200).json({ entries: [], admin: true }); }
    }
    try {
      const rows = await q(
        `select visitor_name, body, created_at from guestbook where approved=true order by created_at desc limit 50`);
      return res.status(200).json({ entries: rows });
    } catch (e) { return res.status(200).json({ entries: [] }); }
  }
  if (req.method === 'POST') {
    const u = getUser(req);
    if (!u) return res.status(401).json({ error: 'sign in first' });
    try {
      const b = await readJson(req);
      const body = String(b.body || '').slice(0, 500);
      if (!body) return res.status(400).json({ error: 'empty' });
      await q(`insert into guestbook(visitor_email,visitor_name,body,approved) values($1,$2,$3,false)`,
        [u.email, u.name, body]);
      return res.status(200).json({ ok: true, pending: true });
    } catch (e) { return res.status(500).json({ error: 'db error' }); }
  }
  // admin approve: PATCH { id, approved }
  if (req.method === 'PATCH') {
    const u = getUser(req);
    if (!u || !u.isAdmin) return res.status(403).json({ error: 'forbidden' });
    try {
      const b = await readJson(req);
      await q(`update guestbook set approved=$2 where id=$1`, [b.id, !!b.approved]);
      return res.status(200).json({ ok: true });
    } catch (e) { return res.status(500).json({ error: 'db error' }); }
  }
  res.status(405).end();
}
