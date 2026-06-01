// ===============================
// STYLE TOGGLE 
// ===============================
(function () {
  "use strict";

  const STORAGE_KEY = "csce331_style";
  const linkEl = document.getElementById("themeStylesheet");
  const btn = document.getElementById("styleToggle");

  if (!linkEl) return;

  const saved = localStorage.getItem(STORAGE_KEY);
  const current = saved === "style2" ? "style2" : "style1";

  function applyStyle(style) {
    linkEl.href = style + ".css";
    localStorage.setItem(STORAGE_KEY, style);
  }

  applyStyle(current);

  if (btn) {
    btn.addEventListener("click", () => {
      const next =
        localStorage.getItem(STORAGE_KEY) === "style2" ? "style1" : "style2";
      applyStyle(next);
    });
  }
})();
// ===============================
// SCROLL REVEAL ANIMATION
// ===============================
(function () {
  if (location.pathname.toLowerCase().includes("genai")) return;

  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;

  const io = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add("show");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  els.forEach(el => io.observe(el));
})();

