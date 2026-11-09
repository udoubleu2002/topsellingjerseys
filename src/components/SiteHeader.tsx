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
          <span className="brand-name brand-word"><span className="bw-top">{site.name.replace(/\s*\S+$/, "")}</span><em className="bw-main">{site.name.split(" ").pop()}</em></span>
        </Link>
        <nav className="league-nav" aria-label="Leagues">
          {leagues.map((l) => (
            <Link key={l.id} href={`/${l.slug}/`} aria-current={active === l.id ? "page" : undefined}>
              {l.name}
            </Link>
          ))}
          <span className="nav-sep" aria-hidden="true" />
          <Link href="/cities/" className="nav-cities" aria-current={active === "cities" ? "page" : undefined}>Cities</Link>
          <Link href="/shop/" className="nav-x nav-shop" aria-current={active === "shop" ? "page" : undefined}>Shop</Link>
        </nav>
        <Link className="mast-search-icon" href="/search/" aria-label="Search players, teams, cities and leagues">
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2.2" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>
        </Link>
        <form className="mast-search" action="/search/" role="search">
          <label htmlFor="q-desktop" className="sr-only">Search players, teams, cities and leagues</label>
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
            <form action="/search/" role="search">
              <label htmlFor="q-mobile" className="sr-only">Search players, teams, cities and leagues</label>
              <input id="q-mobile" name="q" type="search" placeholder="Search players, teams or cities" />
              <button type="submit">Search</button>
            </form>
            <div className="mp-leagues">
              {leagues.map((l) => (
                <Link key={l.id} href={`/${l.slug}/`} style={{ "--lg": l.accent } as React.CSSProperties}><b>{l.name}</b><span>Top sellers</span></Link>
              ))}
            </div>
            <Link href="/cities/">Top jerseys by city</Link>
            <Link href="/shop/">Shop jerseys</Link>
            <Link href="/news/">Jersey news</Link>
            {backendEnabled && <a href="#newsletter">Newsletter</a>}
          </nav>
        </details>
      </div>
      <script src="/my-jerseys.js" defer data-keep {...(backendEnabled ? { "data-sb-url": backend.url, "data-sb-key": backend.anonKey } : {})} />
    </header>
    </>
  );
}
