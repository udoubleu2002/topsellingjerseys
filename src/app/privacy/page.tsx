import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Privacy Policy", description: "How Top Selling Jerseys handles analytics, consent, browser storage and outbound shopping links, and the choices you have about your data.", path: "/privacy/" });

export default function Privacy() {
  return (
    <InfoPage title="Privacy Policy" path="/privacy/" lede="Last updated October 21, 2026.">
      <p className="notice">Template text. Have it reviewed by a lawyer before launch and update it to match the analytics and affiliate services you actually enable.</p>
      <h2>What we collect</h2>
      <p>With your consent, we record anonymous usage events such as page views, which rankings are viewed and which shopping links are clicked. We do not ask for or store your name, email address or payment details.</p>
      <h2>Cookies and local storage</h2>
      <p>We store your consent choice and an experiment assignment in your browser&apos;s local storage. If analytics services are enabled, they may set their own cookies after you consent.</p>
      <h2>Retailer sites</h2>
      <p>Shopping links take you to retailers whose own privacy policies apply. Affiliate networks may record that you arrived from this site.</p>
      <h2>Your choices</h2>
      <p>You can decline analytics in the consent banner or clear your browser storage at any time. Contact <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with questions.</p>
    </InfoPage>
  );
}
