/* ============================================================================
   hero-particles.js — 3D particle portrait for the homepage hero.
   Renders a WebGL point cloud built from a portrait + (optional) depth map.
   The cloud sits behind the hero text, gently rotates, follows the mouse, and
   disperses + fades as you scroll past the hero. Falls back to a static image
   if WebGL is unavailable.

   USAGE (after loading three.min.js):
     HeroParticles.init({
       canvas:   "#heroParticles",                 // <canvas> selector
       portrait: "assets/img/hero-portrait.jpg",    // color source
       depth:    "assets/img/hero-portrait-depth.png", // optional grayscale depth (bright = near)
       fadeWith: "#hero",                           // element the cloud fades out across
       density:  2,        // pixel sampling step (bigger = fewer particles)
       depthScale: 9,      // how far particles push in Z
       pointSize: 1.3,
       spin:     0.10,     // idle rotation speed
       dropBg:   0,        // 0..160: remove near-corner-colour background pixels
       invertDepth: false  // flip if your depth map has dark = near
     });
   Served over http(s) the images load same-origin fine. For LOCAL testing run a
   tiny server in the project folder (e.g. python3 -m http.server) and open the
   localhost URL, otherwise the browser blocks reading image pixels from file://.
   ============================================================================ */
(function (root) {
  "use strict";
  var HeroParticles = { init: init };
  root.HeroParticles = HeroParticles;

  function init(opt) {
    opt = opt || {};
    var canvas = document.querySelector(opt.canvas || "#heroParticles");
    if (!canvas) return;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobile = root.innerWidth < 760;
    var cfg = {
      portrait: opt.portrait || "assets/img/hero-portrait.jpg",
      depth: opt.depth || null,
      fadeWith: opt.fadeWith || null,
      density: (opt.density || 2) * (mobile ? 2 : 1),
      depthScale: opt.depthScale != null ? opt.depthScale : 9,
      pointSize: (opt.pointSize || 1.3) * (mobile ? 1.25 : 1),
      spin: reduce ? 0 : (opt.spin != null ? opt.spin : 0.10),
      dropBg: opt.dropBg || 0,
      invertDepth: !!opt.invertDepth,
      reduce: reduce
    };

    if (!root.THREE) { fallback(canvas, cfg.portrait); return; }
    try { detectGL(); } catch (e) { fallback(canvas, cfg.portrait); return; }
    function detectGL(){ var t=document.createElement("canvas"); if(!(t.getContext("webgl")||t.getContext("experimental-webgl"))) throw 0; }

    loadImages(cfg, function (pData, dData, pw, ph) {
      try { run(canvas, cfg, pData, dData, pw, ph); }
      catch (e) { if (root.console) console.error("[hero-particles]", e); fallback(canvas, cfg.portrait); }
    }, function () { fallback(canvas, cfg.portrait); });
  }

  function loadImages(cfg, ok, err) {
    var p = new Image(); p.crossOrigin = "anonymous";
    var d = null, need = cfg.depth ? 2 : 1, got = 0, pData, dData, pw, ph;
    function sampleP() {
      var c = document.createElement("canvas"); pw = p.naturalWidth; ph = p.naturalHeight;
      c.width = pw; c.height = ph; var cx = c.getContext("2d"); cx.drawImage(p, 0, 0);
      pData = cx.getImageData(0, 0, pw, ph).data;
    }
    function sampleD() {
      var c = document.createElement("canvas"); c.width = pw; c.height = ph;
      var cx = c.getContext("2d"); cx.drawImage(d, 0, 0, pw, ph);  // scale depth to portrait size
      dData = cx.getImageData(0, 0, pw, ph).data;
    }
    function done() { if (++got === need) ok(pData, dData, pw, ph); }
    p.onload = function () { try { sampleP(); if (cfg.depth) { /* wait for d */ if (d && d.complete && d.naturalWidth) { sampleD(); } } done(); } catch (e) { err(); } };
    p.onerror = err;
    p.src = cfg.portrait;
    if (cfg.depth) {
      d = new Image(); d.crossOrigin = "anonymous";
      d.onload = function () { try { if (pw) sampleD(); done(); } catch (e) { err(); } };
      d.onerror = err; d.src = cfg.depth;
    }
  }

  function run(canvas, cfg, pData, dData, pw, ph) {
    var T = root.THREE;
    function box(){ return [canvas.clientWidth || root.innerWidth, canvas.clientHeight || root.innerHeight]; }
    var _wh = box(), W = _wh[0], H = _wh[1];
    var SP = 0.16; // spacing between particles in world units
    var bg = [pData[0], pData[1], pData[2]];
    var pos = [], scat = [], col = [], rnd = [];
    for (var y = 0; y < ph; y += cfg.density) {
      for (var x = 0; x < pw; x += cfg.density) {
        var i = (y * pw + x) * 4, r = pData[i], g = pData[i + 1], b = pData[i + 2];
        if (cfg.dropBg > 0) { if (Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) < cfg.dropBg) continue; }
        var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        var dz;
        if (dData) { var dl = dData[i] / 255; dz = cfg.invertDepth ? (1 - dl) : dl; }
        else dz = lum;
        pos.push((x - pw / 2) * SP, -(y - ph / 2) * SP, (dz - 0.5));
        var a = Math.random() * Math.PI * 2, phi = Math.acos(2 * Math.random() - 1), R = 22 + Math.random() * 26;
        scat.push(Math.sin(phi) * Math.cos(a) * R, Math.sin(phi) * Math.sin(a) * R, Math.cos(phi) * R);
        col.push(r / 255, g / 255, b / 255);
        rnd.push(Math.random(), lum);
      }
    }
    var geom = new T.BufferGeometry();
    geom.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geom.setAttribute("aScatter", new T.Float32BufferAttribute(scat, 3));
    geom.setAttribute("aColor", new T.Float32BufferAttribute(col, 3));
    geom.setAttribute("aRnd", new T.Float32BufferAttribute(rnd, 2));

    var scene = new T.Scene(); scene.fog = new T.FogExp2(0x05070d, 0.012);
    var camera = new T.PerspectiveCamera(50, W / H, 0.1, 600); camera.position.set(0, 0, 52);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);

    var uni = { uTime: { value: 0 }, uProg: { value: 0 }, uSize: { value: cfg.pointSize }, uDepth: { value: cfg.depthScale }, uPix: { value: renderer.getPixelRatio() }, uFade: { value: 1 } };
    var mat = new T.ShaderMaterial({
      uniforms: uni, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
      vertexShader: [
        "attribute vec3 aScatter; attribute vec3 aColor; attribute vec2 aRnd;",
        "uniform float uTime,uProg,uSize,uDepth,uPix;",
        "varying vec3 vColor; varying float vLum;",
        "void main(){ vColor=aColor; vLum=aRnd.y;",
        " vec3 base=position; base.z*=uDepth;",
        " float e=uProg*uProg*(3.0-2.0*uProg);",
        " vec3 p=mix(base,aScatter,e);",
        " float sw=e*6.2831*aRnd.x+uTime*0.15*e; float s=sin(sw),c=cos(sw); p.xy=mat2(c,-s,s,c)*p.xy;",
        " p+=sin(uTime*0.6+aRnd.x*6.28)*0.25*e;",
        " vec4 mv=modelViewMatrix*vec4(p,1.0); gl_Position=projectionMatrix*mv;",
        " gl_PointSize=uSize*(0.6+vLum)*uPix*(120.0/-mv.z); }"
      ].join("\n"),
      fragmentShader: [
        "uniform float uFade; varying vec3 vColor; varying float vLum;",
        "void main(){ vec2 d=gl_PointCoord-vec2(0.5); float r=dot(d,d); if(r>0.25) discard;",
        " float a=smoothstep(0.25,0.0,r)*uFade; vec3 col=vColor*(0.75+0.6*vLum); gl_FragColor=vec4(col,a); }"
      ].join("\n")
    });
    var points = new T.Points(geom, mat); scene.add(points);

    var mouse = { x: 0, y: 0 }, ml = { x: 0, y: 0 }, prog = 0;
    var fadeEl = cfg.fadeWith ? document.querySelector(cfg.fadeWith) : null;
    function onScroll() {
      var span = fadeEl ? fadeEl.offsetHeight : root.innerHeight;
      prog = Math.min(1, Math.max(0, (window.scrollY || window.pageYOffset || 0) / Math.max(1, span)));
    }
    function onResize() { var w2=box(); W=w2[0]; H=w2[1]; camera.aspect=W/H; camera.updateProjectionMatrix(); renderer.setSize(W,H,false); }
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("resize", onResize);
    if (!cfg.reduce) root.addEventListener("mousemove", function (e) { mouse.x = e.clientX / root.innerWidth - 0.5; mouse.y = e.clientY / root.innerHeight - 0.5; });
    onScroll();

    var t0 = root.performance.now();
    (function loop() {
      root.requestAnimationFrame(loop);
      var t = (root.performance.now() - t0) / 1000; uni.uTime.value = t;
      uni.uProg.value += (prog - uni.uProg.value) * 0.06;
      uni.uFade.value = 1 - Math.min(1, prog * 1.15);          // fade out as it scrolls away
      ml.x += (mouse.x - ml.x) * 0.05; ml.y += (mouse.y - ml.y) * 0.05;
      points.rotation.y = ml.x * 0.6 + t * cfg.spin;
      points.rotation.x = ml.y * 0.4;
      if (uni.uFade.value > 0.001) renderer.render(scene, camera);
    })();
  }

  function fallback(canvas, portrait) {
    if (!canvas) return;
    var img = document.createElement("img");
    img.src = portrait; img.alt = "";
    img.style.cssText = "position:absolute;inset:0;margin:auto;max-width:64%;max-height:78%;object-fit:contain;opacity:.9;filter:drop-shadow(0 12px 40px rgba(0,0,0,.6));border-radius:14px;";
    canvas.style.display = "none";
    if (canvas.parentNode) canvas.parentNode.appendChild(img);
  }
})(window);