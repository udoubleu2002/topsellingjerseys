import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { getLeagues } from "@/lib/data";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" data-page-type="not_found">
        <header className="wrap page-head" style={{ paddingTop: 40 }}>
          <h1>Page not found</h1>
          <p className="lede">That page does not exist or has moved. Try a league ranking or search for a player.</p>
          <nav className="related" aria-label="Leagues">
            {getLeagues().map((l) => <Link key={l.id} href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link>)}
            <Link href="/search/">Search</Link>
          </nav>
        </header>
      </main>
    </>
  );
}
