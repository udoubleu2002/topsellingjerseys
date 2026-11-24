import Link from "next/link";
import { backendEnabled } from "@/lib/config";
import { newsletterEnabled } from "@/lib/newsletter/provider";
import { getCurrentRanking, getLeagues, getPlayer } from "@/lib/data";
import { BLACK_FRIDAY_PATH, BLACK_FRIDAY_STRIP_ENDS } from "@/lib/blackFriday";

const Chevron = () => (
  <svg className="mm-chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);

/**
 * Phone navigation, laid out like the big sports retail and media apps: search first, then grouped lists
 * (leagues that expand to their top players, shop, explore), with full-width rows and clear section labels.
 */
export function MobileMenu() {
  const leagues = getLeagues();
  const blackFriday = Date.now() <= Date.parse(BLACK_FRIDAY_STRIP_ENDS);
  return (
    <details className="mobile-menu">
      <summary aria-label="Menu">
        <span className="mm-burger" aria-hidden="true"><i /><i /><i /></span>
        <span className="mm-summary-text">Menu</span>
      </summary>
      <nav className="mobile-panel" aria-label="Mobile">
        <form className="mm-search" action="/search/" role="search">
          <label htmlFor="q-mobile" className="sr-only">Search players, teams, cities and leagues</label>
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m13 13 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          <input id="q-mobile" name="q" type="search" placeholder="Search players, teams or cities" autoComplete="off" />
        </form>

        {blackFriday && (
          <Link className="mm-promo" href={BLACK_FRIDAY_PATH}>
            <span className="mm-promo-tag">Black Friday</span>
            <span className="mm-promo-text">Top sellers on sale now</span>
            <Chevron />
          </Link>
        )}

        <p className="mm-label">Leagues</p>
        <ul className="mm-list">
          {leagues.map((l) => {
            const ranking = getCurrentRanking(l.id);
            const top = (ranking?.entries ?? []).slice(0, 5).map((e) => ({ rank: e.rank, p: getPlayer(e.playerId) })).filter((x) => x.p);
            return (
              <li key={l.id}>
                <details className="mm-league" style={{ "--lg": l.accent } as React.CSSProperties}>
                  <summary><span className="mm-dot" aria-hidden="true" />{l.name}<span className="mm-sub">Top sellers</span><Chevron /></summary>
                  <ul className="mm-sublist">
                    <li><Link href={`/${l.slug}/`}>All top selling {l.name} jerseys</Link></li>
                    {top.map(({ rank, p }) => (
                      <li key={p!.id}><Link href={`/players/${p!.slug}/`}><span className="mm-rank">{rank}</span>{p!.name}</Link></li>
                    ))}
                    {ranking && <li><Link href={`/rankings/${ranking.league}/${ranking.id}/`}>Latest {l.name} sales report</Link></li>}
                  </ul>
                </details>
              </li>
            );
          })}
        </ul>

        <p className="mm-label">Shop</p>
        <ul className="mm-list">
          <li><Link href="/shop/">Shop all jerseys<Chevron /></Link></li>
          <li><Link href="/best-selling-jerseys/">Best selling jerseys<Chevron /></Link></li>
          <li><Link href={BLACK_FRIDAY_PATH}>Black Friday deals{blackFriday && <span className="mm-pill">Sale</span>}<Chevron /></Link></li>
          <li><Link href="/jersey-gift-guide/">Jersey gift guide<Chevron /></Link></li>
        </ul>

        <p className="mm-label">Explore</p>
        <ul className="mm-list">
          <li><Link href="/trending/">Trending this week<Chevron /></Link></li>
          <li><Link href="/cities/">Top jerseys by city<Chevron /></Link></li>
          <li><Link href="/news/">Jersey news<Chevron /></Link></li>
          <li><Link href="/rankings/">Sales report archive<Chevron /></Link></li>
        </ul>

        <div className="mm-foot">
          <a className="mm-mj" href="/my-jerseys/">My Jerseys</a>
          <Link href="/about/">About</Link>
          {(backendEnabled || newsletterEnabled()) && <a href="#newsletter">Newsletter</a>}
        </div>
      </nav>
    </details>
  );
}
