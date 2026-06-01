# Ali Hussein - Portfolio (alihussein.tech)

A futuristic, hardware-engineering portfolio built as a fast, dependency-light static site.
Dark space theme · A&M maroon + electric-steel accents · 3D hero · cinematic motion · built-in AI assistant.

## Pages
- `index.html` - hero (3D core), about, highlights, featured projects, **AIDEN** chat bot, CTA
- `projects.html` - full-stack web apps (Reveille Bubble Tea, click to open the breakdown) + hardware projects + engineering journal gallery (click any image to enlarge)
- `skills.html` - animated skill matrix, tools/bench chips, embedded + downloadable resume
- `experience.html` - career timeline, leadership/IEEE/SCLA, "beyond the bench"
- `designer.html` - **Creative** page: video editing + design toolkit (CapCut, Premiere, etc.) and Instagram reels
- `contact.html` - contact channels + a no-backend email form (opens your mail app)

## Run it locally
Just open `index.html` in a browser. Or serve it (recommended, so the resume PDF + 3D load cleanly):
```bash
cd project
python3 -m http.server 8080
# visit http://localhost:8080
```

## Deploy
It's 100% static - host anywhere:
- **GitHub Pages**: push this folder to a repo, enable Pages on the `main` branch (root). Point `alihussein.tech` at it via a `CNAME` DNS record.
- **Netlify / Vercel / Cloudflare Pages**: drag-and-drop the folder, no build step.
Keep the `assets/` folder next to the HTML files - all paths are relative.

## Tech notes (no build tools, nothing to compile)
- **CSS**: one file, `assets/css/main.css` (design tokens at the top - change colors/fonts there).
- **JS** (vanilla, no frameworks):
  - `core.js` - boot loader, particle field, custom cursor, smooth scroll, scroll reveals, typewriter, count-up stats, lightbox.
  - `hero3d.js` - Three.js 3D core (loads from CDN; **auto-falls back** to an animated 2D canvas if the CDN is blocked, so the hero never breaks).
  - `assistant.js` - **AIDEN**, the chat bot. Runs fully client-side today (a knowledge base about you) with zero backend, and is ready to connect to a real AI model via one line (see below).

## Wiring AIDEN to a real AI model later
Open `assets/js/assistant.js` and find the commented `callLiveModel()` stub near the bottom.
The intended pattern: deploy a tiny serverless function (Cloudflare Worker / Vercel function) that holds
your API key **server-side**, calls the model, and returns the text. Then point `callLiveModel()` at that
endpoint. Never put an API key directly in this file - it's public.

## Editing content
All copy lives directly in the HTML. To change a project, edit its card in `projects.html`
(and the matching featured card in `index.html`). Skill levels are the `data-fill` numbers
on the bars in `skills.html`. Replace images in `assets/img/` (keep the same filenames, or update the `src`).
