import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { bestSellingByLeague, leagueList } from "@/lib/bestSelling";

const path = "/best-selling-sports-jerseys/";

export const metadata: Metadata = pageMeta({
  title: "Best Selling Sports Jerseys: Where the Lists Come From",
  description: `Who publishes the best selling jersey lists for the ${leagueList(bestSellingByLeague(1).map((x) => x.league.name))}, what sales each one counts, when it was released, and who is No. 1.`,
  path,
});

export default function BestSellingSportsJerseys() {
  const data = bestSellingByLeague(1);
  const newest = [...data].sort((a, b) => b.ranking.publishedDate.localeCompare(a.ranking.publishedDate))[0];
  const faq = [
    { q: "Who publishes best selling jersey lists?", a: data.map((d) => `${d.league.name}: ${d.ranking.publisher}`).join(". ") + "." },
    { q: "Which jersey sales list is the newest?", a: `The ${newest.league.name} list, ${newest.ranking.title}, published ${newest.published}.` },
    { q: "Do these lists count every store?", a: "No. Each list counts only the sales its publisher tracks, such as a league's online store or a retail network. The scope of each list is noted below." },
  ];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <InfoPage title="Best Selling Sports Jerseys" path={path} pageType="guide" lede="Every league counts jersey sales a little differently. Here is who publishes each best selling list, what it covers and when it came out.">
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
      {data.map((d) => (
        <section key={d.league.id}>
          <h2>Best selling {d.league.name} jerseys: the source</h2>
          <p>{d.ranking.scope} {d.ranking.methodology}</p>
          {d.ranking.limitations.length > 0 && <p className="shop-note">{d.ranking.limitations.join(" ")}</p>}
          <p><Link href={`/${d.league.slug}/`}>See the {d.total} best selling {d.league.name} jerseys →</Link></p>
        </section>
      ))}
      <h2>Questions</h2>
      {faq.map((f) => (<div key={f.q}><h3 className="bs-q">{f.q}</h3><p>{f.a}</p></div>))}
      <p>See the top five in every league on <Link href="/best-selling-jerseys/">best selling jerseys</Link>, or just the No. 1s on <Link href="/best-selling-jersey/">the best selling jersey in every league</Link>.</p>
      <JsonLd data={ld} />
    </InfoPage>
  );
}
