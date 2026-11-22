import Link from "next/link";
import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Terms of Use", description: "The terms for using Top Selling Jerseys, including how rankings and stats are provided, trademark use, and purchases made on retailer sites.", path: "/terms/" });

export default function Terms() {
  return (
    <InfoPage title="Terms of Use" path="/terms/" lede="Last updated November 22, 2026.">
      <h2>Information only</h2>
      <p>Rankings and statistics are provided for information. We work to keep them accurate and sourced, but we do not guarantee they are complete or current.</p>
      <h2>Trademarks</h2>
      <p>League, team and player names and logos are trademarks of their owners and are used only to identify them. {site.name} is not affiliated with, endorsed by or sponsored by the NFL, NBA, WNBA, MLB, NHL, MLS, any team or any player, or by Lids or any other retailer.</p>
      <h2>Purchases</h2>
      <p>Purchases happen on retailer sites under the retailer&apos;s terms. We are not responsible for products, prices, shipping or returns.</p>
      <h2>Affiliate links and ads</h2>
      <p>
        Some shopping links earn us a commission, and the site shows ads. See the <Link href="/affiliate-disclosure/">affiliate disclosure</Link>{" "}
        and <Link href="/privacy/">privacy policy</Link> for details.
      </p>

      <h2>Stories and photos you send</h2>
      <p>
        When you send a jersey story or photo and allow us to show it, you confirm that it is yours to share and give us a non-exclusive,
        royalty-free license to publish, edit for length and display it on the site. Don&apos;t send photos of other people without their
        permission. We may decline or remove anything you send. You can ask us to take it down at any time.
      </p>

      <h2>Copyright concerns</h2>
      <p>
        If you believe something on the site infringes your copyright, email {site.contactEmail} with the page address, a description of
        the work, and your contact details, and we will review it promptly.
      </p>

      <h2>No warranty</h2>
      <p>
        The site is provided as is. To the fullest extent the law allows, we are not liable for any loss arising from your use of the site
        or of the sites it links to.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows when they last changed. Using the site after a change means you accept it.</p>

      <h2>Contact</h2>
      <p><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
    </InfoPage>
  );
}
