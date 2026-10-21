import Link from "next/link";
import { site } from "@/lib/config";
import { getLeagues } from "@/lib/data";

export function SiteFooter() {
  return (
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
            <li><Link href="/rankings/">All reports and archive</Link></li>
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
      <div className="wrap foot-legal">
        <p>
          {site.name} is independent and is not affiliated with or endorsed by any league, team, players association or player.
          Team and player names are used to identify them and belong to their owners. Some shopping links earn us a commission.
        </p>
        <p>&copy; 2026 {site.name}</p>
      </div>
    </footer>
  );
}
