import type { HouseAd as Ad } from "@/lib/houseAds";

/** An ad for one of our own sites. The link goes through /go/ so the click is counted. */
export function HouseAd({ ad, at, className = "" }: { ad: Ad; at: string; className?: string }) {
  return (
    <a className={`hads ${className}`} href={`/go/${ad.id}/?at=${at}`} rel="nofollow" data-ad-slot={at} style={{ "--ha-bg": ad.color, "--ha-ac": ad.accent } as React.CSSProperties}>
      <span className="hads-tag">From our network</span>
      <span className="hads-name">{ad.name}</span>
      <span className="hads-pitch">{ad.pitch}</span>
      <span className="hads-detail">{ad.detail}</span>
      <span className="hads-cta">{ad.cta} <span aria-hidden="true">→</span><span className="hads-dom">{ad.domain}</span></span>
    </a>
  );
}
