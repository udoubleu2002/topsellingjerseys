# Weekly newsletter

Every Thursday at 8am Eastern, the **Weekly newsletter** GitHub workflow builds an email from the site's own data and
sends it through the newsletter service. Subscribers live in the service, so the site needs no database (Supabase is not
used for this).

Each issue has, when there is something to show:

1. **Deals this week**: Lids promo codes running that day (`data/promotions.json`).
2. **Hot jerseys right now**: up to five of the week's daily stories, each with the player's Lids jersey photo, price and a
   shop button.
3. **Top sellers on sale**: ranked players whose jersey is marked down, biggest markdown first.
4. **No. 1 jersey in every league**, from the latest sales lists.
5. **Gift ideas**: a link to the gift guide, from Nov. 1 to Dec. 24.

Every shop link goes through the site's `/out/` redirect, so it carries the Lids affiliate tracking. In Impact, newsletter
sales show `subId1` starting with `nl_` (`nl_deal`, `nl_story`, `nl_sale`, `nl_leader`) and `subId3` set to
`~newsletter~<date>`. Links to site pages carry `utm_source=newsletter`, so Google Analytics shows newsletter visits.

A week with no stories and no deals is skipped.

## Sign-up boxes

- **Sidebar**: "Sign up for our newsletter", right under the search box on every page with the side rail.
- **Footer**: the newsletter form at the bottom of every page (and the "Newsletter" link in the phone menu).

Both post to `/api/newsletter/`, which passes the address to the service. They stay hidden until the service is connected.

## Connect Kit (the current choice)

Kit's free plan (up to 10,000 subscribers) includes the API, so the weekly email sends on its own at no cost.

1. Create a free account at kit.com and a form (**Grow > Landing pages & forms > Create new > Form**). The number in the
   form's address is the form ID.
2. **Settings > Developer > API keys > Add a new key**. Copy it.
3. In **Netlify > Project configuration > Environment variables** set `KIT_API_KEY` and `KIT_FORM_ID`, then redeploy.
4. In **GitHub > the repository > Settings > Secrets and variables > Actions** add the secrets `KIT_API_KEY` and
   `KIT_FORM_ID`. That lets the weekly job send.
5. In Kit, set your mailing address (**Settings > Email**) and turn the form's double opt-in off or on as you prefer.

## Or use beehiiv

1. In beehiiv, open **Settings > Workspace settings > API** (on some accounts **Settings > Integrations > API**).
2. Click **Create new API key**, name it `topsellingjerseys`, and copy the key. It is shown once.
3. Copy the **Publication ID** on the same page. It starts with `pub_`.
4. In **Netlify > Project configuration > Environment variables**, add `NEWSLETTER_PROVIDER` = `beehiiv`,
   `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID`, then redeploy. The sign-up boxes appear.
5. In **GitHub > the repository > Settings > Secrets and variables > Actions**, add the secrets `BEEHIIV_API_KEY` and
   `BEEHIIV_PUBLICATION_ID`, and under **Variables** add `NEWSLETTER_PROVIDER` = `beehiiv`.

beehiiv only lets the API create and send posts on **Pro** or **Enterprise** (and during the free trial). On the free
Launch plan sign-ups still work, but the weekly job can't send: open the run in **GitHub > Actions > Weekly newsletter**,
download the **newsletter-preview** file, and paste it into a new beehiiv post.

## Try it before it goes out

In **GitHub > Actions > Weekly newsletter > Run workflow**, pick:

- **preview**: builds the email only. Download **newsletter-preview** from the run to see it.
- **draft**: saves it in the service so you can review and send it yourself.
- **send**: sends it now.

Locally: `npm run newsletter:send -- --preview` writes `newsletter-preview.html`.

## Rules

- The service adds the unsubscribe link and mailing address that US anti-spam law (CAN-SPAM) requires. Set your mailing
  address in the service's settings before the first send.
- Prices in the email say when Lids last showed them; the email notes that prices change.
- The email never claims sales figures that aren't on a published list.
