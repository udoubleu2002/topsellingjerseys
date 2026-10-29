import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { InfoPage } from "@/components/InfoPage";
import { site } from "@/lib/config";

export const metadata: Metadata = pageMeta({ title: "Privacy Policy", description: "How Top Selling Jerseys handles analytics, consent, browser storage and outbound shopping links, and the choices you have about your data.", path: "/privacy/" });

export default function Privacy() {
  return (
    <InfoPage title="Privacy Policy" path="/privacy/" lede="Last updated October 29, 2026.">
      <p className="notice">Template text. Have it reviewed by a lawyer before launch and update it to match the analytics and affiliate services you actually enable.</p>
      <h2>What we collect</h2>
      <p>With your consent, our analytics services record usage events such as which rankings are viewed and which shopping links are clicked. We never ask for payment details.</p>
      <p>Without cookies, we also count page views: the page, the site you came from, any campaign tags in the link, your rough location (country, state and city, worked out from your connection) and your type of device. Your IP address is used only to tell visitors apart within a single day and is not stored.</p>
      <p>Separately, when you click a shopping link we count the click (which link, where it was on the page, which page and when) so we know which links are useful. This count is kept without anything that identifies you; your IP address is used only briefly to stop abuse and is not stored with it.</p>
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
      <h2>Your choices</h2>
      <p>You can decline analytics in the consent banner or clear your browser storage at any time. Contact <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> with questions.</p>
    </InfoPage>
  );
}
