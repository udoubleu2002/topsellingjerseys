/**
 * Links to the owner's stadium sites (Nov. 21, 2026). Kept small and in context: a few player pages name where the
 * player's fans gather, and throwback jerseys and city pages point to the city's old stadiums. Deep links are only used where the page was checked to exist.
 */

/** MLB home ballparks on InsideThePark, from its sitemap (Oct. 2026). US parks only; Toronto is not on the site. */
const BALLPARKS: Record<string, { name: string; file: string }> = {
  "arizona-diamondbacks": { name: "Chase Field", file: "chase-field-phoenix" },
  "atlanta-braves": { name: "Truist Park", file: "truist-park-atlanta" },
  "baltimore-orioles": { name: "Oriole Park at Camden Yards", file: "oriole-park-at-camden-yards-baltimore" },
  "boston-red-sox": { name: "Fenway Park", file: "fenway-park-boston" },
  "chicago-cubs": { name: "Wrigley Field", file: "wrigley-field-chicago" },
  "chicago-white-sox": { name: "Rate Field", file: "rate-field-chicago" },
  "cincinnati-reds": { name: "Great American Ball Park", file: "great-american-ball-park-cincinnati" },
  "cleveland-guardians": { name: "Progressive Field", file: "progressive-field-cleveland" },
  "colorado-rockies": { name: "Coors Field", file: "coors-field-denver" },
  "detroit-tigers": { name: "Comerica Park", file: "comerica-park-detroit" },
  "houston-astros": { name: "Daikin Park", file: "daikin-park-houston" },
  "kansas-city-royals": { name: "Kauffman Stadium", file: "kauffman-stadium-kansas-city" },
  "los-angeles-angels": { name: "Angel Stadium", file: "angel-stadium-anaheim" },
  "los-angeles-dodgers": { name: "Dodger Stadium", file: "dodger-stadium-los-angeles" },
  "miami-marlins": { name: "loanDepot park", file: "loandepot-park-miami" },
  "milwaukee-brewers": { name: "American Family Field", file: "american-family-field-milwaukee" },
  "minnesota-twins": { name: "Target Field", file: "target-field-minneapolis" },
  "new-york-mets": { name: "Citi Field", file: "citi-field-queens" },
  "new-york-yankees": { name: "Yankee Stadium", file: "yankee-stadium-bronx" },
  "philadelphia-phillies": { name: "Citizens Bank Park", file: "citizens-bank-park-philadelphia" },
  "pittsburgh-pirates": { name: "PNC Park", file: "pnc-park-pittsburgh" },
  "san-diego-padres": { name: "Petco Park", file: "petco-park-san-diego" },
  "san-francisco-giants": { name: "Oracle Park", file: "oracle-park-san-francisco" },
  "seattle-mariners": { name: "T-Mobile Park", file: "t-mobile-park-seattle" },
  "st-louis-cardinals": { name: "Busch Stadium", file: "busch-stadium-st-louis" },
  "tampa-bay-rays": { name: "Tropicana Field", file: "tropicana-field-st-petersburg" },
  "texas-rangers": { name: "Globe Life Field", file: "globe-life-field-arlington" },
  "washington-nationals": { name: "Nationals Park", file: "nationals-park-washington" },
};

