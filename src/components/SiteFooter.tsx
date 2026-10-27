import Link from "next/link";
import { site, backendEnabled } from "@/lib/config";
import { getLeagues } from "@/lib/data";
import { LidsAd } from "./LidsAd";
import { rectFor } from "@/lib/lidsAds";

export function SiteFooter() {
  return (
    <>
    <div className="wrap foot-ad"><LidsAd banner={rectFor(undefined, true)} at="footer" /></div>
    <footer className="footer">
      <div className="wrap foot-in">
        <div>
          <h2>{site.name}</h2>
          <p style={{ maxWidth: "46ch" }}>
            Published jersey sales rankings for the NFL, NBA, WNBA, MLB, NHL and MLS, with player stats and links to shop. Every ranking
            comes from an identified report, and each page shows its source and dates.
          </p>
        </div>
        <div>
          <h2>Rankings</h2>
          <ul>
            {getLeagues().map((l) => (
              <li key={l.id}><Link href={`/${l.slug}/`}>Top Selling {l.name} Jerseys</Link></li>
            ))}
            <li><Link href="/best-selling-jerseys/">Best selling jerseys</Link></li>
            <li><Link href="/best-selling-jersey/">Best selling jersey in every league</Link></li>
            <li><Link href="/best-selling-sports-jerseys/">Best selling sports jerseys: sources</Link></li>
            <li><Link href="/rankings/">All reports and archive</Link></li>
            <li><Link href="/players/">All player pages</Link></li>
          </ul>
        </div>
        <div>
          <h2>About</h2>
          <ul>
            <li><Link href="/about/">About</Link></li>
            <li><Link href="/methodology/">Ranking methodology</Link></li>
            <li><Link href="/sources/">Sources and data coverage</Link></li>
            <li><Link href="/affiliate-disclosure/">Affiliate disclosure</Link></li>
            <li><Link href="/contact/">Contact</Link></li>
            <li><Link href="/privacy/">Privacy policy</Link></li>
            <li><Link href="/terms/">Terms of use</Link></li>
          </ul>
        </div>
      </div>
      {backendEnabled && (
        <div className="wrap foot-news" id="newsletter">
          <form className="nl-form" data-newsletter="" noValidate>
            <label htmlFor="nl-email"><strong>Get the {site.name} newsletter.</strong> New sales lists and jersey news by email. Unsubscribe anytime.</label>
            <div className="nl-row">
              <input id="nl-email" name="email" type="email" required placeholder="you@example.com" autoComplete="email" maxLength={254} />
              <button type="submit">Sign up</button>
            </div>
            <p className="nl-status" aria-live="polite" />
          </form>
        </div>
      )}
      <div className="wrap foot-legal">
        <p>
          {site.name} is independent and is not affiliated with or endorsed by any league, team, players association or player.
          Team and player names are used to identify them and belong to their owners. Some shopping links earn us a commission.
        </p>
        <p>&copy; 2026 {site.name}</p>
      </div>
    </footer>
    </>
  );
}
