# Vidflow Landing Page

Static marketing site for [vidflow.io](https://vidflow.io). Hosted on
Cloudflare Pages (free tier). Pages: `index.html` (home, with the pricing
section), `pricing.html` (/pricing), `map.html` and `approvals.html` (lead
magnet pages), and the help center under `help/`. The home page contact form
posts to a Google Apps Script web app that appends to a Google Sheet and
emails you on each submit (no API keys, no third-party services). The
trial call to action links to https://app.vidflow.io.

## Stack

- Plain HTML pages with inline CSS, no framework, no build step
- `assets/screens/` holds resized copies of real app screenshots used on the home page
- `apps-script.gs` is the Google Apps Script web app behind the contact form (it also served the earlier signup form)

## Deploy steps

### 1. Push to GitHub (already done)

Repo: `cosmicarcmedia/vidflow-landing`. Push to `main` to auto-redeploy.

### 2. Connect Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**
   (Make sure you pick **Pages**, not Workers. A Worker will just serve "hello world".)
2. Pick the `vidflow-landing` repo
3. Build settings:
   - **Framework preset:** None
   - **Build command:** _(leave blank, no build step)_
   - **Build output directory:** `/`
4. **Save and Deploy** → you get a `*.pages.dev` preview URL

### 3. Custom domain

1. In the Pages project → **Custom domains → Set up a custom domain**
2. Add `vidflow.io`, then `www.vidflow.io` (Cloudflare auto-adds the DNS records)

### 4. Contact form → Google Sheet + email (one-time)

Follow the setup steps at the top of [`apps-script.gs`](./apps-script.gs):
1. Create a Google Sheet with headers `Timestamp | Email | Source`
2. Extensions → Apps Script → paste `apps-script.gs` → Save → authorize
3. Deploy as a **Web app** (Execute as: Me, Who has access: Anyone)
4. Copy the `/exec` URL
5. Put that URL in `index.html` → `FORM_ENDPOINT` constant → commit/push (Cloudflare redeploys)

After that, every contact form submission appends a row to the Sheet and emails `landon@cosmicarcmedia.com`.

## Local preview

```bash
npx serve .
```
Pretty URLs (`/pricing` for `pricing.html`) work on Cloudflare Pages and with
`npx serve`. The contact form submit only works once `FORM_ENDPOINT` points at a
deployed Apps Script URL.

## Updating

Push to `main`. Cloudflare Pages auto-redeploys on every push.
