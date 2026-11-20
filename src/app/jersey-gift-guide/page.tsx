import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AffiliateNote } from "@/components/RankingHeader";
import { ShopCard } from "@/components/ShopBits";
import { ShopButton } from "@/components/ShopButton";
import { PriceTag } from "@/components/PriceTag";
import { Faq } from "@/components/Faq";
import { DealsBar } from "@/components/Deals";
import { JsonLd } from "@/components/JsonLd";
import { getLeagues, getCurrentRanking, getPlayer, getProducts, getTeam } from "@/lib/data";
import { productOffer } from "@/lib/affiliate";
import { productStyle } from "@/lib/productStyle";
import { jerseyImg } from "@/lib/img";
import { fmtShortDate } from "@/lib/format";
import { abs, site } from "@/lib/config";
import type { League, Product } from "@/lib/schema";

const PATH = "/jersey-gift-guide/";

export const metadata: Metadata = pageMeta({
  title: "Jersey Gift Guide 2026: Best Jerseys for Every Fan",
  description: "The best jersey gifts for football, basketball, baseball, hockey and soccer fans, picked from each league's latest sales list, plus youth jerseys and a sizing guide.",
  path: PATH,
});

/** How each league's fan is named in the section headings: "For the football fan". */
const FAN: Record<string, string> = { nfl: "football fan", nba: "basketball fan", wnba: "WNBA fan", mlb: "baseball fan", nhl: "hockey fan", mls: "soccer fan" };

/** Youth jerseys of players near the top of the latest lists: one per player, at most `n`, best rank first. */
function youthPicks(n = 8) {
  const out: { league: League; rank: number; product: Product }[] = [];
  const rows = getLeagues()
    .flatMap((league) => (getCurrentRanking(league.id)?.entries.slice(0, 10) ?? []).map((e) => ({ league, e })))
    .sort((a, b) => a.e.rank - b.e.rank);
  for (const { league, e } of rows) {
    // At most two per league, so every sport gets a kids' pick.
    if (out.length >= n || out.filter((x) => x.league.id === league.id).length >= 2) continue;
    const p = getPlayer(e.playerId);
    const youth = p && getProducts(p.id).find((x) => x.productType === "jersey" && x.image && productStyle(x).fit === "Youth" && (!p.teamId || x.teamId === p.teamId));
    if (youth) out.push({ league, rank: e.rank, product: youth });
  }
  return out;
}

