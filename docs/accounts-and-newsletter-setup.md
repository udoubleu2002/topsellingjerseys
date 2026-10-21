# Turn on accounts and the newsletter

Accounts (saved My Jerseys lists) and newsletter sign-ups both use one free Supabase project. Until it is connected, the site shows "Accounts that save your list permanently are coming soon" on My Jerseys, and the footer has no newsletter form. Nothing breaks in the meantime.

Setup takes about 15 minutes. Supabase occasionally renames menu items. If a label below doesn't match, look for the closest one, or send a screenshot.

## 1. Create the Supabase project

1. Go to **supabase.com**, click **Start your project**, and sign in with your GitHub account.
2. Click **New project**.
   - Name: `topsellingjerseys`.
   - Database password: click **Generate a password** and save it in your password manager. The site never needs it, but you will if you ever manage the database directly.
   - Region: **East US** (or whichever is closest to most visitors).
   - Plan: **Free**.
3. Click **Create new project** and wait a minute or two while it sets up.

## 2. Create the tables

1. In the left sidebar, open **SQL Editor** and click **New query**.
2. Open `supabase-schema.sql` from the downloads folder (the same file is at `supabase/schema.sql` in the GitHub repo). Copy all of it and paste it into the editor.
3. Click **Run**. You should see "Success. No rows returned."

This creates two tables:

- **jersey_lists**: one saved list per account. Each person can read and change only their own list.
- **newsletter_signups**: email addresses. Visitors can add their own address, but nobody can read the list from the website. Only you can, from the dashboard.

## 3. Let people log in with a username and password

1. In the sidebar, open **Authentication**, then **Sign In / Providers** (on some accounts it is just **Providers**).
2. Under **Email**, keep the provider turned on, and turn **Confirm email** off. Click **Save**.

Why: people sign up with a username, not an email address. Behind the scenes, the site gives each username a stand-in address (`username@users.topsellingjerseys.net`) that never receives mail. With **Confirm email** on, no one could finish signing up.

The trade-off is that there is no "forgot password" yet. If someone gets locked out, you can delete their account under **Authentication > Users** and they can sign up again. Adding an optional email for password resets can come later.

## 4. Copy the two public settings

1. Open **Project Settings** (the gear icon), then **API** or **API Keys**.
2. Copy these two values:
   - **Project URL**. It looks like `https://abcdefghijk.supabase.co`.
   - **anon public** key, or **publishable** key on newer projects. The publishable one starts with `sb_publishable_`.

Both are meant to be public, because the website sends them to every visitor's browser, and the table rules from step 2 decide what they can do.

**Never copy or share the `service_role` or `secret` key.** It bypasses all the rules.

## 5. Put the settings on the site

**If Netlify builds the site from GitHub:**

1. In Netlify, open the project and go to **Project configuration > Environment variables**.
2. Click **Add a variable** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`, with the Project URL as the value.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`, with the anon or publishable key as the value.
3. Go to **Deploys > Trigger deploy > Clear cache and deploy site**.

**If you upload the zip by hand:** send the Project URL and the anon or publishable key in the thread. I'll build a new zip with them included.

## 6. Check that it works

1. Open **topsellingjerseys.net/my-jerseys/**. Under your jersey count there is now a **Save your list for good** card with **Create account** and **Log in**.
2. Add a jersey, then create an account (for example `joe_test`).
3. In Supabase, open **Table Editor > jersey_lists**. Your row is there with the jersey.
4. Scroll to the bottom of any page and sign up for the newsletter. The address appears in **Table Editor > newsletter_signups**.
5. Afterwards, delete the test account under **Authentication > Users**.

## Using the newsletter list

- To see sign-ups, open **Table Editor > newsletter_signups**. To download them, click **Export > Export to CSV**.
- To send newsletters, import that CSV into an email service such as Buttondown, Kit or Mailchimp. Those services add the unsubscribe link and mailing address that US anti-spam law (CAN-SPAM) requires. Don't send bulk email from a personal inbox.
- If you later want sign-ups to flow into the email service automatically, I can connect them.

## Good to know

- **Free plan limits:** Supabase pauses free projects after about a week with no activity. Regular sign-ups and log-ins count as activity, and you can un-pause a project from the dashboard. Paid plans don't pause.
- **Deleting an account:** go to **Authentication > Users**, open the menu next to the user, and choose **Delete user**. Their saved list is deleted with it.
- **Privacy policy:** the privacy page already describes accounts and the newsletter. Have it reviewed along with the rest of the template legal text.