/** LostStadiums city hubs with plenty of venues (5+ in its seed data, Nov. 2026), so the page reliably exists. */
const LOST_CITY: Record<string, { slug: string; name: string }> = {
  "new-york": { slug: "new-york-city-ny", name: "New York City" },
  philadelphia: { slug: "philadelphia-pa", name: "Philadelphia" },
  chicago: { slug: "chicago-il", name: "Chicago" },
  "los-angeles": { slug: "los-angeles-ca", name: "Los Angeles" },
  cincinnati: { slug: "cincinnati-oh", name: "Cincinnati" },
  detroit: { slug: "detroit-mi", name: "Detroit" },
  "st-louis": { slug: "st-louis-mo", name: "St. Louis" },
  baltimore: { slug: "baltimore-md", name: "Baltimore" },
  "washington-dc": { slug: "washington-dc", name: "Washington" },
  milwaukee: { slug: "milwaukee-wi", name: "Milwaukee" },
  indianapolis: { slug: "indianapolis-in", name: "Indianapolis" },
  buffalo: { slug: "buffalo-ny", name: "Buffalo" },
  pittsburgh: { slug: "pittsburgh-pa", name: "Pittsburgh" },
  boston: { slug: "boston-ma", name: "Boston" },
  atlanta: { slug: "atlanta-ga", name: "Atlanta" },
  cleveland: { slug: "cleveland-oh", name: "Cleveland" },
  houston: { slug: "houston-tx", name: "Houston" },
  "bay-area": { slug: "san-francisco-ca", name: "San Francisco" },
  minneapolis: { slug: "minneapolis-mn", name: "Minneapolis" },
  seattle: { slug: "seattle-wa", name: "Seattle" },
  miami: { slug: "miami-fl", name: "Miami" },
  "san-diego": { slug: "san-diego-ca", name: "San Diego" },
  "kansas-city": { slug: "kansas-city-mo", name: "Kansas City" },
};

type Kind = "mlb" | "nfl" | "hoops" | "nhl";
const SITES: Record<Kind, { url: string }> = {
  mlb: { url: "https://insidethepark.com/" },
  nfl: { url: "https://allfootballstadiums.com/" },
  hoops: { url: "https://hoopsarenas.com/" },
  nhl: { url: "https://rinkguide.com/" },
};

/**
 * A hand-picked set of ten or so players per sport whose page gets one line about the jerseys at their home venue.
 * Each line is written by hand so no two read alike; the part in [brackets] becomes the link. Ballparks deep-link to
 * InsideThePark; the other guides link to the site's homepage, since their venue URLs were not checked.
 */
