/* My Jerseys: header badge on every page, and the collection builder on /my-jerseys/.
   Plain JavaScript (no framework) so it also runs on the static preview. The list lives in localStorage;
   share links carry the whole list in the URL (see src/lib/collection.ts for the format). */
(function () {
  var KEY = "tsj-my-jerseys";
  var LEAGUES = ["nfl", "nba", "mlb", "nhl", "mls"];
  var NAMES = { nfl: "NFL", nba: "NBA", mlb: "MLB", nhl: "NHL", mls: "MLS" };
  var BASE = (document.currentScript && document.currentScript.src) || location.href;
  var cache = {};

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      if (d && Array.isArray(d.items)) return { name: String(d.name || ""), items: d.items.filter(function (i) { return i && LEAGUES.indexOf(i.l) > -1 && i.n; }) };
    } catch (e) {}
    return { name: "", items: [] };
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} badges(); }

  function badges() {
    var n = load().items.length;
    document.querySelectorAll("[data-mj-count]").forEach(function (b) {
      var t = n > 99 ? "99+" : String(n);
      // Only touch the DOM on a change, or the MutationObserver below would loop.
      if (b.textContent !== t) b.textContent = t;
      if (b.hidden !== (n === 0)) b.hidden = n === 0;
    });
  }

  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, ""); }
  function headline(name, n) {
    var who = name ? name + (/s$/i.test(name) ? "'" : "'s") : "Your";
    return who + " jersey count is: " + n;
  }

  // Share code: "z" + base64url(deflate-raw(text)) when the browser can compress, else "p" + base64url(text).
  function b64url(bytes) {
    var s = "";
    for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function encode(state) {
    var text = state.name.replace(/[\n\t]/g, " ");
    LEAGUES.forEach(function (l) {
      var names = state.items.filter(function (i) { return i.l === l; }).map(function (i) { return i.n.replace(/[\n\t]/g, " "); });
      if (names.length) text += "\n" + l + "\t" + names.join("\t");
    });
    var bytes = new TextEncoder().encode(text);
    if (typeof CompressionStream === "undefined") return Promise.resolve("p" + b64url(bytes));
    var stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate-raw"));
    return new Response(stream).arrayBuffer().then(function (buf) { return "z" + b64url(new Uint8Array(buf)); }, function () { return "p" + b64url(bytes); });
  }

  function players(league) {
    if (!cache[league]) {
      cache[league] = fetch(new URL("player-index/" + league + ".json", BASE).href)
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function (rows) { return rows.map(function (r) { return { n: r[0], i: r[1], k: norm(r[0]) }; }); })
        .catch(function () { delete cache[league]; return []; });
    }
    return cache[league];
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function init(app) {
    app.dataset.ready = "1";
    var state = load();
    var league = "nfl";
    var nameIn = app.querySelector("#mj-name"), search = app.querySelector("#mj-search"), results = app.querySelector("#mj-results");
    var status = app.querySelector("#mj-status"), label = app.querySelector("#mj-search-label"), groups = app.querySelector("#mj-groups");
    var countH = app.querySelector("#mj-count"), share = app.querySelector("#mj-share"), textLink = app.querySelector("#mj-text");
    var site = (app.dataset.site || location.origin).replace(/\/$/, "");
    var shareUrl = "";
    nameIn.value = state.name;

    function add(n) {
      state.items.push({ l: league, n: n });
      save(state);
      render();
      status.textContent = "Added " + n + " (" + NAMES[league] + ").";
      search.value = "";
      results.innerHTML = "";
      search.focus();
    }

    function render() {
      countH.textContent = headline(state.name, state.items.length);
      groups.innerHTML = "";
      share.hidden = state.items.length === 0;
      if (!state.items.length) {
        groups.appendChild(el("p", "mj-empty", "No jerseys yet. Search for a player and tap Add."));
        shareUrl = "";
        return;
      }
      LEAGUES.forEach(function (l) {
        var mine = state.items.filter(function (i) { return i.l === l; });
        if (!mine.length) return;
        var sec = el("section", "mj-group");
        sec.style.setProperty("--lg", getComputedStyle(app.querySelector('.mj-tab[data-league="' + l + '"]')).getPropertyValue("--lg"));
        var h = el("h3", null, NAMES[l] + " ");
        h.appendChild(el("span", null, String(mine.length)));
        sec.appendChild(h);
        var ul = el("ul");
        mine.forEach(function (it) {
          var li = el("li", null, it.n);
          var x = el("button", "mj-remove", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Remove " + it.n);
          x.addEventListener("click", function () {
            state.items.splice(state.items.indexOf(it), 1);
            save(state);
            render();
          });
          li.appendChild(x);
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        groups.appendChild(sec);
      });
      encode(state).then(function (code) {
        shareUrl = site + "/j/" + code + "/";
        var msg = headline(state.name, state.items.length) + ". See them all: " + shareUrl;
        textLink.href = "sms:?&body=" + encodeURIComponent(msg);
      });
    }

    var searchSeq = 0;
    function runSearch() {
      var q = norm(search.value.trim());
      var seq = ++searchSeq, lg = league;
      if (!q) { results.innerHTML = ""; return; }
      players(lg).then(function (list) {
        // Only the latest search draws results, so fast typing or tab switches never stack duplicate rows.
        if (seq !== searchSeq) return;
        results.innerHTML = "";
        var words = q.split(/\s+/);
        var hits = [], starts = [];
        for (var i = 0; i < list.length && hits.length + starts.length < 400; i++) {
          var p = list[i];
          if (words.every(function (w) { return p.k.indexOf(w) > -1; })) (p.k.indexOf(q) === 0 || p.k.indexOf(" " + q) > -1 ? starts : hits).push(p);
        }
        var shown = starts.concat(hits).slice(0, 12);
        shown.forEach(function (p) {
          var li = el("li");
          var b = el("button", "mj-add");
          b.type = "button";
          b.appendChild(el("span", "mj-add-name", p.n));
          if (p.i) b.appendChild(el("span", "mj-add-info", p.i));
          b.appendChild(el("span", "mj-add-plus", "Add"));
          b.addEventListener("click", function () { add(p.n); });
          li.appendChild(b);
          results.appendChild(li);
        });
        var typed = search.value.trim().replace(/\s+/g, " ").slice(0, 48);
        var exact = shown.some(function (p) { return p.k === q; });
        if (!exact && typed.length > 1) {
          var li = el("li");
          var b = el("button", "mj-add mj-add-own");
          b.type = "button";
          b.appendChild(el("span", "mj-add-name", "Add “" + typed + "” as an " + NAMES[league] + " jersey"));
          b.appendChild(el("span", "mj-add-plus", "Add"));
          b.addEventListener("click", function () { add(typed); });
          li.appendChild(b);
          results.appendChild(li);
        }
        status.textContent = shown.length ? "" : "No match in our " + NAMES[league] + " list. You can still add the name as typed.";
      });
    }

    function setLeague(l) {
      league = l;
      app.querySelectorAll(".mj-tab").forEach(function (t) { t.setAttribute("aria-selected", String(t.dataset.league === l)); });
      label.textContent = "Search " + NAMES[l] + " players";
      status.textContent = "Loading " + NAMES[l] + " players…";
      players(l).then(function (list) {
        if (league === l) status.textContent = list.length ? list.length.toLocaleString() + " " + NAMES[l] + " players to choose from." : "Type any " + NAMES[l] + " player's name to add it.";
        runSearch();
      });
    }

    app.querySelectorAll(".mj-tab").forEach(function (t) { t.addEventListener("click", function () { setLeague(t.dataset.league); search.focus(); }); });
    search.addEventListener("input", runSearch);
    search.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); var first = results.querySelector("button"); if (first) first.click(); }
    });
    nameIn.addEventListener("input", function () { state.name = nameIn.value.trim().slice(0, 24); save(state); render(); });
    app.querySelector("#mj-share-btn").addEventListener("click", function () {
      if (!shareUrl) return;
      var title = headline(state.name, state.items.length);
      if (navigator.share) navigator.share({ title: title, text: title, url: shareUrl }).catch(function () {});
      else copy();
    });
    function copy() {
      var done = function () { status.textContent = "Link copied. Paste it into a text or post."; };
      if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).then(done, function () { prompt("Copy your link:", shareUrl); });
      else prompt("Copy your link:", shareUrl);
    }
    app.querySelector("#mj-copy").addEventListener("click", function () { if (shareUrl) copy(); });
    app.querySelector("#mj-clear").addEventListener("click", function () {
      if (confirm("Remove all " + state.items.length + " jerseys from your list?")) { state.items = []; save(state); render(); }
    });

    render();
    setLeague("nfl");
  }

  // Static hosting: /j/{code}/ is one shared page, so draw the list from the code in the address.
  function b64bytes(s) {
    var bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4));
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function decode(code) {
    if (!/^[zp][A-Za-z0-9_-]+$/.test(code)) return Promise.reject(new Error("bad code"));
    var bytes = b64bytes(code.slice(1));
    if (code[0] === "p") return Promise.resolve(new TextDecoder().decode(bytes));
    var stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    return new Response(stream).text();
  }
  function initShared(box) {
    box.dataset.ready = "1";
    var meta = {};
    try { meta = JSON.parse(box.dataset.leagues || "{}"); } catch (e) {}
    var m = location.pathname.match(/\/j\/([^/]+)/);
    var groups = document.getElementById("mj-shared-groups"), h1 = document.getElementById("mj-shared-h1");
    decode(m ? m[1] : "").then(function (text) {
      var lines = text.split("\n"), name = (lines.shift() || "").slice(0, 24), total = 0;
      groups.innerHTML = "";
      lines.forEach(function (line) {
        var parts = line.split("\t"), l = parts.shift();
        if (LEAGUES.indexOf(l) < 0 || !parts.length) return;
        var counts = {}, order = [];
        parts.forEach(function (n) { n = n.trim().slice(0, 48); if (!n) return; total++; if (!counts[n]) order.push(n); counts[n] = (counts[n] || 0) + 1; });
        var sec = el("section", "mj-group");
        sec.style.setProperty("--lg", (meta[l] && meta[l].accent) || "#e8442c");
        var h = el("h2", null, ((meta[l] && meta[l].name) || NAMES[l]) + " ");
        h.appendChild(el("span", null, String(parts.length)));
        sec.appendChild(h);
        var ul = el("ul");
        order.forEach(function (n) { ul.appendChild(el("li", null, counts[n] > 1 ? n + " ×" + counts[n] : n)); });
        sec.appendChild(ul);
        groups.appendChild(sec);
      });
      if (!total) throw new Error("empty");
      var head = headline(name, total).replace(/^Your /, "My ");
      h1.textContent = head.replace(/: \d+$/, ": ");
      h1.appendChild(el("em", null, String(total)));
      document.title = head + " | Top Selling Jerseys";
    }).catch(function () {
      groups.innerHTML = "";
      groups.appendChild(el("p", "mj-empty", "This jersey list link looks incomplete. Ask for the link again, or count your own below."));
    });
  }

  function scan() {
    badges();
    var app = document.getElementById("mj-app");
    if (app && !app.dataset.ready) init(app);
    var shared = document.getElementById("mj-shared");
    if (shared && shared.dataset.leagues && !shared.dataset.ready) initShared(shared);
  }
  scan();
  // Pages change without a full reload on the live site, so re-check when the page content changes.
  new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("storage", badges);
})();
