# alihussein.tech — Backend setup (Vercel)

Your site now has a real backend: serverless API in `/api`, Postgres storage,
OpenAI-powered AIDEN, Google sign-in, and a private manager dashboard.

Everything is wired to **degrade gracefully** — before you finish this setup the
site still works as a normal static site (AIDEN falls back to its built-in
answers, the contact form opens your email app, etc.). Once the env vars below
are set on Vercel, the live features switch on automatically.

You only ever paste secrets into Vercel's dashboard. Never put a key in the code.

---

## 1. Put the code on GitHub + import to Vercel
- Push this folder to a GitHub repo.
- On vercel.com → **Add New → Project → import the repo**.
- Framework preset: **Other** (it's a static site + `/api` functions). No build command needed; Output dir = root.
- Deploy once. You'll get a `*.vercel.app` URL. (Point alihussein.tech at it later under Project → Domains.)

## 2. Database (Postgres)
Use any hosted Postgres — **Supabase**, **Neon**, or **Render** all have free tiers.
1. Create a database.
2. Open its SQL editor and paste the contents of **`schema.sql`** (in this repo), run it.
3. Copy the **connection string** (looks like `postgresql://user:pass@host:5432/dbname`).
   - Supabase: use the **connection pooling** string (port 6543) for serverless.
4. You'll add it as `DATABASE_URL` in step 5.

## 3. Google sign-in (OAuth client ID)
1. Go to **console.cloud.google.com → APIs & Services → Credentials**.
2. **Create credentials → OAuth client ID → Web application**.
3. Under **Authorized JavaScript origins** add:
   - `https://alihussein.tech`
   - your `https://<project>.vercel.app` URL
   - `http://localhost:3000` (optional, for local testing)
4. Copy the **Client ID** (ends in `.apps.googleusercontent.com`). That's `GOOGLE_CLIENT_ID`.
   (No client *secret* is needed — we verify Google's ID token, we don't do a redirect flow.)

## 4. OpenAI key
- platform.openai.com → **API keys → Create**. Copy it → that's `OPENAI_API_KEY`.
- The assistant uses the cheap, fast **gpt-4o-mini** model and is capped at small replies.

## 5. Set the environment variables on Vercel
Project → **Settings → Environment Variables** (Production + Preview), then **Redeploy**:

| Name | Value |
|------|-------|
| `OPENAI_API_KEY` | your OpenAI key |
| `DATABASE_URL` | your Postgres connection string |
| `GOOGLE_CLIENT_ID` | your Google client id (`...apps.googleusercontent.com`) |
| `ADMIN_EMAIL` | the Google email that should see the dashboard (e.g. your gmail) |
| `SESSION_SECRET` | any long random string (e.g. run `openssl rand -hex 32`) |

## 6. Try it
- Open the site → click **Sign in** (top-right) → choose your Google account.
- If your email matches `ADMIN_EMAIL`, a **Dashboard** link appears → analytics, messages, guestbook moderation.
- Ask AIDEN something → it now answers with GPT using your real project info.
- Submit the contact form → it's stored and shows in the dashboard.

---

## What each API does
- `POST /api/chat` — AIDEN (OpenAI). Rate-limited; logs questions to `chat_logs`.
- `POST /api/track` — anonymous page-view beacon → `pageviews`.
- `POST /api/auth/google` — verifies Google token, sets a secure session cookie.
- `GET /api/auth/me`, `POST /api/auth/logout` — session state.
- `GET /api/stats` — dashboard analytics (admin only).
- `GET/POST /api/messages` — store + list contact messages (list is admin only).
- `GET/POST/PATCH /api/guestbook` — visitor notes + admin approval.
- `GET /api/config` — public, returns the Google client id + whether AI is on.

## Notes
- "Who visited" without sign-in = **anonymous sessions** (counts, pages, device, rough country). Real names only for visitors who sign in.
- A cookie-consent banner is recommended before going wide — say the word and I'll add one.
- To harden the AI rate limit across instances, move it to the DB — easy follow-up.
