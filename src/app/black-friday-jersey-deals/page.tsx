import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateNote } from "@/components/RankingHeader";
import { ShopButton } from "@/components/ShopButton";
import { PriceTag } from "@/components/PriceTag";
import { Faq } from "@/components/Faq";
import { DealsBar } from "@/components/Deals";
import { JsonLd } from "@/components/JsonLd";
import { getActivePromotions, getLeagues, getCurrentRanking, getPlayer, getTeam } from "@/lib/data";
import { productOffer } from "@/lib/affiliate";
import { jerseyImg } from "@/lib/img";
import { fmtShortDate } from "@/lib/format";
import { abs, site } from "@/lib/config";
import { pctOff, saleTopSellers } from "@/lib/blackFriday";

const PATH = "/black-friday-jersey-deals/";

export const metadata: Metadata = pageMeta({
  title: "Black Friday Jersey Deals 2026: Top Sellers on Sale",
  description: "Black Friday and Cyber Monday 2026 jersey deals: the NFL, NBA, WNBA, MLB, NHL and MLS top sellers on sale now at Lids, plus Lids' current promo codes.",
  path: PATH,
});

export default function BlackFridayPage() {
  const leagues = getLeagues().map((league) => ({ league, picks: saleTopSellers(league), ranking: getCurrentRanking(league.id) })).filter((x) => x.picks.length);
  const promos = getActivePromotions();
  const checked = leagues.flatMap((x) => x.picks.map((p) => p.product.lastVerified)).sort().pop();
  const crumbs = [{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }, { name: "Black Friday jersey deals", href: PATH }];
  const faq = [
    { q: "When is Black Friday 2026?", a: "Black Friday is Friday, November 27, 2026, the day after Thanksgiving. Cyber Monday is November 30. Retailers often start jersey sales the week before and run them through Cyber Monday." },
    { q: "Does Lids have a Black Friday promo code?", a: `Lids usually runs Black Friday markdowns and sitewide codes. Any code Lids gives us shows at the top of this page with its end date${promos.some((p) => p.code) ? "" : ". None is live right now, so check back as Black Friday gets closer"}. Many jerseys below are already marked down without a code.` },
    { q: "Are Black Friday jersey deals worth waiting for?", a: "For the top sellers, discounts of 20% or more are common in the weeks around Black Friday. If you're buying a gift and need a specific size, buying early is safer, because popular sizes sell out first." },
    { q: "Which jerseys are included?", a: "Each league's section shows the players on its latest published sales list whose jersey is on sale right now, best-selling first. Prices and markdowns come from Lids and are checked daily." },
    { q: "Do you earn money from these links?", a: `Some links are affiliate links, so ${site.name} may earn a commission when you buy, at no extra cost to you. The order comes from the sales lists, not from commissions.` },
  ];
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Black Friday jersey deals", url: abs(PATH) };
  return (
    <>
      <SiteHeader active="shop" />
      <main id="main" data-page-type="black_friday">
        <Breadcrumbs items={crumbs} />
        <header className="gd-band">
          <div className="wrap">
            <p className="gd-kicker">Black Friday &amp; Cyber Monday 2026</p>
            <h1 className="gd-band-h">Black Friday jersey deals: the top sellers on sale now</h1>
            <p className="gd-band-dek">The most popular jerseys in every league, marked down right now at Lids. Each section follows its league&apos;s latest sales list, so you see the jerseys fans actually want first{checked ? `. Prices checked ${fmtShortDate(checked)}` : ""}.</p>
            <nav className="gd-chips" aria-label="Jump to a league">
              <a href="#bf-codes">Lids codes</a>
              {leagues.map(({ league }) => <a key={league.id} href={`#bf-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>{league.name}</a>)}
              <a href="#bf-faq">FAQ</a>
            </nav>
          </div>
        </header>

        <section id="bf-codes" className="wrap section" aria-labelledby="bf-codes-h">
          <div className="sec-head"><h2 id="bf-codes-h" className="sec-h">Lids promo codes and sales</h2></div>
          {promos.length === 0 && <p>No Lids code is live right now. When Lids releases its Black Friday codes, they show up here with their end dates. Until then, the markdowns below need no code.</p>}
        </section>
        <DealsBar page="black_friday" />
        <div className="wrap" style={{ marginTop: 18 }}><AffiliateNote /></div>

        {leagues.map(({ league, picks, ranking }) => (
          <section key={league.id} id={`bf-${league.id}`} className="wrap section shop-sec" aria-labelledby={`bf-h-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
            <div className="sec-head">
              <p className="sec-k">From {ranking!.title}</p>
              <h2 id={`bf-h-${league.id}`} className="sec-h">{league.name} jersey deals</h2>
              <Link className="sec-more" href={`/${league.slug}/`}>All top selling {league.name} jerseys →</Link>
            </div>
            <ol className="shopcards">
              {picks.map(({ rank, product: prod }) => {
                const p = getPlayer(prod.playerId)!;
                const offer = productOffer(prod);
                const team = getTeam(prod.teamId ?? p.teamId ?? p.lastTeamId);
                if (!offer) return null;
                return (
                  <li key={prod.id} className="shopcard" style={{ "--tc": team?.colors.primary ?? league.accent } as React.CSSProperties}>
                    <span className="shopcard-rank">No. {rank} <small>{league.name}</small></span>
                    <span className="shopcard-art"><img {...jerseyImg(prod.image!.url, 280)} alt={prod.image!.alt} width={280} height={280} loading="lazy" decoding="async" /></span>
                    <span className="shopcard-body">
                      <Link className="shopcard-name" href={`/players/${p.slug}/`}>{p.name}</Link>
                      <span className="shopcard-team">{team?.name}</span>
                      <span className="shopcard-tags"><span>{pctOff(prod)}% off</span></span>
                      <PriceTag product={prod} />
                    </span>
                    <ShopButton offer={offer} variant="small" ctx={{ league: league.id, playerId: p.id, rank, placement: "bf_card", page: "black_friday" }}>Shop the deal</ShopButton>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        <section id="bf-faq" className="wrap section" aria-labelledby="bf-faq-h">
          <div className="sec-head"><h2 id="bf-faq-h" className="sec-h">Black Friday jersey questions</h2></div>
          <Faq items={faq} />
          <p style={{ marginTop: 16 }}>Shopping for someone else? See the <Link href="/jersey-gift-guide/">jersey gift guide</Link>, or <Link href="/shop/">shop every league&apos;s top sellers</Link>.</p>
          <div style={{ marginTop: 18 }}><AffiliateNote /></div>
        </section>
        <JsonLd data={ld} />
      </main>
    </>
  );
}
