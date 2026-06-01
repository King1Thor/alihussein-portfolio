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
      const dotCol = light ? "rgba(90,40,55,.55)" : "rgba(127,227,255,.55)";
      const lineRGB = light ? "70,90,140" : "120,150,210";
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
            const o = (1 - dist / LINK) * (light ? .45 : .35);
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

  /* -------------------------------------------------- PROJECT POPUP (works on any page) */
  (function projModal() {
    const modal = $("#projModal");
    if (!modal) return;
    const elKind = $("#pmKind", modal), elTitle = $("#pmTitle", modal),
          elDesc = $("#pmDesc", modal), elTags = $("#pmTags", modal),
          elVisit = $("#pmVisit", modal), elMark = $("#pmMark", modal);
    function open(card) {
      const d = card.dataset;
      const q = s => card.querySelector(s);
      const kind = d.kind || (q(".kind") ? q(".kind").textContent.trim() : "PROJECT");
      const title = d.title || (q("h3") ? q("h3").textContent.replace(/[↗↘\s]+$/, "").trim() : "Project");
      const desc = d.desc || (q(".body p") ? q(".body p").textContent.trim() : "");
      let tags = [];
      if (d.tags) tags = d.tags.split("|");
      else tags = $$(".tags span", card).map(s => s.textContent);
      elKind.textContent = kind;
      elTitle.textContent = title;
      elDesc.textContent = desc;
      elMark.textContent = title.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
      elTags.innerHTML = tags.filter(Boolean).map(t => "<span>" + t.trim() + "</span>").join("");
      if (d.url) { elVisit.href = d.url; elVisit.style.display = ""; elVisit.textContent = (d.visit || "Visit the live site") + "  ↗"; }
      else { elVisit.style.display = "none"; }
      modal.classList.add("open"); document.body.style.overflow = "hidden";
    }
    function close() { modal.classList.remove("open"); document.body.style.overflow = ""; }
    $$("[data-proj]").forEach(c => {
      c.style.cursor = "pointer";
      c.addEventListener("click", e => {
        if (e.target.closest("a")) return; // let real links work
        open(c);
      });
    });
    $$(".pm-x", modal).forEach(b => b.addEventListener("click", close));
    modal.addEventListener("click", e => { if (e.target === modal) close(); });
    addEventListener("keydown", e => { if (e.key === "Escape") close(); });
  })();
})();


