#!/usr/bin/env python3
# Rebuilds projects / skills / experience / contact / designer with shared chrome.
# Dash-free, resume-accurate (GPA 3.1, 5 hardware projects, no ALU), new nav (+ Creative).
import pathlib
ROOT = pathlib.Path("/home/claude/project")

def head(title, desc):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <link rel="icon" href="assets/img/favicon.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="assets/css/main.css">
  <script>try{{if(localStorage.getItem('ah_theme')==='light')document.documentElement.setAttribute('data-theme','light');}}catch(e){{}}</script>
</head>
<body>
  <div id="boot">
    <div class="boot-mark">ALI&nbsp;·&nbsp;HUSSEIN</div>
    <div class="boot-ring"></div>
    <div class="boot-log">INITIALIZING ENGINEERING INTERFACE</div>
    <div class="boot-bar"><i></i></div>
  </div>
  <canvas id="bg-canvas"></canvas>
  <div class="bg-aura"></div>
  <div class="bg-grid"></div>
  <div class="bg-noise"></div>
  <div class="shell">
"""

def nav(active):
    def cls(name): return ' class="active"' if name == active else ''
    return f"""  <nav class="nav">
    <a class="brand" href="index.html">
      <span class="logo"><span>AH</span></span>
      <span class="who"><span class="n">Ali Hussein</span><span class="r">Hardware Engineer</span></span>
    </a>
    <div class="nav-links" id="navLinks">
      <a{cls('home')} href="index.html">Home</a>
      <a{cls('projects')} href="projects.html">Projects</a>
      <a{cls('playground')} href="playground.html">Playground</a>
      <a{cls('skills')} href="skills.html">Skills</a>
      <a{cls('experience')} href="experience.html">Experience</a>
      <a{cls('designer')} href="designer.html">Creative</a>
      <a class="nav-cta" href="contact.html">Contact</a>
    </div>
    <div id="authSlot" class="auth-slot"></div>
    <button class="theme-toggle" aria-label="Toggle light or dark mode" type="button">
      <svg class="i-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
      <svg class="i-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19"/></svg>
    </button>
    <button class="burger" id="burger" aria-label="Menu"><i></i><i></i><i></i></button>
  </nav>
"""

FOOTER = """  <footer class="site">
    <div class="wrap">
      <div class="foot-grid">
        <div class="foot-brand">
          <a class="brand" href="index.html" style="display:inline-flex; align-items:center; gap:11px;">
            <span class="logo"><span>AH</span></span>
            <span class="who"><span class="n">Ali Hussein</span><span class="r">Hardware Engineer</span></span>
          </a>
          <p>Computer Engineering @ Texas A&amp;M University. Hardware-focused and verification-minded, working in digital design, RTL, and FPGA prototyping.</p>
        </div>
        <div>
          <h4>Navigate</h4>
          <a href="index.html">Home</a>
          <a href="projects.html">Projects</a>
          <a href="playground.html">Playground</a>
          <a href="skills.html">Skills</a>
          <a href="experience.html">Experience</a>
          <a href="designer.html">Creative</a>
          <a href="contact.html">Contact</a>
        </div>
        <div>
          <h4>Connect</h4>
          <a href="mailto:ali.hussein24@tamu.edu">ali.hussein24@tamu.edu</a>
          <a href="https://www.linkedin.com/in/ali-hussein-b13004260/" target="_blank" rel="noopener">LinkedIn &#8599;</a>
          <a href="https://github.com/King1Thor" target="_blank" rel="noopener">GitHub &#8599;</a>
          <a href="https://engineering.tamu.edu/" target="_blank" rel="noopener">TAMU Engineering &#8599;</a>
        </div>
      </div>
      <div class="foot-bottom">
        <span>&copy; <span data-year>2026</span> ALI HUSSEIN &middot; BUILT AS A SYSTEMS INTERFACE</span>
        <div class="socials">
          <a href="mailto:ali.hussein24@tamu.edu" aria-label="Email"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></a>
          <a href="https://www.linkedin.com/in/ali-hussein-b13004260/" target="_blank" rel="noopener" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z"/></svg></a>
          <a href="https://github.com/King1Thor" target="_blank" rel="noopener" aria-label="GitHub"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg></a>
        </div>
      </div>
    </div>
  </footer>
  </div>
  <script src="assets/js/core.js"></script>
  <script src="assets/js/assistant.js"></script>
  <script src="assets/js/app.js"></script>
"""

def page(filename, active, title, desc, body, extra_scripts=""):
    html = head(title, desc) + nav(active) + body + FOOTER + extra_scripts + "</body>\n</html>\n"
    (ROOT / filename).write_text(html, encoding="utf-8")
    print("wrote", filename, len(html), "bytes")

# Reusable recreated Reveille Bubble Tea preview (stands in for a live screenshot)
BOBA = """<div class="boba">
  <div class="bnav"><div class="blogo">RB</div><div><h1>Reveille Bubble Tea</h1><div class="team">TEAM 25 &middot; FULL-STACK POS</div></div></div>
  <div class="cards">
    <div class="bc"><div class="tag">KIOSK</div><h3>Customer Kiosk</h3><p>Order drinks, earn reward points, spin the wheel, and customize every cup.</p><div class="pill">Order Now</div></div>
    <div class="bc"><div class="tag">POS</div><h3>Cashier Terminal</h3><p>Staff point-of-sale with TAMU login and a secure staff PIN gate.</p><div class="pill">Open Cashier</div></div>
    <div class="bc"><div class="tag">MGR</div><h3>Manager Dashboard</h3><p>Analytics, inventory, menu editing, employee management, and reports.</p><div class="pill">Manager Login</div></div>
  </div>
