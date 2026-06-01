/* =====================================================================
   HERO3D.JS — interactive 3D "engineering core" for the hero stage.
   Uses Three.js if available; otherwise renders an animated 2D fallback.
   ===================================================================== */
(function () {
  "use strict";
  const stage = document.getElementById("stage");
  if (!stage) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function fallback() {
    // Lightweight animated core if Three.js can't load
    const c = document.createElement("canvas");
    stage.appendChild(c);
    const ctx = c.getContext("2d");
    let w, h, t = 0, mx = 0, my = 0;
    function size() {
      const r = stage.getBoundingClientRect();
      w = c.width = r.width * devicePixelRatio;
      h = c.height = r.height * devicePixelRatio;
      c.style.width = r.width + "px"; c.style.height = r.height + "px";
    }
    size(); addEventListener("resize", size);
    addEventListener("mousemove", e => {
      mx = (e.clientX / innerWidth - .5); my = (e.clientY / innerHeight - .5);
    });
    const N = 26;
    function frame() {
      t += 0.01; ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.32;
      ctx.save(); ctx.translate(cx, cy);
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + t;
        const wob = 1 + Math.sin(t * 2 + i) * 0.08;
        const x = Math.cos(a) * R * wob + mx * 30;
        const y = Math.sin(a) * R * 0.55 * wob + my * 30;
        ctx.beginPath(); ctx.arc(x, y, 2.2 * devicePixelRatio, 0, 7);
        ctx.fillStyle = i % 3 ? "rgba(127,227,255,.8)" : "rgba(181,29,53,.9)";
        ctx.fill();
        if (i > 0) {
          const pa = ((i - 1) / N) * Math.PI * 2 + t;
          ctx.strokeStyle = "rgba(120,150,210,.18)"; ctx.lineWidth = devicePixelRatio * .6;
          ctx.beginPath(); ctx.moveTo(x, y);
          ctx.lineTo(Math.cos(pa) * R + mx * 30, Math.sin(pa) * R * .55 + my * 30); ctx.stroke();
        }
      }
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
      g.addColorStop(0, "rgba(181,29,53,.5)"); g.addColorStop(1, "rgba(181,29,53,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill();
      ctx.restore();
      requestAnimationFrame(frame);
    }
    frame();
  }

  function build() {
    const THREE = window.THREE;
    if (!THREE) return fallback();

    const r = stage.getBoundingClientRect();
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 6;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(r.width, r.height);
    stage.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // inner glowing core (icosahedron)
    const coreGeo = new THREE.IcosahedronGeometry(1.25, 1);
    const core = new THREE.Mesh(
      coreGeo,
      new THREE.MeshStandardMaterial({
        color: 0x7a0f1e, emissive: 0xb51d35, emissiveIntensity: 0.9,
        metalness: 0.7, roughness: 0.25, flatShading: true
      })
    );
    group.add(core);

    // wireframe shell
    const shell = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.05, 1)),
      new THREE.LineBasicMaterial({ color: 0x58b6ff, transparent: true, opacity: 0.55 })
    );
    group.add(shell);

    // outer dodeca ring frame
    const frame = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(2.55, 0)),
      new THREE.LineBasicMaterial({ color: 0x7fe3ff, transparent: true, opacity: 0.22 })
    );
    group.add(frame);

    // particle halo
    const pcount = 420;
    const pos = new Float32Array(pcount * 3);
    for (let i = 0; i < pcount; i++) {
      const rr = 3 + Math.random() * 1.6;
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = rr * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = rr * Math.sin(ph) * Math.sin(th);
      pos[i * 3 + 2] = rr * Math.cos(ph);
    }
    const pg = new THREE.BufferGeometry();
    pg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(pg, new THREE.PointsMaterial({
      color: 0x9fd8ff, size: 0.045, transparent: true, opacity: 0.8
    }));
    group.add(particles);

    // lights
    scene.add(new THREE.AmbientLight(0x405070, 0.7));
    const l1 = new THREE.PointLight(0xb51d35, 2.4, 30); l1.position.set(4, 3, 5); scene.add(l1);
    const l2 = new THREE.PointLight(0x58b6ff, 2.0, 30); l2.position.set(-5, -2, 4); scene.add(l2);

    let tx = 0, ty = 0, cx = 0, cy = 0;
    addEventListener("mousemove", e => {
      tx = (e.clientX / innerWidth - 0.5);
      ty = (e.clientY / innerHeight - 0.5);
    });
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
      cx += (tx - cx) * 0.05; cy += (ty - cy) * 0.05;
      group.rotation.y = t * 0.18 + cx * 0.9;
      group.rotation.x = Math.sin(t * 0.3) * 0.12 + cy * 0.6;
      shell.rotation.y -= 0.004; shell.rotation.z += 0.002;
      frame.rotation.x += 0.0015; frame.rotation.y += 0.003;
      particles.rotation.y -= 0.0009;
      const b = 1 + Math.sin(t * 1.6) * 0.04; // breathing
      core.scale.setScalar(b);
      core.material.emissiveIntensity = 0.75 + Math.sin(t * 1.6) * 0.25;
      renderer.render(scene, camera);
    })();
  }

  if (reduce) { fallback(); return; }

  // Load Three.js from CDN, fall back gracefully
  if (window.THREE) { build(); return; }
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  s.onload = build;
  s.onerror = fallback;
  document.head.appendChild(s);
  // safety: if it hasn't loaded in 3.5s, draw fallback
  setTimeout(() => { if (!window.THREE && !stage.querySelector("canvas")) fallback(); }, 3500);
})();
