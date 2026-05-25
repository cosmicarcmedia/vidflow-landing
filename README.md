# Vidflow Landing Page

Static marketing/waitlist page for [vidflow.io](https://vidflow.io). Hosted on
Cloudflare Pages (free tier). Waitlist signups go straight to a Google Sheet
and email you on each submit — via a Google Apps Script web app (no API keys,
no third-party services).

## Stack

- Single `index.html` — no framework, no build step
- `apps-script.gs` — Google Apps Script web app: appends signups to a Sheet + emails you

## Deploy steps

### 1. Push to GitHub (already done)

Repo: `cosmicarcmedia/vidflow-landing`. Push to `main` to auto-redeploy.

### 2. Connect Cloudflare Pages

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** tab → **Connect to Git**
   (Make sure you pick **Pages**, not Workers — a Worker will just serve "hello world".)
2. Pick the `vidflow-landing` repo
3. Build settings:
   - **Framework preset:** None
   - **Build command:** _(leave blank — no build step)_
   - **Build output directory:** `/`
4. **Save and Deploy** → you get a `*.pages.dev` preview URL

### 3. Custom domain

1. In the Pages project → **Custom domains → Set up a custom domain**
2. Add `vidflow.io`, then `www.vidflow.io` (Cloudflare auto-adds the DNS records)

### 4. Waitlist → Google Sheet + email (one-time)

Follow the setup steps at the top of [`apps-script.gs`](./apps-script.gs):
1. Create a Google Sheet "Vidflow Waitlist" with headers `Timestamp | Email | Source`
2. Extensions → Apps Script → paste `apps-script.gs` → Save → authorize
3. Deploy as a **Web app** (Execute as: Me, Who has access: Anyone)
4. Copy the `/exec` URL
5. Put that URL in `index.html` → `WAITLIST_ENDPOINT` constant → commit/push (Cloudflare redeploys)

After that, every signup appends a row to the Sheet and emails `landon@cosmicarcmedia.com`.

## Local preview

```bash
npx serve .
```
The waitlist submit only works once `WAITLIST_ENDPOINT` points at a deployed
Apps Script URL.

## Updating

Push to `main` — Cloudflare Pages auto-redeploys on every push.
