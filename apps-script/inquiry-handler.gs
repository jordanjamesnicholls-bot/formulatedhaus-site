/*************************************************************
 * FORMULATED HAUS — Website Inquiry Handler (wired to the Ops portal)
 * Public web app the website "Start a project" form POSTs to. It writes each
 * inquiry straight into the Ops portal's "Leads" tab (so it shows up in the
 * portal, ready to one-click convert) and emails your Workspace inbox.
 *
 * SETUP:
 *  1. New Apps Script project → paste this file.
 *  2. Set NOTIFY_TO to your inbox.
 *  3. Set the Ops sheet id as a SCRIPT PROPERTY, not in this file:
 *       Project Settings → Script Properties → Add
 *       Property: OPS_SHEET_ID   Value: <id from the Ops sheet URL, between /d/ and /edit>
 *     Without it the script falls back to finding the sheet by name, which
 *     still works but needs a broader Drive scope.
 *  4. Deploy → Web app → Execute as ME · Access: ANYONE. Copy the /exec URL.
 *  5. Put that URL in the website Site HTML's INQUIRY_ENDPOINT.
 *  6. Run testAppend() once to authorize + confirm a row lands in the Leads tab.
 *************************************************************/

const NOTIFY_TO   = 'jordan@formulatedhaus.com';        // ← your Workspace inbox

// The Ops sheet id is read from a SCRIPT PROPERTY rather than written here.
//
// This file lives in a git repo. A sheet id is not a password — the sheet still
// has to be shared with whoever asks — but it IS the link to that sheet, and the
// Leads tab holds prospect names, emails and budgets. If the sheet is ever set
// to "anyone with the link", an id sitting in source becomes the way in. Keeping
// it out of the repo means that mistake stays survivable.
//
// Set it once: Project Settings → Script Properties → OPS_SHEET_ID
function opsSheetId_(){
  try { return PropertiesService.getScriptProperties().getProperty('OPS_SHEET_ID') || ''; }
  catch (err) { return ''; }
}
const OPS_SHEET_TITLE = 'Formulated Haus — Ops';
const LEADS_TAB   = 'Leads';
const LEADS_HEADERS = ['Timestamp','Name','Business','Email','Type','Locations','Needs','Pain','Timeline','Budget','Status'];

function doPost(e){
  try{
    const p = (e && e.parameter) || {};
    const needs = (e && e.parameters && e.parameters.needs) ? e.parameters.needs.join(', ') : (p.needs || '');
    const stamp = new Date();
    leadsTab_().appendRow([stamp, p.name||'', p.business||'', p.email||'', p.type||'',
      p.locations||'', needs, p.pain||'', p.timeline||'', p.budget||'', 'New']);
    notify_(p, needs, stamp);
    return json_({ ok:true });
  }catch(err){
    try{ MailApp.sendEmail(NOTIFY_TO, 'Inquiry (error saving)', JSON.stringify((e&&e.parameter)||{}) + '\n\n' + err); }catch(_){}
    return json_({ ok:false, error:String(err) });
  }
}
function doGet(){ return ContentService.createTextOutput('Formulated Haus — inquiry endpoint is live.'); }

function opsSheet_(){
  const id = opsSheetId_();
  if (id) return SpreadsheetApp.openById(id);
  const it = DriveApp.getFilesByName(OPS_SHEET_TITLE);
  if (it.hasNext()) return SpreadsheetApp.open(it.next());
  throw new Error('Ops sheet not found. Set the OPS_SHEET_ID script property (Project Settings → Script Properties), or run the Ops portal setup() first.');
}
function leadsTab_(){
  const ss = opsSheet_();
  let sh = ss.getSheetByName(LEADS_TAB);
  if (!sh) sh = ss.insertSheet(LEADS_TAB);
  if (sh.getLastRow() === 0){ sh.appendRow(LEADS_HEADERS); sh.getRange(1,1,1,LEADS_HEADERS.length).setFontWeight('bold'); sh.setFrozenRows(1); }
  return sh;
}
function notify_(p, needs, stamp){
  const when = Utilities.formatDate(stamp, Session.getScriptTimeZone(), 'EEE MMM d, yyyy · h:mm a');
  const rows = [['Business',p.business],['Name',p.name],['Email',p.email],['Type',p.type],
    ['Locations',p.locations],['Needs',needs],['Timeline',p.timeline],['Budget',p.budget]]
    .map(function(r){ return '<tr><td style="padding:6px 14px 6px 0;color:#8A8377">'+r[0]+
      '</td><td style="padding:6px 0;color:#26231F"><b>'+(r[1]||'—')+'</b></td></tr>'; }).join('');
  const pain = p.pain ? '<p style="margin:14px 0 0;color:#3a352e"><i>“'+escHtml_(p.pain)+'”</i></p>' : '';
  MailApp.sendEmail({ to: NOTIFY_TO, replyTo: p.email || NOTIFY_TO,
    subject: 'New inquiry — ' + (p.business || p.name || 'website'),
    htmlBody: '<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px">'+
      '<div style="font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:#2540D0;font-weight:700">New project inquiry</div>'+
      '<h2 style="margin:6px 0 2px;color:#26231F">'+escHtml_(p.business||p.name||'Website inquiry')+'</h2>'+
      '<div style="font-size:12px;color:#8A8377">'+when+'</div>'+
      '<table style="margin-top:16px;font-size:14px;border-collapse:collapse">'+rows+'</table>'+pain+
      '<p style="margin:22px 0 0;font-size:12px;color:#8A8377">In your Ops portal under Leads → Convert.</p></div>' });
}
function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function escHtml_(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

/** Run once to authorize + drop a test lead into the Ops portal. */
function testAppend(){
  leadsTab_().appendRow([new Date(),'Test Lead','Test Business','test@example.com','Gym / Fitness studio','2–3 locations','Website, Staff Portal','Onboarding is chaos','1–3 months','$15k–$40k','New']);
  return 'Test lead added to the Ops portal Leads tab.';
}
