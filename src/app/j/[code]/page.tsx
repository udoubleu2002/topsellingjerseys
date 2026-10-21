import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { JerseyIcon } from "@/components/Brand";
import { getLeague } from "@/lib/data";
import { decodeCollection, countHeadline, grouped, COLLECTION_LEAGUES } from "@/lib/collection";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const c = decodeCollection(code);
  if (!c) return { title: "Jersey list not found", robots: { index: false } };
  const lines = COLLECTION_LEAGUES.filter((l) => c.jerseys[l].length).map((l) => `${getLeague(l)?.name ?? l.toUpperCase()}: ${grouped(c.jerseys[l]).join(", ")}`);
  const meta = pageMeta({ title: countHeadline(c), description: lines.join(" · "), path: `/j/${code}/`, noindex: true });
  // The shared card is generated per collection by ./opengraph-image.tsx, in place of the site-wide default image.
  const image = { url: `/j/${code}/opengraph-image/`, width: 1200, height: 630, alt: countHeadline(c) };
  // Link previews get every jersey, not the search-length snippet.
  const full = lines.join(" · ").slice(0, 1000);
  return { ...meta, openGraph: { ...meta.openGraph, description: full, images: [image] }, twitter: { ...meta.twitter, description: full, images: [image.url] } };
}

export default async function SharedJerseys({ params }: Props) {
  const { code } = await params;
  const c = decodeCollection(code);
  if (!c) notFound();
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="shared_jerseys">
        <section className="mj-hero">
          <div className="wrap">
            <p className="kicker">Jersey collection</p>
            <h1>{countHeadline(c).replace(/: \d+$/, ":")} <em>{c.count}</em></h1>
          </div>
        </section>
        <div className="wrap mj-shared">
          <div className="mj-card">
            <div className="mj-groups">
              {COLLECTION_LEAGUES.filter((l) => c.jerseys[l].length).map((l) => {
                const lg = getLeague(l);
                return (
                  <section key={l} className="mj-group" style={{ "--lg": lg?.accent } as React.CSSProperties}>
                    <h2>{lg?.name ?? l.toUpperCase()} <span>{c.jerseys[l].length}</span></h2>
                    <ul>{grouped(c.jerseys[l]).map((n) => <li key={n}><JerseyIcon className="mj-li-icon" />{n}</li>)}</ul>
                  </section>
                );
              })}
            </div>
          </div>
          <div className="mj-cta">
            <p>What&apos;s your jersey count?</p>
            <Link className="btn-shop" href="/my-jerseys/"><span className="cta-text">Count my jerseys</span></Link>
            <Link className="mj-sec" href="/">See the top selling jerseys</Link>
          </div>
        </div>
      </main>
    </>
  );
}
