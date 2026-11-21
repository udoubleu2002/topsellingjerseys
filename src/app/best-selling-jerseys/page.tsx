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
  const newest = [...data].sort((a, b) => b.ranking.publishedDate.localeCompare(a.ranking.publishedDate))[0];
  // This page also carries what used to be /best-selling-jersey/ (the No. 1 in each league) and /best-selling-sports-jerseys/
  // (who publishes each list); both now redirect here so one page answers every "best selling jerseys" search.
  const faq = [
    ...data.map(({ league, ranking, entries }) => ({
      q: `What are the best selling ${league.name} jerseys?`,
      a: `On ${ranking.title} from ${ranking.publisher}, the top three are ${leagueList(entries.slice(0, 3).map((e) => e.player.name))}.`,
    })),
    { q: "Who publishes best selling jersey lists?", a: data.map((d) => `${d.league.name}: ${d.ranking.publisher}`).join(". ") + "." },
    ...(newest ? [{ q: "Which jersey sales list is the newest?", a: `The ${newest.league.name} list, ${newest.ranking.title}, published ${newest.published}.` }] : []),
    { q: "Do these lists count every store?", a: "No. Each list counts only the sales its publisher tracks, such as a league's online store or a retail network. The scope of each list is noted above." },
  ];
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
      <h2>The best selling jersey in every league</h2>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>League</th><th>No. 1 jersey</th><th>Publisher</th><th>Published</th><th>Sales period</th></tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.league.id}>
                <td><Link href={`/${d.league.slug}/`}>{d.league.name}</Link></td>
                <td><Link href={`/players/${d.entries[0].player.slug}/`}>{d.entries[0].player.name}</Link></td>
                <td><a href={d.ranking.sourceUrl} target="_blank" rel="noopener">{d.ranking.publisher}</a></td>
                <td>{d.published}</td>
                <td>{d.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
                  <span className="bs-team">{[e.team?.name, e.number && `No. ${e.number}`, e.now].filter(Boolean).join(" · ")}</span>
                </span>
                <HaveJersey name={e.player.name} league={league.id} className="have-sm" />
              </li>
            ))}
          </ol>
          <p className="shop-note">{ranking.scope} {ranking.methodology}{ranking.limitations.length > 0 ? ` ${ranking.limitations.join(" ")}` : ""}</p>
          <p><Link className="bs-more" href={`/${league.slug}/`}>See all {total} top selling {league.name} jerseys →</Link></p>
        </section>
      ))}
      <h2>Questions</h2>
      {faq.map((f) => (<div key={f.q}><h3 className="bs-q">{f.q}</h3><p>{f.a}</p></div>))}
      <p>For how we read and check each list, see <Link href="/methodology/">our methodology</Link> and <Link href="/sources/">every source</Link>.</p>
      <JsonLd data={ld} />
    </InfoPage>
  );
}
