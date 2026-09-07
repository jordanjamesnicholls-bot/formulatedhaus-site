# Formulated Haus — website

The live site at **formulatedhaus.com**, served from Netlify.

## Files

| Path | What it is |
|---|---|
| `index.html` | The whole site. One hand-written file: markup, CSS and JS inline, no build step. Was `Formulated Haus — Site.html` before this repo; renamed because `index.html` is the name Netlify serves it under and the name it needs to deploy from a repo. |
| `portal-intro.html` | Standalone portal introduction page. Not currently linked from the site. |
| `apps-script/inquiry-handler.gs` | Google Apps Script that receives the site's inquiry form. Deployed from the Apps Script editor, NOT from here — this copy is for version history and review. Editing it here does not change what's live. |

### The Apps Script needs one property set

It reads the Ops sheet id from a **Script Property**, not from source, so the id
never lands in this repo:

    Apps Script editor → Project Settings → Script Properties → Add
    Property: OPS_SHEET_ID
    Value:    the id in the Ops sheet URL, between /d/ and /edit

Without it the script still works — it falls back to finding the sheet by name —
but that needs a broader Drive scope, so setting the property is preferred.

## Deploying

The site is a single static file, so there is no build. Whatever is at
`index.html` on `main` is the site.

If Netlify is connected to this repo, pushing to `main` publishes. If it is
still drag-and-drop, remember that a manual upload does not update this repo —
and this repo not matching the live site is the exact problem it exists to
prevent.

## Conventions

- No build step and no framework, on purpose. Keep it that way unless there is
  a reason not to.
- Real credentials never live in this repo. Apps Script secrets belong in
  Script Properties; anything else belongs in the Netlify dashboard.
