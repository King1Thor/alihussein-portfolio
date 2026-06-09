import { getUser } from '../_auth.js';
export default function handler(req, res) {
  res.status(200).json({ user: getUser(req) });
}
