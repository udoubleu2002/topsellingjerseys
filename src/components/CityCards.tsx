import Link from "next/link";
import type { City } from "@/lib/cities";
import { cityArt, cityFeatured, cityIntro, cityJerseys, cityPath, cityRanked, cityTeams, teamNickname } from "@/lib/cities";
import { getAnyTeam } from "@/lib/data";
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

/** A row of jersey photos for a card. Ranked players show their league rank; the rest are Lids catalog jerseys. */
function JerseyRow({ city, n, eager, w }: { city: City; n: number; eager?: boolean; w: number }) {
  const items = cityJerseys(city, n);
  return (
    <span className={`cj-row cj-${n}`}>
      {items.map((j) => (
        <span key={j.player.id} className="cj">
          <span className="cj-img"><img {...jerseyImg(j.product.image!.url, w)} alt={`${j.player.name} jersey`} width={w} height={w} loading={eager ? "eager" : "lazy"} decoding="async" /></span>
          <span className="cj-name">{j.player.name}</span>
          <span className="cj-rank">{j.rank ? `No. ${j.rank} ${j.league!.toUpperCase()}` : teamNickname({ name: getAnyTeam(j.teamId)?.name ?? "", league: getAnyTeam(j.teamId)?.league ?? "" })}</span>
        </span>
      ))}
    </span>
  );
}

/** One directory card: the city, its leagues and teams, and a row of its top jerseys. The whole card links to the city page. */
export function CityCard({ city, eager, size = "md" }: { city: City; eager?: boolean; size?: "md" | "sm" }) {
  const teams = cityTeams(city);
  const lgs = [...new Set(teams.map((t) => t.league))];
  return (
    <Link href={cityPath(city)} className={`ccard ccard-${size} ${lgs.map((l) => `has-${l}`).join(" ")}`}>
      <span className="ccard-head">
        <span className="ccard-place">{place(city)} · {teams.length} {teams.length === 1 ? "team" : "teams"}</span>
        <span className="ccard-lgs" aria-label={`Leagues: ${lgs.map((l) => l.toUpperCase()).join(", ")}`}>{lgs.map((l) => <span key={l}>{l.toUpperCase()}</span>)}</span>
      </span>
      <span className="ccard-name">{city.name}</span>
      <span className="ccard-teams">{teamLine(city, size === "sm" ? 3 : 5)}</span>
      <JerseyRow city={city} n={size === "sm" ? 3 : 4} eager={eager} w={size === "sm" ? 110 : 130} />
      {size === "md" && city.blurb && <span className="ccard-blurb">{city.blurb}</span>}
      <span className="ccard-go">Explore {city.name} <span aria-hidden="true">→</span></span>
    </Link>
  );
}

/**
 * The hand-picked lead city (data/cities.json "featured"): its top jerseys beside its intro, top jersey and teams.
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
        <JerseyRow city={city} n={6} eager w={220} />
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
