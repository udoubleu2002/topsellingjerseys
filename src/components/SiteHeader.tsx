import Link from "next/link";
import { site, backend, backendEnabled } from "@/lib/config";
import { getLeagues } from "@/lib/data";
import { JerseyIcon } from "./Brand";
import { DealTicker } from "./DealTicker";

export function SiteHeader({ active }: { active?: string }) {
  const leagues = getLeagues();
  return (
    <>
    <DealTicker />
    <header className="masthead">
      <div className="wrap mast-in">
        <Link href="/" className="brand" aria-label={`${site.name} home`}>
          <span className="brand-name">{site.name.replace(/\s*\S+$/, "")} <em>{site.name.split(" ").pop()}</em></span>
        </Link>
        <nav className="league-nav" aria-label="Leagues">
          {leagues.map((l) => (
            <Link key={l.id} href={`/${l.slug}/`} aria-current={active === l.id ? "page" : undefined}>
              {l.name}
            </Link>
          ))}
        </nav>
        <form className="mast-search" action="/search/" role="search">
          <label htmlFor="q-desktop" className="sr-only">Search players and teams</label>
          <input id="q-desktop" name="q" type="search" placeholder="Search players or teams" autoComplete="off" />
          <button type="submit">Search</button>
        </form>
        <a className="mj-link" href="/my-jerseys/" aria-label="My Jerseys: build and share your jersey collection">
          <JerseyIcon />
          <span className="mj-link-text">My Jerseys</span>
          <span className="mj-badge" data-mj-count hidden suppressHydrationWarning>0</span>
        </a>
        <details className="mobile-menu">
          <summary>Menu</summary>
          <nav className="mobile-panel" aria-label="Mobile">
            {leagues.map((l) => (
              <Link key={l.id} href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link>
            ))}
            <Link href="/news/">Jersey news</Link>
            <form action="/search/" role="search">
              <label htmlFor="q-mobile" className="sr-only">Search players and teams</label>
              <input id="q-mobile" name="q" type="search" placeholder="Search players or teams" />
              <button type="submit">Search</button>
            </form>
            {backendEnabled && <a href="#newsletter">Newsletter</a>}
          </nav>
        </details>
      </div>
      <script src="/my-jerseys.js" defer data-keep {...(backendEnabled ? { "data-sb-url": backend.url, "data-sb-key": backend.anonKey } : {})} />
    </header>
    </>
  );
}
