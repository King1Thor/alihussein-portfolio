import { OAuth2Client } from 'google-auth-library';
import { setSession, readJson } from '../_auth.js';
import { q } from '../_db.js';
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const { credential } = await readJson(req);
    if (!credential) return res.status(400).json({ error: 'missing credential' });
    const ticket = await client.verifyIdToken({ idToken: credential, audience: process.env.GOOGLE_CLIENT_ID });
    const p = ticket.getPayload();
    const isAdmin = (p.email || '').toLowerCase() === (process.env.ADMIN_EMAIL || '').toLowerCase();
    const user = { sub: p.sub, email: p.email, name: p.name, picture: p.picture, isAdmin };
    try {
      await q(`insert into visitors(id,email,name,picture,is_admin,last_seen)
               values($1,$2,$3,$4,$5,now())
               on conflict (id) do update set name=$3, picture=$4, last_seen=now()`,
        [p.sub, p.email, p.name, p.picture, isAdmin]);
    } catch (e) { /* DB optional */ }
    setSession(res, user);
    res.status(200).json({ user });
  } catch (e) {
    res.status(401).json({ error: 'invalid token' });
  }
}