</div>"""

# ======================================================== PROJECTS
projects_body = """
  <header class="banner wrap">
    <div class="eyebrow reveal show">// PROJECT COMMAND CENTER</div>
    <h1 class="reveal show d1">Systems I've <span class="grad">designed &amp; verified</span></h1>
    <p class="lead reveal show d2">Full-stack web applications and hardware down to the logic gate. Click any project to open its breakdown.</p>
  </header>

  <!-- FULL-STACK WEB APPS -->
  <section style="padding-top:30px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// FULL-STACK WEB APPS</div>
        <h2 class="h-sec">Things I've shipped to the web</h2>
        <p class="lead">Team builds with a real frontend, a real backend, and a real database behind them. Click the card to open the breakdown, then visit the live site.</p>
      </div>
      <div class="webgrid">

        <article class="glass proj reveal" data-proj
          data-kind="Full-Stack &middot; Team Project"
          data-title="Reveille Bubble Tea"
          data-desc="A complete point-of-sale platform for a bubble-tea shop built with a team. Three role-based interfaces run on one shared API and database: a customer ordering kiosk (rewards, spin-the-wheel, drink customization), a cashier terminal gated by TAMU login and a staff PIN, and a manager dashboard for analytics, inventory, menu editing, employee management, and reports. Deployed live on Render."
          data-tags="Frontend|REST API|Relational Database|Role-Based Auth|OAuth Login|Deployed on Render"
          data-url="https://project3-team25-m13k.onrender.com/"
          data-visit="Visit the live restaurant site">
          <div class="ph"><img src="assets/img/projects/rbt-kiosk.png" alt="Reveille Bubble Tea customer ordering kiosk">
            <div class="badge"><span class="stat"><span class="d"></span> LIVE SITE</span></div><span class="num">01</span></div>
          <div class="body">
            <div class="kind">Full-Stack &middot; Team Project</div>
            <h3>Reveille Bubble Tea <span class="arrow">&#8599;</span></h3>
            <p>A complete point-of-sale platform for a bubble-tea shop: a customer kiosk, a cashier terminal, and a manager dashboard, all on one shared API and database. Deployed live on Render.</p>
            <div class="reveal-more">
              <div class="tags"><span>Frontend</span><span>REST API</span><span>Database</span><span>Auth &amp; Roles</span></div>
              <span class="btn btn-ghost" style="margin-top:14px;">Click to explore &#8594;</span>
            </div>
          </div>
        </article>

      </div>
    </div>
  </section>

  <!-- HARDWARE PROJECTS -->
  <section style="padding-top:14px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// HARDWARE &amp; SYSTEMS</div>
        <h2 class="h-sec">Designed and verified in silicon</h2>
        <p class="lead">From combinational logic to a full ARMv8 datapath and a memory-system simulator. Click any card to open its breakdown.</p>
      </div>
      <div class="proj-grid">

        <article class="glass proj reveal" data-proj>
          <div class="ph"><img src="assets/img/projects/armv8-datapath.png" alt="Single-cycle ARMv8 datapath and control unit">
            <div class="badge"><span class="stat r"><span class="d"></span> TEAM PROJECT</span></div><span class="num">01</span></div>
          <div class="body">
            <div class="kind">Computer Architecture &middot; ECEN 350</div>
            <h3>Single-Cycle ARMv8 CPU <span class="arrow">&#8599;</span></h3>
            <p>A single-cycle ARMv8 processor in Verilog: fetch, decode, register file, ALU, data memory, and write-back, with a control unit decoding the 11-bit opcode. Extended with MOVZ to build full 64-bit constants, then verified with a self-checking testbench and run on FPGA hardware.</p>
            <div class="reveal-more">
              <div class="tags"><span>ARMv8 ISA</span><span>Control Unit</span><span>Sign Extender</span><span>MOVZ</span><span>Verilog</span></div>
              <div class="metrics">
                <div class="m"><div class="v">Single-Cycle</div><div class="l">Datapath</div></div>
                <div class="m"><div class="v">R/I/D/CB/B</div><div class="l">Instr. Types</div></div>
                <div class="m"><div class="v">All Passed</div><div class="l">Self-Tests</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal d1" data-proj>
          <div class="ph"><img src="assets/img/breadboard_signal.jpeg" alt="Cache simulator concept circuit">
            <div class="badge"><span class="stat"><span class="d"></span> VERIFIED</span></div><span class="num">02</span></div>
          <div class="body">
            <div class="kind">Memory Systems &middot; C++</div>
            <h3>LRU Cache Simulator <span class="arrow">&#8599;</span></h3>
            <p>A configurable set-associative cache simulator reporting hit and miss statistics from memory traces. Designed an O(1) LRU replacement policy backed by a hash map and doubly linked list to study miss-rate tradeoffs across configurations.</p>
            <div class="reveal-more">
              <div class="tags"><span>C++</span><span>Set-Associative</span><span>Hash Map + DLL</span><span>Trace Analysis</span></div>
              <div class="metrics">
                <div class="m"><div class="v">O(1)</div><div class="l">Replacement</div></div>
                <div class="m"><div class="v">Configurable</div><div class="l">Associativity</div></div>
                <div class="m"><div class="v">Hit/Miss</div><div class="l">Reporting</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal" data-proj>
          <div class="ph"><img src="assets/img/alu_whiteboard.jpeg" alt="Digital combination lock concept">
            <div class="badge"><span class="stat"><span class="d"></span> VERIFIED ON FPGA</span></div><span class="num">03</span></div>
          <div class="body">
            <div class="kind">FPGA &middot; Verilog</div>
            <h3>Digital Combination Lock <span class="arrow">&#8599;</span></h3>
            <p>A 4-bit combination lock implemented on the ZYBO Z7-10, using onboard switches as the input code and LEDs to indicate lock status. Verified correct on-board behavior by testing the Verilog compare logic and documenting required waveforms.</p>
            <div class="reveal-more">
              <div class="tags"><span>ZYBO Z7-10</span><span>Verilog</span><span>Compare Logic</span><span>Waveform Docs</span></div>
              <div class="metrics">
                <div class="m"><div class="v">4-bit</div><div class="l">Code Width</div></div>
                <div class="m"><div class="v">On-board</div><div class="l">Validation</div></div>
                <div class="m"><div class="v">Vivado</div><div class="l">Toolchain</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal d1" data-proj>
          <div class="ph"><img src="assets/img/breadboard_output.jpeg" alt="Motion sensor alarm circuit">
            <div class="badge"><span class="stat r"><span class="d"></span> TEAM PROJECT</span></div><span class="num">04</span></div>
          <div class="body">
            <div class="kind">Analog &middot; Embedded</div>
            <h3>Motion Sensor Alarm <span class="arrow">&#8599;</span></h3>
            <p>An infrared-based motion and presence alarm that activates a buzzer through comparator thresholding. Shared responsibility for circuit assembly, threshold calibration, and testing under varying ambient-light conditions.</p>
            <div class="reveal-more">
              <div class="tags"><span>IR Detection</span><span>Comparator</span><span>Threshold Calibration</span><span>Buzzer Drive</span></div>
              <div class="metrics">
                <div class="m"><div class="v">IR</div><div class="l">Sensing</div></div>
                <div class="m"><div class="v">Analog&rarr;Digital</div><div class="l">Pipeline</div></div>
                <div class="m"><div class="v">Calibrated</div><div class="l">Threshold</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal" data-proj>
          <div class="ph"><img src="assets/img/projects/banking-architecture.svg" alt="Multi-threaded banking system architecture">
            <div class="badge"><span class="stat"><span class="d"></span> CONCURRENT</span></div><span class="num">05</span></div>
          <div class="body">
            <div class="kind">Systems Programming &middot; Networking &middot; C++</div>
            <h3>Multi-Threaded Banking System <span class="arrow">&#8599;</span></h3>
            <p>A C++ client/server banking system over TCP sockets on Linux. The server accepts many clients at once and dispatches each request to a thread pool of persistent workers pulling from a task queue, with mutex-guarded shared account state and modular networking, finance, logging, and signal-handling layers.</p>
            <div class="reveal-more">
              <div class="tags"><span>C++</span><span>TCP Sockets</span><span>Thread Pool</span><span>Mutexes</span><span>Linux</span></div>
              <div class="metrics">
                <div class="m"><div class="v">Thread Pool</div><div class="l">Concurrency</div></div>
                <div class="m"><div class="v">TCP/IP</div><div class="l">Sockets</div></div>
                <div class="m"><div class="v">Mutex-Safe</div><div class="l">Shared State</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal d1" data-proj>
          <div class="ph"><img src="assets/img/projects/amp-schematic.png" alt="Two-stage MOSFET amplifier schematic">
            <div class="badge"><span class="stat"><span class="d"></span> BUILT &amp; MEASURED</span></div><span class="num">06</span></div>
          <div class="body">
            <div class="kind">Analog Electronics &middot; ECEN 325</div>
            <h3>Two-Stage MOSFET Amplifier <span class="arrow">&#8599;</span></h3>
            <p>Designed, simulated, and built a two-stage MOSFET amplifier on a &plusmn;5 V supply: a CD4007P common-source gain stage into a 2N7000G source-follower with a current-source bias. Hand-calculated the full bias, tuned it in Multisim, then verified it on hardware against gain, input-resistance, swing, and THD specs.</p>
            <div class="reveal-more">
              <div class="tags"><span>MOSFET</span><span>Analog Design</span><span>Biasing</span><span>Multisim</span><span>Oscilloscope</span></div>
              <div class="metrics">
                <div class="m"><div class="v">~40 V/V</div><div class="l">Gain</div></div>
                <div class="m"><div class="v">3.7%</div><div class="l">THD</div></div>
                <div class="m"><div class="v">21 k&#8486;</div><div class="l">Input R</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal" data-proj>
          <div class="ph"><img src="assets/img/projects/tlc-zybo.jpg" alt="Traffic light controller on the ZYBO Z7-10 FPGA">
            <div class="badge"><span class="stat"><span class="d"></span> VERIFIED ON FPGA</span></div><span class="num">07</span></div>
          <div class="body">
            <div class="kind">Digital Logic &middot; FPGA &middot; ECEN 248</div>
            <h3>Traffic Light Controller <span class="arrow">&#8599;</span></h3>
            <p>A sensor-aware traffic-light controller for a highway/farm-road intersection, built as a 6-state Moore FSM in Verilog. A 31-bit counter at 50 MHz times each phase, a farm-road sensor shortens the highway green, and the design was simulated then run on the ZYBO Z7-10.</p>
            <div class="reveal-more">
              <div class="tags"><span>Verilog</span><span>FSM</span><span>FPGA</span><span>ZYBO Z7</span><span>Sequential Logic</span></div>
              <div class="metrics">
                <div class="m"><div class="v">6-State FSM</div><div class="l">Moore</div></div>
                <div class="m"><div class="v">50 MHz</div><div class="l">Clock</div></div>
                <div class="m"><div class="v">ZYBO Z7</div><div class="l">FPGA</div></div>
              </div>
            </div>
          </div>
        </article>

        <article class="glass proj reveal d1" data-proj>
          <div class="ph"><img src="assets/img/projects/alu-breadboard.jpg" alt="4-bit ALU built on a breadboard">
            <div class="badge"><span class="stat"><span class="d"></span> BUILT &amp; TESTED</span></div><span class="num">08</span></div>
          <div class="body">
            <div class="kind">Digital Logic &middot; Breadboard &middot; ECEN 248</div>
            <h3>4-Bit ALU <span class="arrow">&#8599;</span></h3>
            <p>A 4-bit arithmetic logic unit built from discrete 74-series ICs on a breadboard: a ripple-carry adder with XOR gates for add/subtract (two's complement), AND gates for bitwise AND, and a 2:1 MUX to select the operation. Verified against add, subtract, and AND test cases with LED outputs.</p>
            <div class="reveal-more">
              <div class="tags"><span>Digital Logic</span><span>74xx ICs</span><span>Ripple-Carry Adder</span><span>MUX</span><span>Two's Complement</span></div>
              <div class="metrics">
                <div class="m"><div class="v">4-bit</div><div class="l">Operands</div></div>
                <div class="m"><div class="v">ADD/SUB/AND</div><div class="l">Operations</div></div>
                <div class="m"><div class="v">74xx ICs</div><div class="l">Hardware</div></div>
              </div>
            </div>
          </div>
        </article>

      </div>
    </div>
  </section>

  <!-- ENGINEERING JOURNAL / GALLERY -->
  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// ENGINEERING JOURNAL</div>
        <h2 class="h-sec">How I think before I build</h2>
        <p class="lead">Whiteboard work and bench builds. I break problems down on paper, trace the signal flow, then validate on real hardware. Click any frame to enlarge.</p>
      </div>
      <div class="gal">
        <div class="it reveal" data-lightbox="assets/img/armv8_whiteboard.jpeg"><img src="assets/img/armv8_whiteboard.jpeg" alt="ARMv8 control flow"><div class="cap"><b>ARMv8 Control Flow</b><em>C to assembly &middot; branches &amp; loops</em></div></div>
        <div class="it reveal d1" data-lightbox="assets/img/alu_whiteboard.jpeg"><img src="assets/img/alu_whiteboard.jpeg" alt="Logic block diagram"><div class="cap"><b>Logic Block Diagram</b><em>FA &middot; XOR &middot; AND &middot; MUX</em></div></div>
        <div class="it reveal d2" data-lightbox="assets/img/breadboard_signal.jpeg"><img src="assets/img/breadboard_signal.jpeg" alt="Signal detection circuit"><div class="cap"><b>Signal Detection Circuit</b><em>analog input to clean digital out</em></div></div>
        <div class="it reveal" data-lightbox="assets/img/breadboard_output.jpeg"><img src="assets/img/breadboard_output.jpeg" alt="Digital output circuit"><div class="cap"><b>Digital Output / Indicator</b><em>clean wiring &middot; verified behavior</em></div></div>
        <div class="it reveal d1" data-lightbox="assets/img/bank_whiteboard.jpeg"><img src="assets/img/bank_whiteboard.jpeg" alt="C++ bank program logic"><div class="cap"><b>Bank Program Logic</b><em>menu &middot; loops &middot; switch</em></div></div>
        <div class="it reveal d2" data-lightbox="assets/img/math_whiteboard.jpeg"><img src="assets/img/math_whiteboard.jpeg" alt="Step-by-step math"><div class="cap"><b>Step-by-Step Reasoning</b><em>break it down &middot; verify each step</em></div></div>
      </div>
    </div>
  </section>

  <section style="padding-top:0;">
    <div class="wrap">
      <div class="glass cta-band reveal">
        <div class="eyebrow" style="justify-content:center;">// EXPLORE MORE</div>
        <h2>Want the technical depth?</h2>
        <p>Browse the full skill matrix, or ask AIDEN to walk you through any project.</p>
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
          <a class="btn btn-primary" href="skills.html">View skills</a>
          <button class="btn btn-ghost" type="button" data-aiden-open>Ask AIDEN</button>
        </div>
      </div>
    </div>
  </section>

  <!-- PROJECT POPUP (shared) -->
  <div id="projModal" role="dialog" aria-modal="true">
    <div class="pm-card">
      <div class="pm-hero">
        <div class="pm-x" aria-label="Close">&#10005;</div>
        <div class="pm-mark" id="pmMark">RB</div>
        <div>
          <div class="pm-kind" id="pmKind">PROJECT</div>
          <h2 id="pmTitle">Project</h2>
        </div>
      </div>
      <div class="pm-body">
        <img class="pm-img" id="pmImg" alt="Project artifact">
        <video class="pm-vid" id="pmVid" controls playsinline preload="none" style="display:none"></video>
        <div class="pm-thumbs" id="pmThumbs"></div>
        <div class="pm-steps" id="pmSteps"></div>
        <div class="pm-tags" id="pmTags"></div>
        <div class="pm-actions">
          <a class="btn btn-primary" id="pmVisit" href="#" target="_blank" rel="noopener">Visit the live site &#8599;</a>
          <a class="btn btn-ghost" id="pmRepo" href="#" target="_blank" rel="noopener">View code &#8599;</a>
        </div>
      </div>
    </div>
  </div>
"""

projects_script = ""

page("projects.html", "projects",
     "Projects · Ali Hussein",
     "Full-stack and hardware projects by Ali Hussein: Reveille Bubble Tea POS, single-cycle ARMv8 CPU, LRU cache simulator, FPGA combination lock, motion sensor alarm, a two-stage MOSFET amplifier, an FPGA traffic-light controller, a breadboard 4-bit ALU, and a multi-threaded C++ banking system.",
     projects_body, extra_scripts=projects_script)
print("done projects")

# ======================================================== PLAYGROUND
playground_body = """
  <header class="banner wrap">
    <div class="eyebrow reveal show">// INTERACTIVE LAB</div>
    <h1 class="reveal show d1">Play with the <span class="grad">hardware</span></h1>
    <p class="lead reveal show d2">Small interactive versions of the ideas behind my projects. Click, toggle, and step through them, no install required.</p>
  </header>

  <!-- ARMv8 CPU DATAPATH SIMULATOR -->
  <section style="padding-top:24px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// COMPUTER ARCHITECTURE</div>
        <h2 class="h-sec">ARMv8 CPU Lab</h2>
        <p class="lead">An interactive single-cycle ARMv8 (LEGv8) processor, built from my <b>Verilog CPU project</b> with the same opcode encodings and control logic. Pick any instruction to see its assembly, colored binary fields, control signals, and C equivalent, then Step or Auto-run to watch it light up the active path through the datapath. Drag to pan, scroll to zoom, and click any component to open it in place: the ALU expands into a full adder, then logic gates, then real CMOS transistors with gate, source, and drain terminals. The register file, control unit, memory with cache, and sign-extend all open the same way. A second tab is a live <b>C / Assembly / Binary</b> editor with two-way translation and big or little-endian output.</p>
      </div>
      <div class="glass lab reveal" id="cpuSim"></div>
    </div>
  </section>

  <!-- LRU CACHE -->
  <section style="padding-top:24px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// MEMORY SYSTEMS</div>
        <h2 class="h-sec">LRU cache, live</h2>
        <p class="lead">The same idea as my <b>LRU Cache Simulator</b>. Pick the geometry, enter a list of memory addresses, and step through to watch hits, misses, and least-recently-used eviction.</p>
      </div>
      <div class="glass lab reveal">
        <div class="lab-controls">
          <label>Sets
            <select id="lruSets"><option>4</option><option>8</option></select></label>
          <label>Ways
            <select id="lruWays"><option>1</option><option selected>2</option><option>4</option></select></label>
          <label class="grow">Addresses
            <input id="lruSeq" type="text" value="0,4,8,0,12,4,16,0,8,20"></label>
          <button class="btn btn-ghost" id="lruStep" type="button">Step</button>
          <button class="btn btn-primary" id="lruRun" type="button">Run</button>
          <button class="btn btn-ghost" id="lruReset" type="button">Reset</button>
        </div>
        <div class="lab-stats">
          <span>Access <b id="lruCur">&mdash;</b></span>
          <span>Hits <b id="lruHits">0</b></span>
          <span>Misses <b id="lruMiss">0</b></span>
          <span>Hit rate <b id="lruRate">0%</b></span>
        </div>
        <div class="lru-msg" id="lruMsg"></div>
        <div class="lru-grid" id="lruGrid"></div>
      </div>
    </div>
  </section>

  <!-- LOGIC GATES + FSM -->
  <section style="padding-top:14px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// DIGITAL LOGIC</div>
        <h2 class="h-sec">Gates &amp; state machines</h2>
        <p class="lead">The building blocks of every chip. Flip the inputs to see a gate's output and truth table, then try the combination-lock state machine from my FPGA project.</p>
      </div>
      <div class="lab-two">

        <div class="glass lab reveal">
          <div class="lab-cap">Logic gate explorer</div>
          <div class="gate-row">
            <div class="gate-inputs">
              <button class="bit" id="gA" type="button">A = 0</button>
              <button class="bit" id="gB" type="button">B = 0</button>
            </div>
            <select id="gSel" aria-label="Gate">
              <option>AND</option><option>OR</option><option>NAND</option>
              <option>NOR</option><option>XOR</option><option>XNOR</option><option>NOT</option>
            </select>
            <div class="gate-out">OUT = <b id="gOut">0</b><span class="led" id="gLed"></span></div>
          </div>
          <table class="ttable" id="gTable"></table>
        </div>

        <div class="glass lab reveal d1">
          <div class="lab-cap">Combination-lock FSM &middot; code 1 &middot; 3 &middot; 2</div>
          <div class="fsm-row">
            <div class="fsm-node active">LOCKED</div><span class="fsm-arrow">&#8594;</span>
            <div class="fsm-node">S1</div><span class="fsm-arrow">&#8594;</span>
            <div class="fsm-node">S2</div><span class="fsm-arrow">&#8594;</span>
            <div class="fsm-node">OPEN</div>
          </div>
          <div class="fsm-keys" id="fsmKeys">
            <button data-k="1" type="button">1</button><button data-k="2" type="button">2</button>
            <button data-k="3" type="button">3</button><button data-k="4" type="button">4</button>
          </div>
          <div class="fsm-msg" id="fsmMsg"></div>
          <button class="btn btn-ghost" id="fsmReset" type="button" style="margin-top:14px;">Reset lock</button>
        </div>

      </div>
    </div>
  </section>

  <!-- MORE TOYS -->
  <section style="padding-top:14px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// NUMBERS &amp; DECODERS</div>
        <h2 class="h-sec">More logic toys</h2>
        <p class="lead">Flip bits and watch the numbers, the seven-segment display, and the adder update in real time.</p>
      </div>
      <div class="lab-two">
        <div class="glass lab reveal">
          <div class="lab-cap">Binary explorer &middot; 8-bit</div>
          <div class="bit-row" id="binBits"></div>
          <div class="bin-out">DEC <b id="binDec">0</b><span>HEX <b id="binHex">0x00</b></span></div>
        </div>
        <div class="glass lab reveal d1">
          <div class="lab-cap">7-segment decoder</div>
          <div class="seg-wrap">
            <svg id="segDisplay" viewBox="0 0 120 200" width="96">
              <polygon class="seg" data-s="a" points="35,20 85,20 92,27 85,34 35,34 28,27"/>
              <polygon class="seg" data-s="f" points="25,30 32,37 32,90 25,97 18,90 18,37"/>
              <polygon class="seg" data-s="b" points="95,30 102,37 102,90 95,97 88,90 88,37"/>
              <polygon class="seg" data-s="g" points="35,93 85,93 92,100 85,107 35,107 28,100"/>
              <polygon class="seg" data-s="e" points="25,103 32,110 32,163 25,170 18,163 18,110"/>
              <polygon class="seg" data-s="c" points="95,103 102,110 102,163 95,170 88,163 88,110"/>
              <polygon class="seg" data-s="d" points="35,166 85,166 92,173 85,180 35,180 28,173"/>
            </svg>
            <label class="seg-pick">Show digit
              <select id="segVal">
                <option value="0">0</option><option value="1">1</option><option value="2">2</option><option value="3">3</option>
                <option value="4">4</option><option value="5">5</option><option value="6">6</option><option value="7">7</option>
                <option value="8">8</option><option value="9">9</option><option value="10">A</option><option value="11">b</option>
                <option value="12">C</option><option value="13">d</option><option value="14">E</option><option value="15">F</option>
              </select>
            </label>
          </div>
        </div>
      </div>
      <div class="glass lab reveal" style="margin-top:22px;">
        <div class="lab-cap">4-bit ripple-carry adder</div>
        <div class="adder">
          <div class="add-side"><span class="add-lbl">A</span><div class="bit-row" id="addA"></div></div>
          <div class="add-plus">+</div>
          <div class="add-side"><span class="add-lbl">B</span><div class="bit-row" id="addB"></div></div>
        </div>
        <div class="add-out" id="addOut"></div>
      </div>
    </div>
  </section>
"""
page("playground.html", "playground",
     "Playground · Ali Hussein",
     "Interactive hardware toys by Ali Hussein: a live LRU cache simulator, a logic-gate explorer, and a combination-lock finite state machine.",
     playground_body, extra_scripts='  <script src="assets/js/playground.js"></script>\n  <script src="assets/js/cpu-lab.js"></script>\n')
print("done playground")


# ======================================================== SKILLS
def bar(name, lv, fill):
    return f"""        <div class="bar">
          <div class="top"><span>{name}</span><span class="lv">{lv}</span></div>
          <div class="track"><i data-fill="{fill}"></i></div>
        </div>"""
def chips(items):
    return "".join(f'<span class="chip">{i}</span>' for i in items)

skills_body = f"""
  <header class="banner wrap">
    <div class="eyebrow reveal show">// CAPABILITY MATRIX</div>
    <h1 class="reveal show d1">The <span class="grad">skill stack</span> behind the systems</h1>
    <p class="lead reveal show d2">Hardware-first, verification-minded, comfortable from the logic gate up to C/C++ and Python. Levels below reflect coursework, lab work, and real project delivery, not buzzwords.</p>
  </header>

  <section style="padding-top:30px;">
    <div class="wrap">
      <div class="grid-2">

        <div class="glass skill-cat reveal">
          <h3><span class="dot"></span> Hardware &amp; RTL</h3>
{bar("Digital Logic &amp; FSMs", "ADVANCED", 92)}
{bar("Verilog / RTL Design", "ADVANCED", 88)}
{bar("Computer Architecture", "ADVANCED", 86)}
{bar("Cache &amp; Memory Systems", "PROFICIENT", 82)}
{bar("FPGA Prototyping (Vivado)", "PROFICIENT", 80)}
{bar("Verification &amp; Directed Testing", "PROFICIENT", 78)}
        </div>

        <div class="glass skill-cat reveal d1">
          <h3><span class="dot"></span> Programming Languages</h3>
{bar("C / C++", "ADVANCED", 88)}
{bar("Verilog (HDL)", "ADVANCED", 88)}
{bar("ARMv8 Assembly", "ADVANCED", 85)}
{bar("Python", "PROFICIENT", 84)}
{bar("HTML / CSS", "PROFICIENT", 80)}
        </div>

      </div>
    </div>
  </section>

  <section style="padding-top:10px;">
    <div class="wrap">
      <div class="grid-2">
        <div class="glass skill-cat reveal">
          <h3><span class="dot"></span> EDA &amp; Simulation</h3>
          <div class="kv">{chips(["Vivado","Multisim","LTspice","GTKWave"])}</div>
          <h3 style="margin-top:24px;"><span class="dot"></span> Debug &amp; Dev Tools</h3>
          <div class="kv">{chips(["Linux / Unix","Git","VS Code","gdb"])}</div>
        </div>
        <div class="glass skill-cat reveal d1">
          <h3><span class="dot"></span> Lab &amp; Test Equipment</h3>
          <div class="kv">{chips(["Oscilloscope (MSOX3024T)","Multimeter","Power Supply","Function Generator","Analog Discovery 2"])}</div>
          <h3 style="margin-top:24px;"><span class="dot"></span> Platforms</h3>
          <div class="kv">{chips(["ZYBO Z7-10","Raspberry Pi 4"])}</div>
        </div>
      </div>
    </div>
  </section>

  <section style="padding-top:0;">
    <div class="wrap">
      <div class="glass cta-band reveal">
        <div class="eyebrow" style="justify-content:center;">// NEXT</div>
        <h2>See the work in context</h2>
        <p>Skills are easier to trust when you can see them shipped. Browse the projects or ask AIDEN anything.</p>
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
          <a class="btn btn-primary" href="projects.html">View projects</a>
          <button class="btn btn-ghost" type="button" data-aiden-open>Ask AIDEN</button>
        </div>
      </div>
    </div>
  </section>
"""
page("skills.html", "skills",
     "Skills · Ali Hussein",
     "Hardware, RTL, and programming skill matrix for Ali Hussein. Verilog, C/C++, Python, ARMv8, FPGA, computer architecture.",
     skills_body)
print("done skills")

# ======================================================== EXPERIENCE
experience_body = """
  <header class="banner wrap">
    <div class="eyebrow reveal show">// CAREER TIMELINE</div>
    <h1 class="reveal show d1">Experience &amp; <span class="grad">the road so far</span></h1>
    <p class="lead reveal show d2">Two threads run through everything: teaching people to think clearly, and leading teams under pressure. Both feed directly into how I engineer.</p>
  </header>

  <section style="padding-top:30px;">
    <div class="wrap">
      <div class="grid-2" style="align-items:start; gap:48px;">

        <div class="reveal">
          <div class="eyebrow" style="margin-bottom:18px;">// WORK &amp; LEADERSHIP</div>
          <div class="timeline">
            <div class="tl-item">
              <div class="when">Nov 2023 to Present</div>
              <h3>Academic Coach &amp; Peer Tutor</h3>
              <div class="org">Blinn College &middot; Bryan, TX</div>
              <p>Coaching students through the exact engineering and math gauntlet I came up through, turning "I'm lost" into "oh, that's how it works."</p>
              <ul class="dots">
                <li>Tutored <b>50+ students</b> in physics and math across <b>100+ sessions</b>.</li>
                <li>Built tailored study plans and explanations that improve exam readiness and conceptual understanding.</li>
                <li>Strengthened my own fundamentals, because teaching a concept forces you to truly own it.</li>
              </ul>
            </div>

            <div class="tl-item">
              <div class="when">Jan 2023 to Aug 2024</div>
              <h3>Team Leader</h3>
              <div class="org">McDonald's &middot; College Station, TX</div>
              <p>Ran the floor during peak rushes, the original real-time system with hard latency requirements and zero tolerance for dropped throughput.</p>
              <ul class="dots">
                <li>Led shift operations for a cross-functional team serving <b>300+ customers</b>.</li>
                <li>Trained <b>20+ employees</b> and coordinated peak-hour coverage.</li>
                <li>Resolved 20 to 50 customer issues per shift while holding throughput and team coordination.</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="reveal d1">
          <div class="eyebrow" style="margin-bottom:18px;">// EDUCATION &amp; ACTIVITIES</div>
          <div class="timeline">
            <div class="tl-item">
              <div class="when">2024 to May 2027 (expected)</div>
              <h3>B.S. Computer Engineering</h3>
              <div class="org">Texas A&amp;M University &middot; Minor in Mathematics</div>
              <p>Coursework in computer architecture, digital logic, RTL/Verilog, and verification. <b>GPA 3.1</b>.</p>
            </div>
            <div class="tl-item">
              <div class="when">Aug 2022 to 2024</div>
              <h3>Engineering Foundations</h3>
              <div class="org">Blinn College &middot; transferred to Texas A&amp;M</div>
              <p>Completed 52 credit hours of the engineering core with a <b>3.92 GPA</b>, earning Chancellor's and Dean's List honors.</p>
            </div>
            <div class="tl-item">
              <div class="when">2024 to Present</div>
              <h3>IEEE Student Member</h3>
              <div class="org">Texas A&amp;M University Student Branch</div>
            </div>
            <div class="tl-item">
              <div class="when">2024 to Present</div>
              <h3>Society for Collegiate Leadership &amp; Achievement</h3>
              <div class="org">SCLA &middot; Texas A&amp;M University</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// BEYOND THE BENCH</div>
        <h2 class="h-sec">Engineering is a team sport</h2>
        <p class="lead">The part of the work that doesn't show up in a waveform: lifting other people up, and staying clear under pressure.</p>
      </div>
      <div class="grid-3">
        <div class="glass fcard reveal">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 14c4 0 7 2 7 5v1H5v-1c0-3 3-5 7-5z"/><circle cx="12" cy="7" r="4"/></svg></div>
          <h3>Mentoring</h3>
          <p>100+ tutoring sessions taught me that the clearest engineer in the room is usually the one who can explain it simply.</p>
        </div>
        <div class="glass fcard reveal d1">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 2 3 14h7l-1 8 10-12h-7z"/></svg></div>
          <h3>Performance Under Load</h3>
          <p>Leading a fast-food floor at full rush is real-time scheduling with humans: prioritize, delegate, recover, repeat.</p>
        </div>
        <div class="glass fcard reveal d2">
          <div class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/></svg></div>
          <h3>Consistency</h3>
          <p>Carrying a full course load at A&amp;M (3.92 GPA at Blinn) while working and tutoring: the discipline of showing up and doing it right.</p>
        </div>
      </div>
    </div>
  </section>

  <section style="padding-top:0;">
    <div class="wrap">
      <div class="glass cta-band reveal">
        <div class="eyebrow" style="justify-content:center;">// LET'S CONNECT</div>
        <h2>Always glad to talk hardware.</h2>
        <p>Digital design, RTL, verification, or a project we could build together. My inbox is open.</p>
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
          <a class="btn btn-primary" href="contact.html">Get in touch</a>
          <a class="btn btn-ghost" href="skills.html">View skills</a>
        </div>
      </div>
    </div>
  </section>
"""
page("experience.html", "experience",
     "Experience · Ali Hussein",
     "Experience and leadership of Ali Hussein: academic coaching at Blinn College, team leadership, IEEE and SCLA involvement at Texas A&M University.",
     experience_body)
print("done experience")

# ======================================================== CONTACT
contact_body = """
  <header class="banner wrap">
    <div class="eyebrow reveal show">// OPEN CHANNEL</div>
    <h1 class="reveal show d1">Let's build <span class="grad">something real</span></h1>
    <p class="lead reveal show d2">Questions, ideas, or just want to talk hardware? Leave a message below or email me directly, the channel is open.</p>
  </header>

  <section style="padding-top:30px;">
    <div class="wrap">
      <div class="contact-grid">

        <div class="reveal">
          <a class="contact-line" href="mailto:ali.hussein24@tamu.edu">
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg></span>
            <span><span class="lbl">Email</span><span class="val">ali.hussein24@tamu.edu</span></span>
          </a>
          <a class="contact-line" href="https://www.linkedin.com/in/ali-hussein-b13004260/" target="_blank" rel="noopener">
            <span class="ic"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M4.98 3.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM3 9h4v12H3zM10 9h3.8v1.7h.05c.53-1 1.83-2.05 3.77-2.05 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.3c0-1.26-.02-2.9-1.77-2.9-1.77 0-2.04 1.38-2.04 2.8V21h-4z"/></svg></span>
            <span><span class="lbl">LinkedIn</span><span class="val">in/ali-hussein-b13004260 &#8599;</span></span>
          </a>
          <a class="contact-line" href="https://github.com/King1Thor" target="_blank" rel="noopener">
            <span class="ic"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.22-3.37-1.22-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.66.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.27 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.93-2.34 4.8-4.57 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg></span>
            <span><span class="lbl">GitHub</span><span class="val">View repositories &#8599;</span></span>
          </a>
          <div class="contact-line" style="border-bottom:none;">
            <span class="ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg></span>
            <span><span class="lbl">Location</span><span class="val">Texas, USA</span></span>
          </div>
        </div>

        <div class="glass reveal d1" style="padding:30px; border-radius:var(--radius-lg);">
          <div class="eyebrow" style="margin-bottom:18px;">// LEAVE A MESSAGE</div>
          <div class="field">
            <label for="cName">Your name</label>
            <input id="cName" type="text" placeholder="Your name">
          </div>
          <div class="field">
            <label for="cEmail">Your email</label>
            <input id="cEmail" type="email" placeholder="you@email.com">
          </div>
          <div class="field">
            <label for="cMsg">Message</label>
            <textarea id="cMsg" placeholder="Hey Ali, I wanted to reach out about..."></textarea>
          </div>
          <button class="btn btn-primary" id="cSend" type="button" style="width:100%; justify-content:center;">Send message &#8594;</button>
          <input type="text" id="cHP" name="botcheck" tabindex="-1" autocomplete="off" style="position:absolute; left:-9999px;" aria-hidden="true">
          <div id="cStatus" class="form-status"></div>
          <p style="font-size:.78rem; color:var(--ink-dim); margin-top:12px; line-height:1.5;">
            Your message goes straight to my inbox. Prefer email? <a href="mailto:ali.hussein24@tamu.edu" style="color:var(--steel-2);">ali.hussein24@tamu.edu</a>
          </p>
        </div>

      </div>
    </div>
  </section>

  <section style="padding-top:6px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// GUESTBOOK</div>
        <h2 class="h-sec">Leave your mark</h2>
        <p class="lead">Signed-in visitors can drop a quick note or endorsement. Notes appear here once I approve them.</p>
      </div>
      <div class="glass reveal" style="padding:26px; border-radius:var(--radius-lg);">
        <div id="gbCompose" style="display:none; margin-bottom:20px;">
          <div class="field" style="margin-bottom:10px;">
            <textarea id="gbText" placeholder="Say hi, leave feedback, or an endorsement..."></textarea>
          </div>
          <div style="display:flex; gap:14px; align-items:center;">
            <button class="btn btn-primary" id="gbSend" type="button">Post note &#8594;</button>
            <span id="gbStatus" class="form-status"></span>
          </div>
        </div>
        <div id="gbSignin" style="display:none; color:var(--ink-dim); font-size:.9rem; margin-bottom:18px;">
          Sign in with Google (top-right) to leave a note.
        </div>
        <div id="gbList"></div>
      </div>
    </div>
  </section>

  <section style="padding-top:14px;">
    <div class="wrap">
      <div class="glass cta-band reveal">
        <div class="eyebrow" style="justify-content:center;">// QUICK ANSWERS</div>
        <h2>Have a quick question first?</h2>
        <p>AIDEN, the little assistant in the corner, can walk you through any project, skill, or my background.</p>
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-primary" type="button" data-aiden-open>Ask AIDEN</button>
          <a class="btn btn-ghost" href="projects.html">Browse projects</a>
        </div>
      </div>
    </div>
  </section>
"""
contact_script = """  <script>
  (function(){
    var b=document.getElementById('cSend'); if(!b) return;
    var status=document.getElementById('cStatus');
    function val(id){ var e=document.getElementById(id); return e?(e.value||'').trim():''; }
    function setStatus(msg, cls){ if(status){ status.textContent=msg; status.className='form-status '+(cls||''); } }
    function mailtoFallback(n,e,m){
      var subj=n?('Portfolio contact from '+n):'Portfolio contact';
      var body=m+(e?('\\n\\nfrom '+n+' ('+e+')'):('\\n\\nfrom '+n));
      window.location.href='mailto:ali.hussein24@tamu.edu?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
    }
    b.addEventListener('click', function(){
      var n=val('cName'), e=val('cEmail'), m=val('cMsg');
      if(document.getElementById('cHP') && document.getElementById('cHP').value) return; /* honeypot */
      if(!m){ setStatus('Please write a message first.', 'bad'); return; }
      setStatus('Sending…', ''); b.disabled = true;
      fetch('/api/messages', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name:n, email:e, message:m })
      }).then(function(r){ if(!r.ok) throw new Error('bad'); return r.json(); }).then(function(){
        b.disabled = false; setStatus('Thanks, your message was sent.', 'ok');
        ['cName','cEmail','cMsg'].forEach(function(id){ var el=document.getElementById(id); if(el) el.value=''; });
      }).catch(function(){
        /* backend not live yet -> open the visitor's email app instead */
        b.disabled = false; setStatus('Opening your email app…', '');
        mailtoFallback(n,e,m);
      });
    });

    /* ---- guestbook ---- */
    (function(){
      var list=document.getElementById('gbList'); if(!list) return;
      function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
      function load(){
        fetch('/api/guestbook').then(function(r){return r.json();}).then(function(d){
          var rows=(d.entries||[]);
          list.innerHTML = rows.length ? rows.map(function(g){
            return '<div class="gb-entry"><b>'+esc(g.visitor_name||'Visitor')+'</b><p>'+esc(g.body)+'</p></div>';
          }).join('') : '<p style="color:var(--ink-dim);font-size:.9rem;">No notes yet. Be the first.</p>';
        }).catch(function(){ list.innerHTML=''; });
      }
      fetch('/api/auth/me').then(function(r){return r.json();}).then(function(d){
        if(d&&d.user){ document.getElementById('gbCompose').style.display=''; }
        else { document.getElementById('gbSignin').style.display=''; }
      }).catch(function(){});
      var send=document.getElementById('gbSend');
      if(send) send.addEventListener('click', function(){
        var ta=document.getElementById('gbText'); var st=document.getElementById('gbStatus');
        var body=(ta.value||'').trim();
        if(!body){ st.textContent='Write something first.'; st.className='form-status bad'; return; }
        send.disabled=true; st.textContent='Posting…'; st.className='form-status';
        fetch('/api/guestbook',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({body:body})})
          .then(function(r){ if(!r.ok) throw 0; return r.json(); }).then(function(){
            send.disabled=false; ta.value=''; st.textContent='Thanks! Your note is pending approval.'; st.className='form-status ok';
          }).catch(function(){ send.disabled=false; st.textContent='Could not post (are you signed in?).'; st.className='form-status bad'; });
      });
      load();
    })();
  })();
  </script>
