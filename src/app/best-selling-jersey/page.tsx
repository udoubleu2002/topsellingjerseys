import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { JsonLd } from "@/components/JsonLd";
import { HaveJersey } from "@/components/HaveJersey";
import { bestSellingByLeague, leagueList } from "@/lib/bestSelling";

const path = "/best-selling-jersey/";

export const metadata: Metadata = pageMeta({
  title: "Best Selling Jersey in Every League",
  description: `The best selling jersey in every league: ${bestSellingByLeague(1).map((x) => `${x.league.name} ${x.entries[0].player.name.split(" ").pop()}`).join(", ")}. From the latest sales lists.`,
  path,
});

export default function BestSellingJersey() {
  const data = bestSellingByLeague(3);
  const answer = ({ league, ranking, entries, published }: (typeof data)[number]) => {
    const [first, ...rest] = entries;
    const num = first.player.number ? `No. ${first.player.number} ` : "";
    return `${first.player.name}'s ${num}${first.team?.name ?? ""} jersey is No. 1 on ${ranking.title}, published by ${ranking.publisher} on ${published}.${rest.length ? ` ${leagueList(rest.map((e) => `${e.player.name} (No. ${e.rank})`))} follow.` : ""}`.replace(/  +/g, " ");
  };
  const faq = data.map((d) => ({ q: `What is the best selling ${d.league.name} jersey?`, a: answer(d) }));
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) };
  return (
    <InfoPage title="Best Selling Jersey in Every League" path={path} pageType="guide" lede="The No. 1 jersey on each league's latest published sales list, with the runners-up and the source behind each one.">
      <div className="bs-ones">
        {data.map((d) => {
          const first = d.entries[0];
          return (
            <section key={d.league.id} className="bs-one" style={{ "--lg": d.league.accent } as React.CSSProperties}>
              <p className="bs-one-lg">Best selling {d.league.name} jersey</p>
              <h2><Link href={`/players/${first.player.slug}/`}>{first.player.name}</Link></h2>
              <p>{answer(d)}</p>
              <p className="bs-one-links">
                <Link href={`/players/${first.player.slug}/`}>Shop {first.player.name} jerseys</Link>
                <Link href={`/${d.league.slug}/`}>Full {d.league.name} list</Link>
              </p>
              <HaveJersey name={first.player.name} league={d.league.id} className="have-sm" />
            </section>
          );
        })}
      </div>
      <h2>More best selling lists</h2>
      <p>For the top five in each league, see <Link href="/best-selling-jerseys/">best selling jerseys</Link>. For how each list is made, see <Link href="/best-selling-sports-jerseys/">where these sales lists come from</Link>.</p>
      <JsonLd data={ld} />
    </InfoPage>
  );
}
