# Vidflow Landing Page

Static marketing/waitlist page for [vidflow.io](https://vidflow.io). Hosted on
Cloudflare Pages, free tier.

## Stack

- Single `index.html` (no framework, no build step)
- Cloudflare Pages Function at `functions/api/waitlist.ts` captures signups

## Deploy steps

### 1. Push to GitHub

```bash
cd ~/vidflow-landing
git init
git add .
git commit -m "Initial Vidflow landing page"
gh repo create cosmicarcmedia/vidflow-landing --public --source=. --push
```

### 2. Connect Cloudflare Pages

1. Go to [Cloudflare Dashboard → Pages](https://dash.cloudflare.com/?to=/:account/pages)
2. **Create a project → Connect to Git**
3. Pick the `vidflow-landing` repo
4. Build settings:
   - **Build command:** _(leave blank — no build step)_
   - **Build output directory:** `/`
5. **Save and deploy**

You'll get a preview URL like `vidflow-landing-abc.pages.dev`.

### 3. Wire up the custom domain

1. In the new Pages project: **Custom domains → Set up a custom domain**
2. Add `vidflow.io` — Cloudflare will auto-add the DNS records since the zone is already on Cloudflare
3. Add `www.vidflow.io` as well (it'll redirect)

In 1–2 minutes, `https://vidflow.io` will serve the page over HTTPS.

### 4. (Optional but recommended) Wire up waitlist capture

The form already POSTs to `/api/waitlist`. By default, signups are logged to
the Cloudflare Pages function logs only. To persist them and get email
notifications:

**KV storage** (free, ~100k reads/day):
1. Cloudflare Dashboard → **Storage & Databases → KV → Create namespace** named `vidflow-waitlist`
2. In the Pages project → **Settings → Functions → KV namespace bindings**
3. Add binding: **Variable name** `WAITLIST` → **KV namespace** `vidflow-waitlist`
4. Redeploy

After this, each signup is stored as `signup:<email>`. List them anytime with:
```bash
npx wrangler kv:key list --binding=WAITLIST --remote
```

**Email notifications via Resend** (3k emails/month free):
1. Sign up at [resend.com](https://resend.com) and add `vidflow.io` as a verified domain (paste the DNS records Resend gives you into Cloudflare DNS)
2. Get an API key from Resend
3. In the Pages project → **Settings → Environment variables → Production**
   - `RESEND_API_KEY` = your Resend key
   - `OWNER_EMAIL` = `landon@cosmicarcmedia.com`
   - `FROM_EMAIL` = `waitlist@vidflow.io` (must be on a Resend-verified domain)
4. Redeploy

After this, every signup also pings `landon@cosmicarcmedia.com`.

## Local preview

Open `index.html` directly in a browser, or run a tiny static server:
```bash
npx serve .
```
The waitlist form will fail locally because the Pages Function isn't running.
To test the function locally, install Wrangler and run:
```bash
npx wrangler pages dev .
```

## Updating

Push to `main` — Cloudflare Pages auto-redeploys on every push.