"""
page("contact.html", "contact",
     "Contact · Ali Hussein",
     "Get in touch with Ali Hussein, Computer Engineering student at Texas A&M, hardware and digital-design engineer.",
     contact_body, extra_scripts=contact_script)
print("done contact")

# ======================================================== DESIGNER / CREATIVE
def soft(letter, grad, name, role):
    return f"""        <div class="glass soft reveal">
          <div class="badge" style="background:{grad};">{letter}</div>
          <div><div class="n">{name}</div><div class="r">{role}</div></div>
        </div>"""

PLAY = '<div class="play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>'
def reel(label, src):
    return f"""        <div class="reel-card reveal" data-reel="{src}">
          <video preload="metadata" muted playsinline><source src="{src}" type="video/mp4"></video>
          <div class="reel-ov">{PLAY}</div>
          <div class="reel-fallback">add this clip as<br><b>{src}</b></div>
          <span class="reel-lab">{label}</span>
        </div>"""

designer_body = f"""
  <header class="banner wrap">
    <div class="eyebrow reveal show">// CREATIVE STUDIO</div>
    <h1 class="reveal show d1">I also <span class="grad">edit &amp; design</span></h1>
    <p class="lead reveal show d2">Outside the lab I edit short-form video and design visuals. I started on mobile with CapCut and grew into the desktop tools the pros use. Same instinct as engineering: take raw pieces, shape them, and sweat the details until it lands.</p>
  </header>

  <section style="padding-top:30px;">
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// WHAT I WORK WITH</div>
        <h2 class="h-sec">My editing toolkit</h2>
        <p class="lead">From quick mobile cuts to full timeline edits and color work, these are the apps I reach for.</p>
      </div>
      <div class="soft-grid">
{soft("Cc","linear-gradient(135deg,#00e0c6,#0098ff)","CapCut","Mobile &amp; desktop editing")}
{soft("Pr","linear-gradient(135deg,#9a4dff,#3b2a8c)","Adobe Premiere Pro","Timeline video editing")}
{soft("Ae","linear-gradient(135deg,#c39bff,#5a3df0)","After Effects","Motion graphics &amp; FX")}
{soft("Ps","linear-gradient(135deg,#2aa9ff,#063b73)","Adobe Photoshop","Graphics &amp; thumbnails")}
{soft("Dr","linear-gradient(135deg,#3a3f4a,#11151c)","DaVinci Resolve","Color grading")}
{soft("Cv","linear-gradient(135deg,#00c4cc,#7d2ae8)","Canva","Quick social graphics")}
      </div>
    </div>
  </section>

  <section>
    <div class="wrap">
      <div class="sec-head reveal">
        <div class="eyebrow">// SELECTED EDITS</div>
        <h2 class="h-sec">A few of my reels</h2>
        <p class="lead">A few of my favorite edits, hosted right here. Click any one to play it full size, no Instagram needed.</p>
      </div>
      <div class="reel-grid">
{reel("EDIT 01", "assets/reels/reel1.mp4")}
{reel("EDIT 02", "assets/reels/reel2.mp4")}
{reel("EDIT 03", "assets/reels/reel3.mp4")}
{reel("EDIT 04", "assets/reels/reel4.mp4")}
      </div>
    </div>
  </section>

  <section style="padding-top:6px;">
    <div class="wrap">
      <div class="glass ig-cta reveal">
        <div>
          <h3>Watch the full set on Instagram</h3>
          <p>More edits live on my page <b>@maxvj.o</b>, full reels, motion work, and color grades.</p>
        </div>
        <a class="btn btn-primary" href="https://www.instagram.com/maxvj.o/" target="_blank" rel="noopener">@maxvj.o on Instagram &#8599;</a>
      </div>
    </div>
  </section>

  <section style="padding-top:34px;">
    <div class="wrap">
      <div class="glass cta-band reveal">
        <div class="eyebrow" style="justify-content:center;">// TWO SIDES, ONE BUILDER</div>
        <h2>Engineer by training, editor by instinct.</h2>
        <p>Whether it's RTL or a reel, I like making things that work and feel sharp. Want to see the engineering side?</p>
        <div style="display:flex; gap:14px; justify-content:center; flex-wrap:wrap;">
          <a class="btn btn-primary" href="projects.html">View engineering projects</a>
          <a class="btn btn-ghost" href="contact.html">Get in touch</a>
        </div>
      </div>
    </div>
  </section>

  <div id="reelLB" aria-hidden="true">
    <button class="reel-lb-x" type="button" aria-label="Close">&#10005;</button>
    <video controls playsinline preload="auto"></video>
  </div>
