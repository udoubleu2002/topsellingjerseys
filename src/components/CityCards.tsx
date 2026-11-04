import Link from "next/link";
import type { City } from "@/lib/cities";
import { cityArt, cityFeatured, cityIntro, cityPath, cityRanked, cityTeams, teamNickname } from "@/lib/cities";
import { jerseyImg } from "@/lib/img";

/** The city's poster illustration (a local SVG with fixed dimensions). */
export function CityArt({ city, eager, className }: { city: City; eager?: boolean; className?: string }) {
  const art = cityArt(city);
  return (
    <img
      className={className}
      src={art.src}
      alt={art.alt}
      width={1600}
      height={1000}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      {...(eager ? { fetchPriority: "high" as const } : {})}
    />
  );
}

const place = (c: City) => `${c.region}${c.country === "CA" ? ", Canada" : ""}`;

/** Team nicknames for a card, cut to `max` with "+N more". */
function teamLine(c: City, max: number): string {
  const names = cityTeams(c).map(teamNickname);
  return names.length > max ? `${names.slice(0, max).join(" · ")} +${names.length - max}` : names.join(" · ");
}

/** The city's top jersey, from the latest published sales lists only. */
function topLine(c: City): { label: string; name: string; detail?: string } | null {
  const r = cityRanked(c)[0];
  if (r) return { label: "Top jersey", name: r.player.name, detail: `No. ${r.rank} ${r.ranking.league.toUpperCase()}` };
  const f = cityFeatured(c);
  return f ? { label: "Featured jersey", name: f.player.name } : null;
}

/** One illustrated directory card. The whole card is a link to the city page. */
export function CityCard({ city, eager, size = "md" }: { city: City; eager?: boolean; size?: "md" | "sm" }) {
  const teams = cityTeams(city);
  const top = topLine(city);
  return (
    <Link href={cityPath(city)} className={`ccard ccard-${size}`}>
      <span className="ccard-art"><CityArt city={city} eager={eager} /></span>
      <span className="ccard-shade" aria-hidden="true" />
      <span className="ccard-go">Explore city <span aria-hidden="true">→</span></span>
      <span className="ccard-body">
        <span className="ccard-place">{place(city)} · {teams.length} {teams.length === 1 ? "team" : "teams"}</span>
        <span className="ccard-name">{city.name}</span>
        <span className="ccard-teams">{teamLine(city, size === "sm" ? 3 : 4)}</span>
        {size === "md" && city.blurb && <span className="ccard-blurb">{city.blurb}</span>}
        {top && <span className="ccard-top">{top.label}: <strong>{top.name}</strong>{top.detail && <em>{top.detail}</em>}</span>}
      </span>
    </Link>
  );
}

/**
 * The hand-picked lead city (data/cities.json "featured"): a large illustration beside its intro, top jersey and teams.
 * The intro is built from the site's data (teams, leagues, ranked players), never from invented figures.
 */
export function FeaturedCity({ city }: { city: City }) {
  const teams = cityTeams(city);
  const ranked = cityRanked(city);
  const lead = cityFeatured(city);
  const top = ranked[0];
  const intro = cityIntro(city);
  const leadTeam = lead ? teams.find((t) => t.id === lead.player.teamId) : undefined;
  const leadRank = lead && ranked.find((r) => r.player.id === lead.player.id);
  return (
    <article className="cfeat">
      <Link href={cityPath(city)} className="cfeat-art" tabIndex={-1} aria-hidden="true">
        <CityArt city={city} eager />
      </Link>
      <div className="cfeat-body">
        <p className="cfeat-kicker">Featured city · {place(city)}</p>
        <h2 className="cfeat-name"><Link href={cityPath(city)}>{city.name}</Link></h2>
        <p className="cfeat-intro">{intro}</p>
        {lead && (
          <Link href={`/players/${lead.player.slug}/`} className="cfeat-player">
            {lead.product.image && <img {...jerseyImg(lead.product.image.url, 96)} alt={lead.product.image.alt || `${lead.player.name} jersey`} width={96} height={96} loading="eager" decoding="async" />}
            <span>
              <small>{leadRank ? (leadRank === top ? `No. 1 jersey in ${city.name}` : `${city.name} jersey`) : "Featured Lids jersey"}</small>
              <strong>{lead.player.name}</strong>
              <em>{leadTeam?.name ?? ""}{leadRank ? ` · No. ${leadRank.rank} on the ${leadRank.ranking.league.toUpperCase()} list` : ""}</em>
            </span>
          </Link>
        )}
        <ul className="cfeat-teams" aria-label={`${city.name} teams`}>
          {teams.map((t) => <li key={t.id}><span>{t.league.toUpperCase()}</span>{t.name}</li>)}
        </ul>
        <Link href={cityPath(city)} className="cfeat-go">Explore {city.name} <span aria-hidden="true">→</span></Link>
      </div>
    </article>
  );
}
