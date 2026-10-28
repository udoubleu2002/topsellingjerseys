import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";

export const metadata: Metadata = pageMeta({ title: "Related Sites", description: "Sister sites to Top Selling Jerseys: guides to ballparks, football stadiums, basketball arenas, hockey rinks and horse racing tracks, plus lost stadiums and sports history.", path: "/related-sites/" });

const SITES: [string, string, string, string][] = [
  ["Baseball", "InsideThePark.com", "https://insidethepark.com/", "A guide to MLB, minor league, spring training and college ballparks in the United States."],
  ["Football", "AllFootballStadiums.com", "https://allfootballstadiums.com/", "A guide to NFL and college football stadiums across the United States."],
  ["Basketball", "HoopsArenas.com", "https://hoopsarenas.com/", "A guide to NBA, WNBA and men’s and women’s college basketball arenas across the United States and Canada."],
  ["Hockey", "RinkGuide.com", "https://rinkguide.com/", "A guide to NHL, minor league and college hockey rinks across the United States and Canada."],
  ["Horse racing", "HorseTrackAtlas.com", "https://horsetrackatlas.com/", "A guide to horse racing tracks across the United States and internationally."],
  ["Lost venues", "LostStadiums.com", "https://loststadiums.com/", "A map of demolished and repurposed ballparks, stadiums, arenas and racetracks, and what stands on the land now."],
  ["Sports history", "SportsOnThisDay.com", "https://sportsonthisday.com/", "The biggest moments in sports history on every day of the year, over the past 50 years."],
];

export default function RelatedSites() {
  return (
    <InfoPage title="Related sites" path="/related-sites/" lede="Top Selling Jerseys tracks the players fans are buying. Our sister sites cover the places they go to watch them play.">
      <h2>Our sister sites</h2>
      {SITES.map(([kind, name, url, desc]) => (
        <div key={url}>
          <h3><a href={url} target="_blank" rel="noopener">{name}</a></h3>
          <p><strong>{kind}.</strong> {desc}</p>
        </div>
      ))}
    </InfoPage>
  );
}
