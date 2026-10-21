import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "About Top Selling Jerseys", description: "Top Selling Jerseys collects the latest official jersey sales rankings for five leagues, keeps them dated and sourced, and links each player to a retailer.", path: "/about/" });

export default function About() {
  return (
    <InfoPage title="About Top Selling Jerseys" path="/about/" lede="One place to see which players' jerseys fans are buying, according to the reports leagues and their partners publish.">
      <p>{site.name} gathers the most recent official or officially attributed jersey sales rankings for the NFL, NBA, MLB, NHL and MLS. We show each list in its published order with the player&apos;s team, position, three short highlights and current stats.</p>
      <p>Lists are released at different times and cover different sales periods, so every page shows when its report was published, which period it covers and when we last checked it. Older reports stay in the <Link href="/rankings/">archive</Link>.</p>
      <h2>Independence</h2>
      <p>We are not affiliated with any league, team, players association or retailer. Some shopping links are affiliate links; see our <Link href="/affiliate-disclosure/">affiliate disclosure</Link>. Commissions never affect rankings.</p>
      <h2>Corrections</h2>
      <p>If you spot an error, <Link href="/contact/">let us know</Link>. We correct facts against the original source and update the page&apos;s verified date.</p>
    </InfoPage>
  );
}
