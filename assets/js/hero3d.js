/* =====================================================================
   HERO3D.JS, detailed 3D CPU for the hero stage.
   Auto-rotates on its own. Does NOT react to the mouse.
   Uses Three.js if available; otherwise a 2D top-down CPU fallback.
   ===================================================================== */
(function () {
  "use strict";
  const stage = document.getElementById("stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- texture for the CPU heat spreader (the engraved lid markings) ---- */
  function lidTexture(THREE) {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0, 0, 512, 512);
    g.addColorStop(0, "#3a3f49"); g.addColorStop(.5, "#262a32"); g.addColorStop(1, "#1b1e25");
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    // brushed-metal streaks
    x.globalAlpha = .05;
    for (let i = 0; i < 140; i++) {
      x.strokeStyle = i % 2 ? "#fff" : "#000";
      x.beginPath(); const yy = Math.random() * 512;
      x.moveTo(0, yy); x.lineTo(512, yy + (Math.random() - .5) * 8); x.stroke();
    }
    x.globalAlpha = 1;
    // border frame
    x.strokeStyle = "rgba(127,227,255,.25)"; x.lineWidth = 4;
    x.strokeRect(34, 34, 444, 444);
    // markings
    x.fillStyle = "#e9eefb"; x.textAlign = "center";
    x.font = "700 62px 'Sora', sans-serif";
    x.fillText("AH-V8", 256, 210);
    x.fillStyle = "#7fe3ff";
    x.font = "500 30px 'JetBrains Mono', monospace";
    x.fillText("ARMv8 · RTL", 256, 256);
    x.fillStyle = "#aeb7cc";
    x.font = "500 23px 'JetBrains Mono', monospace";
    x.fillText("DIGITAL DESIGN UNIT", 256, 300);
    x.fillStyle = "#6f7891";
    x.font = "500 19px 'JetBrains Mono', monospace";
    x.fillText("L1151B · TX · 64-BIT", 256, 338);
    // little logo plate
    x.fillStyle = "#b51d35"; x.fillRect(214, 372, 84, 60);
    x.fillStyle = "#fff"; x.font = "800 34px 'Sora', sans-serif";
    x.fillText("AH", 256, 414);
    // pin-1 triangle
    x.fillStyle = "#7fe3ff"; x.beginPath();
    x.moveTo(60, 60); x.lineTo(96, 60); x.lineTo(60, 96); x.closePath(); x.fill();
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 4;
    return tex;
  }

  /* ---- 2D fallback : top-down CPU, gentle auto-rotation, no mouse ---- */
  function fallback() {
    const c = document.createElement("canvas");
    stage.appendChild(c);
    const ctx = c.getContext("2d");
    let w, h, t = 0;
    function size() {
      const r = stage.getBoundingClientRect();
      w = c.width = r.width * devicePixelRatio;
      h = c.height = r.height * devicePixelRatio;
      c.style.width = r.width + "px"; c.style.height = r.height + "px";
    }
    size(); addEventListener("resize", size);
    function frame() {
      t += 0.0045; ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, S = Math.min(w, h);
      const pkg = S * 0.46, pin = pkg * 0.10, lid = pkg * 0.62;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t);
      // glow
      const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, pkg);
      gl.addColorStop(0, "rgba(181,29,53,.35)"); gl.addColorStop(1, "rgba(181,29,53,0)");
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, pkg, 0, 7); ctx.fill();
      // package
      ctx.fillStyle = "#13161e"; ctx.strokeStyle = "rgba(127,227,255,.4)"; ctx.lineWidth = devicePixelRatio;
      roundRect(ctx, -pkg / 2, -pkg / 2, pkg, pkg, 10 * devicePixelRatio); ctx.fill(); ctx.stroke();
      // gold pins around border
      ctx.fillStyle = "#d8b15a";
      const n = 11, step = pkg / (n + 1);
      for (let i = 1; i <= n; i++) {
        const p = -pkg / 2 + i * step;
        ctx.fillRect(p - pin / 2, -pkg / 2 + 4, pin, pin);          // top
        ctx.fillRect(p - pin / 2, pkg / 2 - pin - 4, pin, pin);      // bottom
        ctx.fillRect(-pkg / 2 + 4, p - pin / 2, pin, pin);          // left
        ctx.fillRect(pkg / 2 - pin - 4, p - pin / 2, pin, pin);     // right
      }
      // metal lid
      const lg = ctx.createLinearGradient(-lid / 2, -lid / 2, lid / 2, lid / 2);
      lg.addColorStop(0, "#3a3f49"); lg.addColorStop(.5, "#262a32"); lg.addColorStop(1, "#181b22");
      ctx.fillStyle = lg; roundRect(ctx, -lid / 2, -lid / 2, lid, lid, 6 * devicePixelRatio); ctx.fill();
      ctx.strokeStyle = "rgba(127,227,255,.3)"; ctx.stroke();
      // lid text
      ctx.fillStyle = "#e9eefb"; ctx.textAlign = "center";
      ctx.font = `700 ${lid * 0.16}px Sora, sans-serif`; ctx.fillText("AH-V8", 0, 0);
      ctx.fillStyle = "#7fe3ff"; ctx.font = `500 ${lid * 0.08}px monospace`;
      ctx.fillText("ARMv8 · RTL", 0, lid * 0.16);
      ctx.restore();
      requestAnimationFrame(frame);
    }
    function roundRect(c, x, y, w, h, r) {
      c.beginPath(); c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
    }
    frame();
  }

  /* ---- full 3D CPU ---- */
  function build() {
    const THREE = window.THREE;
    if (!THREE) return fallback();

    const r = stage.getBoundingClientRect();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 4.4, 6.2);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(r.width, r.height);
    stage.appendChild(renderer.domElement);

    const cpu = new THREE.Group();
    scene.add(cpu);

    // ---- package substrate (dark PCB) ----
    const sub = new THREE.Mesh(
      new THREE.BoxGeometry(3.1, 0.26, 3.1),
      new THREE.MeshStandardMaterial({ color: 0x0e1a16, metalness: 0.3, roughness: 0.7 })
    );
    cpu.add(sub);

    // glowing edge outline on the substrate
    cpu.add(new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(3.12, 0.28, 3.12)),
      new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0.5 })
    ));

    // ---- metal heat spreader (lid) with engraved texture on top ----
    const lidTop = new THREE.MeshStandardMaterial({ map: lidTexture(THREE), metalness: 0.9, roughness: 0.34 });
    const lidSide = new THREE.MeshStandardMaterial({ color: 0x2a2f38, metalness: 0.95, roughness: 0.3 });
    const lid = new THREE.Mesh(
      new THREE.BoxGeometry(2.15, 0.24, 2.15),
      [lidSide, lidSide, lidTop, lidSide, lidSide, lidSide]   // +Y face uses the texture
    );
    lid.position.y = 0.25;
    cpu.add(lid);

    // ---- gold pin grid underneath (PGA) ----
    const pinGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.18, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xd8b15a, metalness: 1, roughness: 0.35,
      emissive: 0x3a2c08, emissiveIntensity: 0.4 });
    const N = 14, gap = 3.0 / N, start = -3.0 / 2 + gap / 2;
    const pins = new THREE.InstancedMesh(pinGeo, pinMat, N * N);
    const m = new THREE.Matrix4(); let idx = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      m.makeTranslation(start + i * gap, -0.22, start + j * gap);
      pins.setMatrixAt(idx++, m);
    }
    pins.instanceMatrix.needsUpdate = true;
    cpu.add(pins);

    // ---- small SMD capacitors around the lid for detail ----
    const capMat = new THREE.MeshStandardMaterial({ color: 0x9a8f6a, metalness: 0.6, roughness: 0.5 });
    const capGeo = new THREE.BoxGeometry(0.16, 0.08, 0.09);
    const ring = 1.32;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      if (Math.abs(Math.cos(a)) > 0.95 || Math.abs(Math.sin(a)) > 0.95) continue;
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(Math.cos(a) * ring, 0.17, Math.sin(a) * ring);
      cap.rotation.y = -a;
      cpu.add(cap);
    }

    // pin-1 corner marker (small steel triangle prism)
    const mark = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.06, 3),
      new THREE.MeshStandardMaterial({ color: 0x7fe3ff, emissive: 0x1a6fa8, emissiveIntensity: 0.6 })
    );
    mark.position.set(-1.28, 0.15, -1.28); mark.rotation.y = Math.PI / 4;
    cpu.add(mark);

    // ---- lights ----
    scene.add(new THREE.AmbientLight(0x405070, 0.85));
    const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 6, 4); scene.add(key);
    const l1 = new THREE.PointLight(0xb51d35, 2.2, 30); l1.position.set(4, 3, 5); scene.add(l1);
    const l2 = new THREE.PointLight(0x58b6ff, 1.8, 30); l2.position.set(-5, 2, 3); scene.add(l2);

    // gentle resting tilt; auto-rotate only (NO mouse tracking)
    cpu.rotation.x = 0.18;

    function resize() {
      const b = stage.getBoundingClientRect();
      camera.aspect = b.width / b.height; camera.updateProjectionMatrix();
      renderer.setSize(b.width, b.height);
    }
    addEventListener("resize", resize);

    const clock = new THREE.Clock();
    (function loop() {
      requestAnimationFrame(loop);
      const t = clock.getElapsedTime();
      cpu.rotation.y = t * 0.32;                 // steady spin
      cpu.position.y = Math.sin(t * 1.1) * 0.06; // soft hover
      renderer.render(scene, camera);
    })();
  }

  if (reduce) { fallback(); return; }
  if (window.THREE) { build(); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  s.onload = build;
  s.onerror = fallback;
  document.head.appendChild(s);
  setTimeout(() => { if (!window.THREE && !stage.querySelector("canvas")) fallback(); }, 3500);
})();
