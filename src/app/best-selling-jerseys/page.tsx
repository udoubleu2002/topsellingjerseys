import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { HaveJersey } from "@/components/HaveJersey";
import { bestSellingByLeague, leagueList } from "@/lib/bestSelling";
import { abs } from "@/lib/config";

const path = "/best-selling-jerseys/";
const names = () => leagueList(bestSellingByLeague().map((x) => x.league.name));

export const metadata: Metadata = pageMeta({
  title: "Best Selling Jerseys: Latest Lists for Every League",
  description: `The best selling jerseys in the ${names()}: the top five from each league's latest sales list, with links to every full ranking.`,
  path,
});

export default function BestSellingJerseys() {
  const data = bestSellingByLeague(5);
  const faq = data.map(({ league, ranking, entries }) => ({
    q: `What are the best selling ${league.name} jerseys?`,
    a: `On ${ranking.title} from ${ranking.publisher}, the top three are ${leagueList(entries.slice(0, 3).map((e) => e.player.name))}.`,
  }));
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      ...data.map(({ league, entries }) => ({
        "@type": "ItemList",
        name: `Best selling ${league.name} jerseys`,
        itemListOrder: "https://schema.org/ItemListOrderAscending",
        itemListElement: entries.map((e) => ({ "@type": "ListItem", position: e.rank, name: `${e.player.name} jersey`, url: abs(`/players/${e.player.slug}/`) })),
      })),
      { "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
    ],
  };
  return (
    <InfoPage title="Best Selling Jerseys" path={path} pageType="guide" lede={`The best selling jerseys in the ${names()}, taken from each league's latest published sales list and shown in the published order.`}>
      {data.map(({ league, ranking, entries, total, published, period }) => (
        <section key={league.id} className="bs-league" style={{ "--lg": league.accent } as React.CSSProperties}>
          <h2>Best selling {league.name} jerseys</h2>
          <p className="bs-src">{ranking.publisher} · published {published} · sales {period}</p>
          <ol className="bs-list">
            {entries.map((e) => (
              <li key={e.player.id}>
                <span className="bs-rank">{e.rank}</span>
                <span className="bs-who">
                  <Link href={`/players/${e.player.slug}/`}>{e.player.name} jersey</Link>
                  <span className="bs-team">{[e.team?.name, e.player.number && `No. ${e.player.number}`].filter(Boolean).join(" · ")}</span>
                </span>
                <HaveJersey name={e.player.name} league={league.id} className="have-sm" />
              </li>
            ))}
          </ol>
          <p><Link className="bs-more" href={`/${league.slug}/`}>See all {total} best selling {league.name} jerseys →</Link></p>
        </section>
      ))}
      <h2>Questions</h2>
      {faq.map((f) => (<div key={f.q}><h3 className="bs-q">{f.q}</h3><p>{f.a}</p></div>))}
      <p>Looking for one name per league? See <Link href="/best-selling-jersey/">the best selling jersey in every league</Link>, or read <Link href="/best-selling-sports-jerseys/">where these sales lists come from</Link>.</p>
      <JsonLd data={ld} />
    </InfoPage>
  );
}
