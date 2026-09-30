import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
const flags=process.argv.slice(2);
if(flags.some(flag=>!['--native-intake','--register-native-form'].includes(flag)))throw new Error('Unknown build option');
if(flags.length>1)throw new Error('Conflicting or repeated build mode options');
const native=flags.includes('--native-intake');
const output = new URL('../dist/', import.meta.url);
const allowed = ['index.html', 'portal-intro.html'];
await mkdir(output, { recursive: true });
for (const entry of await readdir(output, { withFileTypes: true })) {
 if (!allowed.includes(entry.name) || !entry.isFile())throw new Error('Unsafe dist contents: inspect and remove unexpected output before building.');
}
for (const name of allowed) await copyFile(new URL('../' + name, import.meta.url), new URL(name, output));
if(native){
 let html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const adapter=await readFile(new URL('./adapters/native-browser.mjs',import.meta.url),'utf8');
 html=html.replace("const INQUIRY_RELEASE_MODE = 'legacy';","const INQUIRY_RELEASE_MODE = 'native';")
  .replace('/* NATIVE_BROWSER_IMPLEMENTATION */',()=>adapter.replace('export function','function'))
  .replace('<form class="form-card" id="scopeForm"','<form name="fh-inquiry-v1" method="POST" data-netlify="true" netlify-honeypot="website" class="form-card" id="scopeForm"')
  .replace('<!-- NATIVE_FIELDS_START -->','<input type="hidden" name="form-name" value="fh-inquiry-v1"><input type="hidden" name="intake" value="">')
  .replace('id="nativeFields" hidden disabled','id="nativeFields"')
  .replace('id="inquiry-pain" maxlength="5000"','id="inquiry-pain" required minlength="20" maxlength="4000"');
 await writeFile(new URL('index.html',output),html);
}

if(flags.includes('--register-native-form')){
 let html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 const unavailable='Online inquiries are currently unavailable. This site is not accepting submissions.';
 const start=html.indexOf('    <form class="form-card" id="scopeForm"');
 const end=html.indexOf('  </div></div></section>',start);
 const scriptStart=html.indexOf('let inquiryAttempt = null;');
 const scriptEnd=html.indexOf('// konasushi.com slideshow',scriptStart);
 if(start<0||end<0||scriptStart<0||scriptEnd<0)throw new Error('Registration build markers missing');
 // Remove both transport implementations, not merely the submit button.
 html=html.slice(0,scriptStart)+`const INQUIRY_RELEASE_MODE = 'registration';
function submitScope(e){
 if(e)e.preventDefault();
 document.getElementById('inquiryStatus').textContent=${JSON.stringify(unavailable)};
 return false;
}
`+html.slice(scriptEnd);
 html=html.slice(0,start)+`    <div class="form-card"><h2>Inquiries unavailable</h2><p id="inquiryStatus" role="status">${unavailable}</p></div>
    <!-- Registration schema only: no customer controls or transport. -->
    <form name="fh-inquiry-v1" method="POST" data-netlify="true" netlify-honeypot="website" hidden inert aria-hidden="true" onsubmit="event.preventDefault(); return false;">
      <fieldset disabled>
        <input type="hidden" name="form-name" value="fh-inquiry-v1">
        <input type="hidden" name="intake" value="">
        <input type="hidden" name="website" value="">
      </fieldset>
    </form>
`+html.slice(end);
 await writeFile(new URL('index.html',output),html);
}
