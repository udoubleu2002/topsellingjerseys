import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getLeague, getLeagues } from "@/lib/data";
import { fmtDate } from "@/lib/format";
import { getStories, storyPath } from "@/lib/stories";

export const metadata: Metadata = pageMeta({
  title: "Jersey News: Today's Biggest Stories in Every League",
  description: "Daily sports stories from the NFL, NBA, WNBA, MLB, NHL and MLS: the players and moments fans are talking about, with links to their best-selling jerseys.",
  path: "/news/",
});

export default function NewsIndex() {
  const leagues = getLeagues().filter((l) => getStories(l.id).length > 0);
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="news">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "News", href: "/news/" }]} />
        <header className="wrap page-head">
          <h1>Jersey News</h1>
          <p className="lede">The biggest stories in every league we cover, written daily. Sales claims come only from published lists, with their dates.</p>
        </header>
        {leagues.map((l) => (
          <section key={l.id} className="wrap section" aria-labelledby={`nw-${l.id}`}>
            <div className="section-head">
              <h2 id={`nw-${l.id}`}>{l.name} news</h2>
              <Link href={`/${l.slug}/`}>Top Selling {getLeague(l.id)!.name} Jerseys →</Link>
            </div>
            <ul className="article-list">
              {getStories(l.id).slice(0, 12).map((s) => (
                <li key={s.slug}>
                  <Link href={storyPath(s)}>
                    <h3>{s.headline}</h3>
                    <span>{s.subject} · {fmtDate(s.publishedDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
