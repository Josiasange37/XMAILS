/**
 * XYBERCLAN WEBINAIRE #1 — Automated Confirmation Email
 * Google Apps Script: Form Submit -> Resend API
 *
 * SETUP:
 * 1. Extensions > Apps Script > Paste this code
 * 2. Run setupApiKey() once to store your Resend API key
 * 3. Triggers (clock icon) > Add Trigger:
 *    - Function: sendEmail
 *    - Event: On form submit
 * 4. Test by submitting the form
 */

// ─── CONFIG ───────────────────────────────────────────────────────────────────
// Edit these to match your Google Form columns (0 = column A, 1 = column B, ...)

var COL_NAME  = 0;  // Column A: Full Name
var COL_EMAIL = 1;  // Column B: Email Address

var EVENT_NAME    = 'XYBERCLAN WEBINAIRE #1';
var CALENDAR_LINK = 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=XYBERCLAN%20WEBINAIRE%20%231&dates=20260710T190000Z/20260710T210000Z&details=XYBERCLAN%20Webinar&location=Google%20Meet';
var WHATSAPP_LINK = 'https://chat.whatsapp.com/IZr5ypRWXj14m6FYXiJsYE';

var FROM_NAME  = 'XYBERCLAN';
var FROM_EMAIL = 'hello@xyberclan.dev';
var LOG_SHEET  = '_EmailLog';

// ─── MAIN ─────────────────────────────────────────────────────────────────────

function sendEmail(e) {
  if (!e || !e.values) {
    logError('No form submission event. Did you click Run manually? Use testSend() instead.');
    return;
  }

  var name  = e.values[COL_NAME];
  var email = e.values[COL_EMAIL];

  if (!name || !email) {
    logError('Missing name or email in row');
    return;
  }

  email = email.trim().toLowerCase();

  if (alreadySent(email)) {
    logInfo('Skipped - already sent to ' + email);
    return;
  }

  var payload = {
    from: FROM_NAME + ' <' + FROM_EMAIL + '>',
    to: [email],
    subject: EVENT_NAME + ' - Registration Confirmed',
    html: buildEmail(name),
  };

  var result = sendWithRetry(payload);

  if (result.success) {
    markSent(email, result.messageId);
    logInfo('Sent to ' + email + ' (' + result.messageId + ')');
  } else {
    logError('Failed for ' + email + ' - ' + result.error);
  }
}

// ─── RESEND API (with retry) ─────────────────────────────────────────────────

function sendWithRetry(payload) {
  var apiKey = PropertiesService.getScriptProperties().getProperty('RESEND_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'API key not set. Run setupApiKey() first.' };
  }

  var maxAttempts = 3;

  for (var attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      var response = UrlFetchApp.fetch('https://api.resend.com/emails', {
        method: 'post',
        headers: {
          Authorization: 'Bearer ' + apiKey,
          'Content-Type': 'application/json',
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      });

      var code = response.getResponseCode();
      var body = JSON.parse(response.getContentText());

      if (code >= 200 && code < 300) {
        return { success: true, messageId: body.id };
      }

      if (code === 429) {
        var wait = parseInt(response.getHeaders()['Retry-After'] || '10', 10);
        Utilities.sleep(Math.min(wait, 20) * 1000);
        continue;
      }

      if (code >= 400 && code < 500) {
        return { success: false, error: 'HTTP ' + code + ': ' + body.error.message };
      }

      Utilities.sleep(Math.pow(2, attempt) * 1000);
    } catch (err) {
      Utilities.sleep(Math.pow(2, attempt) * 1000);
    }
  }

  return { success: false, error: 'Max retries exceeded' };
}

// ─── MANUAL TEST ──────────────────────────────────────────────────────────────

function testSend() {
  var mockEvent = {
    values: ['Test User', 'your-email@gmail.com'] // <- replace with your email
  };
  sendEmail(mockEvent);
}

// ─── EMAIL HTML ───────────────────────────────────────────────────────────────

