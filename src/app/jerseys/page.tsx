import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { getAnyTeam, getLeague, getLeagues } from "@/lib/data";
import { articlePath, getArticles } from "@/lib/articles";

export const metadata: Metadata = pageMeta({
  title: "Jerseys to Watch: The Next Potential Top Sellers",
  description: "Player jerseys that could climb the next sales rankings: who they are, why fans are buying in, and where to find official jerseys.",
  path: "/jerseys/",
});

export default function JerseysToWatch() {
  const leagues = getLeagues().filter((l) => getArticles(l.id).length > 0);
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="articles">
        <Breadcrumbs items={[{ name: "Home", href: "/" }, { name: "Jerseys to watch", href: "/jerseys/" }]} />
        <header className="wrap page-head">
          <h1>Jerseys to Watch</h1>
          <p className="lede">Players who are not at the top of the latest sales lists yet, or not by much, and why their jerseys could move up. These are informed possibilities, not sales results.</p>
        </header>
        {leagues.map((l) => (
          <section key={l.id} className="wrap section" aria-labelledby={`jw-${l.id}`}>
            <div className="section-head">
              <h2 id={`jw-${l.id}`}>{l.name} jerseys to watch</h2>
              <Link href={`/${l.slug}/`}>Top Selling {getLeague(l.id)!.name} Jerseys →</Link>
            </div>
            <ul className="article-list">
              {getArticles(l.id).map((a) => (
                <li key={a.slug}>
                  <Link href={articlePath(a)}>
                    <strong>{a.player}</strong>
                    <span>{a.teamId ? getAnyTeam(a.teamId)?.name : "Free agent"} · {a.position}</span>
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
