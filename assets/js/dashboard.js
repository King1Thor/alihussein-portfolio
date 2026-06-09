/* =====================================================================
   DASHBOARD.JS — manager analytics (admin only, enforced server-side).
   Renders stat cards + lightweight custom SVG charts. No external libs.
   ===================================================================== */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  function api(u, o) {
    return fetch(u, Object.assign({ headers: { "Content-Type": "application/json" } }, o || {}))
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r); });
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function show(el) { if (el) el.style.display = ""; }
  function timeAgo(ts) {
    var d = (Date.now() - new Date(ts).getTime()) / 1000;
    if (d < 60) return "just now";
    if (d < 3600) return Math.floor(d / 60) + "m ago";
    if (d < 86400) return Math.floor(d / 3600) + "h ago";
    return Math.floor(d / 86400) + "d ago";
  }

  var gate = $("#dashGate"), content = $("#dashContent");

  api("/api/auth/me").then(function (d) {
    if (!d.user) { show(gate); gate.innerHTML = "<p>This dashboard is for the site owner. Use the <b>Sign in</b> button in the top-right with your manager Google account.</p>"; return; }
    if (!d.user.isAdmin) { show(gate); gate.innerHTML = "<p>You're signed in as <b>" + esc(d.user.email) + "</b>, which isn't the manager account. Set <code>ADMIN_EMAIL</code> to this address (or sign in with the manager account).</p>"; return; }
    show(content); load();
  }).catch(function () {
    show(gate);
    gate.innerHTML = "<p>The backend isn't reachable yet. Once the site is deployed on Vercel with the database connected and env vars set, analytics will show up here.</p>";
  });

  function load() {
    api("/api/stats").then(render).catch(function () {
      $("#statCards").innerHTML = "<div class='muted'>Couldn't load stats — check the DATABASE_URL connection.</div>";
    });
    api("/api/messages").then(renderMsgs).catch(function () {});
    api("/api/guestbook?all=1").then(renderGB).catch(function () {});
  }

  /* ---- stat cards ---- */
  function statCard(label, val) { return '<div class="stat-card"><div class="sv">' + val + '</div><div class="sl">' + label + '</div></div>'; }
  function render(d) {
    $("#statCards").innerHTML =
      statCard("Total views", d.totals.views) +
      statCard("Unique visitors", d.totals.visitors) +
      statCard("Views today", d.today.views) +
      statCard("Visitors today", d.today.visitors);
    $("#chartViews").innerHTML = lineChart(d.perDay || []);
    $("#chartPages").innerHTML = barList((d.perPath || []).map(function (r) { return { label: r.path, val: r.views }; }));
    $("#chartDevices").innerHTML = barList((d.devices || []).map(function (r) { return { label: r.device, val: r.n }; }));
    $("#listRef").innerHTML = barList((d.referrers || []).map(function (r) { return { label: r.ref, val: r.n }; }));
    $("#listGeo").innerHTML = barList((d.countries || []).map(function (r) { return { label: r.country, val: r.n }; }));
    $("#recent").innerHTML = (d.recent && d.recent.length)
      ? '<table class="dash-table"><tbody>' + d.recent.map(function (r) {
          return "<tr><td>" + esc(r.path) + "</td><td>" + esc(r.device) + "</td><td>" + esc(r.country || "") + "</td><td class='ta'>" + timeAgo(r.created_at) + "</td></tr>";
        }).join("") + "</tbody></table>"
      : "<p class='muted'>No visits recorded yet.</p>";
  }

  /* ---- horizontal bar list ---- */
  function barList(rows) {
    if (!rows.length) return "<p class='muted'>No data yet.</p>";
    var max = Math.max.apply(null, rows.map(function (r) { return r.val; })) || 1;
    return '<div class="barlist">' + rows.map(function (r) {
      var pct = Math.round(r.val / max * 100);
      return '<div class="barrow"><span class="bl" title="' + esc(r.label) + '">' + esc(r.label) + '</span>' +
        '<span class="bt"><i style="width:' + pct + '%"></i></span><span class="bv">' + r.val + '</span></div>';
    }).join("") + "</div>";
  }

  /* ---- 30-day line/area chart (SVG) ---- */
  function lineChart(days) {
    if (!days.length) return "<p class='muted'>No data yet.</p>";
    var W = 560, H = 180, pad = 26;
    var max = Math.max.apply(null, days.map(function (d) { return d.views; })) || 1;
    var n = days.length;
    var x = function (i) { return pad + (W - pad * 2) * (n === 1 ? 0.5 : i / (n - 1)); };
    var y = function (v) { return H - pad - (H - pad * 2) * (v / max); };
    var pts = days.map(function (d, i) { return x(i) + "," + y(d.views); });
    var area = "M" + pad + "," + (H - pad) + " L" + pts.join(" L") + " L" + (W - pad) + "," + (H - pad) + " Z";
    var line = "M" + pts.join(" L");
    var dots = days.map(function (d, i) { return '<circle cx="' + x(i) + '" cy="' + y(d.views) + '" r="2.5"/>'; }).join("");
    var first = days[0].day.slice(5), last = days[n - 1].day.slice(5);
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="linechart" preserveAspectRatio="none">' +
      '<path class="area" d="' + area + '"/><path class="line" d="' + line + '"/>' + dots +
      '<text class="ax" x="' + pad + '" y="' + (H - 6) + '">' + first + '</text>' +
      '<text class="ax" x="' + (W - pad) + '" y="' + (H - 6) + '" text-anchor="end">' + last + '</text>' +
      '<text class="ax" x="' + pad + '" y="14">' + max + ' views/day peak</text>' +
      '</svg>';
  }

  /* ---- messages ---- */
  function renderMsgs(d) {
    var rows = d.messages || [];
    $("#msgs").innerHTML = rows.length ? rows.map(function (m) {
      return '<div class="msg-row"><div class="msg-head"><b>' + esc(m.name || "Anonymous") + "</b> <span>" + esc(m.email || "") +
        "</span><em class='ta'>" + timeAgo(m.created_at) + "</em></div><p>" + esc(m.body) + "</p></div>";
    }).join("") : "<p class='muted'>No messages yet.</p>";
  }

  /* ---- guestbook moderation ---- */
  function renderGB(d) {
    var rows = d.entries || [];
    if (!rows.length) { $("#gbmod").innerHTML = "<p class='muted'>No guestbook notes yet.</p>"; return; }
    $("#gbmod").innerHTML = rows.map(function (g) {
      return '<div class="msg-row"><div class="msg-head"><b>' + esc(g.visitor_name || "Visitor") + "</b> <span>" + esc(g.visitor_email || "") +
        "</span><em class='ta'>" + timeAgo(g.created_at) + "</em></div><p>" + esc(g.body) + "</p>" +
        '<div class="gb-actions"><button data-id="' + g.id + '" data-ok="' + (g.approved ? "0" : "1") + '" class="btn btn-ghost gb-btn">' +
        (g.approved ? "Hide" : "Approve") + "</button>" + (g.approved ? '<span class="gb-live">live</span>' : "") + "</div></div>";
    }).join("");
    Array.prototype.forEach.call($("#gbmod").querySelectorAll(".gb-btn"), function (b) {
      b.addEventListener("click", function () {
        api("/api/guestbook", { method: "PATCH", body: JSON.stringify({ id: +b.dataset.id, approved: b.dataset.ok === "1" }) })
          .then(function () { return api("/api/guestbook?all=1"); }).then(renderGB).catch(function () {});
      });
    });
  }
})();
