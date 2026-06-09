// Public front-end config (only non-secret values). The Google *client id* is public.
export default function handler(req, res) {
  res.status(200).json({
    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    aiEnabled: !!process.env.OPENAI_API_KEY
  });
}