"""
page("designer.html", "designer",
     "Creative · Ali Hussein",
     "The creative side of Ali Hussein: short-form video editing and design using CapCut, Adobe Premiere Pro, After Effects, Photoshop, and DaVinci Resolve.",
     designer_body)
print("done designer")

# ======================================================== MANAGER DASHBOARD
dashboard_body = """
  <header class="banner wrap">
    <div class="eyebrow reveal show">// MANAGER</div>
    <h1 class="reveal show d1">Dashboard</h1>
    <p class="lead reveal show d2">Live analytics for alihussein.tech, who's visiting, what they read, and your messages.</p>
  </header>
  <section style="padding-top:18px;">
    <div class="wrap">
      <div id="dashGate" class="glass" style="padding:30px; border-radius:var(--radius-lg); display:none;"></div>
      <div id="dashContent" style="display:none;">
        <div class="stat-cards" id="statCards"></div>
        <div class="dash-grid">
          <div class="glass dash-card span2"><h3>Views, last 30 days</h3><div id="chartViews"></div></div>
          <div class="glass dash-card"><h3>Top pages</h3><div id="chartPages"></div></div>
          <div class="glass dash-card"><h3>Devices</h3><div id="chartDevices"></div></div>
          <div class="glass dash-card"><h3>Top referrers</h3><div id="listRef"></div></div>
          <div class="glass dash-card"><h3>Countries</h3><div id="listGeo"></div></div>
          <div class="glass dash-card span2"><h3>Recent visits</h3><div id="recent"></div></div>
        </div>
        <div class="glass dash-card" style="margin-top:22px;"><h3>Messages</h3><div id="msgs"></div></div>
        <div class="glass dash-card" style="margin-top:22px;"><h3>Guestbook moderation</h3><div id="gbmod"></div></div>
      </div>
    </div>
  </section>
"""
page("dashboard.html", "",
     "Dashboard · Ali Hussein",
     "Private manager dashboard for alihussein.tech.",
     dashboard_body, extra_scripts='  <script src="assets/js/dashboard.js"></script>\n')
print("done dashboard")

print("ALL DONE")
