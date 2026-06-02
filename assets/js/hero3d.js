/* =====================================================================
   HERO3D.JS, detailed interactive 3D CPU.
   Auto-rotates always (never tracks the mouse).
   CLICK cycles layers: 0 sealed lid -> 1 die / interconnect + bond wires
                        2 transistor mesh (flowing) -> back to 0.
   Three.js if available; otherwise an animated 2D fallback.
   ===================================================================== */
(function () {
  "use strict";
  const stage = document.getElementById("stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const stateEl = document.getElementById("cpuState");
  const LABELS = ["SEALED · CLICK TO OPEN", "DIE & INTERCONNECT · CLICK AGAIN", "TRANSISTOR MESH · CLICK TO CLOSE"];
  const setLabel = s => { if (stateEl) stateEl.innerHTML = LABELS[s]; };

  /* ---------- textures ---------- */
  function lidTexture(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 640;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 640, 640);
    g.addColorStop(0, "#434954"); g.addColorStop(.5, "#262a32"); g.addColorStop(1, "#171a20");
    x.fillStyle = g; x.fillRect(0, 0, 640, 640);
    x.globalAlpha = .05;
    for (let i = 0; i < 200; i++) { x.strokeStyle = i % 2 ? "#fff" : "#000";
      x.beginPath(); const yy = Math.random() * 640; x.moveTo(0, yy); x.lineTo(640, yy + (Math.random() - .5) * 10); x.stroke(); }
    x.globalAlpha = 1;
    x.strokeStyle = "rgba(127,227,255,.30)"; x.lineWidth = 5; x.strokeRect(40, 40, 560, 560);
    x.strokeStyle = "rgba(127,227,255,.12)"; x.lineWidth = 2; x.strokeRect(60, 60, 520, 520);
    x.fillStyle = "#eef3fb"; x.textAlign = "center";
    x.font = "800 78px Sora, sans-serif"; x.fillText("AH-V8", 320, 250);
    x.fillStyle = "#7fe3ff"; x.font = "600 36px monospace"; x.fillText("ARMv8 · 64-BIT · RTL", 320, 308);
    x.fillStyle = "#aeb7cc"; x.font = "500 27px monospace"; x.fillText("DIGITAL DESIGN UNIT", 320, 356);
    x.fillStyle = "#7c869c"; x.font = "500 22px monospace";
    x.fillText("AH" + "L1151B947 · TX", 320, 398);
    x.fillText("◼ ▮ ◼▮ ◼ ▮◼ ▮ ◼  LOT TX-26", 320, 430);
    x.fillStyle = "#b51d35"; x.fillRect(268, 470, 104, 74);
    x.fillStyle = "#fff"; x.font = "800 42px Sora, sans-serif"; x.fillText("AH", 320, 522);
    x.fillStyle = "#7fe3ff"; x.beginPath(); x.moveTo(74, 74); x.lineTo(120, 74); x.lineTo(74, 120); x.closePath(); x.fill();
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  }
  function dieTexture(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 640;
    const x = c.getContext("2d");
    x.fillStyle = "#081a24"; x.fillRect(0, 0, 640, 640);
    x.strokeStyle = "rgba(127,227,255,.16)"; x.lineWidth = 1;
    for (let i = 18; i < 640; i += 18) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 640); x.stroke();
      x.beginPath(); x.moveTo(0, i); x.lineTo(640, i); x.stroke(); }
    // diagonal "routing" highlights
    x.strokeStyle = "rgba(216,177,90,.5)"; x.lineWidth = 2;
    for (let i = 0; i < 22; i++) { x.beginPath(); const yy = Math.random()*640;
      x.moveTo(0, yy); x.lineTo(640, yy + (Math.random()-.5)*60); x.stroke(); }
    function block(bx, by, bw, bh, col, label) {
      x.fillStyle = col; x.fillRect(bx, by, bw, bh);
      x.strokeStyle = "rgba(255,255,255,.28)"; x.lineWidth = 2; x.strokeRect(bx, by, bw, bh);
      x.fillStyle = "#eaf6ff"; x.font = "700 20px monospace"; x.textAlign = "center";
      x.fillText(label, bx + bw / 2, by + bh / 2 + 7);
    }
    block(40, 40, 170, 170, "rgba(181,29,53,.6)", "CORE 0");
    block(220, 40, 170, 170, "rgba(181,29,53,.45)", "CORE 1");
    block(400, 40, 200, 80, "rgba(88,182,255,.5)", "L2 CACHE");
    block(400, 130, 95, 80, "rgba(67,224,138,.45)", "ALU");
    block(505, 130, 95, 80, "rgba(127,227,255,.4)", "FPU");
    block(40, 220, 130, 90, "rgba(88,182,255,.4)", "L1 I$");
    block(180, 220, 130, 90, "rgba(88,182,255,.4)", "L1 D$");
    block(320, 220, 130, 90, "rgba(67,224,138,.35)", "REGS");
    block(460, 220, 140, 90, "rgba(127,227,255,.3)", "MMU");
    block(40, 320, 560, 130, "rgba(88,182,255,.22)", "INTERCONNECT FABRIC");
    block(40, 460, 270, 140, "rgba(181,29,53,.3)", "MEM CONTROLLER");
    block(330, 460, 270, 140, "rgba(127,227,255,.25)", "I/O & PHY");
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8; return t;
  }
  function pcbTexture(THREE) {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    const x = c.getContext("2d");
    x.fillStyle = "#0c1712"; x.fillRect(0, 0, 512, 512);
    x.strokeStyle = "rgba(120,200,160,.22)"; x.lineWidth = 2;
    for (let i = 0; i < 60; i++) { x.beginPath(); let px = Math.random()*512, py = Math.random()*512;
      x.moveTo(px, py); for (let k=0;k<3;k++){ px += (Math.random()-.5)*120; py += (Math.random()-.5)*120; x.lineTo(px, py);} x.stroke(); }
    x.fillStyle = "rgba(216,177,90,.6)";
    for (let i = 0; i < 90; i++) { x.beginPath(); x.arc(Math.random()*512, Math.random()*512, 2.2, 0, 7); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }

  /* ---------- 2D fallback ---------- */
  function fallback() {
    const c = document.createElement("canvas"); stage.appendChild(c);
    const ctx = c.getContext("2d"); let w, h, t = 0, state = 0;
    const size = () => { const r = stage.getBoundingClientRect();
      w = c.width = r.width * devicePixelRatio; h = c.height = r.height * devicePixelRatio;
      c.style.width = r.width + "px"; c.style.height = r.height + "px"; };
    size(); addEventListener("resize", size); setLabel(0);
    stage.addEventListener("click", () => { state = (state + 1) % 3; setLabel(state); });
    const rr = (x, y, w2, h2, r) => { ctx.beginPath(); ctx.moveTo(x + r, y);
      ctx.arcTo(x + w2, y, x + w2, y + h2, r); ctx.arcTo(x + w2, y + h2, x, y + h2, r);
      ctx.arcTo(x, y + h2, x, y, r); ctx.arcTo(x, y, x + w2, y, r); ctx.closePath(); };
    function frame() {
      t += 0.0045; ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, S = Math.min(w, h), pkg = S * 0.5, pin = pkg * 0.055, lid = pkg * 0.6;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t);
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, pkg);
      gl.addColorStop(0, "rgba(181,29,53,.32)"); gl.addColorStop(1, "rgba(181,29,53,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, pkg, 0, 7); ctx.fill();
      ctx.fillStyle = "#10151c"; ctx.strokeStyle = "rgba(127,227,255,.4)"; ctx.lineWidth = devicePixelRatio;
      rr(-pkg / 2, -pkg / 2, pkg, pkg, 10 * devicePixelRatio); ctx.fill(); ctx.stroke();
      // dense gold pins
      ctx.fillStyle = "#d8b15a"; const n = 18, step = pkg / (n + 1);
      for (let i = 1; i <= n; i++) { const p = -pkg / 2 + i * step;
        ctx.fillRect(p - pin / 2, -pkg / 2 + 3, pin, pin); ctx.fillRect(p - pin / 2, pkg / 2 - pin - 3, pin, pin);
        ctx.fillRect(-pkg / 2 + 3, p - pin / 2, pin, pin); ctx.fillRect(pkg / 2 - pin - 3, p - pin / 2, pin, pin); }
      // SMD caps
      ctx.fillStyle = "#9a8f6a";
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; if (Math.abs(Math.cos(a))>.9||Math.abs(Math.sin(a))>.9) continue;
        ctx.fillRect(Math.cos(a)*lid*.62 - pin, Math.sin(a)*lid*.62 - pin*.6, pin*2, pin*1.2); }
      if (state === 0) {
        const lg = ctx.createLinearGradient(-lid/2, -lid/2, lid/2, lid/2);
        lg.addColorStop(0, "#434954"); lg.addColorStop(.5, "#262a32"); lg.addColorStop(1, "#171a20");
        ctx.fillStyle = lg; rr(-lid/2, -lid/2, lid, lid, 7 * devicePixelRatio); ctx.fill();
        ctx.strokeStyle = "rgba(127,227,255,.3)"; ctx.stroke();
        ctx.strokeStyle = "rgba(127,227,255,.12)"; ctx.strokeRect(-lid/2+8, -lid/2+8, lid-16, lid-16);
        ctx.fillStyle = "#eef3fb"; ctx.textAlign = "center"; ctx.font = `800 ${lid*0.16}px Sora, sans-serif`;
        ctx.fillText("AH-V8", 0, -lid*.02); ctx.fillStyle = "#7fe3ff"; ctx.font = `600 ${lid*0.07}px monospace`;
        ctx.fillText("ARMv8 · 64-BIT", 0, lid*.14);
        ctx.fillStyle = "#b51d35"; ctx.fillRect(-lid*.09, lid*.24, lid*.18, lid*.13);
        ctx.fillStyle = "#fff"; ctx.font = `800 ${lid*0.08}px Sora`; ctx.fillText("AH", 0, lid*.335);
      } else if (state === 1) {
        ctx.fillStyle = "#081a24"; rr(-lid/2, -lid/2, lid, lid, 7 * devicePixelRatio); ctx.fill();
        const u = lid/100; const blk=(bx,by,bw,bh,col,l)=>{ctx.fillStyle=col;ctx.fillRect(-lid/2+bx*u,-lid/2+by*u,bw*u,bh*u);
          ctx.fillStyle="#eaf6ff";ctx.font=`600 ${lid*.045}px monospace`;ctx.textAlign="center";ctx.fillText(l,-lid/2+(bx+bw/2)*u,-lid/2+(by+bh/2)*u+lid*.016);};
        blk(6,6,40,40,"rgba(181,29,53,.6)","C0"); blk(54,6,40,40,"rgba(181,29,53,.45)","C1");
        blk(6,54,40,18,"rgba(88,182,255,.45)","L1"); blk(54,54,40,18,"rgba(67,224,138,.4)","ALU");
        blk(6,78,88,16,"rgba(88,182,255,.25)","FABRIC");
      } else {
        ctx.fillStyle = "#05121a"; rr(-lid/2, -lid/2, lid, lid, 7 * devicePixelRatio); ctx.fill();
        const G = 14, g2 = lid / G; ctx.fillStyle = "#7fe3ff";
        for (let i = 0; i <= G; i++) for (let j = 0; j <= G; j++) {
          ctx.globalAlpha = .3 + .5 * Math.abs(Math.sin(t * 3 + i * .6 + j * .4));
          ctx.fillRect(-lid/2 + i*g2 - 1.5, -lid/2 + j*g2 - 1.5, 3, 3); }
        ctx.globalAlpha = .18; ctx.strokeStyle = "#58b6ff"; ctx.lineWidth = devicePixelRatio*.5;
        for (let i = 0; i <= G; i++) { ctx.beginPath(); ctx.moveTo(-lid/2+i*g2,-lid/2); ctx.lineTo(-lid/2+i*g2,lid/2); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-lid/2,-lid/2+i*g2); ctx.lineTo(lid/2,-lid/2+i*g2); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      ctx.restore(); requestAnimationFrame(frame);
    }
    frame();
  }

  /* ---------- full 3D CPU ---------- */
  function build() {
    const THREE = window.THREE; if (!THREE) return fallback();
    const r = stage.getBoundingClientRect();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 4.2, 5.8); camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setSize(r.width, r.height);
    stage.appendChild(renderer.domElement);

    const cpu = new THREE.Group(); scene.add(cpu);
    const SZ = 3.4;

    // substrate with PCB texture on top
    const pcb = pcbTexture(THREE);
    const subTop = new THREE.MeshStandardMaterial({ map: pcb, metalness: 0.35, roughness: 0.65 });
    const subSide = new THREE.MeshStandardMaterial({ color: 0x0c1712, metalness: 0.3, roughness: 0.7 });
    const sub = new THREE.Mesh(new THREE.BoxGeometry(SZ, 0.28, SZ),
      [subSide, subSide, subTop, subSide, subSide, subSide]);
    cpu.add(sub);
    cpu.add(new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(SZ + 0.02, 0.3, SZ + 0.02)),
      new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0.55 })));

    // gold contact-pad ring on substrate top
    const padMat = new THREE.MeshStandardMaterial({ color: 0xd8b15a, metalness: 1, roughness: 0.3, emissive: 0x3a2c08, emissiveIntensity: 0.35 });
    const padGeo = new THREE.BoxGeometry(0.09, 0.02, 0.09);
    const PADN = 20, pgap = (SZ - 0.5) / PADN, pstart = -(SZ - 0.5) / 2;
    const pads = new THREE.InstancedMesh(padGeo, padMat, PADN * 4);
    const pm = new THREE.Matrix4(); let pi = 0; const edge = SZ / 2 - 0.18;
    for (let i = 0; i < PADN; i++) { const p = pstart + i * pgap + pgap / 2;
      pm.makeTranslation(p, 0.15, -edge); pads.setMatrixAt(pi++, pm);
      pm.makeTranslation(p, 0.15, edge); pads.setMatrixAt(pi++, pm);
      pm.makeTranslation(-edge, 0.15, p); pads.setMatrixAt(pi++, pm);
      pm.makeTranslation(edge, 0.15, p); pads.setMatrixAt(pi++, pm); }
    pads.instanceMatrix.needsUpdate = true; cpu.add(pads);

    // silicon die
    const dieMat = new THREE.MeshStandardMaterial({ map: dieTexture(THREE), metalness: 0.45, roughness: 0.5,
      transparent: true, opacity: 0, emissive: 0x0a2233, emissiveIntensity: 0.55 });
    const die = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 2.0), dieMat);
    die.position.y = 0.17; cpu.add(die);
    // raised core tiles on die
    const tileMat = new THREE.MeshStandardMaterial({ color: 0xb51d35, emissive: 0x7a0f1e, emissiveIntensity: 0.7, transparent: true, opacity: 0 });
    const tiles = [];
    [[-0.45, -0.45], [0.1, -0.45], [-0.55, 0.2], [-0.1, 0.2], [0.35, 0.2]].forEach(([dx, dz], n) => {
      const tl = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.04, 0.42), tileMat.clone());
      tl.position.set(dx, 0.22, dz); tl.material.color.setHex(n < 2 ? 0xb51d35 : 0x2c6fb0);
      tl.material.emissive.setHex(n < 2 ? 0x7a0f1e : 0x113a66); cpu.add(tl); tiles.push(tl);
    });
    // bond wires (gold) die -> substrate
    const bwPts = [];
    for (let i = 0; i < 11; i++) { const f = -0.9 + i * 0.18;
      bwPts.push(f, 0.2, -0.98, f, 0.16, -1.45); bwPts.push(f, 0.2, 0.98, f, 0.16, 1.45);
      bwPts.push(-0.98, 0.2, f, -1.45, 0.16, f); bwPts.push(0.98, 0.2, f, 1.45, 0.16, f); }
    const bwGeo = new THREE.BufferGeometry(); bwGeo.setAttribute("position", new THREE.Float32BufferAttribute(bwPts, 3));
    const bondWires = new THREE.LineSegments(bwGeo, new THREE.LineBasicMaterial({ color: 0xe8c878, transparent: true, opacity: 0 }));
    cpu.add(bondWires);

    // transistor mesh (denser) + flowing lines
    const txMat = new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x2aa6e0, emissiveIntensity: 1.2, transparent: true, opacity: 0 });
    const G = 16, span = 1.85, gstep = span / (G - 1), o = -span / 2;
    const tx = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 0.04), txMat, G * G);
    const mm = new THREE.Matrix4(); let k = 0;
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) { mm.makeTranslation(o + i * gstep, 0.36, o + j * gstep); tx.setMatrixAt(k++, mm); }
    tx.instanceMatrix.needsUpdate = true; cpu.add(tx);
    const lp = [];
    for (let i = 0; i < G; i++) { lp.push(o + i * gstep, 0.36, o, o + i * gstep, 0.36, -o);
      lp.push(o, 0.36, o + i * gstep, -o, 0.36, o + i * gstep); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute("position", new THREE.Float32BufferAttribute(lp, 3));
    const txLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0 }));
    cpu.add(txLines);

    // heat-spreader rim + lid
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x3a3f49, metalness: 0.95, roughness: 0.32, transparent: true, opacity: 1 });
    const rim = new THREE.Mesh(new THREE.BoxGeometry(2.45, 0.08, 2.45), rimMat); rim.position.y = 0.17; cpu.add(rim);
    const lidTop = new THREE.MeshStandardMaterial({ map: lidTexture(THREE), metalness: 0.9, roughness: 0.32, transparent: true, opacity: 1 });
    const lidSide = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.95, roughness: 0.3, transparent: true, opacity: 1 });
    const lid = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.26, 2.15),
      [lidSide, lidSide, lidTop, lidSide, lidSide, lidSide]);
    lid.position.y = 0.3; cpu.add(lid);

    // gold pin grid underneath (PGA, denser)
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd8b15a, metalness: 1, roughness: 0.33, emissive: 0x3a2c08, emissiveIntensity: 0.4 });
    const N = 18, gap = SZ / N, st = -SZ / 2 + gap / 2;
    const pins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 8), pinMat, N * N);
    const m2 = new THREE.Matrix4(); let idx = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { m2.makeTranslation(st + i * gap, -0.24, st + j * gap); pins.setMatrixAt(idx++, m2); }
    pins.instanceMatrix.needsUpdate = true; cpu.add(pins);

    // SMD caps/resistors of varying size
    const capMat = new THREE.MeshStandardMaterial({ color: 0x9a8f6a, metalness: 0.6, roughness: 0.5 });
    const resMat = new THREE.MeshStandardMaterial({ color: 0x222831, metalness: 0.4, roughness: 0.6 });
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2;
      if (Math.abs(Math.cos(a)) > 0.96 || Math.abs(Math.sin(a)) > 0.96) continue;
      const big = i % 3 === 0;
      const part = new THREE.Mesh(new THREE.BoxGeometry(big ? 0.2 : 0.13, big ? 0.1 : 0.06, 0.08), i % 2 ? capMat : resMat);
      const rad = 1.3 + (i % 2) * 0.12;
      part.position.set(Math.cos(a) * rad, 0.17, Math.sin(a) * rad); part.rotation.y = -a; cpu.add(part); }

    const mark = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.05, 3),
      new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x1a6fa8, emissiveIntensity: 0.6 }));
    mark.position.set(-SZ / 2 + 0.25, 0.16, -SZ / 2 + 0.25); mark.rotation.y = Math.PI / 4; cpu.add(mark);

    scene.add(new THREE.AmbientLight(0x405070, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(3, 7, 4); scene.add(key);
    const l1 = new THREE.PointLight(0xb51d35, 2.3, 32); l1.position.set(4, 3, 5); scene.add(l1);
    const l2 = new THREE.PointLight(0x58b6ff, 1.9, 32); l2.position.set(-5, 2, 3); scene.add(l2);

    cpu.rotation.x = 0.17;

    let state = 0; setLabel(0);
    const tgt = { lidY: 0.3, lidO: 1, dieO: 0, txO: 0 };
    function applyTargets() {
      if (state === 0) { tgt.lidY = 0.3; tgt.lidO = 1; tgt.dieO = 0; tgt.txO = 0; }
      else if (state === 1) { tgt.lidY = 1.9; tgt.lidO = 0.1; tgt.dieO = 1; tgt.txO = 0; }
      else { tgt.lidY = 2.5; tgt.lidO = 0; tgt.dieO = 0.28; tgt.txO = 1; }
    }
    stage.addEventListener("click", () => { state = (state + 1) % 3; setLabel(state); applyTargets(); });
    stage.style.cursor = "pointer";

    const resize = () => { const b = stage.getBoundingClientRect();
      camera.aspect = b.width / b.height; camera.updateProjectionMatrix(); renderer.setSize(b.width, b.height); };
    addEventListener("resize", resize);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      cpu.rotation.y = t * 0.3;
      cpu.position.y = Math.sin(t * 1.05) * 0.06;
      lid.position.y += (tgt.lidY - lid.position.y) * 0.08;
      lidTop.opacity += (tgt.lidO - lidTop.opacity) * 0.08; lidSide.opacity = lidTop.opacity; rimMat.opacity = lidTop.opacity;
      lid.visible = rim.visible = lidTop.opacity > 0.02;
      dieMat.opacity += (tgt.dieO - dieMat.opacity) * 0.08; die.visible = dieMat.opacity > 0.02;
      const dO = Math.min(dieMat.opacity, tgt.dieO === 1 ? 1 : 0);
      tiles.forEach((tl, n) => { tl.material.opacity += ((state === 1 ? 1 : 0) - tl.material.opacity) * 0.08;
        tl.visible = tl.material.opacity > 0.02;
        tl.material.emissiveIntensity = 0.5 + Math.abs(Math.sin(t * 2 + n)) * 0.6; });
      bondWires.material.opacity += ((state === 1 ? 0.85 : 0) - bondWires.material.opacity) * 0.08;
      bondWires.visible = bondWires.material.opacity > 0.02;
      txMat.opacity += (tgt.txO - txMat.opacity) * 0.08;
      txLines.material.opacity += (tgt.txO * 0.55 - txLines.material.opacity) * 0.08;
      tx.visible = txMat.opacity > 0.02; txLines.visible = tx.visible;
      if (tx.visible) txMat.emissiveIntensity = 0.7 + Math.sin(t * 3.2) * 0.6;
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
