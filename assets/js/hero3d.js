/* =====================================================================
   HERO3D.JS, interactive layered 3D CPU.
   Auto-rotates always (never tracks the mouse).
   CLICK to cycle layers:  0 sealed lid  ->  1 die / interconnect
                           2 transistor mesh  ->  back to 0 (cover closes)
   Uses Three.js if available; otherwise an animated 2D fallback.
   ===================================================================== */
(function () {
  "use strict";
  const stage = document.getElementById("stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stateEl = document.getElementById("cpuState");
  const LABELS = ["SEALED · CLICK TO OPEN", "DIE EXPOSED · INTERCONNECT", "TRANSISTOR MESH · CLICK TO CLOSE"];
  function setLabel(s) { if (stateEl) stateEl.innerHTML = LABELS[s]; }

  /* engraved metal lid texture */
  function lidTexture(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, "#3a3f49"); g.addColorStop(.5, "#262a32"); g.addColorStop(1, "#1b1e25");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    x.globalAlpha = .05;
    for (let i = 0; i < 140; i++) { x.strokeStyle = i % 2 ? "#fff" : "#000";
      x.beginPath(); const yy = Math.random() * 512; x.moveTo(0, yy); x.lineTo(512, yy + (Math.random() - .5) * 8); x.stroke(); }
    x.globalAlpha = 1;
    x.strokeStyle = "rgba(127,227,255,.25)"; x.lineWidth = 4; x.strokeRect(34, 34, 444, 444);
    x.fillStyle = "#e9eefb"; x.textAlign = "center";
    x.font = "700 62px Sora, sans-serif"; x.fillText("AH-V8", 256, 210);
    x.fillStyle = "#7fe3ff"; x.font = "500 30px monospace"; x.fillText("ARMv8 · RTL", 256, 256);
    x.fillStyle = "#aeb7cc"; x.font = "500 23px monospace"; x.fillText("DIGITAL DESIGN UNIT", 256, 300);
    x.fillStyle = "#6f7891"; x.font = "500 19px monospace"; x.fillText("L1151B · TX · 64-BIT", 256, 338);
    x.fillStyle = "#b51d35"; x.fillRect(214, 372, 84, 60);
    x.fillStyle = "#fff"; x.font = "800 34px Sora, sans-serif"; x.fillText("AH", 256, 414);
    x.fillStyle = "#7fe3ff"; x.beginPath(); x.moveTo(60, 60); x.lineTo(96, 60); x.lineTo(60, 96); x.closePath(); x.fill();
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  /* silicon die texture: functional blocks + interconnect */
  function dieTexture(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d");
    x.fillStyle = "#0a1f2b"; x.fillRect(0, 0, 512, 512);
    // interconnect grid
    x.strokeStyle = "rgba(127,227,255,.18)"; x.lineWidth = 1;
    for (let i = 24; i < 512; i += 22) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 512); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(512, i); x.stroke(); }
    // blocks
    function block(bx, by, bw, bh, col, label) {
      x.fillStyle = col; x.fillRect(bx, by, bw, bh);
      x.strokeStyle = "rgba(255,255,255,.25)"; x.strokeRect(bx, by, bw, bh);
      x.fillStyle = "#eaf6ff"; x.font = "600 18px monospace"; x.textAlign = "center";
      x.fillText(label, bx + bw / 2, by + bh / 2 + 6);
    }
    block(40, 40, 200, 200, "rgba(181,29,53,.55)", "CORE");
    block(272, 40, 200, 92, "rgba(88,182,255,.45)", "L1/L2");
    block(272, 148, 92, 92, "rgba(67,224,138,.4)", "ALU");
    block(376, 148, 96, 92, "rgba(127,227,255,.35)", "REG");
    block(40, 272, 432, 200, "rgba(88,182,255,.25)", "INTERCONNECT FABRIC");
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  /* ---- 2D fallback (top-down CPU, click cycles a caption + layer) ---- */
  function fallback() {
    const c = document.createElement("canvas"); stage.appendChild(c);
    const ctx = c.getContext("2d"); let w, h, t = 0, state = 0;
    function size() { const r = stage.getBoundingClientRect();
      w = c.width = r.width * devicePixelRatio; h = c.height = r.height * devicePixelRatio;
      c.style.width = r.width + "px"; c.style.height = r.height + "px"; }
    size(); addEventListener("resize", size); setLabel(0);
    stage.addEventListener("click", () => { state = (state + 1) % 3; setLabel(state); });
    function rr(x, y, w2, h2, r) { ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w2, y, x + w2, y + h2, r); ctx.arcTo(x + w2, y + h2, x, y + h2, r);
      ctx.arcTo(x, y + h2, x, y, r); ctx.arcTo(x, y, x + w2, y, r); ctx.closePath(); }
    function frame() {
      t += 0.0045; ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, S = Math.min(w, h), pkg = S * 0.46, pin = pkg * 0.1, lid = pkg * 0.62;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t);
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, pkg);
      gl.addColorStop(0, "rgba(181,29,53,.32)"); gl.addColorStop(1, "rgba(181,29,53,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, pkg, 0, 7); ctx.fill();
      ctx.fillStyle = "#13161e"; ctx.strokeStyle = "rgba(127,227,255,.4)"; ctx.lineWidth = devicePixelRatio;
      rr(-pkg / 2, -pkg / 2, pkg, pkg, 10 * devicePixelRatio); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#d8b15a"; const n = 11, step = pkg / (n + 1);
      for (let i = 1; i <= n; i++) { const p = -pkg / 2 + i * step;
        ctx.fillRect(p - pin / 2, -pkg / 2 + 4, pin, pin); ctx.fillRect(p - pin / 2, pkg / 2 - pin - 4, pin, pin);
        ctx.fillRect(-pkg / 2 + 4, p - pin / 2, pin, pin); ctx.fillRect(pkg / 2 - pin - 4, p - pin / 2, pin, pin); }
      if (state === 0) {
        const lg = ctx.createLinearGradient(-lid / 2, -lid / 2, lid / 2, lid / 2);
        lg.addColorStop(0, "#3a3f49"); lg.addColorStop(.5, "#262a32"); lg.addColorStop(1, "#181b22");
        ctx.fillStyle = lg; rr(-lid / 2, -lid / 2, lid, lid, 6 * devicePixelRatio); ctx.fill();
        ctx.strokeStyle = "rgba(127,227,255,.3)"; ctx.stroke();
        ctx.fillStyle = "#e9eefb"; ctx.textAlign = "center"; ctx.font = `700 ${lid * 0.16}px Sora, sans-serif`;
        ctx.fillText("AH-V8", 0, 0); ctx.fillStyle = "#7fe3ff"; ctx.font = `500 ${lid * 0.08}px monospace`;
        ctx.fillText("ARMv8 · RTL", 0, lid * 0.16);
      } else if (state === 1) {
        ctx.fillStyle = "#0a1f2b"; rr(-lid / 2, -lid / 2, lid, lid, 6 * devicePixelRatio); ctx.fill();
        ctx.fillStyle = "rgba(181,29,53,.55)"; ctx.fillRect(-lid / 2 + 8, -lid / 2 + 8, lid * .42, lid * .42);
        ctx.fillStyle = "rgba(88,182,255,.45)"; ctx.fillRect(8, -lid / 2 + 8, lid * .42, lid * .18);
        ctx.fillStyle = "rgba(67,224,138,.45)"; ctx.fillRect(8, -lid / 2 + lid * .3, lid * .2, lid * .2);
        ctx.fillStyle = "rgba(88,182,255,.25)"; ctx.fillRect(-lid / 2 + 8, 8, lid * .84, lid * .42);
        ctx.fillStyle = "#eaf6ff"; ctx.font = `600 ${lid * 0.07}px monospace`; ctx.textAlign = "center";
        ctx.fillText("CORE", -lid * .19, -lid * .19); ctx.fillText("FABRIC", 0, lid * .3);
      } else {
        ctx.fillStyle = "#06121a"; rr(-lid / 2, -lid / 2, lid, lid, 6 * devicePixelRatio); ctx.fill();
        const g2 = lid / 11; ctx.fillStyle = "#7fe3ff";
        for (let i = 0; i <= 10; i++) for (let j = 0; j <= 10; j++) {
          ctx.globalAlpha = .35 + .4 * Math.abs(Math.sin(t * 3 + i + j));
          ctx.fillRect(-lid / 2 + i * g2 - 1.5, -lid / 2 + j * g2 - 1.5, 3, 3); }
        ctx.globalAlpha = .2; ctx.strokeStyle = "#58b6ff"; ctx.lineWidth = devicePixelRatio * .5;
        for (let i = 0; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(-lid / 2 + i * g2, -lid / 2);
          ctx.lineTo(-lid / 2 + i * g2, lid / 2); ctx.stroke(); ctx.beginPath();
          ctx.moveTo(-lid / 2, -lid / 2 + i * g2); ctx.lineTo(lid / 2, -lid / 2 + i * g2); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore(); requestAnimationFrame(frame);
    }
    frame();
  }

  /* ---- full 3D CPU ---- */
  function build() {
    const THREE = window.THREE; if (!THREE) return fallback();
    const r = stage.getBoundingClientRect();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 4.4, 6.2); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(r.width, r.height);
    stage.appendChild(renderer.domElement);

    const cpu = new THREE.Group(); scene.add(cpu);

    const sub = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.26, 3.1),
      new THREE.MeshStandardMaterial({ color: 0x0e1a16, metalness: 0.3, roughness: 0.7 }));
    cpu.add(sub);
    cpu.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(3.12, 0.28, 3.12)),
      new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0.5 })));

    // die (visible from state 1)
    const dieMat = new THREE.MeshStandardMaterial({ map: dieTexture(THREE), metalness: 0.4, roughness: 0.55,
      transparent: true, opacity: 0, emissive: 0x0a2233, emissiveIntensity: 0.5 });
    const die = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.06, 1.95), dieMat);
    die.position.y = 0.16; cpu.add(die);

    // transistor mesh (state 2): glowing instanced lattice + grid lines
    const txMat = new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x2aa6e0,
      emissiveIntensity: 1.2, transparent: true, opacity: 0 });
    const G = 12, span = 1.8, step = span / (G - 1), o = -span / 2;
    const tx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), txMat, G * G);
    const mm = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { mm.makeTranslation(o + i * step, 0.34, o + j * step); tx.setMatrixAt(k++, mm); }
    tx.instanceMatrix.needsUpdate = true; cpu.add(tx);
    const linePts = [];
    for (let i = 0; i < G; i++) { linePts.push(o + i * step, 0.34, o, o + i * step, 0.34, -o);
      linePts.push(o, 0.34, o + i * step, -o, 0.34, o + i * step); }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePts, 3));
    const txLines = new THREE.LineSegments(lineGeo,
      new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0 }));
    cpu.add(txLines);

    // heat-spreader lid (lifts + fades from state 1)
    const lidTop = new THREE.MeshStandardMaterial({ map: lidTexture(THREE), metalness: 0.9, roughness: 0.34, transparent: true, opacity: 1 });
    const lidSide = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.95, roughness: 0.3, transparent: true, opacity: 1 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.24, 2.15),
      [lidSide, lidSide, lidTop, lidSide, lidSide, lidSide]);
    lid.position.y = 0.25; cpu.add(lid);

    // gold pin grid underneath
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd8b15a, metalness: 1, roughness: 0.35, emissive: 0x3a2c08, emissiveIntensity: 0.4 });
    const N = 14, gap = 3 / N, st = -3 / 2 + gap / 2;
    const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.18, 8), pinMat, N * N);
    const m2 = new THREE.Matrix4(); let idx = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { m2.makeTranslation(st + i * gap, -0.22, st + j * gap); pins.setMatrixAt(idx++, m2); }
    pins.instanceMatrix.needsUpdate = true; cpu.add(pins);

    // SMD caps
    const capMat = new THREE.MeshStandardMaterial({ color: 0x9a8f6a, metalness: 0.6, roughness: 0.5 });
    const capGeo = new THREE.BoxGeometry(0.16, 0.08, 0.09);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2;
      if (Math.abs(Math.cos(a)) > 0.95 || Math.abs(Math.sin(a)) > 0.95) continue;
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(Math.cos(a) * 1.32, 0.17, Math.sin(a) * 1.32); cap.rotation.y = -a; cpu.add(cap); }

    const mark = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 3),
      new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x1a6fa8, emissiveIntensity: 0.6 }));
    mark.position.set(-1.28, 0.15, -1.28); mark.rotation.y = Math.PI / 4; cpu.add(mark);

    scene.add(new THREE.AmbientLight(0x405070, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 6, 4); scene.add(key);
    const l1 = new THREE.PointLight(0xb51d35, 2.2, 30); l1.position.set(4, 3, 5); scene.add(l1);
    const l2 = new THREE.PointLight(0x58b6ff, 1.8, 30); l2.position.set(-5, 2, 3); scene.add(l2);

    cpu.rotation.x = 0.18;

    // ---- state machine ----
    let state = 0; setLabel(0);
    const tgt = { lidY: 0.25, lidO: 1, dieO: 0, txO: 0 };
    function applyTargets() {
      if (state === 0) { tgt.lidY = 0.25; tgt.lidO = 1; tgt.dieO = 0; tgt.txO = 0; }
      else if (state === 1) { tgt.lidY = 1.7; tgt.lidO = 0.12; tgt.dieO = 1; tgt.txO = 0; }
      else { tgt.lidY = 2.2; tgt.lidO = 0; tgt.dieO = 0.3; tgt.txO = 1; }
    }
    stage.addEventListener("click", () => { state = (state + 1) % 3; setLabel(state); applyTargets(); });
    stage.style.cursor = "pointer";

    function resize() { const b = stage.getBoundingClientRect();
      camera.aspect = b.width / b.height; camera.updateProjectionMatrix(); renderer.setSize(b.width, b.height); }
    addEventListener("resize", resize);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      cpu.rotation.y = t * 0.32;
      cpu.position.y = Math.sin(t * 1.1) * 0.06;
      // smooth transitions
      lid.position.y += (tgt.lidY - lid.position.y) * 0.08;
      lidTop.opacity += (tgt.lidO - lidTop.opacity) * 0.08; lidSide.opacity = lidTop.opacity;
      lid.visible = lidTop.opacity > 0.02;
      dieMat.opacity += (tgt.dieO - dieMat.opacity) * 0.08; die.visible = dieMat.opacity > 0.02;
      const to = tgt.txO; txMat.opacity += (to - txMat.opacity) * 0.08;
      txLines.material.opacity += (to * 0.6 - txLines.material.opacity) * 0.08;
      tx.visible = txMat.opacity > 0.02; txLines.visible = tx.visible;
      if (tx.visible) txMat.emissiveIntensity = 0.8 + Math.sin(t * 3) * 0.5;
      renderer.render(scene, camera);
    })();
  }

  if (reduce) { fallback(); return; }
  if (window.THREE) { build(); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  s.onload = build; s.onerror = fallback;
  document.head.appendChild(s);
  setTimeout(() => { if (!window.THREE && !stage.querySelector("canvas")) fallback(); }, 3500);
})();
