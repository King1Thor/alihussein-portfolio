# Hero particle portrait — setup

A WebGL point cloud built from your photo, sitting behind the hero name. It gently
rotates, follows the mouse, and disperses + fades as you scroll past the hero.
If WebGL is unavailable it falls back to showing your photo as a static image.

Files in this kit:
- assets/js/hero-particles.js   the module
- assets/img/hero-portrait.jpg  your photo (480px, color source)
- preview.html                  a standalone hero page to test locally
- HERO_SETUP.md                 this file

## 1. Get a depth map (for true 3D)

The cloud looks best with a real depth map. Generate a grayscale one from your
photo (bright = near, dark = far) with any of these free tools:

- depthanything.org            (in-browser, no signup)
- kordu.tools depth generator  (runs locally in your browser, nothing uploaded)
- Hugging Face: Depth Anything V2 space

Upload your headshot, download the GRAYSCALE PNG, and save it as:

    assets/img/hero-portrait-depth.png

If your tool outputs dark = near instead of bright = near, set `invertDepth: true`
in the init call.

You can skip this entirely. Without a depth map the module uses image brightness
for relief, which still reads as 3D, just less anatomically correct.

## 2. Preview it locally

Browsers block reading image pixels from file:// URLs, so use a tiny local server.
From the kit folder:

    python3 -m http.server 8000

Then open http://localhost:8000/preview.html  . Once you have the depth PNG,
uncomment the `depth:` line in preview.html to see true depth.

(For an instant, no-server look you also have face-particles-prototype.html from
before, which has the photo embedded and uses brightness relief.)

## 3. Put it on the homepage hero

In index.html, find your hero section (the one with your name). Make it a
positioning context and drop the canvas in as the first child:

```html
<!-- the hero section -->
<section class="hero" style="position:relative; overflow:hidden;">

  <!-- ADD THIS as the first child of the hero -->
  <canvas id="heroParticles"
          style="position:absolute; inset:0; width:100%; height:100%; z-index:0;"></canvas>

  <!-- your existing hero content; make sure it sits ABOVE the canvas -->
  <div class="hero-content" style="position:relative; z-index:1;">
    ... your name / tagline / buttons ...
  </div>

</section>
```

Then, once near the end of <body>, load Three.js and the module and start it:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="assets/js/hero-particles.js"></script>
<script>
  HeroParticles.init({
    canvas:   "#heroParticles",
    portrait: "assets/img/hero-portrait.jpg",
    depth:    "assets/img/hero-portrait-depth.png",  // remove this line to use brightness only
    fadeWith: "#hero",        // selector of the element the cloud fades out across (your hero)
    density:  2,
    depthScale: 9,
    pointSize: 1.3,
    spin:     0.10,
    dropBg:   0,
    invertDepth: false
  });
</script>
```

Notes:
- `fadeWith` should point at your hero element (by id or class). The cloud fades to
  invisible by the time you have scrolled one hero-height down, so it never sits
  behind the sections below.
- Buttons/links in the hero keep working: the canvas is behind them and the script
  never captures clicks.
- On phones the module automatically halves the particle count.
- It respects "reduce motion": rotation and dispersion turn off for those users.

## 4. Tuning (all in the init call)

| option       | what it does                                                |
|--------------|-------------------------------------------------------------|
| density      | pixel sampling step. 1 = densest/heaviest, 3+ = lighter     |
| depthScale   | how far particles push forward/back (0 = flat)              |
| pointSize    | particle size                                               |
| spin         | idle rotation speed (0 = still)                             |
| dropBg       | 0..160; removes pixels close to the top-left corner colour  |
|              | (use it to delete a plain background so only you remain)    |
| invertDepth  | flip if your depth map is dark = near                       |

If anything looks off when you load it (too sparse, too flat, background showing),
tell me the values you tried and I'll dial it in.
