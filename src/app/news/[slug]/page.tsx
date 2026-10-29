import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ShopButton } from "@/components/ShopButton";
import { TrustNote } from "@/components/TrustNote";
import { JsonLd } from "@/components/JsonLd";
import { getAnyTeam, getLeague } from "@/lib/data";
import { storyOffer } from "@/lib/affiliate";
import { abs, site } from "@/lib/config";
import { fmtDate } from "@/lib/format";
import { inline, isHeading, plain, wordCount } from "@/lib/articles";
import { getStories, getStory, storyPath } from "@/lib/stories";

export const dynamicParams = false;
export function generateStaticParams() {
  return getStories().map((s) => ({ slug: s.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = getStory((await params).slug);
  if (!s) return {};
  return pageMeta({ title: s.title, description: s.description, path: storyPath(s), type: "article" });
}

function Paragraph({ text }: { text: string }) {
  return (
    <p>
      {inline(text).map((part, i) => (part.href ? <Link key={i} href={part.href}>{part.text}</Link> : <span key={i}>{part.text}</span>))}
    </p>
  );
}

export default async function StoryPage({ params }: Props) {
  const s = getStory((await params).slug);
  if (!s) notFound();
  const league = getLeague(s.league)!;
  const team = s.teamId ? getAnyTeam(s.teamId) : undefined;
  const offer = storyOffer(s);
  const page = `story_${s.slug}`;
  const more = getStories(s.league).filter((x) => x.slug !== s.slug).slice(0, 4);
  const url = abs(storyPath(s));
  const ld = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "@id": `${url}#article`,
    headline: s.headline,
    description: s.description,
    url,
    mainEntityOfPage: url,
    datePublished: s.publishedDate,
    dateModified: s.lastVerified,
    inLanguage: "en-US",
    image: abs("/opengraph-image/"),
    author: { "@type": "Organization", name: site.name, url: abs("/") },
    publisher: { "@type": "Organization", name: site.name, url: abs("/") },
    keywords: [s.primaryKeyword, ...s.secondaryKeywords].join(", "),
    wordCount: wordCount(s),
  };

  return (
    <>
      <SiteHeader active={league.id} />
      <main id="main" data-page-type="story" data-league={league.id}>
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "News", href: "/news/" }, { name: `${league.name} news`, href: `/news/#nw-${league.id}` }, { name: s.subject, href: storyPath(s) }]} />
        <article className="wrap article">
          <header className="article-head">
            <p className="eyebrow">{league.name} · News</p>
            <h1>{s.headline}</h1>
            <p className="lede story-sub">{s.subheadline}</p>
            <p className="p-meta">
              {team && <span><strong>{team.name}</strong></span>}
              <span>Published {fmtDate(s.publishedDate)}</span>
              {s.lastVerified !== s.publishedDate && <span>Updated {fmtDate(s.lastVerified)}</span>}
            </p>
          </header>

          <div className="article-cols">
            <div className="prose article-body">
              {s.body.map((p, i) => (isHeading(p) ? <h2 key={i}>{plain(p)}</h2> : <Paragraph key={i} text={p} />))}
            </div>

            <aside className="buybox article-shop" aria-labelledby="shop-h">
              <h2 id="shop-h">Shop {s.subject} jerseys</h2>
              {offer ? (
                <>
                  <ShopButton offer={offer} ctx={{ league: league.id, playerId: s.playerId ?? s.slug, placement: "story_shop", page }}>{s.shopLabel}</ShopButton>
                  <TrustNote merchant={offer.merchantName} />
                  <p className="shop-note">Opens {offer.merchantName} search results for {s.subject} jerseys, with every style, size and price they carry.</p>
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

          <footer className="article-foot">
            <h2>Keep reading</h2>
            <ul className="article-related">
              {s.related.map((r) => <li key={r.href}><Link href={r.href}>{r.label}</Link></li>)}
            </ul>
            <h2>Sources</h2>
            <ul className="article-sources">
              {s.sources.map((x) => <li key={x.url}><a href={x.url} target="_blank" rel="noopener">{x.label}</a>{x.date ? `, ${fmtDate(x.date)}` : ""}</li>)}
            </ul>
            {more.length > 0 && (
              <>
                <h2>More {league.name} news</h2>
                <ul className="article-related">
                  {more.map((r) => <li key={r.slug}><Link href={storyPath(r)}>{r.headline}</Link></li>)}
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
