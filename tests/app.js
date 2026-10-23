/* Checks the AP Labs app (installable web app + offline support).
   Run from ap-labs: node tests/app.js [root]
   root = the folder holding the sibling clones ap-labs, physics-mechanics, physics-em, chemistry-lab
   (default: the parent of this repo). They are served at the same paths as on jiacode2030.github.io. */
const path = require('path'), fs = require('fs'), http = require('http');
const { chromium, devices } = require(require('child_process').execSync('npm root -g').toString().trim() + '/playwright');
const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', '..'));
const COURSES = [['physics-mechanics', 'Mechanics Lab'], ['physics-em', 'E&M Lab'], ['chemistry-lab', 'Chemistry Lab'], ['calculus-lab', 'Calculus Lab']];
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (c, ...a) => c ? console.log('ok  ', ...a) : (fails++, console.log('FAIL', ...a));

const server = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end('not found'); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-cache' });
  fs.createReadStream(f).pipe(r);
});

(async () => {
  await new Promise(r => server.listen(0, 'localhost', r));
  const BASE = `http://localhost:${server.address().port}`;
  const b = await chromium.launch();

  // 1. manifest and icons
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'ap-labs', 'manifest.webmanifest'), 'utf8'));
  ok(man.name === 'AP Labs' && man.display === 'standalone' && man.scope === '/' && man.start_url === '/ap-labs/', 'manifest: name, standalone, scope covers the course sites');
  for (const ic of man.icons) ok(fs.existsSync(path.join(ROOT, ic.src.replace(/^\//, ''))), 'icon exists', ic.src, ic.purpose);
  ok(man.icons.some(i => i.purpose === 'maskable'), 'has a maskable icon (Android)');
  ok(fs.existsSync(path.join(ROOT, 'ap-labs/icons/apple-touch-icon.png')), 'has an Apple touch icon (iPhone)');

  // 2. in a normal browser: installable, Get the app button + dialog, only its own offline helper
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } }); const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/ap-labs/'); await p.evaluate(() => navigator.serviceWorker.ready);
    const cdp = await ctx.newCDPSession(p);
    const inst = await cdp.send('Page.getInstallabilityErrors');
    ok(inst.installabilityErrors.length === 0, 'Chrome says the app is installable', JSON.stringify(inst.installabilityErrors));
    ok(await p.isVisible('#install'), '"Get the app" button shows in the browser');
    await p.click('#install'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => document.querySelector('#appdlg').open), 'install dialog opens');
    ok(/Add to Home Screen/.test(await p.textContent('#appdlg')) && /Install app/.test(await p.textContent('#appdlg')), 'dialog has iPhone and Android steps');
    await p.click('#appdlg .cta'); await p.waitForTimeout(150);
    ok(await p.evaluate(() => !document.querySelector('#appdlg').open), 'dialog closes');
    const scopes = await p.evaluate(() => navigator.serviceWorker.getRegistrations().then(rs => rs.map(r => new URL(r.scope).pathname)));
    ok(JSON.stringify(scopes) === '["/ap-labs/"]', 'browser visitors only get the landing page saved', JSON.stringify(scopes));
    for (const [site, title] of COURSES) {
      await p.goto(BASE + '/' + site + '/'); await p.waitForTimeout(500);
      ok(await p.isVisible('#app-btn'), title + ': "Get the app" button shows');
      await p.click('#app-btn'); await p.waitForTimeout(200);
      ok(await p.evaluate(() => document.querySelector('#app-dlg').open && /Add to Home Screen/.test(document.querySelector('#app-dlg').textContent)), title + ': install steps open');
      await p.click('#app-dlg .approw button'); await p.waitForTimeout(150);
      ok(await p.evaluate(() => !document.querySelector('#app-dlg').open), title + ': steps close');
      ok(await p.evaluate(() => document.querySelector('link[rel=manifest]').getAttribute('href') === '/ap-labs/manifest.webmanifest'), title + ': installs the same AP Labs app');
    }
    ok(!errs.length, 'no page errors', errs.join(' | '));
    await ctx.close();
  }

  // 3. as the installed app (phone): saves every course, then everything works offline
  {
    const ctx = await b.newContext({ ...devices['iPhone 13'] });
    await ctx.addInitScript(() => { const mm = window.matchMedia.bind(window); window.matchMedia = q => /display-mode:\s*standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q); });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', e => errs.push(e.message));
    await p.goto(BASE + '/ap-labs/');
    ok(await p.isHidden('#install'), '"Get the app" button is hidden inside the app');
    for (const [site, title] of COURSES) { await p.goto(BASE + '/' + site + '/'); await p.waitForTimeout(400); ok(await p.isHidden('#app-btn'), title + ': button hidden inside the app'); }
    await p.goto(BASE + '/ap-labs/');
    const active = () => p.evaluate(() => navigator.serviceWorker.getRegistrations().then(rs => rs.filter(r => r.active).map(r => new URL(r.scope).pathname).sort()));
    let scopes = [];
    for (let i = 0; i < 60 && scopes.length < COURSES.length + 1; i++) { scopes = await active(); if (scopes.length < COURSES.length + 1) await p.waitForTimeout(500); }
    ok(JSON.stringify(scopes) === JSON.stringify(['/ap-labs/', '/calculus-lab/', '/chemistry-lab/', '/physics-em/', '/physics-mechanics/']), 'app saved the landing page and all three courses', JSON.stringify(scopes));
    await p.waitForTimeout(1500); // let precache finish writing
    await ctx.setOffline(true);
    for (const [site, title] of [['ap-labs', 'AP Labs'], ...COURSES]) {
      const res = await p.goto(BASE + '/' + site + '/').catch(e => null);
      await p.waitForTimeout(900);
      const t = await p.title().catch(() => '');
      const fit = await p.evaluate(() => innerWidth).catch(() => 0);
      ok(res && t === title, 'offline:', site, 'opens', `(title "${t}")`);
      ok(fit === 390, 'offline:', site, 'fits the phone', fit + 'px');
    }
    await p.goto(BASE + '/physics-em/#gauss').catch(() => {}); await p.waitForTimeout(800);
    ok(await p.evaluate(() => !document.querySelector('#v-gauss').hidden && document.querySelectorAll('#nav a').length > 20).catch(() => false), 'offline: a module page renders with its menu');
    ok(!errs.length, 'no page errors (online or offline)', errs.join(' | '));
    await ctx.setOffline(false); await ctx.close();
  }

  // 4. PHY 103 (Princeton Labs) is not part of the AP Labs app
  const phy = path.join(ROOT, 'phy103-lab', 'index.html');
  if (fs.existsSync(phy)) { const h = fs.readFileSync(phy, 'utf8'); ok(!/manifest|serviceWorker/.test(h), 'PHY 103 has no AP Labs app tags'); }

  await b.close(); server.close();
  console.log(fails ? `\n${fails} failed` : '\nall app checks passed'); process.exit(fails ? 1 : 0);
})();
