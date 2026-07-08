/* ============================================================================
   hero-particles.js — 3D particle portrait for the homepage hero.
   Builds a WebGL point cloud from a cutout portrait (PNG w/ transparent bg) +
   a grayscale depth map (bright = near). The head sits still, then TURNS to
   show its depth and DISSOLVES as you scroll through the hero. No dragging,
   no free-spin. Falls back to the static image if WebGL is unavailable.

   HeroParticles.init({
     canvas:"#heroParticles",
     portrait:"assets/img/hero-portrait.png",        // cutout, transparent bg
     depth:"assets/img/hero-portrait-depth.png",      // grayscale depth (optional)
     fadeWith:".hero",
     density:2, depthScale:11, pointSize:1.4, turn:0.7, tint:0.4,
     invertDepth:false
   });
   Serve over http(s) (or a local server) so image pixels can be read.
   ============================================================================ */
(function (root) {
  "use strict";
  root.HeroParticles = { init: init };

  function init(opt) {
    opt = opt || {};
    var canvas = document.querySelector(opt.canvas || "#heroParticles");
    if (!canvas) return;
    var reduce = root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var mobile = root.innerWidth < 760;
    var cfg = {
      portrait: opt.portrait || "assets/img/hero-portrait.png",
      depth: opt.depth || null,
      fadeWith: opt.fadeWith || null,
      density: (opt.density || 2) * (mobile ? 2 : 1),
      depthScale: opt.depthScale != null ? opt.depthScale : 11,
      pointSize: (opt.pointSize || 1.4) * (mobile ? 1.25 : 1),
      turn: opt.turn != null ? opt.turn : 0.7,
      tint: opt.tint != null ? opt.tint : 0.4,
      invertDepth: !!opt.invertDepth,
      reduce: reduce
    };
    if (!root.THREE) { fallback(canvas, cfg.portrait); return; }
    try { var t = document.createElement("canvas"); if (!(t.getContext("webgl") || t.getContext("experimental-webgl"))) throw 0; }
    catch (e) { fallback(canvas, cfg.portrait); return; }

    loadImages(cfg, function (pd, dd, pw, ph) {
      try { run(canvas, cfg, pd, dd, pw, ph); }
      catch (e) { if (root.console) console.error("[hero-particles]", e); fallback(canvas, cfg.portrait); }
    }, function () { fallback(canvas, cfg.portrait); });
  }

  function loadImages(cfg, ok, err) {
    var p = new Image(); p.crossOrigin = "anonymous";
    var d = null, need = cfg.depth ? 2 : 1, got = 0, pd, dd, pw, ph;
    function sampleP() { var c = document.createElement("canvas"); pw = p.naturalWidth; ph = p.naturalHeight; c.width = pw; c.height = ph; var x = c.getContext("2d"); x.drawImage(p, 0, 0); pd = x.getImageData(0, 0, pw, ph).data; }
    function sampleD() { var c = document.createElement("canvas"); c.width = pw; c.height = ph; var x = c.getContext("2d"); x.drawImage(d, 0, 0, pw, ph); dd = x.getImageData(0, 0, pw, ph).data; }
    function done() { if (++got === need) ok(pd, dd, pw, ph); }
    p.onload = function () { try { sampleP(); done(); } catch (e) { err(); } };
    p.onerror = err; p.src = cfg.portrait;
    if (cfg.depth) { d = new Image(); d.crossOrigin = "anonymous"; d.onload = function () { try { if (!pw) { var iv = setInterval(function () { if (pw) { clearInterval(iv); sampleD(); done(); } }, 15); return; } sampleD(); done(); } catch (e) { err(); } }; d.onerror = err; d.src = cfg.depth; }
  }

  function run(canvas, cfg, pd, dd, pw, ph) {
    var T = root.THREE;
    function box() { return [canvas.clientWidth || root.innerWidth, canvas.clientHeight || root.innerHeight]; }
    var wh = box(), W = wh[0], H = wh[1];
    var minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
    for (var y = 0; y < ph; y++) for (var x = 0; x < pw; x++) { if (pd[(y * pw + x) * 4 + 3] > 60) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; } }
    var ccx = (minx + maxx) / 2, ccy = (miny + maxy) / 2, SP = 0.16;
    var pos = [], scat = [], col = [], rnd = [];
    for (var yy = 0; yy < ph; yy += cfg.density) for (var xx = 0; xx < pw; xx += cfg.density) {
      var i = (yy * pw + xx) * 4; if (pd[i + 3] < 60) continue;
      var r = pd[i] / 255, g = pd[i + 1] / 255, b = pd[i + 2] / 255, lum = 0.299 * r + 0.587 * g + 0.114 * b;
      var dz = dd ? (dd[i] / 255) : lum; if (cfg.invertDepth) dz = 1 - dz;
      pos.push((xx - ccx) * SP, -(yy - ccy) * SP, dz - 0.5);
      var a = Math.random() * 6.2831, phi = Math.acos(2 * Math.random() - 1), R = 20 + Math.random() * 26;
      scat.push(Math.sin(phi) * Math.cos(a) * R, Math.sin(phi) * Math.sin(a) * R, Math.cos(phi) * R);
      col.push(r, g, b); rnd.push(Math.random(), lum);
    }
    var geom = new T.BufferGeometry();
    geom.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    geom.setAttribute("aScatter", new T.Float32BufferAttribute(scat, 3));
    geom.setAttribute("aColor", new T.Float32BufferAttribute(col, 3));
    geom.setAttribute("aRnd", new T.Float32BufferAttribute(rnd, 2));

    var scene = new T.Scene(); scene.fog = new T.FogExp2(0x05070d, 0.012);
    var camera = new T.PerspectiveCamera(50, W / H, 0.1, 600); camera.position.set(0, 0, 46);
    var renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(root.devicePixelRatio || 1, 2)); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);

    var uni = { uTime: { value: 0 }, uProg: { value: 0 }, uSize: { value: cfg.pointSize }, uDepth: { value: cfg.depthScale }, uTint: { value: cfg.tint }, uFade: { value: 1 }, uPix: { value: renderer.getPixelRatio() } };
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
        "uniform float uFade,uTint; varying vec3 vColor; varying float vLum;",
        "void main(){ vec2 d=gl_PointCoord-vec2(0.5); float r=dot(d,d); if(r>0.25) discard;",
        " float a=smoothstep(0.25,0.0,r)*uFade; vec3 steel=vec3(0.5,0.72,1.0);",
        " vec3 col=mix(vColor,steel*(0.55+0.6*vLum),uTint)*(0.85+0.5*vLum);",
        " gl_FragColor=vec4(col,a); }"
      ].join("\n")
    });
    var points = new T.Points(geom, mat); scene.add(points);

    var prog = 0, mouse = { x: 0, y: 0 }, ml = { x: 0, y: 0 };
    var fadeEl = cfg.fadeWith ? document.querySelector(cfg.fadeWith) : null;
    function onScroll() { var span = fadeEl ? fadeEl.offsetHeight : root.innerHeight; prog = Math.min(1, Math.max(0, (root.scrollY || root.pageYOffset || 0) / Math.max(1, span))); }
    function onResize() { var w2 = box(); W = w2[0]; H = w2[1]; camera.aspect = W / H; camera.updateProjectionMatrix(); renderer.setSize(W, H, false); }
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("resize", onResize);
    if (!cfg.reduce) root.addEventListener("mousemove", function (e) { mouse.x = e.clientX / root.innerWidth - 0.5; mouse.y = e.clientY / root.innerHeight - 0.5; });
    onScroll();

    var t0 = root.performance.now();
    (function loop() {
      root.requestAnimationFrame(loop);
      var t = (root.performance.now() - t0) / 1000; uni.uTime.value = t;
      var dissolve = Math.max(0, (prog - 0.5) / 0.5);
      uni.uProg.value += (dissolve - uni.uProg.value) * 0.07;
      uni.uFade.value = 1 - Math.min(1, Math.max(0, (prog - 0.55) / 0.45));
      ml.x += (mouse.x - ml.x) * 0.05; ml.y += (mouse.y - ml.y) * 0.05;
      points.rotation.y = (cfg.reduce ? 0 : (-0.12 + Math.sin(t * 0.4) * 0.05)) + prog * cfg.turn + ml.x * 0.15;
      points.rotation.x = ml.y * 0.10;
      if (uni.uFade.value > 0.001) renderer.render(scene, camera);
    })();
  }

  function fallback(canvas, portrait) {
    if (!canvas) return;
    var img = document.createElement("img"); img.src = portrait; img.alt = "";
    img.style.cssText = "position:absolute;inset:0;margin:auto;max-width:62%;max-height:82%;object-fit:contain;opacity:.95;filter:drop-shadow(0 12px 40px rgba(0,0,0,.6));";
    canvas.style.display = "none";
    if (canvas.parentNode) canvas.parentNode.appendChild(img);
  }
})(window);