function buildEmail(name) {
  var firstName = name.split(' ')[0];

  var h = '';
  h += '<div style="font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;">';

  h += '<div style="background-color:#0c0a20;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">';
  h += '<h1 style="margin:0;color:#fff;font-size:20px;">XYBERCLAN</h1>';
  h += '<p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Community &#183; Tech &#183; Growth</p>';
  h += '</div>';

  h += '<div style="background:#fff;padding:28px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">';

  h += '<h2 style="margin:0 0 16px;font-size:20px;">Hello ' + escapeHtml(firstName) + ',</h2>';

  h += '<p style="margin:0 0 16px;font-size:15px;">';
  h += 'Thank you for registering for ';
  h += '<strong style="color:#0ea5e9;">XYBERCLAN WEBINAIRE #1</strong>.';
  h += '</p>';

  h += '<div style="margin:0 0 20px;padding:16px 20px;background:#f8fafc;border-radius:8px;border-left:4px solid #0ea5e9;">';
  h += '<p style="margin:0 0 4px;">&#128197; <strong style="color:#0ea5e9;">10 July 2026</strong></p>';
  h += '<p style="margin:0 0 4px;">&#128344; <strong style="color:#0ea5e9;">20:00 GMT+1</strong></p>';
  h += '<p style="margin:0;">&#127758; <strong style="color:#0ea5e9;">Google Meet</strong></p>';
  h += '</div>';

  h += '<p style="margin:0 0 12px;">';
  h += '<a href="' + CALENDAR_LINK + '" target="_blank" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">';
  h += '&#128197; Add to Google Calendar';
  h += '</a>';
  h += '</p>';

  h += '<p style="margin:0 0 20px;font-size:14px;">';
  h += 'Join our WhatsApp community:<br>';
  h += '<a href="' + WHATSAPP_LINK + '" target="_blank" style="color:#0ea5e9;font-weight:600;text-decoration:none;">';
  h += 'Click here to join &#128172;';
  h += '</a>';
  h += '</p>';

  h += '<div style="margin:0 0 16px;padding:12px 16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #0ea5e9;">';
  h += '<p style="margin:0;font-size:13px;color:#0c4a6e;">';
  h += '&#9888; The Google Meet link will be sent 24 hours before the event.';
  h += '</p>';
  h += '</div>';

  h += '<p style="margin:20px 0 0;font-size:14px;">';
  h += 'See you soon,<br>';
  h += '<strong style="color:#0ea5e9;">XYBERCLAN Team</strong>';
  h += '</p>';

  h += '</div>';

  h += '<p style="margin:12px 0;font-size:12px;color:#9ca3af;text-align:center;">';
  h += 'XYBERCLAN &#8212; <a href="https://xyberclan.dev" style="color:#0ea5e9;text-decoration:none;">xyberclan.dev</a>';
  h += '</p>';

  h += '</div>';

  return h;
}

// ─── DEDUP ────────────────────────────────────────────────────────────────────

function alreadySent(email) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(LOG_SHEET);
  if (!sheet) return false;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === email) return true;
  }
  return false;
}

function markSent(email, msgId) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(LOG_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET);
    sheet.appendRow(['Email', 'MessageID', 'Event', 'SentAt']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  sheet.appendRow([email, msgId, EVENT_NAME, new Date().toISOString()]);
}

// ─── LOGGING ──────────────────────────────────────────────────────────────────

function logInfo(msg) {
  Logger.log('[INFO] ' + msg);
  writeLog('INFO', msg);
}

function logError(msg) {
  Logger.log('[ERROR] ' + msg);
  writeLog('ERROR', msg);
}

function writeLog(level, msg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('_SystemLog');
    if (!sheet) {
      sheet = ss.insertSheet('_SystemLog');
      sheet.appendRow(['Level', 'Message', 'Timestamp']);
      sheet.getRange(1, 1, 1, 3).setFontWeight('bold');
    }
    sheet.appendRow([level, msg, new Date().toISOString()]);
  } catch(e) {
    Logger.log('[LOG FAILED] ' + e);
  }
}

// ─── SETUP - run once ─────────────────────────────────────────────────────────

function setupApiKey() {
  var ui = SpreadsheetApp.getUi();
  var key = ui.prompt('Resend API Key', 'Enter your Resend API key (re_...):', ui.ButtonSet.OK_CANCEL);

  if (key.getSelectedButton() !== ui.Button.OK) return;

  var value = key.getResponseText().trim();
  if (value.indexOf('re_') !== 0) {
    ui.alert('Invalid key - must start with re_');
    return;
  }

  PropertiesService.getScriptProperties().setProperty('RESEND_API_KEY', value);
  ui.alert('API key stored securely in Script Properties');
}

function testConfig() {
  var key = PropertiesService.getScriptProperties().getProperty('RESEND_API_KEY');
  var msg = 'Resend Key: ' + (key ? 'SET' : 'NOT SET');

  var sheet = SpreadsheetApp.getActiveSheet();
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  msg += '\nHeaders: ' + headers.join(' | ');

  Logger.log(msg);
  SpreadsheetApp.getUi().alert(msg);
}

// ─── UTILITY ──────────────────────────────────────────────────────────────────

function escapeHtml(text) {
  text = String(text);
  text = text.replace(/&/g, '&amp;');
  text = text.replace(/</g, '&lt;');
  text = text.replace(/>/g, '&gt;');
  text = text.replace(/"/g, '&quot;');
  return text;
}
