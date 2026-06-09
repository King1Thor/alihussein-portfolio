import { getUser, readJson } from '../_auth.js';
import { q } from '../_db.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const b = await readJson(req);
      const name = String(b.name || '').slice(0, 120);
      const email = String(b.email || '').slice(0, 160);
      const body = String(b.message || '').slice(0, 4000);
      if (!body) return res.status(400).json({ error: 'empty message' });
      await q(`insert into messages(name,email,body) values($1,$2,$3)`, [name, email, body]);
      return res.status(200).json({ ok: true });
    } catch (e) { return res.status(500).json({ error: 'db error' }); }
  }
  if (req.method === 'GET') {
    const u = getUser(req);
    if (!u || !u.isAdmin) return res.status(403).json({ error: 'forbidden' });
    try {
      const rows = await q(`select id,name,email,body,status,created_at from messages order by created_at desc limit 100`);
      return res.status(200).json({ messages: rows });
    } catch (e) { return res.status(500).json({ error: 'db error' }); }
  }
  res.status(405).end();
}