export default function GiftGuidePage() {
  const leagues = getLeagues().map((league) => ({ league, ranking: getCurrentRanking(league.id) })).filter((x) => x.ranking);
  const youth = youthPicks();
  const crumbs = [{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }, { name: "Jersey gift guide", href: PATH }];
  const nfl = leagues.find((x) => x.league.id === "nfl");
  const nflTop = nfl ? getPlayer(nfl.ranking!.entries[0].playerId) : undefined;
  const faq = [
    ...(nfl && nflTop ? [{ q: "What is the best jersey gift for a football fan?", a: `If they have a favorite team, get that team's star. If not, a safe pick is the NFL's top seller: ${nflTop.name} was No. 1 on ${nfl.ranking!.title}. The football section above shows the top five with photos and links.` }] : []),
    { q: "What's the difference between a replica and an authentic jersey?", a: "Replica (or fan) jerseys are cut for everyday wear, lighter and lower priced, usually with printed or heat-pressed lettering. Authentic jerseys match what the players wear on the field, with a tighter athletic cut, stitched numbers and a higher price. Brands use their own names for each level: Nike's NFL jerseys come as Game, Limited and Elite, NBA jerseys as Swingman and Authentic." },
    { q: "What size jersey should I buy as a gift?", a: "Most fans wear their usual T-shirt size in a replica jersey. Authentic jerseys run slimmer, so go up a size if they like a looser fit. Youth jerseys use youth sizes (S, M, L, XL) rather than ages, so check the retailer's size chart." },
    { q: "Should I get a current player or a team jersey?", a: "A current star is the most popular choice, but a player can be traded. A legend's throwback, or a jersey with no name, never goes out of date. Our player pages show each player's current team and number so you don't buy the wrong one." },
    { q: "Do you earn money from these links?", a: `Some links are affiliate links, so ${site.name} may earn a commission when you buy, at no extra cost to you. Picks come from the published sales lists, not from commissions.` },
  ];
  const ld = { "@context": "https://schema.org", "@type": "CollectionPage", name: "Jersey gift guide", url: abs(PATH) };
  return (
    <>
      <SiteHeader active="shop" />
      <main id="main" data-page-type="gift_guide">
        <Breadcrumbs items={crumbs} />
        <header className="gd-band">
          <div className="wrap">
            <p className="gd-kicker">Holiday gift guide</p>
            <h1 className="gd-band-h">Jersey gift guide: the best jerseys for every fan</h1>
            <p className="gd-band-dek">Not sure which jersey to get? Start with the players fans are buying most. Every pick below comes from its league&apos;s latest published sales list, with the retailer&apos;s photo and a link to every size and style.</p>
            <nav className="gd-chips" aria-label="Jump to a fan">
              {leagues.map(({ league }) => <a key={league.id} href={`#gift-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>{league.name}</a>)}
              {youth.length > 0 && <a href="#gift-youth">Kids &amp; youth</a>}
              <a href="#gift-tips">Sizing &amp; styles</a>
            </nav>
          </div>
        </header>
        <DealsBar page="gift_guide" />
        <div className="wrap" style={{ marginTop: 18 }}><AffiliateNote /></div>

        {leagues.map(({ league, ranking }) => (
          <section key={league.id} id={`gift-${league.id}`} className="wrap section shop-sec" aria-labelledby={`gg-${league.id}`} style={{ "--lg": league.accent } as React.CSSProperties}>
            <div className="sec-head">
              <p className="sec-k">From {ranking!.title} · published {fmtShortDate(ranking!.publishedDate)}</p>
              <h2 id={`gg-${league.id}`} className="sec-h">Best jersey gifts for the {FAN[league.id] ?? `${league.name} fan`}</h2>
              <Link className="sec-more" href={`/${league.slug}/`}>All top selling {league.name} jerseys →</Link>
            </div>
            <ol className="shopcards">
              {ranking!.entries.slice(0, 5).map((e) => <ShopCard key={e.playerId} league={league} ranking={ranking!} rank={e.rank} page="gift_guide" placement="gift_card" />)}
            </ol>
          </section>
        ))}

        {youth.length > 0 && (
          <section id="gift-youth" className="wrap section shop-sec" aria-labelledby="gg-youth">
            <div className="sec-head">
              <p className="sec-k">For kids</p>
              <h2 id="gg-youth" className="sec-h">Youth jerseys of the top sellers</h2>
            </div>
            <ol className="shopcards">
              {youth.map(({ league, rank, product: prod }) => {
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
                      <span className="shopcard-tags"><span>Youth</span></span>
                      <PriceTag product={prod} />
                    </span>
                    <ShopButton offer={offer} variant="small" ctx={{ league: league.id, playerId: p.id, rank, placement: "gift_youth", page: "gift_guide" }}>Shop this jersey</ShopButton>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section id="gift-tips" className="wrap section" aria-labelledby="gg-faq">
          <div className="sec-head"><h2 id="gg-faq" className="sec-h">Jersey gift questions: sizing, styles and picks</h2></div>
          <Faq items={faq} />
          <p style={{ marginTop: 16 }}>Want a deal? See <Link href="/black-friday-jersey-deals/">Black Friday jersey deals</Link>. Want more options? <Link href="/shop/">Shop every league&apos;s top sellers</Link>, browse <Link href="/cities/">jerseys by city</Link> for a hometown gift, or see <Link href="/trending/">who&apos;s trending</Link>.</p>
          <div style={{ marginTop: 18 }}><AffiliateNote /></div>
        </section>
        <JsonLd data={ld} />
      </main>
    </>
  );
}
