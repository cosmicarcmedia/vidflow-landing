// Cloudflare Pages Function: POST /api/waitlist
//
// Captures waitlist signups. Behavior:
//   - Validates the email.
//   - Stores it in the Cloudflare KV namespace bound as `WAITLIST` (if bound).
//   - Sends a notification to OWNER_EMAIL via Resend (if RESEND_API_KEY is set).
//
// Bindings to configure in the Cloudflare Pages → Settings → Functions tab:
//   - KV namespace: `WAITLIST` (create one in Cloudflare → Storage → KV)
//   - Environment variables:
//       OWNER_EMAIL       e.g. landon@cosmicarcmedia.com
//       RESEND_API_KEY    optional; sign up at resend.com (free tier ~3k/mo)
//       FROM_EMAIL        e.g. waitlist@vidflow.io (verified Resend sender)
//
// If you skip RESEND_API_KEY, signups are still captured in KV. You can read
// them with `wrangler kv:key list --binding=WAITLIST` or via the dashboard.

export interface Env {
  WAITLIST?: KVNamespace;
  OWNER_EMAIL?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let body: { email?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isValidEmail(email)) {
    return json({ error: "Please enter a valid email." }, 400);
  }

  const now = new Date().toISOString();
  const userAgent = request.headers.get("user-agent") ?? "";
  const referer = request.headers.get("referer") ?? "";
  // Cloudflare-injected; gives the visitor IP without exposing it to the page.
  const ip = request.headers.get("cf-connecting-ip") ?? "";

  // Persist to KV if bound.
  if (env.WAITLIST) {
    try {
      await env.WAITLIST.put(
        `signup:${email}`,
        JSON.stringify({ email, signedUpAt: now, userAgent, referer, ip }),
      );
    } catch (err) {
      console.error("[waitlist] KV write failed:", err);
    }
  } else {
    console.log("[waitlist] No KV binding — signup not persisted:", { email, signedUpAt: now });
  }

  // Notify the owner via Resend if configured.
  if (env.RESEND_API_KEY && env.OWNER_EMAIL) {
    const from = env.FROM_EMAIL ?? "waitlist@vidflow.io";
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: `Vidflow Waitlist <${from}>`,
          to: [env.OWNER_EMAIL],
          subject: `New Vidflow waitlist signup: ${email}`,
          text: `${email} just joined the Vidflow waitlist.\n\nSigned up: ${now}\nReferer: ${referer || "(none)"}\nUA: ${userAgent || "(none)"}`,
        }),
      });
      if (!res.ok) {
        console.error("[waitlist] Resend send failed:", res.status, await res.text());
      }
    } catch (err) {
      console.error("[waitlist] Resend error:", err);
    }
  }

  return json({ ok: true });
};

function isValidEmail(value: string): boolean {
  // Reasonable simple check; full RFC 5322 isn't worth the complexity.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 320;
}

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
