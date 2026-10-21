import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Terms of Use", description: "The terms for using Top Selling Jerseys, including how rankings and stats are provided, trademark use, and purchases made on retailer sites.", path: "/terms/" });

export default function Terms() {
  return (
    <InfoPage title="Terms of Use" path="/terms/" lede="Last updated October 21, 2026.">
      <p className="notice">Template text. Have it reviewed by a lawyer before launch.</p>
      <h2>Information only</h2>
      <p>Rankings and statistics are provided for information. We work to keep them accurate and sourced, but we do not guarantee they are complete or current.</p>
      <h2>Trademarks</h2>
      <p>League, team and player names identify their owners and are used for reference. {site.name} is not affiliated with or endorsed by any of them.</p>
      <h2>Purchases</h2>
      <p>Purchases happen on retailer sites under the retailer&apos;s terms. We are not responsible for products, prices, shipping or returns.</p>
      <h2>Contact</h2>
      <p><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
    </InfoPage>
  );
}
