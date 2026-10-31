/* My Jerseys: header badge on every page, and the collection builder on /my-jerseys/.
   Plain JavaScript (no framework) so it also runs on the static preview. The list lives in localStorage;
   share links carry the whole list in the URL (see src/lib/collection.ts for the format).
   When the site is built with a Supabase project (data-sb-url / data-sb-key on this script tag), visitors can also
   save the list to an account, and the footer newsletter form stores sign-ups. See supabase/schema.sql. */
(function () {
  var KEY = "tsj-my-jerseys";
  var LEAGUES = ["nfl", "nba", "wnba", "mlb", "nhl", "mls"];
  var NAMES = { nfl: "NFL", nba: "NBA", wnba: "WNBA", mlb: "MLB", nhl: "NHL", mls: "MLS" };
  var SCRIPT = document.currentScript;
  var BASE = (SCRIPT && SCRIPT.src) || location.href;
  var SB_URL = (SCRIPT && SCRIPT.dataset.sbUrl) || "", SB_KEY = (SCRIPT && SCRIPT.dataset.sbKey) || "";
  var AUTH_KEY = "tsj-auth";
  // Optional jersey style on an owned jersey. Stored as item.s; older lists without it keep working.
  var STYLES = ["Authentic", "Replica", "Swingman / Game", "Limited", "Throwback", "Alternate", "City / Special edition", "Signed"];
  function withStyle(o, i) { if (i && typeof i.s === "string" && STYLES.indexOf(i.s) > -1) o.s = i.s; return o; }
  var cache = {};

  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || "null");
      var ok = function (i) { return i && LEAGUES.indexOf(i.l) > -1 && i.n; };
      if (d && Array.isArray(d.items)) return { name: String(d.name || ""), items: d.items.filter(ok).map(function (i) { return withStyle({ l: i.l, n: i.n }, i); }), wish: Array.isArray(d.wish) ? d.wish.filter(ok) : [] };
    } catch (e) {}
    return { name: "", items: [], wish: [] };
  }
  function save(s, fromServer) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
    badges();
    if (!fromServer) pushSoon();
  }

  // ---------- Accounts (Supabase) ----------
  var sbPromise = null, syncTimer = null;
  function sb() {
    if (!SB_URL || !SB_KEY) return Promise.reject(new Error("Accounts are not set up"));
    if (!sbPromise) {
      sbPromise = new Promise(function (resolve, reject) {
        if (window.supabase) return resolve();
        var tag = document.createElement("script");
        tag.src = new URL("vendor/supabase-2.117.2.js", BASE).href;
        tag.onload = resolve;
        tag.onerror = reject;
        document.head.appendChild(tag);
      }).then(function () {
        return window.supabase.createClient(SB_URL, SB_KEY, { auth: { storageKey: AUTH_KEY, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
      });
      sbPromise.catch(function () { sbPromise = null; });
    }
    return sbPromise;
  }
  function hasSession() { try { return !!SB_URL && !!localStorage.getItem(AUTH_KEY); } catch (e) { return false; } }
  function currentUser() {
    return sb().then(function (c) { return c.auth.getSession().then(function (r) { return { c: c, user: r.data && r.data.session ? r.data.session.user : null }; }); });
  }
  function clean(list) { return Array.isArray(list) ? list.filter(function (i) { return i && LEAGUES.indexOf(i.l) > -1 && typeof i.n === "string" && i.n; }).map(function (i) { return withStyle({ l: i.l, n: i.n.slice(0, 48) }, i); }) : []; }
  // Adds b's entries to a, counting repeats, so merging two copies of the same list changes nothing.
  function merge(a, b) {
    var out = a.slice(), seen = {};
    a.forEach(function (i) { var k = i.l + "\t" + i.n; seen[k] = (seen[k] || 0) + 1; });
    b.forEach(function (i) { var k = i.l + "\t" + i.n; if (seen[k]) seen[k]--; else out.push(i); });
    return out;
  }
  function syncStatus(t) { var el = document.getElementById("mj-sync"); if (el) el.textContent = t; }
  function pushSoon() {
    if (!hasSession()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(push, 800);
  }
  function push() {
    return currentUser().then(function (x) {
      if (!x.user) return;
      var st = load();
      syncStatus("Saving…");
      return x.c.from("jersey_lists").upsert({
        user_id: x.user.id, username: (x.user.user_metadata && x.user.user_metadata.username) || "",
        display_name: st.name, items: st.items, wish: st.wish, updated_at: new Date().toISOString(),
      }).then(function (r) { syncStatus(r.error ? "Couldn't save just now. Your next change will try again." : "All changes saved."); });
    }).catch(function () {});
  }
  /** Loads the saved list. On log-in it is merged with this browser's list; otherwise the account copy wins. */
  function pull(mergeLocal) {
    return currentUser().then(function (x) {
      if (!x.user) return null;
      return x.c.from("jersey_lists").select("display_name,items,wish").eq("user_id", x.user.id).maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        var local = load(), row = r.data;
        var next = !row ? local : {
          name: row.display_name || local.name,
          items: mergeLocal ? merge(clean(row.items), local.items) : clean(row.items),
          wish: mergeLocal ? merge(clean(row.wish), local.wish) : clean(row.wish),
        };
        save(next, true);
        document.dispatchEvent(new CustomEvent("tsj-list"));
        if (!row || mergeLocal) return push().then(function () { return x.user; });
        return x.user;
      });
    });
  }
  function authError(e) {
    var m = String((e && e.message) || e || "");
    if (/already registered|already exists|duplicate/i.test(m)) return "That username is taken. Try another one, or log in.";
    if (/invalid login|invalid credentials/i.test(m)) return "That username and password don't match.";
    if (/rate limit|too many/i.test(m)) return "Too many tries. Wait a minute and try again.";
    if (/password/i.test(m)) return m;
    return "Something went wrong. Please try again. (" + m.slice(0, 80) + ")";
  }

  function setupAccount(app) {
    var box = app.querySelector("#mj-auth"), signedIn = app.querySelector("#mj-signed-in");
    if (!box || !SB_URL) return;
    var form = app.querySelector("#mj-auth-form"), user = app.querySelector("#mj-user"), pass = app.querySelector("#mj-pass");
    var submit = app.querySelector("#mj-auth-submit .cta-text"), status = app.querySelector("#mj-auth-status");
    var note = app.querySelector("#mj-save-note"), who = app.querySelector("#mj-who"), heading = app.querySelector(".mj-account-h");
    var mode = "signup";
    var localNote = note.textContent;
    function show(u) {
      box.hidden = !!u;
      signedIn.hidden = !u;
      if (u) {
        who.textContent = (u.user_metadata && u.user_metadata.username) || "You";
        heading.textContent = "Saved to your account";
        note.textContent = "Your list is saved to your account and in this browser. Share links still carry the list itself.";
      } else {
        heading.textContent = "Save your list for good";
        note.textContent = localNote;
      }
    }
    app.querySelectorAll(".mj-auth-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        mode = t.dataset.mode;
        app.querySelectorAll(".mj-auth-tab").forEach(function (o) { o.setAttribute("aria-selected", String(o === t)); });
        submit.textContent = mode === "signup" ? "Create account and save" : "Log in";
        pass.setAttribute("autocomplete", mode === "signup" ? "new-password" : "current-password");
        status.textContent = "";
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var u = user.value.trim().toLowerCase(), p = pass.value;
      if (!/^[a-z0-9_]{3,20}$/.test(u)) { status.textContent = "Usernames are 3 to 20 letters, numbers or underscores."; user.focus(); return; }
      if (p.length < 8) { status.textContent = "Passwords need at least 8 characters."; pass.focus(); return; }
      status.textContent = mode === "signup" ? "Creating your account…" : "Logging in…";
      var email = u + "@users.topsellingjerseys.net";
      sb().then(function (c) {
        return mode === "signup"
          ? c.auth.signUp({ email: email, password: p, options: { data: { username: u } } }).then(function (r) {
              if (r.error) throw r.error;
              if (!r.data.session) throw new Error("Account created, but it needs email confirmation, which this site doesn't use. Ask the site owner to turn off Confirm email in Supabase.");
            })
          : c.auth.signInWithPassword({ email: email, password: p }).then(function (r) { if (r.error) throw r.error; });
      }).then(function () { return pull(true); }).then(function (usr) {
        pass.value = "";
        status.textContent = "";
        show(usr);
        try { if (window.gtag) window.gtag("event", mode === "signup" ? "sign_up" : "login", { method: "username" }); } catch (err) {}
      }).catch(function (err) { status.textContent = authError(err); });
    });
    app.querySelector("#mj-logout").addEventListener("click", function () {
      sb().then(function (c) { return c.auth.signOut(); }).catch(function () {}).then(function () {
        try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
        show(null);
      });
    });
    // Show the right panel right away, then confirm with the saved session.
    if (hasSession()) {
      signedIn.hidden = false;
      who.textContent = "…";
      pull(false).then(function (u) { show(u); }).catch(function () { show(null); });
    } else {
      box.hidden = false;
    }
  }

  // ---------- Newsletter ----------
  document.addEventListener("submit", function (e) {
    var form = e.target.closest && e.target.closest("form[data-newsletter]");
    if (!form) return;
    e.preventDefault();
    var input = form.querySelector('input[type="email"]'), status = form.querySelector(".nl-status"), btn = form.querySelector("button");
    var email = input.value.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) { status.textContent = "Enter a valid email address."; input.focus(); return; }
    if (!SB_URL) { status.textContent = "Sign-ups aren't open yet."; return; }
    btn.disabled = true;
    status.textContent = "Signing you up…";
    fetch(SB_URL + "/rest/v1/newsletter_signups", {
      method: "POST",
      headers: { apikey: SB_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ email: email, source: location.pathname.slice(0, 40) }),
    }).then(function (r) {
      if (r.ok || r.status === 409) {
        form.querySelector(".nl-row").hidden = true;
        status.textContent = r.status === 409 ? "You're already on the list. Thanks!" : "You're signed up. Thanks!";
        try { if (window.gtag) window.gtag("event", "newsletter_signup", { page: location.pathname }); } catch (err) {}
      } else throw new Error(r.status);
    }).catch(function () { status.textContent = "That didn't go through. Please try again."; }).then(function () { btn.disabled = false; });
  });

  function find(list, l, n) { for (var k = 0; k < list.length; k++) if (list[k].l === l && list[k].n === n) return k; return -1; }
  function toggle(b, on, onText, offText, onShort, offShort) {
    var label = on ? onText : offText;
    var t = b.querySelector(".have-text") || b;
    if (t.textContent !== label) t.textContent = label;
    // Short label used in the tight phone list rows.
    var sh = b.querySelector(".have-short"), short = on ? onShort : offShort;
    if (sh && short && sh.textContent !== short) sh.textContent = short;
    if (b.getAttribute("aria-pressed") !== String(on)) b.setAttribute("aria-pressed", String(on));
  }

  function badges() {
    var st = load(), items = st.items, n = items.length;
    document.querySelectorAll("[data-mj-wish]").forEach(function (b) {
      toggle(b, find(st.wish, b.dataset.league, b.dataset.name) > -1, "★ On my wishlist", "+ Add to wishlist", "★ Wishlisted", "+ Wishlist");
    });
    // "+ I have this jersey" buttons show whether that player is already in the list.
    document.querySelectorAll("[data-mj-have]").forEach(function (b) {
      toggle(b, find(items, b.dataset.league, b.dataset.name) > -1, "✓ In My Jerseys", "+ I have this jersey", "✓ I have it", "+ I have it");
    });
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
  // Shared-list wording: "Joe has 16 jerseys" (matches src/lib/collection.ts hasHeadline).
  function hasHeadline(name, n) {
    return (name || "This collection") + " has " + n + (n === 1 ? " jersey" : " jerseys");
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
    setupAccount(app);
    var state = load();
    var league = "nfl";
    var nameIn = app.querySelector("#mj-name"), search = app.querySelector("#mj-search"), results = app.querySelector("#mj-results");
    var status = app.querySelector("#mj-status"), label = app.querySelector("#mj-search-label"), groups = app.querySelector("#mj-groups");
    var countH = app.querySelector("#mj-count"), share = app.querySelector("#mj-share"), textLink = app.querySelector("#mj-text");
    var site = (app.dataset.site || location.origin).replace(/\/$/, "");
    var shareUrl = "";
    nameIn.value = state.name;
    // Players with a page on this site, so a list entry can link to that player's ranking and jerseys.
    var pages = {};
    try { pages = JSON.parse((document.getElementById("mj-pages") || {}).textContent || "{}"); } catch (e) {}
    function nameNode(it) {
      var slug = pages[it.l] && pages[it.l][it.n];
      if (!slug) return el("span", "mj-item-name", it.n);
      var a = el("a", "mj-item-name", it.n);
      a.href = "/players/" + slug + "/";
      return a;
    }
    function track(ev, props) { try { if (window.gtag) window.gtag("event", ev, props); } catch (e) {} }
    function totals() {
      var box = app.querySelector("#mj-totals");
      if (!box) return;
      var lg = {}, st = {}, teams = 0;
      state.items.forEach(function (i) { lg[i.l] = 1; if (i.s) st[i.s] = (st[i.s] || 0) + 1; });
      var parts = [state.items.length + " owned", state.wish.length + " on your wishlist", Object.keys(lg).length + (Object.keys(lg).length === 1 ? " league" : " leagues")];
      var styles = Object.keys(st).sort(function (a, b) { return st[b] - st[a]; }).map(function (k) { return st[k] + " " + k; });
      box.textContent = parts.join(" · ") + (styles.length ? ". Styles: " + styles.join(", ") + "." : ".");
      box.hidden = !state.items.length && !state.wish.length;
    }

    function add(n, toWish) {
      if (toWish) { if (find(state.wish, league, n) < 0) state.wish.push({ l: league, n: n }); }
      else state.items.push({ l: league, n: n });
      save(state);
      render();
      track(toWish ? "wishlist_added" : "jersey_added", { league: league, player: n, placement: "my_jerseys_search" });
      status.textContent = "Added " + n + " (" + NAMES[league] + ")" + (toWish ? " to your wishlist." : ".");
      search.value = "";
      results.innerHTML = "";
      search.focus();
    }

    var top = [];
    try { top = JSON.parse((document.getElementById("mj-top") || {}).textContent || "[]"); } catch (e) {}
    // Suggestions: the highest-ranked players on each collected league's latest list that are in neither list yet.
    function renderSuggest() {
      var card = app.querySelector("#mj-suggest-card"), box = app.querySelector("#mj-suggest");
      if (!card || !box) return;
      box.innerHTML = "";
      var leagues = {};
      state.items.concat(state.wish).forEach(function (i) { leagues[i.l] = 1; });
      var any = false;
      LEAGUES.forEach(function (l) {
        if (!leagues[l]) return;
        var picks = top.filter(function (t) { return t.l === l && find(state.items, l, t.n) < 0 && find(state.wish, l, t.n) < 0; }).slice(0, 3);
        if (!picks.length) return;
        any = true;
        var sec = el("section", "mj-group");
        var tab = app.querySelector('.mj-tab[data-league="' + l + '"]');
        if (tab) sec.style.setProperty("--lg", getComputedStyle(tab).getPropertyValue("--lg"));
        sec.appendChild(el("h3", null, NAMES[l]));
        var ul = el("ul");
        picks.forEach(function (t) {
          var li = el("li");
          li.appendChild(el("span", "mj-rank", "No. " + t.r));
          li.appendChild(nameNode({ l: l, n: t.n }));
          var have = el("button", "mj-got", "I have it");
          have.type = "button";
          have.setAttribute("aria-label", "Add " + t.n + " to My Jerseys");
          have.addEventListener("click", function () { state.items.push({ l: l, n: t.n }); save(state); render(); track("jersey_added", { league: l, player: t.n, placement: "my_jerseys_suggest" }); });
          var want = el("button", "mj-got", "Want it");
          want.type = "button";
          want.setAttribute("aria-label", "Add " + t.n + " to your wishlist");
          want.addEventListener("click", function () { state.wish.push({ l: l, n: t.n }); save(state); render(); track("wishlist_added", { league: l, player: t.n, placement: "my_jerseys_suggest" }); });
          li.appendChild(have);
          li.appendChild(want);
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        box.appendChild(sec);
      });
      card.hidden = !any;
    }

    function render() {
      renderWish();
      totals();
      renderSuggest();
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
          var li = el("li");
          li.appendChild(nameNode(it));
          var sel = el("select", "mj-style");
          sel.setAttribute("aria-label", "Style of your " + it.n + " jersey");
          [""].concat(STYLES).forEach(function (v) { var o = el("option", null, v || "Style…"); o.value = v; if ((it.s || "") === v) o.selected = true; sel.appendChild(o); });
          sel.addEventListener("change", function () {
            if (sel.value) it.s = sel.value; else delete it.s;
            save(state);
            totals();
            track("jersey_style_set", { league: it.l, player: it.n, style: sel.value || "none" });
          });
          li.appendChild(sel);
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
        var msg = hasHeadline(state.name, state.items.length) + ". What's your jersey count? " + shareUrl;
        textLink.href = "sms:?&body=" + encodeURIComponent(msg);
      });
    }

    function wishAdd(n) {
      var w = el("button", "mj-wish-add", "+ Wishlist");
      w.type = "button";
      w.setAttribute("aria-label", "Add " + n + " to your wishlist");
      w.addEventListener("click", function () { add(n, true); });
      return w;
    }

    // Wishlist: jerseys the visitor wants. "Got it" moves one into My Jerseys.
    function renderWish() {
      var box = app.querySelector("#mj-wish");
      if (!box) return;
      var head = app.querySelector("#mj-wish-count");
      head.textContent = "My wishlist: " + state.wish.length;
      box.innerHTML = "";
      if (!state.wish.length) { box.appendChild(el("p", "mj-empty", "Nothing on your wishlist yet. Tap + Add to wishlist next to any player, or + Wishlist in the search above.")); return; }
      LEAGUES.forEach(function (l) {
        var mine = state.wish.filter(function (i) { return i.l === l; });
        if (!mine.length) return;
        var sec = el("section", "mj-group");
        sec.style.setProperty("--lg", getComputedStyle(app.querySelector('.mj-tab[data-league="' + l + '"]')).getPropertyValue("--lg"));
        var h = el("h3", null, NAMES[l] + " ");
        h.appendChild(el("span", null, String(mine.length)));
        sec.appendChild(h);
        var ul = el("ul");
        mine.forEach(function (it) {
          var li = el("li");
          li.appendChild(nameNode(it));
          var got = el("button", "mj-got", "Got it");
          got.type = "button";
          got.setAttribute("aria-label", "Move " + it.n + " to My Jerseys");
          got.addEventListener("click", function () {
            state.wish.splice(state.wish.indexOf(it), 1);
            state.items.push({ l: it.l, n: it.n });
            save(state);
            render();
            status.textContent = "Moved " + it.n + " to My Jerseys.";
          });
          var x = el("button", "mj-remove", "×");
          x.type = "button";
          x.setAttribute("aria-label", "Remove " + it.n + " from your wishlist");
          x.addEventListener("click", function () { state.wish.splice(state.wish.indexOf(it), 1); save(state); render(); });
          li.appendChild(got);
          li.appendChild(x);
          ul.appendChild(li);
        });
        sec.appendChild(ul);
        box.appendChild(sec);
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
          li.appendChild(wishAdd(p.n));
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
          li.appendChild(wishAdd(typed));
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
    // Each share is logged to the editor desk through Netlify Forms (form "count-share", see public/__forms.html).
    var lastLog = "";
    function logShare(method) {
      if (!shareUrl || !window.fetch) return;
      var key = method + "|" + shareUrl;
      if (key === lastLog) return; // one log per list and method
      lastLog = key;
      track("collection_shared", { method: method, count: state.items.length });
      var leagues = {};
      state.items.forEach(function (i) { leagues[i.l] = 1; });
      var body = new URLSearchParams({
        "form-name": "count-share", site: "topsellingjerseys.net", name: state.name, method: method,
        count: String(state.items.length), states: String(Object.keys(leagues).length),
        visited: state.items.map(function (i) { return i.n + " (" + (NAMES[i.l] || i.l) + ")"; }).join("; ").slice(0, 4500),
        link: shareUrl.length <= 1500 ? shareUrl : ""
      });
      fetch("/__forms.html", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: body.toString(), keepalive: true }).catch(function () {});
    }
    textLink.addEventListener("click", function () { logShare("text"); });
    app.querySelector("#mj-share-btn").addEventListener("click", function () {
      if (!shareUrl) return;
      logShare(navigator.share ? "native" : "copy");
      var title = hasHeadline(state.name, state.items.length);
      if (navigator.share) navigator.share({ title: title, text: title + ". What's your jersey count?", url: shareUrl }).catch(function () {});
      else copy();
    });
    function copy() {
      var done = function () { status.textContent = "Link copied. Paste it into a text or post."; };
      if (navigator.clipboard) navigator.clipboard.writeText(shareUrl).then(done, function () { prompt("Copy your link:", shareUrl); });
      else prompt("Copy your link:", shareUrl);
    }
    app.querySelector("#mj-copy").addEventListener("click", function () { if (shareUrl) { logShare("copy"); copy(); } });
    app.querySelector("#mj-clear").addEventListener("click", function () {
      if (confirm("Remove all " + state.items.length + " jerseys from your list?")) { state.items = []; save(state); render(); }
    });

    // An account load can replace the list after the page opens.
    document.addEventListener("tsj-list", function () { state = load(); nameIn.value = state.name; render(); });
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
      var head = hasHeadline(name, total);
      h1.textContent = (name || "This collection") + " has ";
      h1.appendChild(el("em", null, String(total)));
      h1.appendChild(document.createTextNode(total === 1 ? " jersey" : " jerseys"));
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
  // Signed-in visitors: refresh the list from their account once per visit, so the header count matches other devices.
  if (hasSession() && !document.getElementById("mj-app")) {
    try {
      if (!sessionStorage.getItem("tsj-pulled")) { sessionStorage.setItem("tsj-pulled", "1"); pull(false).catch(function () {}); }
    } catch (e) {}
  }
  // Pages change without a full reload on the live site, so re-check when the page content changes.
  new MutationObserver(function () { scan(); }).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("storage", badges);
  document.addEventListener("click", function (e) {
    var w = e.target.closest && e.target.closest("[data-mj-wish]");
    // In a ranking row the buttons sit inside <summary>; keep a tap from also opening the row.
    var inRow = e.target.closest && e.target.closest("summary [data-mj-wish], summary [data-mj-have]");
    if (inRow) e.preventDefault();
    if (w) {
      var ws = load(), wl = w.dataset.league, wn = w.dataset.name, wat = find(ws.wish, wl, wn);
      if (wat > -1) ws.wish.splice(wat, 1); else ws.wish.push({ l: wl, n: wn });
      save(ws);
      try { if (window.gtag) window.gtag("event", wat > -1 ? "wishlist_removed" : "wishlist_added", { league: wl, player: wn, placement: "wish_button" }); } catch (err) {}
      return;
    }
    var b = e.target.closest && e.target.closest("[data-mj-have]");
    if (!b) return;
    var s = load(), l = b.dataset.league, n = b.dataset.name;
    var at = find(s.items, l, n);
    if (at > -1) s.items.splice(at, 1);
    else {
      s.items.push({ l: l, n: n });
      // Owning a jersey takes it off the wishlist.
      var wi = find(s.wish, l, n);
      if (wi > -1) s.wish.splice(wi, 1);
    }
    save(s);
    document.querySelectorAll("[data-mj-count]").forEach(function (c) { c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump"); });
    try { if (window.gtag) window.gtag("event", at > -1 ? "jersey_removed" : "jersey_added", { league: l, player: n, placement: "have_button" }); } catch (err) {}
  });
})();
