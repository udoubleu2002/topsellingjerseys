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
import { productOffer, storyOffer } from "@/lib/affiliate";
import { ProductImage } from "@/components/ProductImage";
import { PriceTag } from "@/components/PriceTag";
import { abs, site } from "@/lib/config";
import { fmtDate } from "@/lib/format";
import { inline, isHeading, plain, wordCount } from "@/lib/articles";
import { getStories, getStory, storyJersey, storyPath } from "@/lib/stories";

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
  const jersey = storyJersey(s);
  const jerseyOffer = jersey ? productOffer(jersey.product) : null;
  // Shown in the sidebar on wide screens and under the headline on phones, where the sidebar falls below the story.
  const jerseyCard = (placement: string, className: string) =>
    jersey && jerseyOffer && (
      <div className={className}>
        <ProductImage player={jersey.player} product={jersey.product} priority />
        <p className="story-jersey-title">{jersey.product.title}</p>
        <PriceTag product={jersey.product} />
        <ShopButton offer={jerseyOffer} ctx={{ league: league.id, playerId: jersey.player.id, placement, page }}>View this jersey at {jerseyOffer.merchantName}</ShopButton>
      </div>
    );
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
    image: jersey?.product.image ? [jersey.product.image.url, abs("/opengraph-image/")] : abs("/opengraph-image/"),
    author: { "@type": "Organization", name: s.author, url: abs("/") },
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
              <span>By <strong>{s.author}</strong></span>
              {team && <span>{team.name}</span>}
              <span>Published {fmtDate(s.publishedDate)}</span>
              {s.lastVerified !== s.publishedDate && <span>Updated {fmtDate(s.lastVerified)}</span>}
            </p>
            {jerseyCard("story_jersey_top", "story-jersey story-jersey-top")}
          </header>

          <div className="article-cols">
            <div className="prose article-body">
              {s.body.map((p, i) => (isHeading(p) ? <h2 key={i}>{plain(p)}</h2> : <Paragraph key={i} text={p} />))}
            </div>

            <aside className="buybox article-shop" aria-labelledby="shop-h">
              <h2 id="shop-h">Shop {s.subject} jerseys</h2>
              {jerseyCard("story_jersey", "story-jersey story-jersey-side")}
              {offer ? (
                <>
                  <ShopButton offer={offer} ctx={{ league: league.id, playerId: s.playerId ?? s.slug, placement: "story_shop", page }} variant={jersey ? "ghost" : "primary"}>{s.shopLabel}</ShopButton>
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
