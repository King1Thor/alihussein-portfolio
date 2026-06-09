import OpenAI from 'openai';
import { readJson, getUser } from '../_auth.js';
import { q } from '../_db.js';

const SYSTEM = `You are AIDEN, the friendly AI assistant on Ali Hussein's portfolio website (alihussein.tech).
Speak warmly and concisely (2-4 sentences). Only discuss Ali, his work, skills, and how to reach him.
If asked something off-topic, gently steer back to Ali's portfolio.

ABOUT ALI:
- Computer Engineering student at Texas A&M University (B.S., Math minor), graduating May 2027, GPA 3.1.
- Previously Blinn College (52 credit hours of the engineering core, 3.92 GPA, Chancellor's & Dean's List), then transferred to A&M.
- Hardware-first engineer who thinks in systems: digital design, RTL/Verilog, computer architecture, FPGA prototyping, and verification.
- Also edits short-form video (CapCut, Premiere, After Effects, DaVinci) under the handle @maxvj.o.

PROJECTS:
- Reveille Bubble Tea: full-stack point-of-sale web app built with a team. Customer kiosk, cashier terminal, manager dashboard on one shared API + database. Deployed live on Render.
- Single-Cycle ARMv8 CPU (Verilog): full single-cycle datapath + control unit (R-type, load/store, branch), verified with directed tests.
- LRU Cache Simulator (C++): configurable set-associative cache with O(1) LRU; reports hit/miss rates across configs.
- Digital Combination Lock (Verilog on ZYBO Z7-10): FSM-based lock verified on real FPGA hardware.
- Motion Sensor Alarm: IR detector + comparator driving a buzzer; threshold-calibrated.
- Banking Authentication Program (C++): command-line auth with solid error handling, debugged with gdb.

SKILLS: Verilog, C/C++, Python, ARMv8 assembly, HTML/CSS; Vivado, Multisim, LTspice, GTKWave; Linux, Git, VS Code, gdb; oscilloscope, Analog Discovery 2, ZYBO Z7-10, Raspberry Pi 4.

CONTACT: ali.hussein24@tamu.edu. LinkedIn and GitHub are linked in the site footer. There is a Contact page with a message form.`;

const hits = new Map(); // best-effort per-instance rate limit

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'AI is not configured yet' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'x';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (recent.length >= 25) return res.status(429).json({ error: 'Give me a moment, too many messages.' });
  recent.push(now); hits.set(ip, recent);

  try {
    const b = await readJson(req);
    const msg = String(b.message || '').slice(0, 1000);
    if (!msg) return res.status(400).json({ error: 'empty' });
    const history = Array.isArray(b.history) ? b.history.slice(-6) : [];

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const messages = [
      { role: 'system', content: SYSTEM },
      ...history.map(h => ({ role: (h.role === 'user' || h.role === 'me') ? 'user' : 'assistant', content: String(h.content || h.text || '').slice(0, 1000) })),
      { role: 'user', content: msg }
    ];
    const r = await openai.chat.completions.create({
      model: 'gpt-4o-mini', messages, max_tokens: 350, temperature: 0.6
    });
    const reply = (r.choices?.[0]?.message?.content || '').trim() || "Sorry, I couldn't think of an answer just now.";
    try { const u = getUser(req); await q(`insert into chat_logs(question,answer,visitor_id) values($1,$2,$3)`, [msg, reply, u ? u.sub : null]); } catch (e) {}
    res.status(200).json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'ai error' });
  }
}
