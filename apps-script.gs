/**
 * Vidflow waitlist — Google Apps Script web app.
 *
 * Appends every signup to a Google Sheet AND emails you on each submit.
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

    // Skip duplicates (same email already in column B).
    var existing = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 0), 1)
      .getValues()
      .map(function (r) { return (r[0] || "").toString().trim().toLowerCase(); });
    if (existing.indexOf(email) !== -1) {
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

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
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
