/* =====================================================================
   ASSISTANT.JS, "AIDEN" : Ali's on-site engineering assistant.
   Runs fully client-side (no backend / no key required).
   Intent-matched knowledge base built from Ali's real resume + projects.

   >>> To upgrade to a LIVE model later, implement callLiveModel() below to
       hit your own backend endpoint (keep API keys server-side, never here).
   ===================================================================== */
(function () {
  "use strict";

  /* =====================================================================
     >>> WIRE A REAL AI HERE <<<
     Leave AI_ENDPOINT = "" to use the built-in offline knowledge base.
     To use a real AI model, stand up your own backend (it keeps your API
     key SECRET, server-side) that accepts { message, history } and returns
     { reply }. Then put its URL below, e.g.:
        const AI_ENDPOINT = "https://your-backend.com/api/assistant";
     That's the only line you need to change. See callLiveModel() below.
     ===================================================================== */
  const AI_ENDPOINT = "";

  const log = document.getElementById("chatLog");
  const form = document.getElementById("chatForm");
  const input = document.getElementById("chatInput");
  const quick = document.getElementById("chatQuick");
  if (!log || !form || !input) return;

  /* ---- knowledge base ---- */
  const KB = [
    {
      id: "who",
      keys: ["who", "about", "yourself", "ali", "tell me", "introduce", "background", "summary"],
      a: "Ali Hussein is a <b>Computer Engineering</b> student at <b>Texas A&amp;M University</b> (B.S., May 2027) with a <b>Mathematics</b> minor. He's a hardware-focused engineer who loves digital systems, computer architecture, RTL/Verilog design, and verification. Think: someone who builds and verifies digital hardware from the logic gate up."
    },
    {
      id: "goal",
      keys: ["intern", "internship", "looking for", "hire", "summer", "available", "job", "seeking", "role"],
      a: "Ali is seeking a <b>Summer 2026 Hardware Engineering internship</b> focused on digital systems, RTL design, and verification. He's eligible to intern in the U.S. The fastest way to reach him is the <b>Contact</b> page, or email <b>ali.hussein24@tamu.edu</b>."
    },
    {
      id: "skills",
      keys: ["skill", "stack", "language", "tools", "know", "tech", "proficien", "good at", "expert"],
      a: "Core stack: <b>Verilog</b>, <b>C/C++</b>, <b>Python</b>, and <b>ARMv8 Assembly</b>. Hardware/RTL: digital logic, FSMs, FPGA prototyping in <b>Vivado</b>, computer architecture, cache/memory systems. EDA & sim: Vivado, Multisim, LTspice, GTKWave. Debug: Linux, Git, gdb. Lab gear: oscilloscope, Analog Discovery 2, ZYBO Z7-10, Raspberry Pi 4. See the <b>Skills</b> page for the full breakdown."
    },
    {
      id: "projects",
      keys: ["project", "built", "work", "portfolio", "made", "build", "show me"],
      a: "On the web side: <b>Reveille Bubble Tea</b>, a full-stack point-of-sale platform (customer kiosk, cashier terminal, manager dashboard) built with a team and deployed live. On the hardware side: <b>LRU Cache Simulator</b> (O(1) replacement), <b>Single-Cycle ARMv8 CPU</b> (full datapath, team), <b>Motion Sensor Alarm</b> (IR + comparator), <b>Digital Combination Lock</b> on the ZYBO Z7-10, and a <b>C++ Banking Authentication</b> program. Open the <b>Projects</b> page for the full command center."
    },
    {
      id: "cache",
      keys: ["cache", "lru", "memory simulator", "set associative"],
      a: "The <b>LRU Cache Simulator</b> is a configurable set-associative cache that reports hit/miss statistics from memory traces. Ali designed an <b>O(1)</b> LRU replacement policy using a hash map + doubly linked list, then used it to study miss-rate tradeoffs across cache configurations, exactly the kind of architecture analysis you'd do tuning a real memory hierarchy."
    },
    {
      id: "cpu",
      keys: ["cpu", "armv8", "arm", "processor", "datapath", "single cycle", "single-cycle"],
      a: "The <b>Single-Cycle ARMv8 CPU</b> (team project) implements a full datapath, fetch, decode, register file, ALU, memory, and write-back. Ali helped build the control-unit logic for R-type, load/store, and branch instructions, validating behavior through directed instruction testing and datapath/control tracing."
    },
    {
      id: "bubbletea",
      keys: ["bubble", "boba", "reveille", "web", "website", "full stack", "fullstack", "pos", "restaurant", "app", "frontend", "backend", "api", "team 25", "team25"],
      a: "<b>Reveille Bubble Tea</b> is a full-stack point-of-sale platform Ali built with a team. It has three role-based interfaces on one shared API and database: a <b>customer kiosk</b> (ordering, rewards points, spin-the-wheel, drink customization), a <b>cashier terminal</b> (TAMU login + staff PIN), and a <b>manager dashboard</b> (analytics, inventory, menu editing, employee management, reports). It's deployed live, you can open it from the <b>Projects</b> page."
    },
    {
      id: "lock",
      keys: ["lock", "combination", "zybo", "fpga"],
      a: "The <b>Digital Combination Lock</b> runs on the <b>ZYBO Z7-10 FPGA</b>: onboard switches enter the code and LEDs indicate lock status. Ali verified the Verilog compare logic on real hardware and documented the required waveforms and screenshots."
    },
    {
      id: "alarm",
      keys: ["alarm", "motion", "sensor", "ir", "infrared", "comparator", "buzzer"],
      a: "The <b>Motion Sensor Alarm</b> (team project) is an infrared presence detector that triggers a buzzer via comparator thresholding. Ali shared circuit assembly, threshold calibration, and testing across varying ambient-light conditions, a clean analog-to-digital decision pipeline."
    },
    {
      id: "bank",
      keys: ["bank", "banking", "c++", "authentication", "cpp"],
      a: "The <b>Banking Authentication Program</b> is a C++ command-line app with credential verification and robust input error handling. Ali debugged it using <b>gdb</b> breakpoints and step-through execution against automated test scripts, solid low-level debugging discipline."
    },
    {
      id: "experience",
      keys: ["experience", "tutor", "coach", "mcdonald", "leader", "job history", "employ", "teaching"],
      a: "Experience: <b>Academic Coach / Tutor</b> at Blinn College (since Nov 2023), tutored 50+ students in physics & math across 100+ sessions. Before that, <b>Team Leader at McDonald's</b>, ran shifts for 300+ customers and trained 20+ employees. Both sharpened the communication and leadership that good engineers need. Full detail on the <b>Experience</b> page."
    },
    {
      id: "education",
      keys: ["education", "school", "university", "gpa", "degree", "blinn", "study", "college", "major"],
      a: "Education: <b>Texas A&amp;M University</b>, B.S. Computer Engineering, minor in Mathematics, graduating <b>May 2027</b> (GPA 3.1). Prior: <b>Blinn College</b> engineering coursework (GPA 3.92, Chancellor's &amp; Dean's List, 52 credit hours)."
    },
    {
      id: "verification",
      keys: ["verification", "verify", "test", "rtl", "validate", "debug"],
      a: "Verification is a core theme of Ali's work: he validates RTL with directed testing and waveform inspection (GTKWave), confirms behavior on real FPGA hardware, and debugs C/C++ with gdb. The philosophy across every project: <b>measure and verify rather than guess.</b>"
    },
    {
      id: "activities",
      keys: ["ieee", "club", "organization", "activit", "scla", "society"],
      a: "Ali is active in <b>IEEE (Texas A&amp;M Student Branch)</b>, technical workshops, industry talks, and hands-on build sessions, and the <b>Society for Collegiate Leadership &amp; Achievement (SCLA)</b>, completing career-readiness and portfolio modules."
    },
    {
      id: "contact",
      keys: ["contact", "email", "reach", "linkedin", "github", "phone", "connect", "message"],
      a: "Reach Ali at <b>ali.hussein24@tamu.edu</b> or via the <b>Contact</b> page. You'll also find his LinkedIn and GitHub in the footer of every page."
    },
    {
      id: "resume",
      keys: ["resume", "cv", "download", "pdf"],
      a: "Ali's full resume is embedded on the <b>Skills</b> page, and there's a download button there too. Want the highlights? Just ask me about his projects or skills."
    },
    {
      id: "why",
      keys: ["why", "stand out", "different", "special", "best", "recruiter", "impress"],
      a: "What makes Ali stand out: he doesn't just write code or wire a board, he reasons about systems end-to-end, validates on real hardware, and communicates clearly (years of tutoring will do that). He bridges low-level hardware and modern software with a verification-first mindset."
    },
  ];

  const GREET = ["hi", "hey", "hello", "yo", "sup", "howdy"];
  const THANKS = ["thank", "thanks", "appreciate", "cool", "nice", "awesome", "great"];

  function findAnswer(qRaw) {
    const q = qRaw.toLowerCase().trim();
    if (GREET.some(g => q === g || q.startsWith(g + " ")))
      return "Hey, I'm <b>AIDEN</b>. What would you like to know, his projects, his skills, his experience, or how to reach him?";
    if (THANKS.some(t => q.includes(t)) && q.length < 22)
      return "Anytime. Want me to walk you through his projects or pull up how to contact him?";
    // score each entry
    let best = null, bestScore = 0;
    for (const item of KB) {
      let score = 0;
      for (const k of item.keys) if (q.includes(k)) score += k.length > 4 ? 2 : 1;
      if (score > bestScore) { bestScore = score; best = item; }
    }
    if (best && bestScore > 0) return best.a;
    return "Good question, I'm focused on Ali's engineering background, so I can answer about his <b>projects</b>, <b>skills &amp; tools</b>, <b>experience</b>, <b>education</b>, or <b>how to contact him</b>. Which one would help?";
  }

  /* ---- LIVE model hook ----
     Active automatically when AI_ENDPOINT (top of file) is set. Your backend
     receives { message, history } and must return JSON like { "reply": "..." }.
     Keep all API keys on the server. Never put a real key in this file. */
  async function callLiveModel(message, hist) {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: hist })
    });
    if (!res.ok) throw new Error("AI endpoint error " + res.status);
    const data = await res.json();
    return data.reply;
  }

  const history = [];
  function add(role, html) {
    const m = document.createElement("div");
    m.className = "msg " + (role === "me" ? "me" : "ai");
    m.innerHTML = html;
    log.appendChild(m);
    log.scrollTop = log.scrollHeight;
    return m;
  }
  function typing() {
    const t = document.createElement("div");
    t.className = "typing";
    t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t); log.scrollTop = log.scrollHeight;
    return t;
  }

  function respond(text) {
    history.push({ role: "user", content: text });
    const t = typing();
    if (AI_ENDPOINT) {
      callLiveModel(text, history).then(reply => {
        t.remove();
        const answer = reply || "Sorry, I didn't catch that. Try asking about Ali's projects, skills, or experience.";
        add("ai", answer);
        history.push({ role: "assistant", content: answer });
      }).catch(() => {
        t.remove();
        const answer = findAnswer(text);
        add("ai", answer);
        history.push({ role: "assistant", content: answer });
      });
      return;
    }
    const answer = findAnswer(text);
    const delay = 480 + Math.min(answer.length * 7, 900);
    setTimeout(() => {
      t.remove();
      add("ai", answer);
      history.push({ role: "assistant", content: answer });
    }, delay);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = input.value.trim();
    if (!v) return;
    add("me", v.replace(/</g, "&lt;"));
    input.value = "";
    respond(v);
  });

  if (quick) quick.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const q = b.dataset.q || b.textContent;
    add("me", q);
    respond(q);
  });
})();
