/** Ads for Joe's other sites. Each goes out through /go/<id>/ so the editor desk counts the click. */
export type HouseAd = { id: string; name: string; domain: string; url: string; pitch: string; detail: string; cta: string; color: string; accent: string };

export const HOUSE_ADS: HouseAd[] = [
  { id: "insidethepark", name: "InsideThePark", domain: "insidethepark.com", url: "https://insidethepark.com/", pitch: "Find the ballparks closest to you", detail: "All 2,015 US ballparks by state, plus a free count of every park you've seen a game in.", cta: "Find ballparks", color: "#1f4d32", accent: "#c9a14a" },
  { id: "allfootballstadiums", name: "AllFootballStadiums", domain: "allfootballstadiums.com", url: "https://allfootballstadiums.com/", pitch: "Every NFL and college football stadium", detail: "533 stadiums by state, with a free tracker for each one you've visited.", cta: "Browse stadiums", color: "#2d6a3e", accent: "#e8d9a8" },
  { id: "hoopsarenas", name: "HoopsArenas", domain: "hoopsarenas.com", url: "https://hoopsarenas.com/", pitch: "Basketball arenas near you", detail: "424 NBA, WNBA, G League and college arenas, mapped by state.", cta: "Find arenas", color: "#1f4e8c", accent: "#f08a24" },
  { id: "rinkguide", name: "RinkGuide", domain: "rinkguide.com", url: "https://rinkguide.com/", pitch: "Hockey rinks near you", detail: "461 pro, college and junior rinks across the US and Canada.", cta: "Find rinks", color: "#16305a", accent: "#9fd3ff" },
  { id: "loststadiums", name: "Lost Stadiums", domain: "loststadiums.com", url: "https://loststadiums.com/", pitch: "The stadiums that aren't there anymore", detail: "A map of demolished ballparks, arenas and racetracks, and what stands on the land now.", cta: "Explore the map", color: "#2a4d45", accent: "#d9b77a" },
];

export const houseAd = (id: string) => HOUSE_ADS.find((a) => a.id === id);

/** The site that fits a league best, so a hockey page shows RinkGuide first. */
const BY_LEAGUE: Record<string, string> = { mlb: "insidethepark", nfl: "allfootballstadiums", nba: "hoopsarenas", wnba: "hoopsarenas", nhl: "rinkguide", mls: "loststadiums" };

/** Two different ads for a page: the league's best fit, then the next one in the list. */
export function adsFor(league?: string): [HouseAd, HouseAd] {
  const first = houseAd(BY_LEAGUE[league ?? ""] ?? "insidethepark")!;
  const second = league ? HOUSE_ADS[(HOUSE_ADS.indexOf(first) + 3) % HOUSE_ADS.length] : houseAd("loststadiums")!;
  return [first, second];
}
