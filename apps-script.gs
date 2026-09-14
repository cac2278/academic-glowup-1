/**
 * ACADEMIC GLOW-UP — Google Apps Script backend
 * Email + anonymous analytics only.
 */

const SPREADSHEET_ID = "1LUf2ljvjos-pn6N_75AeJZJ-R5eEi9KpTUG0GtLxj5o";
const ANALYTICS_SHEET = "Analytics";

function doGet() {
  return jsonResponse_({
    ok: true,
    service: "academic-glow-up",
    message: "Glow-Up backend is running."
  });
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action === "send_email") return sendGlowUpEmail_(payload);
    return logAnalytics_(payload);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function sendGlowUpEmail_(payload) {
  const email = String(payload.email || "").trim();
  const subject = String(payload.subject || "Your Academic Glow-Up");
  const message = String(payload.message || "");

  if (!isValidEmail_(email)) {
    return jsonResponse_({ ok: false, error: "Invalid email address." });
  }
  if (!message) {
    return jsonResponse_({ ok: false, error: "Email message is empty." });
  }

  MailApp.sendEmail({
    to: email,
    subject: subject,
    body: message,
    name: "Academic Glow-Up"
  });

  return jsonResponse_({ ok: true, delivery: "email" });
}

function logAnalytics_(payload) {
  const sheet = getAnalyticsSheet_();
  sheet.appendRow([
    new Date(),
    safe_(payload.event),
    safe_(payload.session_id),
    safe_(payload.program),
    safe_(payload.location),
    safe_(payload.result),
    safe_(payload.question),
    safe_(payload.choice),
    safe_(payload.category),
    safe_(payload.reset_step),
    safe_(payload.resource_title),
    safe_(payload.resource_url),
    safe_(payload.duration_seconds),
    safe_(payload.channel),
    safe_(payload.delivery),
    safe_(payload.error)
  ]);
  return jsonResponse_({ ok: true, logged: true });
}

function getAnalyticsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(ANALYTICS_SHEET);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(ANALYTICS_SHEET);
    sheet.appendRow([
      "server_timestamp",
      "event",
      "session_id",
      "program",
      "location",
      "result",
      "question",
      "choice",
      "category",
      "reset_step",
      "resource_title",
      "resource_url",
      "duration_seconds",
      "channel",
      "delivery",
      "error"
    ]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function safe_(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function jsonResponse_(object) {
  return ContentService
    .createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}
