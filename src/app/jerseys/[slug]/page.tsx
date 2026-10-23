import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShopButton } from "@/components/ShopButton";
import { TrustNote } from "@/components/TrustNote";
import { JsonLd } from "@/components/JsonLd";
import { getAnyTeam, getCurrentRanking, getLeague, getPlayer } from "@/lib/data";
import { articleOffer } from "@/lib/affiliate";
import { abs, site } from "@/lib/config";
import { fmtDate } from "@/lib/format";
import { articlePath, getArticle, getArticles, inline, isHeading, plain } from "@/lib/articles";

export const dynamicParams = false;
export function generateStaticParams() {
  return getArticles().map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getArticle((await params).slug);
  if (!a) return {};
  return pageMeta({ title: a.title, description: a.description, path: articlePath(a), type: "article" });
}

function Paragraph({ text }: { text: string }) {
  return (
    <p>
      {inline(text).map((part, i) => (part.href ? <Link key={i} href={part.href}>{part.text}</Link> : <span key={i}>{part.text}</span>))}
    </p>
  );
}

export default async function ArticlePage({ params }: Props) {
  const a = getArticle((await params).slug);
  if (!a) notFound();
  const league = getLeague(a.league)!;
  const team = a.teamId ? getAnyTeam(a.teamId) : undefined;
  const offer = articleOffer(a);
  const page = `article_${a.slug}`;
  const more = getArticles(a.league).filter((x) => x.slug !== a.slug);
  // Rotate the related list so every article links to a different handful.
  const start = more.length ? (getArticles(a.league).findIndex((x) => x.slug === a.slug) % more.length) : 0;
  const related = [...more.slice(start), ...more.slice(0, start)].slice(0, 4);
  const ranking = getCurrentRanking(a.league);
  const url = abs(articlePath(a));
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: a.headline,
    description: a.description,
    url,
    mainEntityOfPage: url,
    datePublished: a.publishedDate,
    dateModified: a.lastVerified,
    inLanguage: "en-US",
    image: abs("/opengraph-image/"),
    author: { "@type": "Organization", name: site.name, url: abs("/") },
    publisher: { "@type": "Organization", name: site.name, url: abs("/") },
    about: { "@type": "Person", name: a.player, ...(team ? { memberOf: { "@type": "SportsTeam", name: team.name } } : {}) },
    keywords: [a.primaryKeyword, ...a.secondaryKeywords].join(", "),
    wordCount: a.body.filter((p) => !isHeading(p)).map(plain).join(" ").split(/\s+/).length,
  };

  return (
    <>
      <SiteHeader active={league.id} />
      <main id="main" data-page-type="article" data-league={league.id}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: `Top Selling ${league.name} Jerseys`, href: `/${league.slug}/` }, { name: "Jerseys to watch", href: "/jerseys/" }, { name: a.player, href: articlePath(a) }]} />
        <article className="wrap article">
          <header className="article-head">
            <p className="eyebrow">{league.name} · Jersey to watch</p>
            <h1>{a.headline}</h1>
            <p className="p-meta">
              {team && <span><strong>{team.name}</strong></span>}
              <span>{a.position}</span>
              {a.number && <span>No. {a.number}</span>}
              <span>Updated {fmtDate(a.lastVerified)}</span>
            </p>
          </header>

          <div className="article-cols">
            <div className="prose article-body">
              {a.body.map((p, i) => (isHeading(p) ? <h2 key={i}>{plain(p)}</h2> : <Paragraph key={i} text={p} />))}
              {a.salesRank && (
                <p className="article-rank">
                  Sales check: No. {a.salesRank.rank} on the <a href={a.salesRank.source} target="_blank" rel="noopener">{a.salesRank.list}</a>.
                </p>
              )}
            </div>

            <aside className="buybox article-shop" aria-labelledby="shop-h">
              <h2 id="shop-h">Shop {a.player} jerseys</h2>
              {offer ? (
                <>
                  <ShopButton offer={offer} ctx={{ league: league.id, playerId: a.slug, placement: "article_shop", page }}>{a.shopLabel}</ShopButton>
                  <TrustNote merchant={offer.merchantName} />
                  <p className="shop-note">Opens {offer.merchantName} search results for {a.player} jerseys, with every style, size and price they carry.</p>
                </>
              ) : (
                <p className="shop-note">No retailer link is available yet.</p>
              )}
              <p className="disclosure">
                This page contains affiliate links. We may earn a commission if you make a purchase through our links, at no additional cost to you.{" "}
                <Link href="/affiliate-disclosure/">Affiliate disclosure</Link>.
              </p>
            </aside>
          </div>

          {ranking && (
            <section className="article-chart" aria-labelledby="chart-h">
              <div className="section-head">
                <h2 id="chart-h"><Link href={`/${league.slug}/`}>Top Selling {league.name} Jerseys</Link></h2>
                <Link href={`/${league.slug}/`}>Full list →</Link>
              </div>
              <p className="shop-note">Top 10 of the {ranking.title}, {ranking.periodLabel.replace(/ \(top \d+ shown\)$/, "")}. Tap a player for their jersey page.</p>
              <ol className="chart-list">
                {ranking.entries.slice(0, 10).map((e) => {
                  const p = getPlayer(e.playerId);
                  if (!p) return null;
                  const t = getAnyTeam(e.teamIdAtReport ?? p.teamId ?? "");
                  return (
                    <li key={e.playerId}>
                      <Link href={`/players/${p.slug}/`}>
                        <span className="chart-rank">{e.rank}</span>
                        <span className="chart-name">{p.name}</span>
                        <span className="chart-team">{t?.name ?? ""}</span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
              <p><Link className="btn-ghost btn-sm chart-all" href={`/${league.slug}/`}>See all {ranking.entries.length} top selling {league.name} jerseys</Link></p>
            </section>
          )}

          <footer className="article-foot">
            <h2>Sources</h2>
            <ul className="article-sources">
              {a.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.label}</a></li>)}
            </ul>
            {related.length > 0 && (
              <>
                <h2>More {league.name} jerseys to watch</h2>
                <ul className="article-related">
                  {related.map((r) => <li key={r.slug}><Link href={articlePath(r)}>{r.headline}</Link></li>)}
                </ul>
              </>
            )}
          </footer>
        </article>
        <JsonLd data={ld} />
      </main>
    </>
  );
}
