import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/config";
import { SiteHeader } from "@/components/SiteHeader";
import { getLeagues } from "@/lib/data";
import type { League } from "@/lib/schema";

export const metadata: Metadata = pageMeta({
  title: "My Jerseys: Count and Share Your Jersey Collection",
  description: "Add every jersey you own from the NFL, NBA, WNBA, MLB, NHL and MLS, see your jersey count by sport, and share your collection with one link.",
  path: "/my-jerseys/",
  shareTitle: "What's your jersey count?",
  shareText: "Add every NFL, NBA, WNBA, MLB, NHL and MLS jersey you own, then share your count with friends.",
});

/** Server-rendered shell; public/my-jerseys.js runs it, so it also works on the static preview. */
export default function MyJerseysPage() {
  const leagues = getLeagues();
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="my_jerseys">
        <section className="mj-hero">
          <div className="wrap">
            <p className="kicker">Your collection</p>
            <h1>My <em>Jerseys</em></h1>
            <p className="lede">Add every jersey you own and every one on your wishlist, from any player in the NFL, NBA, WNBA, MLB, NHL or MLS. Then share your count with one link.</p>
          </div>
        </section>
        {/* The builder's markup is handed to React as HTML so public/my-jerseys.js can change it without hydration errors. */}
        <div className="wrap mj-app" id="mj-app" data-site={site.url} dangerouslySetInnerHTML={{ __html: appHtml(leagues) }} />
      </main>
    </>
  );
}

const JERSEY_PATH = "M23 9 13 13 4 23l8 9 5-4v28h30V28l5 4 8-9-9-10-10-4c-1.6 4.6-4.9 7-9 7s-7.4-2.4-9-7z";

function appHtml(leagues: League[]) {
  const tabs = leagues
    .map((l, i) => `<button type="button" role="tab" class="mj-tab" data-league="${l.id}" aria-selected="${i === 0}" style="--lg:${l.accent}">${l.name}</button>`)
    .join("");
  return `
<div class="mj-build">
  <label class="mj-field"><span>Your first name</span><input id="mj-name" type="text" maxlength="24" placeholder="Joe" autocomplete="given-name"></label>
  <div class="mj-tabs" role="tablist" aria-label="League">${tabs}</div>
  <label class="mj-field"><span id="mj-search-label">Search NFL players</span><input id="mj-search" type="search" placeholder="Start typing a player's name" autocomplete="off" aria-describedby="mj-status"></label>
  <p id="mj-status" class="mj-status" aria-live="polite">Loading players…</p>
  <ul id="mj-results" class="mj-results"></ul>
  <noscript><p class="mj-status">Turn on JavaScript to build your jersey list.</p></noscript>
</div>
<aside class="mj-collection" aria-labelledby="mj-count">
  <div class="mj-card">
    <div class="mj-card-head"><svg class="mj-card-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="${JERSEY_PATH}" fill="currentColor"/></svg><h2 id="mj-count">Your jersey count is: 0</h2></div>
    <div id="mj-groups" class="mj-groups"><p class="mj-empty">No jerseys yet. Search for a player and tap Add.</p></div>
    <div class="mj-share" id="mj-share" hidden>
      <button type="button" class="btn-shop" id="mj-share-btn"><span class="cta-text">Share my jerseys</span></button>
      <a class="mj-sec" id="mj-text" href="sms:">Text it</a>
      <button type="button" class="mj-sec" id="mj-copy">Copy link</button>
      <button type="button" class="mj-clear" id="mj-clear">Clear all</button>
    </div>
  </div>
  <div class="mj-card mj-wish-card">
    <div class="mj-card-head"><span class="mj-wish-icon" aria-hidden="true">★</span><h2 id="mj-wish-count">My wishlist: 0</h2></div>
    <div id="mj-wish" class="mj-groups"><p class="mj-empty">Nothing on your wishlist yet.</p></div>
  </div>
  <p class="mj-note">Your list is saved in this browser only. Share links carry the list itself, so nothing is stored on our servers.</p>
</aside>`;
}
