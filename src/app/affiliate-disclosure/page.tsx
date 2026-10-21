import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Affiliate Disclosure", description: "How Top Selling Jerseys earns commissions from some shopping links, what that means for you, and why it never changes the order of a ranking.", path: "/affiliate-disclosure/" });

export default function Disclosure() {
  return (
    <InfoPage title="Affiliate Disclosure" path="/affiliate-disclosure/">
      <p>{site.name} may earn a commission when you buy through some of the shopping links on this site. You pay the same price either way.</p>
      <h2>What this means</h2>
      <ul>
        <li>Shopping links are marked as sponsored to search engines and open the retailer&apos;s site in a new tab.</li>
        <li>Commissions never affect the order of a ranking. Every list matches its published source.</li>
        <li>Prices, discounts and availability are set by the retailer. We show a price only for a listing we have checked, with the date we checked it.</li>
        <li>Where we have not verified a specific product, the button opens the retailer&apos;s search for that player&apos;s jerseys and says so.</li>
      </ul>
      <p>Questions? Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.</p>
    </InfoPage>
  );
}
