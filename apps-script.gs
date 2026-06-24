/**
 * Vidflow waitlist — Google Apps Script web app.
 *
 * Appends every signup to a Google Sheet, emails YOU on each new submit, AND
 * sends the person who signed up a confirmation email.
 * No API keys, no third-party services.
 *
 * ── SETUP ──────────────────────────────────────────────────────────────────
 * 1. Create a Google Sheet (e.g. "Vidflow Waitlist").
 *    In row 1, add headers:   Timestamp | Email | Source
 * 2. In that Sheet: Extensions → Apps Script.
 * 3. Delete the default code, paste THIS file's contents, Save.
 * 4. Confirm OWNER_EMAIL below is correct.
 * 5. Deploy → New deployment → gear icon → type: "Web app"
 *      - Description: vidflow waitlist
 *      - Execute as: Me (your account)
 *      - Who has access: Anyone
 *    Click Deploy.
 * 6. First deploy asks for authorization — approve it (needs Sheets + Gmail).
 *    You may see an "unverified app" warning → Advanced → Go to (your project).
 * 7. Copy the "Web app URL" (ends in /exec). Send it to me (or paste it into
 *    index.html's WAITLIST_ENDPOINT) and redeploy the site.
 *
 * To verify: open the /exec URL in a browser — it should say the endpoint is live.
 * Re-deploying after edits: Deploy → Manage deployments → edit → Version: New.
 * (The confirmation email below only goes out once the NEW version is deployed.)
 */

var OWNER_EMAIL = "landon@cosmicarcmedia.com";

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = (e && e.parameter) || {};
      }
    } else {
      data = (e && e.parameter) || {};
    }

    var email = (data.email || "").toString().trim().toLowerCase();
    var source = (data.source || "vidflow.io").toString();
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 320;
    if (!emailOk) {
      return jsonOut({ ok: false, error: "Invalid email" });
    }

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Skip duplicate sheet rows, but still confirm to the user so a repeat
    // submit always gets feedback. (Don't re-notify the owner on duplicates.)
    var existing = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 0), 1)
      .getValues()
      .map(function (r) { return (r[0] || "").toString().trim().toLowerCase(); });
    if (existing.indexOf(email) !== -1) {
      sendUserConfirmation(email);
      return jsonOut({ ok: true, duplicate: true });
    }

    var now = new Date();
    sheet.appendRow([now, email, source]);

    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "New Vidflow waitlist signup: " + email,
      body: email + " joined the Vidflow waitlist.\n\n" +
            "When: " + now + "\n" +
            "Source: " + source + "\n\n" +
            "Full list: open your Vidflow Waitlist sheet."
    });

    sendUserConfirmation(email);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

/**
 * Sends the person who signed up a confirmation that they made the list.
 * Sent from the script owner's account, with Vidflow as the display name and
 * replies routed back to the owner.
 */
function sendUserConfirmation(email) {
  var subject = "You're on the Vidflow waitlist";
  var plain =
    "Thanks for joining the Vidflow waitlist. You're on the list.\n\n" +
    "We're rolling out early access to waitlist members in batches, before we open " +
    "to the public, so you'll be among the first invited. We'll email you the moment " +
    "your invite is ready.\n\n" +
    "Questions in the meantime? Just reply to this email.\n\n" +
    "— The Vidflow team\n" +
    "https://vidflow.io";
  var html =
    '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;' +
    'max-width:520px;margin:0 auto;color:#18181b;line-height:1.6;">' +
    '<h2 style="margin:0 0 12px;font-size:20px;">You\'re on the Vidflow waitlist.</h2>' +
    '<p style="margin:0 0 14px;">Thanks for joining. Your spot is saved.</p>' +
    '<p style="margin:0 0 14px;">We\'re rolling out early access to waitlist members in ' +
    'batches, before we open to the public, so you\'ll be among the first invited. ' +
    'We\'ll email you the moment your invite is ready.</p>' +
    '<p style="margin:0 0 20px;">Questions in the meantime? Just reply to this email.</p>' +
    '<p style="margin:0;color:#71717a;font-size:14px;">The Vidflow team<br>' +
    '<a href="https://vidflow.io" style="color:#ec4899;">vidflow.io</a></p>' +
    '</div>';

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: plain,
    htmlBody: html,
    name: "Vidflow",
    replyTo: OWNER_EMAIL
  });
}

function doGet() {
  return ContentService
    .createTextOutput("Vidflow waitlist endpoint is live.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
