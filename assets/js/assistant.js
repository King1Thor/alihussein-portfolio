/* =====================================================================
   ASSISTANT.JS, "AIDEN": floating chat assistant (bottom-right).
   Self-injects a launcher + panel on EVERY page. Stays pinned on scroll.
   Offline knowledge base by default; set AI_ENDPOINT to use a real AI.
   ===================================================================== */
(function () {
  "use strict";

  /* =====================================================================
     >>> WIRE A REAL AI HERE (e.g. GPT) <<<
     Leave AI_ENDPOINT = "" to use the built-in offline knowledge base.
     To use a real model, stand up your OWN small backend that keeps your
     API key secret (server-side), accepts { message, history } and returns
     JSON { reply }. Then set its URL below. That's the only change needed:
        const AI_ENDPOINT = "https://your-backend.com/api/assistant";
     ===================================================================== */
  const AI_ENDPOINT = "";

  /* ---- knowledge base (offline fallback) ---- */
  const KB = [
    { id:"who", keys:["who","about","yourself","ali","tell me","introduce","background","summary"],
      a:"Ali Hussein is a <b>Computer Engineering</b> student at <b>Texas A&amp;M University</b> (B.S., May 2027) with a <b>Mathematics</b> minor. He's a hardware-focused engineer into digital systems, computer architecture, RTL/Verilog design, ASIC/FPGA, and verification, someone who builds and verifies digital hardware from the logic gate up." },
    { id:"contactgoal", keys:["intern","internship","hire","available","job","seeking","role","work with","collaborate","reach","goal"],
      a:"Ali is a hardware / digital-design engineer focused on RTL, ASIC/FPGA, and verification. The best way to reach him is email <b>ali.hussein24@tamu.edu</b> or the <b>Contact</b> page." },
    { id:"skills", keys:["skill","stack","language","tools","know","tech","proficien","good at","expert","asic"],
      a:"Core stack: <b>Verilog</b>, <b>C/C++</b>, <b>Python</b>, and <b>ARMv8 Assembly</b>. Hardware/RTL: digital logic, FSMs, computer architecture, ASIC/RTL design, FPGA prototyping in <b>Vivado</b>, cache/memory systems. EDA &amp; sim: Vivado, Multisim, LTspice, GTKWave. Debug: Linux, Git, gdb. Lab gear: oscilloscope, Analog Discovery 2, ZYBO Z7-10, Raspberry Pi 4. See the <b>Skills</b> page for the full breakdown." },
    { id:"projects", keys:["project","built","work","portfolio","made","build","show me"],
      a:"On the web side: <b>Reveille Bubble Tea</b>, a full-stack point-of-sale platform (customer kiosk, cashier terminal, manager dashboard) built with a team and deployed live. On the hardware side: <b>LRU Cache Simulator</b>, <b>Single-Cycle ARMv8 CPU</b>, <b>Motion Sensor Alarm</b>, <b>Digital Combination Lock</b> on the ZYBO Z7-10, and a <b>C++ Banking Authentication</b> program. Open the <b>Projects</b> page for the full set." },
    { id:"cache", keys:["cache","lru","memory simulator","set associative"],
      a:"The <b>LRU Cache Simulator</b> is a configurable set-associative cache reporting hit/miss statistics from memory traces. Ali designed an <b>O(1)</b> LRU replacement policy using a hash map + doubly linked list to study miss-rate tradeoffs across configurations." },
    { id:"cpu", keys:["cpu","armv8","arm","processor","datapath","single cycle","single-cycle"],
      a:"The <b>Single-Cycle ARMv8 CPU</b> (team project) implements a full datapath: fetch, decode, register file, ALU, memory, and write-back. Ali helped build the control-unit logic for R-type, load/store, and branch instructions, validated through directed testing and datapath/control tracing." },
    { id:"bubbletea", keys:["bubble","boba","reveille","web","website","full stack","fullstack","pos","restaurant","app","frontend","backend","api","team 25","team25"],
      a:"<b>Reveille Bubble Tea</b> is a full-stack point-of-sale platform Ali built with a team. Three role-based interfaces on one shared API and database: a <b>customer kiosk</b> (ordering, rewards, spin-the-wheel, customization), a <b>cashier terminal</b> (TAMU login + staff PIN), and a <b>manager dashboard</b> (analytics, inventory, menu editing, reports). It's deployed live, open it from the <b>Projects</b> page." },
    { id:"lock", keys:["lock","combination","zybo","fpga"],
      a:"The <b>Digital Combination Lock</b> runs on the <b>ZYBO Z7-10 FPGA</b>: onboard switches enter the code and LEDs show lock status. Ali verified the Verilog compare logic on real hardware and documented the waveforms." },
    { id:"alarm", keys:["alarm","motion","sensor","ir","infrared","comparator","buzzer"],
      a:"The <b>Motion Sensor Alarm</b> (team project) is an infrared presence detector that triggers a buzzer via comparator thresholding, with circuit assembly, threshold calibration, and testing across ambient-light conditions." },
    { id:"bank", keys:["bank","banking","c++","authentication","cpp"],
      a:"The <b>Banking Authentication Program</b> is a C++ command-line app with credential verification and robust input error handling, debugged using <b>gdb</b> breakpoints against automated test scripts." },
    { id:"experience", keys:["experience","tutor","coach","mcdonald","leader","job history","employ","teaching"],
      a:"Experience: <b>Academic Coach / Tutor</b> at Blinn College (since Nov 2023), 50+ students in physics &amp; math across 100+ sessions. Earlier, <b>Team Leader at McDonald's</b>, ran shifts for 300+ customers and trained 20+ employees. Full detail on the <b>Experience</b> page." },
    { id:"education", keys:["education","school","university","gpa","degree","blinn","study","college","major"],
      a:"Education: <b>Texas A&amp;M University</b>, B.S. Computer Engineering, minor in Mathematics, graduating <b>May 2027</b> (GPA 3.1). Prior: <b>Blinn College</b> engineering coursework (GPA 3.92, Chancellor's &amp; Dean's List, 52 credit hours)." },
    { id:"creative", keys:["creative","edit","editing","video","design","designer","capcut","instagram","reel"],
      a:"Outside engineering, Ali edits short-form video and designs visuals using <b>CapCut</b>, <b>Adobe Premiere Pro</b>, <b>After Effects</b>, <b>Photoshop</b>, and <b>DaVinci Resolve</b>. See the <b>Creative</b> page." },
    { id:"verification", keys:["verification","verify","test","rtl","validate","debug"],
      a:"Verification is a core theme of Ali's work: directed testing and waveform inspection (GTKWave), on-board FPGA validation, and gdb debugging for C/C++. The philosophy: <b>measure and verify rather than guess.</b>" },
    { id:"contact", keys:["contact","email","linkedin","github","phone","connect","message","resume","cv"],
      a:"Reach Ali at <b>ali.hussein24@tamu.edu</b> or via the <b>Contact</b> page. His LinkedIn and GitHub are in the footer of every page." },
  ];

  const GREET = ["hi","hey","hello","yo","sup","howdy"];
  const THANKS = ["thank","thanks","appreciate","cool","nice","awesome","great"];

  function findAnswer(qRaw) {
    const q = qRaw.toLowerCase().trim();
    if (GREET.some(g => q === g || q.startsWith(g + " ")))
      return "Hey, I'm <b>AIDEN</b>. What would you like to know, his projects, skills, experience, or how to reach him?";
    if (THANKS.some(t => q.includes(t)) && q.length < 22)
      return "Anytime. Want me to walk you through his projects, or pull up how to contact him?";
    let best = null, bestScore = 0;
    for (const item of KB) {
      let score = 0;
      for (const k of item.keys) if (q.includes(k)) score += k.length > 4 ? 2 : 1;
      if (score > bestScore) { bestScore = score; best = item; }
    }
    if (best && bestScore > 0) return best.a;
    return "Good question. I can tell you about Ali's <b>projects</b>, <b>skills &amp; tools</b>, <b>experience</b>, <b>education</b>, or <b>how to contact him</b>. Which one helps?";
  }

  async function callLiveModel(message, hist) {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, history: hist })
    });
    if (!res.ok) throw new Error("AI endpoint error " + res.status);
    const data = await res.json();
    return data.reply;
  }

  /* ---- build the floating UI ---- */
  const fab = document.createElement("button");
  fab.className = "aiden-fab"; fab.type = "button"; fab.setAttribute("aria-label", "Open AIDEN assistant");
  fab.innerHTML =
    '<svg class="i-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.8-.9L3 21l1.9-5.7a8.5 8.5 0 0 1-.9-3.8A8.38 8.38 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5z"/></svg>' +
    '<svg class="i-x" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
    '<span class="aiden-fab-dot"></span>';

  const panel = document.createElement("div");
  panel.className = "aiden-panel";
  panel.innerHTML =
    '<div class="aiden-hd">' +
      '<div class="av"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></svg></div>' +
      '<div class="t"><div class="n">AIDEN</div><div class="s"><span class="d"></span> ASSISTANT · ONLINE</div></div>' +
      '<button class="aiden-min" type="button" aria-label="Close">&#10005;</button>' +
    '</div>' +
    '<div class="aiden-log" id="aidenLog"></div>' +
    '<div class="aiden-quick" id="aidenQuick">' +
      '<button data-q="What projects has Ali built?">Projects</button>' +
      '<button data-q="What are Ali\'s main skills?">Skills</button>' +
      '<button data-q="Tell me about Ali\'s experience">Experience</button>' +
      '<button data-q="How do I contact Ali?">Contact</button>' +
    '</div>' +
    '<form class="aiden-input" id="aidenForm" autocomplete="off">' +
      '<input id="aidenInput" type="text" placeholder="Ask about Ali\'s work…" aria-label="Message">' +
      '<button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg></button>' +
    '</form>';

  document.body.append(fab, panel);

  const log = panel.querySelector("#aidenLog");
  const form = panel.querySelector("#aidenForm");
  const input = panel.querySelector("#aidenInput");
  const quick = panel.querySelector("#aidenQuick");
  let greeted = false;

  function add(role, html) {
    const m = document.createElement("div");
    m.className = "aiden-msg " + (role === "me" ? "me" : "ai");
    m.innerHTML = html;
    log.appendChild(m); log.scrollTop = log.scrollHeight;
    return m;
  }
  function typing() {
    const t = document.createElement("div");
    t.className = "aiden-typing"; t.innerHTML = "<i></i><i></i><i></i>";
    log.appendChild(t); log.scrollTop = log.scrollHeight; return t;
  }
  const history = [];
  function respond(text) {
    history.push({ role: "user", content: text });
    const t = typing();
    const finish = (answer) => { t.remove(); add("ai", answer); history.push({ role: "assistant", content: answer }); };
    if (AI_ENDPOINT) {
      callLiveModel(text, history)
        .then(r => finish(r || "Sorry, I didn't catch that. Ask about Ali's projects, skills, or experience."))
        .catch(() => finish(findAnswer(text)));
      return;
    }
    const answer = findAnswer(text);
    setTimeout(() => finish(answer), 460 + Math.min(answer.length * 6, 800));
  }

  function openPanel() {
    panel.classList.add("open"); fab.classList.add("open");
    if (!greeted) {
      greeted = true;
      add("ai", "Hey, I'm <b>AIDEN</b>, Ali's assistant. What would you like to know, his projects, skills, experience, or how to reach him?");
    }
    setTimeout(() => input.focus(), 250);
  }
  function closePanel() { panel.classList.remove("open"); fab.classList.remove("open"); }
  function toggle() { panel.classList.contains("open") ? closePanel() : openPanel(); }

  fab.addEventListener("click", toggle);
  panel.querySelector(".aiden-min").addEventListener("click", closePanel);
  document.addEventListener("keydown", e => { if (e.key === "Escape") closePanel(); });
  document.querySelectorAll("[data-aiden-open]").forEach(el =>
    el.addEventListener("click", e => { e.preventDefault(); openPanel(); }));

  form.addEventListener("submit", e => {
    e.preventDefault();
    const v = input.value.trim(); if (!v) return;
    add("me", v.replace(/</g, "&lt;")); input.value = ""; respond(v);
  });
  quick.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    const q = b.dataset.q || b.textContent;
    add("me", q); respond(q);
  });
})();
