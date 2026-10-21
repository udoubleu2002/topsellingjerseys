import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Contact Top Selling Jerseys", description: "Contact Top Selling Jerseys with corrections to a ranking or player page, partnership questions or press inquiries. We fix errors against the source.", path: "/contact/" });

export default function Contact() {
  return (
    <InfoPage title="Contact" path="/contact/" lede="Corrections, partnership questions and press inquiries are welcome.">
      <p>Email <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>.</p>
      <p>For a correction, please include the page address and a link to the source that shows the right information.</p>
    </InfoPage>
  );
}
