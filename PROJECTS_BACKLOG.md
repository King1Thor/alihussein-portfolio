# Projects to add (batch build at the end)

> BUILD LOG — 2026-06-09: "build them all" run completed. Projects 2–6 are now built
> into the site (projects.html cards + index.html featured covers where applicable +
> CASE entries in core.js + repos as "View code" buttons), and the homepage profile
> photo was swapped to my_profile_pic.jpeg (assets/img/profile.jpeg).
> Resolved open items: (a) Banking had no artwork → generated an on-brand SVG
> architecture diagram (assets/img/projects/banking-architecture.svg) as its cover;
> (b) Banking card renamed "Banking Authentication Program" → "Multi-Threaded Banking
> System" (CASE key renamed to match); (c) the ALU (Lab 4) was added as its own card
> with the demo video — the popup gallery now supports a video item (pmVid). The Lab 4
> ALU question is resolved (it's now Project 6). Source media kept under assets/img/projects/.

Captured from Ali as we go. When he says "build them all", add each as a project
card (homepage featured + projects page) and a case-study entry in the CASE map
(assets/js/core.js), plus any artifact images. Popup will be upgraded to show a
small image gallery for projects that have multiple pics.

---

## Project 1 — Two-Stage MOSFET Amplifier (ECEN 325)  [BUILT — already in the site]
Kind label: ANALOG · CIRCUIT DESIGN
Tags: MOSFET, Analog Design, Biasing, Multisim, Oscilloscope, THD

Images (in assets/img/projects/):
- amp-schematic.png   (Multisim schematic — primary/cleanest)  1221x906
- amp-breadboard.jpeg (real breadboard build w/ scope probes)  1500x2000 (portrait — crop)
- amp-scope.jpeg      (Keysight scope: Vin yellow, Vout green, THD trace ~1.9%) 800x512

Case study (Problem / Design / Verify / Result):
- Problem: Design, simulate, and physically build a two-stage MOSFET amplifier on a
  ±5 V supply that hits hard specs at once: voltage gain |Av| = 40, input resistance
  Ri >= 10 kohm, output swing >= 2 V into a 100 ohm load, and THD <= 8% at 4 kHz.
- Design: Hand-calculated the full bias design — picked the 20 mA output tail current,
  solved overdrive voltages, gm, and the allowed VRD window (6.08-6.87 V), then sized
  every resistor. Topology: a CD4007P PMOS common-source gain stage (M1) driving a
  2N7000G source-follower output stage (M2) with an NMOS current-source bias (M3).
- Verify: Modeled it in Multisim — DC operating point, AC sweep (gain + input resistance),
  transient, and Fourier/THD — then tuned component values and built it on a breadboard,
  measuring with a Keysight MSO-X 3024T scope and a network analyzer.
- Result: Met every spec. Simulated gain ~40 V/V (measured ~37), input resistance ~21 kohm,
  ~2 V output swing, and measured THD ~3.7% (well under the 8% limit). Hardware tracked
  the design within expected component-tolerance margins.

Final tuned values: RS=82k, RD=420k, RX=24, RG1=68k, RG2=30k, RG3=56k, RG4=30k,
C1=C2=C3=10uF, RL=100, devices 2N7000G (NMOS) + CD4007P (PMOS), supplies +/-5 V.
Source docs: ECEN325_PreLab12.pdf, ECEN325_Lab12_Report.pdf.

---
## Project 2 — Single-Cycle ARMv8 CPU (ECEN 350, Lab 7)  [ALREADY IN SITE — REFRESH IT]
Kind label: COMPUTER ARCHITECTURE  ·  Team project (keep the red "TEAM PROJECT" badge)
Repo (add a "View code" button → data-repo): https://github.com/King1Thor/Hardware-Project
Tags: ARMv8 ISA, Control Unit, Sign Extender, MOVZ, Verilog, iverilog/GTKWave

NOTE: This is NOT a new card. The project already exists in the site:
- Card in build_site.py (hardware grid, card "01"): currently uses cover
  assets/img/armv8_whiteboard.jpeg and has NO metrics issue except the "5-stage"
  label (see below).
- CASE entry "Single-Cycle ARMv8 CPU" in assets/js/core.js currently has 4 generic
  steps and NO gallery.
At build time: swap the cover, add the gallery + richer steps, add the View-code button.

Cover change (Ali dislikes the current whiteboard cover):
- Use assets/img/projects/armv8-datapath.png as the new card cover (clean datapath +
  control-unit diagram, landscape — reads well as a hero image).

Images (saved in assets/img/projects/):
- armv8-datapath.png  (full single-cycle datapath + control diagram)   1087x757  → new cover + gallery #1
- armv8-results.jpeg  (Raspberry Pi terminal: "All tests passed", Program 1 & 2 passed) 1512x2016 (portrait — crop) → gallery #2
- (existing) assets/img/armv8_whiteboard.jpeg — the old cover; can stay as a 3rd gallery
  image ("ARM-v8 hand-compilation / instruction planning") or be retired. Ali's call.

Gallery for CASE map (suggested order):
  { src: "assets/img/projects/armv8-datapath.png", cap: "Single-cycle datapath + control unit" }
  { src: "assets/img/projects/armv8-results.jpeg", cap: "All tests passed (run on Raspberry Pi)" }
  { src: "assets/img/armv8_whiteboard.jpeg",       cap: "Hand-compiling C to ARMv8 assembly" }   // optional

Case study (Problem / Design / Verify / Result) — replaces the current generic 4 steps:
- Problem: Build a working single-cycle ARMv8 processor in Verilog that correctly
  executes the core instruction set — R-type (AND/ORR/ADD/SUB), I-type (ADDI/SUBI),
  D-type (LDUR/STUR), and branches (CBZ, B) — then extend it to support MOVZ so the
  CPU can build full 64-bit constants.
- Design: Built the main control unit (SC_Control.v) that decodes the 11-bit opcode with
  casez wildcard patterns and drives every control line (Reg2Loc, ALUSrc, MemtoReg,
  RegWrite, MemRead, MemWrite, Branch, Uncondbranch, ALUOp, SignOp). Integrated the full
  datapath in SingleCycleProc.v: PC + InstructionMemory (fetch), field extraction + control
  (decode), regfile32x64, SignExtender, ALU, DataMemory, the MemtoReg write-back mux, and
  NextPClogic for PC+4 vs. branch targets. Added MOVZ by introducing a MovZ control flag
  that tells the SignExtender to zero-extend the 16-bit immediate and shift it to position
  hw*16 (0/16/32/48); with ALUSrc=1 and ALUOp=PASS_B the ALU forwards it straight to the
  register file. No other datapath changes were needed.
- Verify: Wrote a self-checking control-unit testbench (tb_SC_Control.v) that exhaustively
  expands the wildcard opcode patterns — I-type, MOVZ, all 8 CBZ encodings, all 32 B
  encodings — and fires 10 random *unsupported* opcodes to confirm they fall through to the
  all-zeros safe default (machine harmlessly does nothing, PC just steps +4). Compiled and
  simulated the whole core with iverilog (-g2012) + GTKWave, tracing PC, control lines, the
  ALU/immediate path, and memory. Ran it on a Raspberry Pi.
- Result: All tests passed. A MOVZ+ORR program builds the 64-bit constant
  0x123456789ABCDEF0 in X9 (four 16-bit chunks), stores it to data memory at 0x28 with STUR,
  and loads it back into X10 with LDUR — verifying the MOVZ extension, the D-type
  store/load path, and the full single-cycle datapath end to end. Terminal shows
  "Results of Program 1 passed", "Results of Program 2 passed", "All tests passed".

Metrics for the card (3 tiles). FIX the current "5-stage Datapath" tile — this is a
single-cycle core, not a 5-stage pipeline. Suggested replacements:
  - "Single-Cycle"  / "Datapath"
  - "R/I/D/CB/B"    / "Instr. Types"   (it handles more than just R/D/B)
  - "All Passed"    / "Self-Tests"
(Alternative middle tile: "MOVZ" / "Extension" to highlight the extra work.)

Source docs: LAB_7_Steps.pdf (full Verilog: SC_Control, SignExtender, SingleCycleProc,
testbench, MOVZ program), Lab07_Demo_docx.pdf (Q1/Q2/Q3 demo output).

---
## Project 3 — Reveille Bubble Tea POS (CSCE 331, Team 25)  [ALREADY IN SITE — REFRESH IT]
Kind label: FULL-STACK · TEAM PROJECT  (keep existing)
Live site (already wired as data-url): https://project3-team25-m13k.onrender.com/
Repo (add a "View code" button → data-repo; CONFIRMED PUBLIC):
  https://github.com/CSCE-331-Spring-2026-900-908/project3-team25
Tags: keep existing (Frontend | REST API | Relational Database | Role-Based Auth |
  OAuth Login | Deployed on Render)

NOTE: NOT a new card. Already exists as the first/featured full-stack card:
- projects.html card "01" in build_site.py currently uses a GRADIENT "RB" placeholder
  (the styled div at ~lines 144-147, NOT an <img>) — that's the "no pic" Ali dislikes.
- The homepage (index.html) also features this project — CHECK there too and update the
  cover/repo if it shows the same RB placeholder.
- CASE entry "Reveille Bubble Tea" in assets/js/core.js has good 4 steps but NO gallery.

At build time:
1. Replace the gradient "RB" cover with a real screenshot (see cover pick below) — i.e.
   swap the placeholder div for an <img> like the hardware cards use, keeping the
   "01" number badge and the green "LIVE SITE" badge.
2. Add an image gallery to the CASE entry (all 4 screenshots).
3. Add data-repo (the public repo above) so the popup shows a "View code" button
   alongside the existing "Visit the live site" button.
4. Keep the existing case-study steps (they already describe the 3 role-based interfaces
   on one shared API/DB); optionally enrich "Verify/Result" with the live dashboard numbers.

Images (saved in assets/img/projects/, all clean landscape screenshots):
- rbt-kiosk.png      Customer ordering kiosk (fruit-tea menu, weather widget, Ask Assistant) 1858x1015
- rbt-pos.png        Cashier POS terminal (current order, categories, checkout, tax)          1882x1013
- rbt-dashboard.png  Manager dashboard (revenue/orders stats, low-stock watchlist,
                     menu-category donut, payment-method split)                                1869x1019
- rbt-landing.png    Role launcher: Customer Kiosk / Cashier POS / Manager Dashboard           1919x846

Cover pick (Ali's call — I'll default to the kiosk unless he says otherwise):
- DEFAULT: rbt-kiosk.png — most colorful/inviting (drink photos), reads as a polished product.
- ALT: rbt-dashboard.png — most data-rich / "impressive" (charts + analytics).

Gallery for CASE map (suggested order — tells the 3-interface story):
  { src: "assets/img/projects/rbt-kiosk.png",     cap: "Customer ordering kiosk" }
  { src: "assets/img/projects/rbt-pos.png",       cap: "Cashier POS terminal" }
  { src: "assets/img/projects/rbt-dashboard.png", cap: "Manager analytics dashboard" }
  { src: "assets/img/projects/rbt-landing.png",   cap: "Role-based launcher" }

BUILD-TIME UI REQUIREMENTS (Ali called these out explicitly):
- Make sure the popup open animation + the gallery thumbnail switching feel smooth/"cool".
- Make sure the screenshots render crisply (they're ~1860-1920px wide; the popup img should
  fit/scale cleanly without overflow).
- IMPORTANT: verify the popup + gallery look good in BOTH dark and light theme (the site has a
  theme toggle). The screenshots themselves are light-UI (cream bg), so check they sit well on
  the dark popup backdrop and don't wash out in light mode — add a subtle frame/border if needed.

Source: live site + the 4 interface screenshots above; repo confirmed public.

---
## Project 4 — Multi-Threaded Banking System over TCP (C++)  [ALREADY IN SITE as "Banking Authentication Program" — UPGRADE / RESCOPE]
Repo (add "View code" → data-repo; CONFIRMED PUBLIC):
  https://github.com/King1Thor/multi-threaded-banking-system
  (GitHub description: multi-threaded client/server banking system in C++ using TCP
   sockets, thread pools, synchronization, and concurrent request handling on Linux.)
Kind label: SYSTEMS PROGRAMMING · NETWORKING · C++  (current card says "Low-Level Software · C++")
Tags: C++, TCP Sockets, Multithreading, Thread Pool, Mutex/Synchronization, Linux,
  Client/Server, POSIX Threads

NOTE: NOT a new card. The site already has a "Banking Authentication Program" card that
Ali says undersells the real project ("it is bigger than that"). This is an UPGRADE of
that card into the full multi-threaded TCP banking system.
- Existing card: build_site.py card "05", kind "Low-Level Software · C++", cover
  assets/img/bank_whiteboard.jpeg, simple "command-line auth program" description.
- Existing CASE entry keyed "Banking Authentication Program" — 4 generic steps, no gallery.

DECISIONS NEEDED at build time:
1. RENAME the card title → "Multi-Threaded Banking System" (recommended; matches scope).
   IMPORTANT: the CASE map is keyed by the card's title text, so if we rename the card we
   must rename the CASE key to match (or the popup won't find its case study).
2. KEEP or RETIRE the old simple version? Ali's wording implies replace/upgrade this one
   card. Default = rescope this card to the bigger project (don't keep a duplicate
   "auth program" card). Confirm with Ali.

OPEN ITEM — NO ARTWORK PROVIDED:
- The only image Ali sent was a screenshot of the CURRENT card (the "before"), not a new
  artifact. The current cover (bank_whiteboard.jpeg) is the basic menu/switch CLI program
  and undersells the multi-threaded system.
- Need either: (a) a terminal screenshot of the server handling multiple concurrent
  clients, or (b) a clean client/server + thread-pool architecture diagram.
- PLAN: ask Ali for a screenshot; if none, I can generate a tasteful architecture diagram
  at build time (client(s) → TCP → server → thread pool/task queue → finance/logging/
  signal modules, with a mutex on shared account state). Until then this card has no cover.

Case study (rewritten from Ali's detailed writeup):
- Problem: Build a backend banking system that serves many clients at once over the network
  without blocking or corrupting shared account data — exercising real systems-programming
  concerns: concurrency, sockets, IPC, and synchronization.
- Design: A C++ client/server architecture over TCP sockets on Linux. The server listens,
  accepts connections, and hands each request to a thread pool of persistent worker threads
  pulling from a task queue (instead of spawning a thread per request). Shared account state
  is guarded by mutexes/locks. Code is split into modules: networking layer, finance/
  transaction logic, logging, signal handling, and thread management.
- Verify: Connected multiple concurrent clients and exercised transaction operations under
  load; mutexes/locks prevent race conditions on shared data; signal handling guarantees a
  graceful shutdown with clean resource release; the logging module records runtime events
  for debugging and monitoring.
- Result: A concurrent, thread-safe banking server that handles simultaneous clients via a
  thread-pool model — the same pattern used in production backend services (web servers,
  distributed systems, fintech platforms).
Metrics (3 tiles): "Thread Pool" / "Concurrency", "TCP/IP" / "Networking", "Mutex-Safe" / "Shared State".
Source: Ali's project writeup (multi-threaded banking system) + repo (confirmed public).

---
## Project 5 — Traffic Light Controller FSM (ECEN 248, Lab 11)  [NEW PROJECT — ADD A CARD]
Repo (add "View code" → data-repo; CONFIRMED PUBLIC):
  https://github.com/King1Thor/traffic-light-controller-fsm
  (GitHub description: FSM traffic light controller in Verilog for the ZYBO Z7-10 FPGA with
   sensor-based traffic management and counter-driven timing delays.)
Kind label: DIGITAL LOGIC · FPGA  (or "Sequential Logic · ECEN 248")
Hardware: ZYBO Z7-10 FPGA (Xilinx Zynq), Verilog, 50 MHz clock
Tags: Verilog, FSM, FPGA, ZYBO Z7, Sequential Logic, Simulation

NOTE: This is a genuinely NEW project — no existing card. At build time ADD:
- a new card in the build_site.py hardware grid (give it the next number),
- a new CASE entry keyed "Traffic Light Controller" (gallery + 4 steps),
- optionally feature it on the homepage.

Images (saved in assets/img/projects/):
- tlc-zybo.jpg            ZYBO Z7-10 FPGA board photo                       3264x2448 (LARGE — downscale at build) → COVER pick
- tlc-state-diagram.png   Clean S0–S5 state diagram (R|R, G|R… + sensor/count timing) 1216x730 → gallery #1
- tlc-waveform.png        Simulation waveform (Count, Clk, Rst, state, RstCount, highway/farm signals) 1279x686 → gallery #2
- tlc-state-thresholds.png  Alt state diagram w/ Count>=D thresholds + farmSensor 840x701 → gallery #3 (optional)
NOTE: tlc-zybo.jpg may be a stock/product photo of the board rather than Ali's own bench
  photo — fine as a hardware visual, but if Ali has his own build photo it'd be more authentic.

Cover pick: tlc-zybo.jpg (real FPGA hardware — on-brand). ALT: tlc-state-diagram.png.

Gallery for CASE map (suggested order):
  { src: "assets/img/projects/tlc-state-diagram.png",   cap: "6-state FSM (highway / farm road)" }
  { src: "assets/img/projects/tlc-waveform.png",        cap: "Simulation: state + signal timing" }
  { src: "assets/img/projects/tlc-zybo.jpg",            cap: "Running on the ZYBO Z7-10 FPGA" }

Case study (Problem / Design / Verify / Result):
- Problem: Design a traffic-light controller for a highway/farm-road intersection that keeps
  the highway green by default but lets a farm-road sensor request a green, with correctly
  timed phases — built as an FSM in Verilog and run on real FPGA hardware.
- Design: A 6-state Moore FSM (S0–S5) driving 2-bit highway and farm-road signals (red/
  yellow/green). A 31-bit counter at 50 MHz times each phase — 1 s / 30 s / 3 s / 1 s /
  15 s / 3 s — and transitions fire when the counter reaches each state's delay; a farmSensor
  input shortens the highway-green phase when traffic is waiting. n = 31 bits sized to count
  the longest delay (1.5e9 cycles for the 30 s highway green).
- Verify: Simulated the FSM testbench (tlc_fsm_tb), tracing Count, state, RstCount, and the
  highway/farm signal buses to confirm each state drives the correct lights and transitions
  at the right counts, then synthesized and ran it on the ZYBO Z7-10.
- Result: A working, sensor-aware traffic-light controller on FPGA hardware, with simulation
  waveforms matching the designed state sequence and timing.
Metrics (3 tiles): "6-State FSM" / "Moore", "50 MHz" / "Clock", "ZYBO Z7" / "FPGA".
Source docs: ECEN248_Lab11_PreLab.pdf (timing-delay table, n=31 derivation, state diagram,
  Verilog FSM module).

OPEN QUESTION (raised with Ali): a second PDF, "Pre-Lab_Report_for_Lab_4.pdf", was also
attached — it's a *Simple ALU* prelab (4-bit ripple-carry adder + AND + 2:1 MUX, ALU control
table), a DIFFERENT project from the traffic light. Not saved as a project yet. Ask Ali
whether to add it as its own card or ignore it.

---
## Project 6 — (waiting)
