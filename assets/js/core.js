/* =====================================================================
   CORE.JS, interface runtime for the Ali Hussein engineering portfolio
   Vanilla JS, zero dependencies. Resilient to CDN failures.
   ===================================================================== */
(function () {
  "use strict";
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(max-width: 860px)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* -------------------------------------------------- BOOT SEQUENCE */
  (function boot() {
    const el = $("#boot");
    if (!el) return;
    const log = $(".boot-log", el);
    const bar = $(".boot-bar i", el);
    const lines = [
      "INITIALIZING ENGINEERING INTERFACE",
      "MOUNTING DIGITAL SYSTEMS . . .",
      "LOADING RTL / VERILOG MODULES",
      "EMBEDDED ARCHITECTURE READY",
      "AI ASSISTANT ACTIVE",
      "SYSTEM ONLINE",
    ];
    let i = 0, p = 0;
    // skip a long boot on repeat visits within session
    const seen = sessionStorage.getItem("ah_boot");
    const total = seen ? 600 : 2100;
    const step = total / lines.length;
    const tick = setInterval(() => {
      if (log && lines[i]) log.textContent = lines[i];
      i++;
      if (i >= lines.length) clearInterval(tick);
    }, step);
    const pr = setInterval(() => {
      p = Math.min(100, p + (seen ? 9 : 3.2));
      if (bar) bar.style.width = p + "%";
      if (p >= 100) clearInterval(pr);
    }, 40);
    setTimeout(() => {
      el.classList.add("done");
      sessionStorage.setItem("ah_boot", "1");
      document.body.style.overflow = "";
      window.dispatchEvent(new Event("boot:done"));
    }, total + 250);
    document.body.style.overflow = "hidden";
  })();

  /* -------------------------------------------------- CUSTOM CURSOR (disabled: use the normal mouse pointer) */
  if (false) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring";
    document.body.append(dot, ring);
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    });
    (function follow() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(follow);
    })();
    const hot = "a,button,.proj,.gal .it,.chip,input,textarea,.contact-line";
    document.addEventListener("mouseover", e => {
      if (e.target.closest(hot)) ring.classList.add("hot");
    });
    document.addEventListener("mouseout", e => {
      if (e.target.closest(hot)) ring.classList.remove("hot");
    });
  }

  /* -------------------------------------------------- PARTICLE FIELD */
  (function particles() {
    const c = $("#bg-canvas");
    if (!c || reduce) return;
    const ctx = c.getContext("2d");
    let w, h, pts = [], mouse = { x: -999, y: -999 };
    const COUNT = isTouch ? 34 : 70;
    function size() {
      w = c.width = innerWidth * devicePixelRatio;
      h = c.height = innerHeight * devicePixelRatio;
      c.style.width = innerWidth + "px"; c.style.height = innerHeight + "px";
    }
    function seed() {
      pts = Array.from({ length: COUNT }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - .5) * .25 * devicePixelRatio,
        vy: (Math.random() - .5) * .25 * devicePixelRatio,
        r: (Math.random() * 1.4 + .5) * devicePixelRatio,
      }));
    }
    size(); seed();
    addEventListener("resize", () => { size(); seed(); });
    addEventListener("mousemove", e => {
      mouse.x = e.clientX * devicePixelRatio; mouse.y = e.clientY * devicePixelRatio;
    });
    const LINK = 130 * devicePixelRatio, PULL = 150 * devicePixelRatio;
    function isLight() { return document.documentElement.getAttribute("data-theme") === "light"; }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      const light = isLight();
      const dotCol = light ? "rgba(55,70,120,.8)" : "rgba(127,227,255,.55)";
      const lineRGB = light ? "60,80,140" : "120,150,210";
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < PULL) { p.x += dx / d * .6; p.y += dy / d * .6; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = dotCol;
        ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          if (dist < LINK) {
            const o = (1 - dist / LINK) * (light ? .7 : .35);
            ctx.strokeStyle = `rgba(${lineRGB},${o})`;
            ctx.lineWidth = devicePixelRatio * .6;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      requestAnimationFrame(frame);
    }
    frame();
  })();

  /* -------------------------------------------------- SMOOTH SCROLL (inertia) */
  (function smooth() {
    if (reduce || isTouch) return;
    let target = window.scrollY, current = window.scrollY, raf = null, active = false;
    const ease = 0.085;
    function loop() {
      current += (target - current) * ease;
      if (Math.abs(target - current) < 0.4) { current = target; active = false; }
      window.scrollTo(0, current);
      if (active) raf = requestAnimationFrame(loop); else raf = null;
    }
    addEventListener("wheel", e => {
      if (e.ctrlKey) return;
      if (document.documentElement.classList.contains("modal-open")) return;
      const open = $(".nav-links.open");
      if (open) return;
      e.preventDefault();
      target = Math.max(0, Math.min(target + e.deltaY,
        document.documentElement.scrollHeight - innerHeight));
      if (!active) { active = true; current = window.scrollY; loop(); }
    }, { passive: false });
    addEventListener("scroll", () => { if (!active) { target = window.scrollY; } });
  })();

  /* -------------------------------------------------- NAV */
  (function nav() {
    const nav = $(".nav");
    const burger = $(".burger");
    const links = $(".nav-links");
    if (nav) addEventListener("scroll", () => {
      nav.classList.toggle("shrink", window.scrollY > 60);
    });
    if (burger && links) {
      burger.addEventListener("click", () => {
        burger.classList.toggle("open");
        links.classList.toggle("open");
      });
      $$("a", links).forEach(a => a.addEventListener("click", () => {
        burger.classList.remove("open"); links.classList.remove("open");
      }));
    }
  })();

  /* -------------------------------------------------- REVEAL ON SCROLL */
  (function reveal() {
    const els = $$(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.classList.add("show");
          // animate skill bars within
          $$(".bar .track i", en.target).forEach(b => {
            if (b.dataset.fill) b.style.width = b.dataset.fill + "%";
          });
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    els.forEach(el => io.observe(el));
  })();

  /* -------------------------------------------------- TYPEWRITER (hero) */
  (function typer() {
    const el = $("[data-type]");
    if (!el) return;
    let phrases;
    try { phrases = JSON.parse(el.dataset.type); } catch { return; }
    const caret = '<span class="caret">▋</span>';
    let pi = 0, ci = 0, del = false;
    function tick() {
      const full = phrases[pi];
      ci += del ? -1 : 1;
      el.innerHTML = full.slice(0, ci) + caret;
      let wait = del ? 38 : 70;
      if (!del && ci === full.length) { wait = 1700; del = true; }
      else if (del && ci === 0) { del = false; pi = (pi + 1) % phrases.length; wait = 320; }
      setTimeout(tick, wait);
    }
    if (reduce) { el.innerHTML = phrases[0] + caret; return; }
    setTimeout(tick, 400);
  })();

  /* -------------------------------------------------- COUNT-UP STATS */
  (function counters() {
    const els = $$("[data-count]");
    if (!els.length) return;
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target, end = parseFloat(el.dataset.count);
      const suf = el.dataset.suffix || "", dur = 1400; let t0 = null;
      function run(t) {
        if (!t0) t0 = t;
        const p = Math.min((t - t0) / dur, 1);
        const v = end * (1 - Math.pow(1 - p, 3));
        el.textContent = (end % 1 ? v.toFixed(2) : Math.round(v)) + suf;
        if (p < 1) requestAnimationFrame(run);
      }
      requestAnimationFrame(run); io.unobserve(el);
    }), { threshold: .5 });
    els.forEach(el => io.observe(el));
  })();

  /* -------------------------------------------------- HERO BIG-TYPE PARALLAX */
  (function bigtype() {
    const spans = $$(".hero-bigtype span");
    if (!spans.length || reduce || isTouch) return;
    addEventListener("mousemove", e => {
      const cx = (e.clientX / innerWidth - .5);
      spans.forEach((s, i) => {
        s.style.setProperty("--px", (cx * (14 + i * 10)) + "px");
      });
    });
  })();

  /* -------------------------------------------------- LIGHTBOX */
  (function lightbox() {
    const items = $$("[data-lightbox]");
    if (!items.length) return;
    const box = document.createElement("div");
    box.id = "lightbox";
    box.innerHTML = '<span class="x mono">[ ESC / CLICK TO CLOSE ]</span><img alt="">';
    document.body.appendChild(box);
    const img = $("img", box);
    items.forEach(it => it.addEventListener("click", () => {
      const src = it.dataset.lightbox || $("img", it)?.src;
      if (!src) return;
      img.src = src; box.classList.add("open");
    }));
    const close = () => box.classList.remove("open");
    box.addEventListener("click", close);
    addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  })();

  /* -------------------------------------------------- NEURAL CANVAS (assistant) */
  (function neural() {
    const c = $("#neural-canvas");
    if (!c || reduce) return;
    const ctx = c.getContext("2d");
    let w, h, nodes = [];
    function size() {
      const r = c.parentElement.getBoundingClientRect();
      w = c.width = r.width * devicePixelRatio;
      h = c.height = r.height * devicePixelRatio;
    }
    function seed() {
      const cols = 4, rows = 5; nodes = [];
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++)
          nodes.push({
            x: (w / (cols + 1)) * (i + 1), y: (h / (rows + 1)) * (j + 1),
            col: i, base: (h / (rows + 1)) * (j + 1),
            ph: Math.random() * 6.28, r: (Math.random() * 1.6 + 1.4) * devicePixelRatio
          });
    }
    size(); seed();
    new ResizeObserver(() => { size(); seed(); }).observe(c.parentElement);
    let t = 0;
    function frame() {
      t += 0.012; ctx.clearRect(0, 0, w, h);
      nodes.forEach(n => n.y = n.base + Math.sin(t + n.ph) * 9 * devicePixelRatio);
      for (const a of nodes) for (const b of nodes) {
        if (b.col === a.col + 1) {
          const o = 0.10 + 0.10 * Math.abs(Math.sin(t + a.ph));
          ctx.strokeStyle = `rgba(127,227,255,${o})`;
          ctx.lineWidth = devicePixelRatio * .55;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      nodes.forEach(n => {
        const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 4);
        g.addColorStop(0, "rgba(127,227,255,.9)");
        g.addColorStop(1, "rgba(127,227,255,0)");
        ctx.fillStyle = g; ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 4, 0, 7); ctx.fill();
        ctx.fillStyle = "#bfeeff"; ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    frame();
  })();

  /* current year */
  $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear());

  /* -------------------------------------------------- LIGHT / DARK THEME */
  (function theme() {
    const root = document.documentElement;
    let saved = "dark";
    try { saved = localStorage.getItem("ah_theme") || "dark"; } catch (e) {}
    function apply(mode) {
      if (mode === "light") root.setAttribute("data-theme", "light");
      else root.removeAttribute("data-theme");
    }
    apply(saved);
    $$(".theme-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
        apply(next);
        try { localStorage.setItem("ah_theme", next); } catch (e) {}
      });
    });
  })();

  /* -------------------------------------------------- CAPABILITY EXPLORER (tabs) */
  (function capabilities() {
    const tabs = $$(".cap-tab");
    if (!tabs.length) return;
    const panels = $$(".cap-panel");
    function show(id) {
      tabs.forEach(t => t.classList.toggle("active", t.dataset.cap === id));
      panels.forEach(p => {
        const on = p.dataset.cap === id;
        p.classList.toggle("active", on);
      });
    }
    tabs.forEach(t => t.addEventListener("click", () => show(t.dataset.cap)));
    if (tabs[0]) show(tabs[0].dataset.cap);
  })();

  /* -------------------------------------------------- TERM CHIPS (click to define) */
  (function termChips() {
    const out = $("#chipDef");
    const chips = $$(".chip[data-def]");
    if (!out || !chips.length) return;
    chips.forEach(c => c.addEventListener("click", () => {
      const active = c.classList.contains("on");
      chips.forEach(x => x.classList.remove("on"));
      if (active) { out.classList.remove("show"); return; }
      c.classList.add("on");
      out.innerHTML = "<b>" + c.textContent.trim() + "</b>: " + c.dataset.def;
      out.classList.add("show");
    }));
  })();

  /* -------------------------------------------------- PROJECT POPUP (case studies) */
  (function projModal() {
    const modal = $("#projModal");
    if (!modal) return;
    const elKind = $("#pmKind", modal), elTitle = $("#pmTitle", modal),
          elTags = $("#pmTags", modal),
          elVisit = $("#pmVisit", modal), elMark = $("#pmMark", modal),
          elImg = $("#pmImg", modal), elVid = $("#pmVid", modal), elThumbs = $("#pmThumbs", modal), elSteps = $("#pmSteps", modal), elRepo = $("#pmRepo", modal);

    // rich case-study content keyed by project title
    const CASE = {
      "Reveille Bubble Tea": {
        repo: "https://github.com/CSCE-331-Spring-2026-900-908/project3-team25",
        gallery: [
          { src: "assets/img/projects/rbt-kiosk.png", cap: "Customer ordering kiosk" },
          { src: "assets/img/projects/rbt-pos.png", cap: "Cashier POS terminal" },
          { src: "assets/img/projects/rbt-dashboard.png", cap: "Manager analytics dashboard" },
          { src: "assets/img/projects/rbt-landing.png", cap: "Role-based launcher" }
        ],
        steps: [
        ["Problem", "A bubble-tea shop needs one system for customers, cashiers, and managers."],
        ["Design", "Three role-based interfaces on one shared API and database: a customer kiosk, a cashier terminal, and a manager dashboard."],
        ["Verify", "Tested ordering, role-based auth, and the dashboard flows end to end, then deployed on Render."],
        ["Result", "A live POS platform that handles the full ordering-to-management workflow."]
      ]},
      "Single-Cycle ARMv8 CPU": {
        repo: "https://github.com/King1Thor/Hardware-Project",
        gallery: [
          { src: "assets/img/projects/armv8-datapath.png", cap: "Single-cycle datapath + control unit" },
          { src: "assets/img/projects/armv8-results.jpeg", cap: "All tests passed (run on Raspberry Pi)" },
          { src: "assets/img/armv8_whiteboard.jpeg", cap: "Hand-compiling C to ARMv8 assembly" }
        ],
        steps: [
          ["Problem", "Build a working single-cycle ARMv8 processor in Verilog that runs the core instruction set — R-type (AND/ORR/ADD/SUB), I-type, load/store, and branches (CBZ, B) — then extend it to support MOVZ for building full 64-bit constants."],
          ["Design", "Built the main control unit decoding the 11-bit opcode with casez wildcards, driving every control line, and integrated the full datapath: PC + instruction memory, register file, sign extender, ALU, data memory, the write-back mux, and next-PC logic. Added MOVZ via a MovZ flag that zero-extends the 16-bit immediate and shifts it to position hw*16, forwarded straight to the register file."],
          ["Verify", "Wrote a self-checking control testbench that exhaustively expands the wildcard opcodes (I-type, MOVZ, all CBZ and B encodings) and fires random unsupported opcodes to confirm a safe all-zero default. Simulated the whole core with iverilog + GTKWave and ran it on a Raspberry Pi."],
          ["Result", "All tests passed. A MOVZ+ORR program builds the constant 0x123456789ABCDEF0 in a register, stores it to data memory, and loads it back — verifying the MOVZ extension and the full single-cycle datapath end to end."]
        ]
      },
      "LRU Cache Simulator": { steps: [
        ["Problem", "Measure how cache configuration affects hit and miss rates."],
        ["Design", "Built a configurable set-associative cache in C++ with an O(1) LRU policy using a hash map plus a doubly linked list."],
        ["Verify", "Fed memory traces through it and checked hit/miss counts against expected behavior across configurations."],
        ["Result", "A simulator that reports hit rate for any cache setup, handy for studying memory-hierarchy tradeoffs."]
      ]},
      "Digital Combination Lock": { steps: [
        ["Problem", "Implement a lock that opens only on the correct code, on real hardware."],
        ["Design", "Described the lock as a finite state machine in Verilog; onboard switches enter the code and LEDs show locked/unlocked state."],
        ["Verify", "Loaded it onto the ZYBO Z7-10 and confirmed the compare logic and waveforms on the board."],
        ["Result", "A hardware lock that unlocks only for the correct sequence."]
      ]},
      "Motion Sensor Alarm": { steps: [
        ["Problem", "Detect motion and raise an alarm reliably."],
        ["Design", "Built an infrared detector feeding a comparator that drives a buzzer when the threshold is crossed."],
        ["Verify", "Calibrated the threshold and tested across different ambient-light conditions."],
        ["Result", "A working alarm that triggers on presence with few false alarms."]
      ]},
      "Multi-Threaded Banking System": {
        repo: "https://github.com/King1Thor/multi-threaded-banking-system",
        gallery: [
          { src: "assets/img/projects/banking-architecture.svg", cap: "Client/server + thread-pool architecture" }
        ],
        steps: [
          ["Problem", "Serve many banking clients at once over the network without blocking or corrupting shared account data — a real systems-programming problem in concurrency, sockets, and synchronization."],
          ["Design", "A C++ client/server architecture over TCP sockets on Linux. The server listens, accepts connections, and hands each request to a thread pool of persistent workers pulling from a task queue (instead of a thread per request). Shared account state is guarded by mutexes. Code is split into networking, finance, logging, and signal-handling modules."],
          ["Verify", "Connected multiple concurrent clients and exercised transactions under load; mutexes prevent race conditions on shared data; signal handling guarantees a graceful shutdown with clean resource release; the logging module records runtime events for debugging."],
          ["Result", "A concurrent, thread-safe banking server that handles simultaneous clients via a thread-pool model — the same pattern used in production backend services like web servers and fintech platforms."]
        ]
      },
      "Two-Stage MOSFET Amplifier": {
        gallery: [
          { src: "assets/img/projects/amp-schematic.png", cap: "Multisim schematic" },
          { src: "assets/img/projects/amp-scope.jpeg", cap: "Scope: Vin, Vout, THD ~1.9%" },
          { src: "assets/img/projects/amp-breadboard.jpeg", cap: "Breadboard build" }
        ],
        steps: [
          ["Problem", "Design, simulate, and build a two-stage MOSFET amplifier on a ±5 V supply that hits four specs at once: gain |Av| = 40, input resistance ≥ 10 kΩ, output swing ≥ 2 V into 100 Ω, and THD ≤ 8% at 4 kHz."],
          ["Design", "Hand-calculated the full bias, picked the 20 mA tail current, solved the overdrive voltages and the allowed V_RD window, then sized every resistor. Topology: a CD4007P PMOS common-source gain stage driving a 2N7000G source-follower output with an NMOS current-source bias."],
          ["Verify", "Modeled it in Multisim (DC operating point, AC sweep, transient, Fourier/THD), tuned the components, then built it on a breadboard and measured with a Keysight MSO-X 3024T scope and a network analyzer."],
          ["Result", "Met every spec: simulated gain ≈ 40 V/V (measured ≈ 37), input resistance ≈ 21 kΩ, ~2 V output swing, and measured THD ≈ 3.7%, well under the 8% limit."]
        ]
      },
      "Traffic Light Controller": {
        repo: "https://github.com/King1Thor/traffic-light-controller-fsm",
        gallery: [
          { src: "assets/img/projects/tlc-state-diagram.png", cap: "6-state FSM (highway / farm road)" },
          { src: "assets/img/projects/tlc-waveform.png", cap: "Simulation: state + signal timing" },
          { src: "assets/img/projects/tlc-zybo.jpg", cap: "Running on the ZYBO Z7-10 FPGA" }
        ],
        steps: [
          ["Problem", "Design a traffic-light controller for a highway/farm-road intersection that keeps the highway green by default but lets a farm-road sensor request a green, with correctly timed phases — built as an FSM in Verilog and run on real FPGA hardware."],
          ["Design", "A 6-state Moore FSM (S0–S5) driving 2-bit highway and farm-road signals. A 31-bit counter at 50 MHz times each phase (1 / 30 / 3 / 1 / 15 / 3 s); transitions fire when the counter reaches each state's delay, and a farm-road sensor shortens the highway-green phase. n = 31 bits, sized for the longest delay (1.5×10⁹ cycles)."],
          ["Verify", "Simulated the FSM testbench, tracing the counter, state, and the highway/farm signal buses to confirm each state drives the right lights and transitions at the right counts, then synthesized and ran it on the ZYBO Z7-10."],
          ["Result", "A working, sensor-aware traffic-light controller on FPGA hardware, with simulation waveforms matching the designed state sequence and timing."]
        ]
      },
      "4-Bit ALU": {
        repo: "https://github.com/King1Thor/4bit-alu-breadboard-project",
        gallery: [
          { vid: "assets/img/projects/alu-demo.mp4", poster: "assets/img/projects/alu-demo-poster.jpg", cap: "Live 4-bit demo" },
          { src: "assets/img/projects/alu-breadboard.jpg", cap: "Breadboard build (74-series ICs)" },
          { src: "assets/img/projects/alu-whiteboard.jpg", cap: "Gate-level design plan" }
        ],
        steps: [
          ["Problem", "Build a 4-bit ALU from discrete logic on a breadboard that performs addition, subtraction, and bitwise AND, with the operation chosen by control signals."],
          ["Design", "A 4-bit ripple-carry adder (74HC283) with XOR gates (7486) for two's-complement subtraction, AND gates (7408) for bitwise AND, and a 2:1 MUX (74CT257) to select between the sum and AND results. Control bits c0/c1 pick AND / add / subtract; an overflow-detection equation flags signed overflow."],
          ["Verify", "Wired the ICs on a breadboard, drove inputs with jumpers, and read results on LEDs. Checked test cases — 8+5=13, 8−5=3, 7&8=0 — and completed the two's-complement and overflow post-lab table."],
          ["Result", "A working 4-bit ALU whose observed LED outputs matched every expected result across add, subtract, and AND operations."]
        ]
      }
    };

    function open(card) {
      const d = card.dataset;
      const q = s => card.querySelector(s);
      const kind = d.kind || (q(".kind") ? q(".kind").textContent.trim() : "PROJECT");
      const title = d.title || (q("h3") ? q("h3").textContent.replace(/[↗↘\s]+$/, "").trim() : "Project");
      let tags = d.tags ? d.tags.split("|") : $$(".tags span", card).map(s => s.textContent);
      const cs = CASE[title] || {};
      elKind.textContent = kind;
      elTitle.textContent = title;
      elMark.textContent = title.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      elTags.innerHTML = tags.filter(Boolean).map(t => "<span>" + t.trim() + "</span>").join("");
      // artifact media: image(s) and/or a demo video, with thumbnails
      var gal = cs.gallery && cs.gallery.length ? cs.gallery : (function () {
        var single = d.img || cs.img; return single ? [{ src: single }] : [];
      })();
      function stopVid() { if (elVid) { try { elVid.pause(); } catch (e) {} elVid.removeAttribute("src"); elVid.load && elVid.load(); elVid.style.display = "none"; } }
      function showItem(g) {
        if (g && g.vid) {
          if (elVid) { elVid.src = g.vid; if (g.poster) elVid.poster = g.poster; elVid.style.display = ""; }
          elImg.style.display = "none"; elImg.removeAttribute("src");
        } else if (g && g.src) {
          stopVid();
          elImg.src = g.src; elImg.alt = g.cap || (title + " artifact"); elImg.style.display = "";
        }
      }
      if (gal.length) {
        showItem(gal[0]);
        if (elThumbs) {
          if (gal.length > 1) {
            elThumbs.style.display = "";
            elThumbs.innerHTML = gal.map(function (g, i) {
              var thumbSrc = g.vid ? (g.poster || "") : g.src;
              var isVid = g.vid ? " vid" : "";
              return '<button type="button" class="pm-thumb' + isVid + (i === 0 ? " on" : "") + '" data-i="' + i + '" title="' + (g.cap || "") + '"><img src="' + thumbSrc + '" alt=""></button>';
            }).join("");
            Array.prototype.forEach.call(elThumbs.querySelectorAll(".pm-thumb"), function (b) {
              b.addEventListener("click", function () {
                showItem(gal[+b.dataset.i]);
                Array.prototype.forEach.call(elThumbs.querySelectorAll(".pm-thumb"), function (x) { x.classList.remove("on"); });
                b.classList.add("on");
              });
            });
          } else { elThumbs.style.display = "none"; elThumbs.innerHTML = ""; }
        }
      } else {
        elImg.style.display = "none"; elImg.removeAttribute("src");
        stopVid();
        if (elThumbs) { elThumbs.style.display = "none"; elThumbs.innerHTML = ""; }
      }
      const steps = cs.steps || [];
      elSteps.innerHTML = steps.map((s, i) =>
        '<div class="pm-step"><span class="pm-sn">' + (i + 1) + '</span><div><b>' + s[0] + '</b><p>' + s[1] + '</p></div></div>').join("");
      elSteps.style.display = steps.length ? "" : "none";
      if (d.url) { elVisit.href = d.url; elVisit.style.display = ""; elVisit.textContent = (d.visit || "Visit the live site") + "  ↗"; }
      else { elVisit.style.display = "none"; }
      const repo = d.repo || cs.repo;
      if (repo) { elRepo.href = repo; elRepo.style.display = ""; } else { elRepo.style.display = "none"; }
      modal.classList.add("open");
      document.documentElement.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    }
    function close() {
      if (elVid) { try { elVid.pause(); } catch (e) {} elVid.removeAttribute("src"); elVid.load && elVid.load(); }
      modal.classList.remove("open");
      document.documentElement.classList.remove("modal-open");
      document.body.style.overflow = "";
    }
    $$("[data-proj]").forEach(c => {
      c.style.cursor = "pointer";
      c.addEventListener("click", e => { if (e.target.closest("a")) return; open(c); });
    });
    $$(".pm-x", modal).forEach(b => b.addEventListener("click", close));
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  })();

  /* -------------------------------------------------- REEL PLAYER (self-hosted) */
  (function reels() {
    const cards = $$(".reel-card");
    if (!cards.length) return;
    const lb = $("#reelLB");
    const vid = lb ? $("video", lb) : null;
    cards.forEach(c => {
      const v = $("video", c);
      if (v) v.addEventListener("error", () => c.classList.add("missing"), true);
      c.addEventListener("click", () => {
        const src = c.dataset.reel;
        if (!lb || !vid || c.classList.contains("missing")) return;
        vid.src = src;
        lb.classList.add("open");
        document.documentElement.classList.add("modal-open");
        vid.play().catch(() => {});
      });
    });
    if (lb) {
      const close = () => {
        lb.classList.remove("open");
        document.documentElement.classList.remove("modal-open");
        if (vid) { vid.pause(); vid.removeAttribute("src"); vid.load(); }
      };
      const x = $(".reel-lb-x", lb);
      if (x) x.addEventListener("click", close);
      lb.addEventListener("click", e => { if (e.target === lb) close(); });
      addEventListener("keydown", e => { if (e.key === "Escape") close(); });
    }
  })();
})();



