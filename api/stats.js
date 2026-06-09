import { getUser } from '../_auth.js';
import { q } from '../_db.js';

export default async function handler(req, res) {
  const u = getUser(req);
  if (!u || !u.isAdmin) return res.status(403).json({ error: 'forbidden' });
  try {
    const [totals] = await q(
      `select count(*)::int as views, count(distinct visitor_id)::int as visitors from pageviews`);
    const today = await q(
      `select count(*)::int as views, count(distinct visitor_id)::int as visitors
       from pageviews where created_at::date = now()::date`);
    const perDay = await q(
      `select to_char(created_at,'YYYY-MM-DD') as day, count(*)::int as views,
              count(distinct visitor_id)::int as visitors
       from pageviews where created_at > now() - interval '30 days' group by 1 order by 1`);
    const perPath = await q(
      `select path, count(*)::int as views from pageviews group by 1 order by 2 desc limit 12`);
    const referrers = await q(
      `select coalesce(nullif(referrer,''),'direct') as ref, count(*)::int as n
       from pageviews group by 1 order by 2 desc limit 8`);
    const devices = await q(`select device, count(*)::int as n from pageviews group by 1`);
    const countries = await q(
      `select coalesce(country,'??') as country, count(*)::int as n
       from pageviews group by 1 order by 2 desc limit 8`);
    const recent = await q(
      `select path, country, device, created_at from pageviews order by created_at desc limit 25`);
    res.status(200).json({ totals: totals || { views: 0, visitors: 0 }, today: today[0] || { views: 0, visitors: 0 },
      perDay, perPath, referrers, devices, countries, recent });
  } catch (e) {
    res.status(500).json({ error: 'db error', detail: String(e.message || e) });
  }
}
