/* =====================================================================
   APP.JS — backend glue (loads on every page).
   - logs an anonymous page view
   - Google sign-in button in the nav (#authSlot) + session state
   Everything degrades silently if the backend/env isn't set up yet.
   ===================================================================== */
(function () {
  "use strict";
  var API = { config: "/api/config", me: "/api/auth/me", google: "/api/auth/google", logout: "/api/auth/logout", track: "/api/track" };
  var GIS = "https://accounts.google.com/gsi/client";
  var clientId = "";

  function api(url, opts) {
    return fetch(url, Object.assign({ headers: { "Content-Type": "application/json" } }, opts || {}))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
  }

  /* ---- page-view beacon (never blocks, never errors loudly) ---- */
  try {
    fetch(API.track, {
      method: "POST", headers: { "Content-Type": "application/json" }, keepalive: true,
      body: JSON.stringify({ path: location.pathname, ref: document.referrer })
    }).catch(function () {});
  } catch (e) {}

  /* ---- auth UI ---- */
  var slot = document.getElementById("authSlot");

  function renderSignedIn(user) {
    if (!slot) return;
    var dash = user.isAdmin ? '<a class="auth-dash" href="dashboard.html">Dashboard</a>' : "";
    var ava = user.picture ? '<img src="' + user.picture + '" alt="" referrerpolicy="no-referrer">'
                           : '<span class="auth-ava">' + (user.name || "U").slice(0, 1).toUpperCase() + "</span>";
    slot.innerHTML = dash + '<div class="auth-user" title="' + (user.email || "") + '">' + ava +
      '<button class="auth-out" type="button" aria-label="Sign out">Sign out</button></div>';
    var out = slot.querySelector(".auth-out");
    if (out) out.addEventListener("click", function () { api(API.logout, { method: "POST" }).finally(function () { location.reload(); }); });
  }

  var gisQueue;
  function loadGIS(cb) {
    if (window.google && window.google.accounts) return cb();
    if (gisQueue) { gisQueue.push(cb); return; }
    gisQueue = [cb];
    var s = document.createElement("script"); s.src = GIS; s.async = true; s.defer = true;
    s.onload = function () { var q = gisQueue; gisQueue = null; q.forEach(function (f) { f(); }); };
    s.onerror = function () { gisQueue = null; };
    document.head.appendChild(s);
  }

  function onCred(resp) {
    api(API.google, { method: "POST", body: JSON.stringify({ credential: resp.credential }) })
      .then(function () { location.reload(); }).catch(function () {});
  }

  function renderSignedOut() {
    if (!slot || !clientId) return; // no backend or no client id -> show nothing extra
    slot.innerHTML = '<div id="gbtn" class="auth-gbtn"></div>';
    loadGIS(function () {
      if (!window.google || !window.google.accounts) return;
      try {
        window.google.accounts.id.initialize({ client_id: clientId, callback: onCred });
        window.google.accounts.id.renderButton(document.getElementById("gbtn"),
          { theme: "filled_black", size: "medium", shape: "pill", text: "signin_with" });
      } catch (e) {}
    });
  }

  api(API.config).then(function (cfg) {
    clientId = (cfg && cfg.googleClientId) || "";
    window.__AH_AI = !!(cfg && cfg.aiEnabled);
    return api(API.me);
  }).then(function (d) {
    if (d && d.user) renderSignedIn(d.user); else renderSignedOut();
  }).catch(function () { /* backend not live yet — nav stays as designed */ });
})();
