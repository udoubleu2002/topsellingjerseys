import { outPath } from "@/lib/affiliate";
import { bannerImage, bannerPixel, type LidsBanner } from "@/lib/lidsAds";

/** A Lids display banner with Impact's impression pixel. Scales down to fit narrow columns. */
export function LidsAd({ banner, at, className = "" }: { banner: LidsBanner; at: string; className?: string }) {
  return (
    <div className={`lids-ad ${className}`} style={{ "--ad-w": `${banner.width}px` } as React.CSSProperties}>
      <span className="lids-ad-label">Advertisement</span>
      <a
        href={`${outPath(`ad-lids-${banner.id}`)}?at=${at}`}
        target="_blank"
        rel="sponsored nofollow noopener"
        data-track="affiliate_click"
        data-offer={`ad-lids-${banner.id}`}
        data-offer-kind="ad"
        data-merchant="lids"
        data-placement={at}
      >
        <img src={bannerImage(banner)} alt={banner.alt} width={banner.width} height={banner.height} loading="lazy" />
      </a>
      <img className="lids-ad-px" src={bannerPixel(banner)} alt="" width={0} height={0} loading="lazy" />
    </div>
  );
}
