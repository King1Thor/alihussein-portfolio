/* =====================================================================
   PLAYGROUND.JS — interactive hardware toys:
   1) LRU set-associative cache simulator
   2) Logic-gate explorer with live truth table
   3) Combination-lock finite state machine
   ===================================================================== */
(function () {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------------- 1) LRU CACHE ---------------- */
  (function lru() {
    const grid = $("#lruGrid"); if (!grid) return;
    const selSets = $("#lruSets"), selWays = $("#lruWays"), seqIn = $("#lruSeq");
    const curEl = $("#lruCur"), hitsEl = $("#lruHits"), missEl = $("#lruMiss"), rateEl = $("#lruRate"), msgEl = $("#lruMsg");
    let S, W, seq, ptr, clock, cache, hits, miss, timer = null;

    function reset() {
      S = +selSets.value; W = +selWays.value;
      seq = (seqIn.value.match(/\d+/g) || []).map(Number);
      ptr = 0; clock = 0; hits = 0; miss = 0;
      cache = Array.from({ length: S }, () => []);
      curEl.textContent = "—"; hitsEl.textContent = "0"; missEl.textContent = "0"; rateEl.textContent = "0%";
      msgEl.textContent = "Ready, press Step or Run."; msgEl.className = "lru-msg";
      render(-1, -1, null);
      if (timer) { clearInterval(timer); timer = null; }
    }
    function render(hiSet, hiWay, kind) {
      let html = "";
      for (let s = 0; s < S; s++) {
        html += '<div class="lru-set"><span class="lru-idx">set ' + s + '</span><div class="lru-ways">';
        for (let w = 0; w < W; w++) {
          const line = cache[s][w];
          const on = (s === hiSet && (hiWay === -1 || w === hiWay));
          const cls = "lru-cell" + (line ? " filled" : "") + (on && kind ? " " + kind : "");
          html += '<div class="' + cls + '">' + (line ? "tag " + line.tag : "·") + '</div>';
        }
        html += "</div></div>";
      }
      grid.innerHTML = html;
    }
    function step() {
      if (ptr >= seq.length) { msgEl.textContent = "Sequence complete."; msgEl.className = "lru-msg"; if (timer) { clearInterval(timer); timer = null; } return; }
      const addr = seq[ptr++]; clock++;
      const idx = addr % S, tag = Math.floor(addr / S);
      const set = cache[idx];
      curEl.textContent = addr + "  (set " + idx + ", tag " + tag + ")";
      const hit = set.find(l => l.tag === tag);
      if (hit) { hit.used = clock; hits++; msgEl.textContent = "HIT in set " + idx + " (tag " + tag + ")"; msgEl.className = "lru-msg ok"; render(idx, set.indexOf(hit), "hit"); }
      else {
        miss++;
        if (set.length < W) { set.push({ tag, used: clock }); msgEl.textContent = "MISS, loaded tag " + tag + " into set " + idx; msgEl.className = "lru-msg bad"; render(idx, set.length - 1, "miss"); }
        else { let lru = 0; for (let i = 1; i < set.length; i++) if (set[i].used < set[lru].used) lru = i;
          const ev = set[lru].tag; set[lru] = { tag, used: clock };
          msgEl.textContent = "MISS, evicted tag " + ev + ", loaded tag " + tag + " in set " + idx; msgEl.className = "lru-msg bad"; render(idx, lru, "miss"); }
      }
      hitsEl.textContent = hits; missEl.textContent = miss;
      const total = hits + miss; rateEl.textContent = total ? Math.round(hits / total * 100) + "%" : "0%";
    }
    $("#lruStep").addEventListener("click", () => { if (timer) { clearInterval(timer); timer = null; } step(); });
    $("#lruRun").addEventListener("click", () => { if (timer) return; if (ptr >= seq.length) reset();
      timer = setInterval(() => { step(); if (ptr >= seq.length) { clearInterval(timer); timer = null; } }, 700); });
    $("#lruReset").addEventListener("click", reset);
    [selSets, selWays, seqIn].forEach(el => el.addEventListener("change", reset));
    reset();
  })();

  /* ---------------- 2) LOGIC GATE EXPLORER ---------------- */
  (function gate() {
    const out = $("#gOut"); if (!out) return;
    const bA = $("#gA"), bB = $("#gB"), sel = $("#gSel"), led = $("#gLed"), table = $("#gTable");
    let A = 0, B = 0;
    const G = {
      AND: (a, b) => a & b, OR: (a, b) => a | b,
      NAND: (a, b) => +!(a & b), NOR: (a, b) => +!(a | b),
      XOR: (a, b) => a ^ b, XNOR: (a, b) => +!(a ^ b), NOT: (a) => +!a
    };
    function compute() {
      const g = sel.value, unary = g === "NOT";
      bB.style.opacity = unary ? ".35" : "1"; bB.style.pointerEvents = unary ? "none" : "auto";
      const o = unary ? G[g](A) : G[g](A, B);
      out.textContent = o; led.className = "led" + (o ? " on" : "");
      bA.textContent = "A = " + A; bB.textContent = "B = " + B;
      bA.classList.toggle("hi", !!A); bB.classList.toggle("hi", !!B && !unary);
      // truth table
      let rows = unary ? [[0], [1]] : [[0, 0], [0, 1], [1, 0], [1, 1]];
      let html = "<tr>" + (unary ? "<th>A</th>" : "<th>A</th><th>B</th>") + "<th>OUT</th></tr>";
      rows.forEach(r => {
        const ro = unary ? G[g](r[0]) : G[g](r[0], r[1]);
        const cur = unary ? (r[0] === A) : (r[0] === A && r[1] === B);
        html += '<tr class="' + (cur ? "cur" : "") + '">' + r.map(v => "<td>" + v + "</td>").join("") + '<td class="o">' + ro + "</td></tr>";
      });
      table.innerHTML = html;
    }
    bA.addEventListener("click", () => { A ^= 1; compute(); });
    bB.addEventListener("click", () => { B ^= 1; compute(); });
    sel.addEventListener("change", compute);
    compute();
  })();

  /* ---------------- 3) COMBINATION-LOCK FSM ---------------- */
  (function fsm() {
    const pad = $("#fsmKeys"); if (!pad) return;
    const msg = $("#fsmMsg"), nodes = $$(".fsm-node");
    const CODE = [1, 3, 2];
    let state = 0; // 0 LOCKED, 1, 2, 3=UNLOCKED
    function paint() {
      nodes.forEach((n, i) => n.classList.toggle("active", i === state));
      if (state === CODE.length) { msg.textContent = "UNLOCKED ✓"; msg.className = "fsm-msg ok"; }
      else if (state === 0) { msg.textContent = "LOCKED, enter the code 1 · 3 · 2"; msg.className = "fsm-msg"; }
      else { msg.textContent = "Correct so far (" + state + "/" + CODE.length + "), keep going"; msg.className = "fsm-msg ok"; }
    }
    pad.addEventListener("click", e => {
      const b = e.target.closest("button[data-k]"); if (!b) return;
      const k = +b.dataset.k;
      if (state >= CODE.length) state = 0;
      if (k === CODE[state]) state++;
      else { state = 0; msg.textContent = "Wrong digit, locked again"; msg.className = "fsm-msg bad"; paintNodes(); return; }
      paint();
    });
    function paintNodes() { nodes.forEach((n, i) => n.classList.toggle("active", i === 0)); }
    $("#fsmReset").addEventListener("click", () => { state = 0; paint(); });
    paint();
  })();
})();