const SPOTLIGHT: Record<string, { kind: Kind; team: string; text: string }> = {
  "shohei-ohtani": { kind: "mlb", team: "los-angeles-dodgers", text: "Do you see all those Ohtani jerseys around [Dodger Stadium]? On some nights it feels like every other fan has one." },
  "aaron-judge": { kind: "mlb", team: "new-york-yankees", text: "Walk the concourse at [Yankee Stadium] and count the 99s. You'll lose track before the first pitch." },
  "pete-crow-armstrong": { kind: "mlb", team: "chicago-cubs", text: "The bleachers at [Wrigley Field] have gone heavy on PCA jerseys, and you'll spot plenty on the walk down Clark Street too." },
  "ronald-acuna-jr": { kind: "mlb", team: "atlanta-braves", text: "Acuña's No. 13 is everywhere at [Truist Park], from the Battery outside to the seats down the lines." },
  "fernando-tatis-jr": { kind: "mlb", team: "san-diego-padres", text: "Spend a night at [Petco Park] and you'll see why the Tatis jersey sells: it's the one in the crowd you notice first." },
  "bryce-harper": { kind: "mlb", team: "philadelphia-phillies", text: "Philly fans wear their loyalty, and at [Citizens Bank Park] that usually means a Harper 3 on their back." },
  "juan-soto": { kind: "mlb", team: "new-york-mets", text: "Mets fans took to Soto fast. Look around [Citi Field] and his 22 is already one of the most common jerseys in the stands." },
  "cal-raleigh": { kind: "mlb", team: "seattle-mariners", text: "Big Dumper jerseys have taken over [T-Mobile Park], a sign of how far Raleigh's home run chase carried him in Seattle." },
  "gunnar-henderson": { kind: "mlb", team: "baltimore-orioles", text: "Orange and black Henderson jerseys fill the seats at [Camden Yards], with plenty more along Eutaw Street." },
  "bobby-witt-jr": { kind: "mlb", team: "kansas-city-royals", text: "Royals fans have a new face of the franchise, and [Kauffman Stadium] shows it, with Witt jerseys from the fountains to the upper deck." },
  "josh-allen": { kind: "nfl", team: "buffalo-bills", text: "Bills Mafia shows up in Allen 17s no matter the weather. If you're planning a trip to Orchard Park, [AllFootballStadiums] has a guide to every NFL stadium." },
  "drake-maye": { kind: "nfl", team: "new-england-patriots", text: "Maye jerseys are quickly replacing the old No. 12s at Gillette Stadium. For more on the venue and the rest of the league's, see [AllFootballStadiums]." },
  "saquon-barkley": { kind: "nfl", team: "philadelphia-eagles", text: "Barkley's 26 is a regular sight in the Lincoln Financial Field parking lots on Sundays. Heading to a game? [AllFootballStadiums] covers every stadium in the league." },
  "jaxon-smith-njigba": { kind: "nfl", team: "seattle-seahawks", text: "Lumen Field is getting louder, and so is the number of JSN jerseys in the crowd. Visiting stadiums on the road? Start at [AllFootballStadiums]." },
  "jayden-daniels": { kind: "nfl", team: "washington-commanders", text: "Daniels gave Commanders fans a reason to buy a jersey again, and you see the 5 all over Northwest Stadium. [AllFootballStadiums] has notes on every NFL venue." },
  "patrick-mahomes": { kind: "nfl", team: "kansas-city-chiefs", text: "A sea of red at Arrowhead is mostly Mahomes 15s. If you're adding stadiums to your list, [AllFootballStadiums] is a good place to plan." },
  "caleb-williams": { kind: "nfl", team: "chicago-bears", text: "Soldier Field crowds have plenty of Williams 18 jerseys mixed in with the old Payton and Butkus throwbacks. [AllFootballStadiums] has a guide to the stadium and the rest of the league's." },
  "jordan-love": { kind: "nfl", team: "green-bay-packers", text: "Lambeau Field has been a quarterback town for decades, and Love's 10 is now the jersey of choice in the stands. Planning a pilgrimage? See [AllFootballStadiums]." },
  "lamar-jackson": { kind: "nfl", team: "baltimore-ravens", text: "Purple Lamar 8s are the uniform of the day at M&T Bank Stadium. [AllFootballStadiums] covers that stadium and every other NFL home." },
  "ceedee-lamb": { kind: "nfl", team: "dallas-cowboys", text: "Look around AT&T Stadium on a Sunday and Lamb's 88 is everywhere, a nod to the receivers who wore it before him. More on NFL stadiums at [AllFootballStadiums]." },
  "stephen-curry": { kind: "hoops", team: "golden-state-warriors", text: "Do you see all those Curry 30s around Chase Center? Some fans have worn one for over a decade. For more arena guides, visit [HoopsArenas]." },
  "luka-doncic": { kind: "hoops", team: "los-angeles-lakers", text: "Doncic jerseys took over Crypto.com Arena almost overnight. If you're planning a trip to see him, [HoopsArenas] has guides to NBA and WNBA arenas." },
  "jalen-brunson": { kind: "hoops", team: "new-york-knicks", text: "Madison Square Garden has a Brunson 11 in nearly every section now. Seeing a game in another city? Check [HoopsArenas] first." },
  "victor-wembanyama": { kind: "hoops", team: "san-antonio-spurs", text: "The Wemby 1 is the new must-have in San Antonio, and Frost Bank Center is full of them. Arena guides for the rest of the league are at [HoopsArenas]." },
  "anthony-edwards": { kind: "hoops", team: "minnesota-timberwolves", text: "Target Center crowds have made the Edwards 5 their jersey of choice. For more on that arena and others, see [HoopsArenas]." },
  "jayson-tatum": { kind: "hoops", team: "boston-celtics", text: "Green Tatum 0s fill TD Garden on game nights. Planning a road trip to watch the Celtics away from home? [HoopsArenas] can help." },
  "shai-gilgeous-alexander": { kind: "hoops", team: "oklahoma-city-thunder", text: "Paycom Center is loud, and much of the crowd wears SGA's No. 2. For more on NBA and WNBA arenas, visit [HoopsArenas]." },
  "cooper-flagg": { kind: "hoops", team: "dallas-mavericks", text: "Flagg jerseys started showing up at American Airlines Center before his first game. Planning a visit to Dallas or another NBA city? Start with [HoopsArenas]." },
  "nikola-jokic": { kind: "hoops", team: "denver-nuggets", text: "In Denver, the Jokic 15 is the jersey you see most at Ball Arena. [HoopsArenas] has guides to that arena and the rest of the league's." },
  "caitlin-clark": { kind: "hoops", team: "indiana-fever", text: "Gainbridge Fieldhouse sells out for the Fever, and Clark's 22 is the most common jersey in the building. [HoopsArenas] covers WNBA arenas too." },
  "aja-wilson": { kind: "hoops", team: "las-vegas-aces", text: "Wilson's 22 is a fixture in the stands at Michelob Ultra Arena in Las Vegas. For guides to WNBA and NBA arenas, see [HoopsArenas]." },
  "breanna-stewart": { kind: "hoops", team: "new-york-liberty", text: "Barclays Center crowds for the Liberty have plenty of Stewie 30s. If you're seeing a game elsewhere, [HoopsArenas] has you covered." },
  "connor-bedard": { kind: "nhl", team: "chicago-blackhawks", text: "Bedard 98s are showing up all over United Center next to the old Kane and Toews sweaters. For more on NHL rinks, see [RinkGuide]." },
  "alex-ovechkin": { kind: "nhl", team: "washington-capitals", text: "Capital One Arena has been full of red Ovi 8s for two decades. Heading to watch him in another rink? [RinkGuide] covers them all." },
  "sidney-crosby": { kind: "nhl", team: "pittsburgh-penguins", text: "A Crosby 87 is close to standard dress at PPG Paints Arena. If you're traveling for hockey, [RinkGuide] has a guide to every NHL rink." },
  "jack-hughes": { kind: "nhl", team: "new-jersey-devils", text: "Devils fans at Prudential Center have made the Hughes 86 the jersey to own. For more NHL arena guides, visit [RinkGuide]." },
  "connor-mcdavid": { kind: "nhl", team: "edmonton-oilers", text: "Edmonton's Rogers Place is a sea of orange, and most of it says McDavid 97. Planning a hockey trip? Start at [RinkGuide]." },
  "nathan-mackinnon": { kind: "nhl", team: "colorado-avalanche", text: "Look around Ball Arena on an Avalanche night and MacKinnon's 29 is the sweater you'll see most. [RinkGuide] has more on NHL rinks." },
  "david-pastrnak": { kind: "nhl", team: "boston-bruins", text: "Bruins crowds at TD Garden have plenty of Pastrnak 88s mixed in with the classic black and gold. For guides to every rink, see [RinkGuide]." },
  "auston-matthews": { kind: "nhl", team: "toronto-maple-leafs", text: "Matthews 34s are all over Scotiabank Arena in Toronto. If you're visiting other NHL cities, [RinkGuide] covers every arena." },
  "macklin-celebrini": { kind: "nhl", team: "san-jose-sharks", text: "Teal Celebrini 71s are a growing sight at SAP Center in San Jose. Planning to catch the Sharks on the road? [RinkGuide] can help." },
  "jack-eichel": { kind: "nhl", team: "vegas-golden-knights", text: "Golden Knights fans at T-Mobile Arena wear Eichel's 9 more than any other. For more on Vegas and every other rink, see [RinkGuide]." },
};

export type VenueLine = { before: string; linkText: string; after: string; url: string };

/** The line for a spotlight player's page, split around its link, or null. */
export function venueLine(player: { id: string; teamId: string | null }): VenueLine | null {
  const s = SPOTLIGHT[player.id];
  if (!s || player.teamId !== s.team) return null; // a trade makes the line wrong, so it drops off
  const m = s.text.match(/^(.*?)\[(.+?)\](.*)$/);
  if (!m) return null;
  let url = SITES[s.kind].url;
  if (s.kind === "mlb") {
    const b = BALLPARKS[s.team];
    if (!b) return null;
    url = `https://insidethepark.com/parks/${b.file}.html`;
  }
  return { before: m[1], linkText: m[2], after: m[3], url };
}

/** The LostStadiums hub for a city, for throwback jerseys and city pages. */
export function lostStadiums(citySlug: string | undefined): { name: string; url: string } | null {
  const l = citySlug ? LOST_CITY[citySlug] : undefined;
  return l ? { name: l.name, url: `https://loststadiums.com/cities/${l.slug}/` } : null;
}
