import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Privacy Policy", description: "How Top Selling Jerseys handles analytics, advertising, consent, browser storage and outbound shopping links, and the choices you have about your data.", path: "/privacy/" });

export default function Privacy() {
  return (
    <InfoPage title="Privacy Policy" path="/privacy/" lede="Last updated November 22, 2026.">
      <h2>What we collect</h2>
      <p>With your consent, our analytics services record usage events such as which rankings are viewed and which shopping links are clicked. We never ask for payment details.</p>
      <p>Without cookies, we also count page views: the page, the site you came from, any campaign tags in the link, your rough location (country, state and city, worked out from your connection) and your type of device. Your IP address is used only to tell visitors apart within a single day and is not stored.</p>
      <p>Separately, when you click a shopping link we count the click (which link, where it was on the page, which page and when, your type of device and browser, and the site your visit came from) so we know which links are useful. Your IP address is not stored: it is used briefly to stop abuse and turned into an anonymous code that can&apos;t be reversed, so repeat clicks from the same connection can be told apart from different shoppers.</p>
      <h2>Forms you send us</h2>
      <p>When you share a jersey story, suggest a fix or send a message, we receive what you typed, any photo you attach, and the page you sent it from. Your email address is used only to reply and is never shown. A story or photo appears on the site only if you tick the box allowing it. When you share your My Jerseys list, we record the list, its share link, your first name if you entered one, and how you shared it, so we can see which lists people share.</p>
      <h2>My Jerseys lists and accounts</h2>
      <p>Your My Jerseys list and wishlist are saved in your browser. Share links carry the list itself, so sharing stores nothing on our servers. If you create an account, we store your username, a securely hashed password, the first name you entered, and your jersey list and wishlist so you can open them on any device. Contact us to delete your account.</p>
      <h2>Newsletter</h2>
      <p>If you sign up for the newsletter, we store your email address and the page you signed up on. We use it only to send the newsletter, and every email includes a way to unsubscribe.</p>
      <h2>Cookies and local storage</h2>
      <p>We store your consent choice, an experiment assignment, your My Jerseys list and, if you log in, your account session in your browser&apos;s local storage. If analytics services are enabled, they may set their own cookies after you consent.</p>
      <h2>Retailer sites</h2>
      <p>Shopping links take you to retailers whose own privacy policies apply. We use Impact&apos;s affiliate tracking tag, which may set cookies so a retailer can credit a purchase to this site. Affiliate networks may record that you arrived from this site.</p>
      <h2>Advertising</h2>
      <p>
        We show ads through Google AdSense. Third-party vendors, including Google, use cookies to serve ads based on your prior visits to
        this site and other sites. Google&apos;s advertising cookies let it and its partners serve ads to you based on those visits. You can
        turn off personalized ads in <a href="https://adssettings.google.com/" rel="noopener">Google&apos;s Ads Settings</a>, and opt out of some
        other vendors&apos; personalized ads at <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>. Learn more in{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from sites that use its services</a>.
        Until you allow it, we ask Google not to use advertising cookies, so the ads you see are not personalized.
      </p>

      <h2>Children</h2>
      <p>
        This site is for a general audience and is not directed to children under 13. We do not knowingly collect personal information from
        children under 13. If you believe a child has sent us information, contact us and we will delete it.
      </p>

      <h2>Your privacy rights</h2>
      <p>
        Depending on where you live, including California and other U.S. states, the EU and the UK, you may have the right to know what
        personal information we hold about you, to get a copy, to correct or delete it, and to opt out of the sale or sharing of your
        information for targeted advertising. We do not sell your personal information. To make a request, email {site.contactEmail}.
        We will not treat you differently for using these rights.
      </p>

      <h2>How long we keep information</h2>
      <p>
        We keep form messages and newsletter sign-ups until you ask us to delete them or unsubscribe, and accounts until you delete them.
        Anonymous visit and click counts are kept as statistics.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy. The date at the top shows when it last changed.</p>

      <h2>Your choices</h2>
      <p>You can decline analytics in the consent banner or clear your browser storage at any time. Contact <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with questions.</p>
    </InfoPage>
  );
}
