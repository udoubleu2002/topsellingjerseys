"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { track, hasConsent, setConsent, consentRequired, assignVariant } from "@/lib/analytics";

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
        track(d.impression === "product" ? "product_impression" : "player_card_impression", { league: d.league, player: d.player, rank: d.rank, offer: d.offer, path: pathname });
      }
    }, { threshold: 0.5 });
    document.querySelectorAll("[data-impression]").forEach((el) => io.observe(el));

    const onClick = (ev: MouseEvent) => {
      const a = (ev.target as HTMLElement).closest<HTMLElement>("[data-track]");
      if (!a) return;
      const d = a.dataset;
      track(d.track!, { offer: d.offer, offer_kind: d.offerKind, merchant: d.merchant, league: d.league, player: d.player, rank: d.rank, placement: d.placement, page: d.page, cta_variant: cta, path: pathname });
    };
    document.addEventListener("click", onClick);
    return () => { io.disconnect(); document.removeEventListener("click", onClick); };
  }, [pathname, pageType]);

  if (!askConsent) return null;
  return (
    <div className="consent" role="dialog" aria-label="Analytics consent">
      <p>We use privacy-friendly analytics to learn which rankings and shopping links are useful. No data is collected unless you agree.</p>
      <div className="consent-actions">
        <button className="primary" onClick={() => { setConsent(true); setAskConsent(false); }}>Allow analytics</button>
        <button onClick={() => { setConsent(false); setAskConsent(false); }}>Decline</button>
      </div>
    </div>
  );
}
