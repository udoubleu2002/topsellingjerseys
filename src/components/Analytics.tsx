"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track, hasConsent, setConsent, consentRequired, assignVariant } from "@/lib/analytics";

// The first page of a visit carries the address the visitor came from; later pages are moves within the site.
let firstView = true;

/** Anonymous page view for the editor desk: the page and where the visit came from. No cookies, nothing stored in the browser. */
function sendPageView(path: string) {
  if (navigator.webdriver) return;
  let ref = location.origin + "/";
  let reload = false;
  if (firstView) {
    firstView = false;
    ref = document.referrer;
    try { reload = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.type === "reload"; } catch { /* older browser */ }
  }
  const q = new URLSearchParams(location.search);
  const body = JSON.stringify({
    page: path, ref: ref.slice(0, 500), reload, w: window.screen?.width ?? 0,
    utm_source: q.get("utm_source") ?? "", utm_medium: q.get("utm_medium") ?? "", utm_campaign: q.get("utm_campaign") ?? "",
  });
  try {
    if (navigator.sendBeacon?.("/api/visit/", new Blob([body], { type: "text/plain" }))) return;
  } catch { /* fall through */ }
  fetch("/api/visit/", { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
}

/**
 * One delegated listener for every [data-track] link and one IntersectionObserver for [data-impression] elements.
 * Pages stay server-rendered; this is the only analytics code on the client.
 */
export function Analytics({ pageType }: { pageType?: string }) {
  const pathname = usePathname();
  const [askConsent, setAskConsent] = useState(false);

  useEffect(() => {
    setAskConsent(consentRequired() && hasConsent() === null);
  }, []);

  useEffect(() => {
    sendPageView(pathname);
    const main = document.querySelector("main");
    track("page_view", { path: pathname, page_type: main?.getAttribute("data-page-type") ?? pageType ?? "other", referrer: document.referrer });

    // CTA wording experiment: variant B swaps the label; the server-rendered default remains for crawlers.
    const cta = assignVariant("cta_wording", ["a", "b"]);
    if (cta === "b") {
      document.querySelectorAll<HTMLElement>("a[data-cta-experiment='cta_wording'] .cta-text").forEach((t) => {
        if (t.childElementCount === 0 && /^Shop .* Jerseys$/.test(t.textContent ?? "")) t.textContent = t.textContent!.replace(/^Shop (.*) Jerseys$/, "Find $1 Jerseys");
      });
    }

    // Promotions are baked into static pages, so hide any that ended after the last build.
    const today = new Date().toISOString().slice(0, 10);
    document.querySelectorAll<HTMLElement>("[data-ends]").forEach((el) => { if ((el.dataset.ends ?? "") < today) el.hidden = true; });

    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting || seen.has(e.target)) continue;
        seen.add(e.target);
        const d = (e.target as HTMLElement).dataset;
        // Products and player rows keep their event names; other sections (e.g. "movement", "report_status") report "<name>_view".
        const ev = d.impression === "product" ? "product_impression" : d.impression === "player_card" || d.impression === "home_list" ? "player_card_impression" : `${d.impression}_view`;
        track(ev, { league: d.league, player: d.player, rank: d.rank, offer: d.offer, report: d.report, path: pathname });
      }
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-impression]").forEach((el) => io.observe(el));

    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest<HTMLElement>("[data-track]");
      if (!a) return;
      const d = a.dataset;
      track(d.track!, { report: d.report, offer: d.offer, offer_kind: d.offerKind, merchant: d.merchant, league: d.league, player: d.player, rank: d.rank, placement: d.placement, page: d.page, cta_variant: cta, path: pathname });
    };
    document.addEventListener("click", onClick);

    // Phone and in-app browsers often drop the Referer, so /out/ and /go/ links carry the page themselves.
    const addFrom = (a: HTMLAnchorElement) => {
      const u = new URL(a.href, location.href);
      if (u.origin !== location.origin || !/^\/(out|go)\//.test(u.pathname)) return;
      u.searchParams.set("from", location.pathname);
      a.href = u.pathname + u.search + u.hash;
    };
    document.querySelectorAll<HTMLAnchorElement>("a[href^='/out/'], a[href^='/go/']").forEach(addFrom);
    const onPress = (ev: Event) => { const a = (ev.target as HTMLElement).closest?.("a"); if (a) addFrom(a); };
    document.addEventListener("pointerdown", onPress, true);
    document.addEventListener("click", onPress, true);
    return () => { io.disconnect(); document.removeEventListener("click", onClick); document.removeEventListener("pointerdown", onPress, true); document.removeEventListener("click", onPress, true); };
  }, [pathname, pageType]);

  if (!askConsent) return null;
  return (
    <div className="consent" role="dialog" aria-label="Analytics consent">
      <p>We count visits anonymously, without cookies. With your OK, we also use analytics tools that may set cookies, to learn which rankings and shopping links are useful.</p>
      <div className="consent-actions">
        <button className="primary" onClick={() => { setConsent(true); setAskConsent(false); }}>Allow analytics</button>
        <button onClick={() => { setConsent(false); setAskConsent(false); }}>Decline</button>
      </div>
    </div>
  );
}
