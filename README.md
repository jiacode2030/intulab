# AP Science Labs

Interactive, intuition-first study sites for AP sciences. This repo (`jiacode2030/ap-labs`) is the landing page at https://jiacode2030.github.io/ap-labs/, which links to each course site.

It's plain static files with no build step:

- `index.html` is the whole page (styles, script and the GoatCounter config line).
- `courses.js` is the course list.
- `tests/check.js` holds the Playwright checks.

> Unofficial study aids. Not affiliated with the College Board. Use these to study, not on graded work.

## Add a course

Add one entry to `courses.js`. Nothing else needs to change.

```js
{
  id: 'bio',                          // short and unique; used in events (open:bio)
  title: 'Biology Lab',
  course: 'AP Biology',
  subject: 'Biology',                 // Physics | Chemistry | Biology | Math
  description: 'One line about the site.',
  modules: 24,                        // the Y in "X of Y modules done"; null if unknown
  topics: ['Cells', 'Genetics', 'Evolution'],
  url: 'https://jiacode2030.github.io/biology-lab/',
  status: 'soon',                     // 'live' when the site is up
  accent: '#F59E0B',                  // the page darkens it in light mode
  prefix: 'bio-',                     // the site's localStorage prefix
  progressKey: 'bio-done',            // where the site stores "marked as done"
  label: 'course:bio'                 // label in ap-labs-feedback
}
```

- A subject filter chip appears once at least one course has that subject.
- Biology and Math already have icons. A brand-new subject falls back to a generic icon. To give it its own, add it to `ICONS` in `index.html`.
- Set `status: 'live'` once the site is deployed. Until then the card is muted, shows "Coming soon" and isn't a link.

### Progress rings

All the sites share one origin (`jiacode2030.github.io`), so the landing page can read each course's localStorage. It only reads and never writes. The ring shows when `progressKey` holds a JSON object of finished modules, for example `{"projectile": 1, "forces": 1}`, which is what Mechanics stores under `kin-done`. Missing or unreadable data hides the ring. When `modules` is `null`, the card shows "X modules done" with no ring.

New course sites should store progress the same way: `localStorage.setItem('<prefix>done', JSON.stringify({moduleId: 1, ...}))`.

The landing page has no "Continue where you left off" strip, because the course sites don't store a last-visited module. To add one later, have each site save `<prefix>last` = `"<moduleId>"`.

## Link back from each course site

Every course site should link back to the landing page. Paste this right after the site's brand link (in Mechanics, after `<a class="brand" ...>…</a>` in the side rail). It uses the site's own `--accent`, `--line` and `--ink` colors when they exist:

```html
<a class="morelabs" href="/ap-labs/">
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
  More AP labs
</a>
<style>
.morelabs{display:inline-flex;align-items:center;gap:8px;min-height:44px;padding:0 14px;border-radius:999px;
  border:1px solid var(--line,#C3D3E7);color:var(--ink,#0E1B2E);font:500 14px/1 inherit;text-decoration:none}
.morelabs:hover{border-color:var(--accent,#1F4FD6)}
.morelabs:focus-visible{outline:3px solid var(--accent,#1F4FD6);outline-offset:3px}
</style>
```

The link is relative (`/ap-labs/`), so it works on every site under `jiacode2030.github.io`. GoatCounter already counts the landing page view, so the link needs no event of its own.

## Deploy

Push to `main`. GitHub Pages serves this repo from the root of `main` (Settings → Pages → Deploy from a branch → `main` / root) at `https://jiacode2030.github.io/ap-labs/`. `.nojekyll` keeps Pages from running Jekyll.

The landing page sits beside the course sites under the same origin (`jiacode2030.github.io`), so it can still read their progress. The bare `jiacode2030.github.io/` stays free for a personal page. If you'd like it to forward here instead, create a `jiacode2030.github.io` repo whose `index.html` is `<!doctype html><meta http-equiv="refresh" content="0; url=/ap-labs/">`.

## Checks

These need Node.js and Playwright (Chromium):

```
node tests/check.js
```

The script opens the page at 360, 768 and 1280 px in light and dark, then checks for:

- horizontal overflow
- NaN or undefined text
- console errors
- touch targets under 44px
- text contrast under 4.5:1
- heading order
- IDs that differ only by case

It also seeds fake progress and confirms the ring reads "12 of 32 modules done", that bad or missing data hides the ring, and that the course keys are never written. Screenshots go to `tests/shots/`, or to the folder in `SHOTS=...`.

## Feedback and analytics

### Issues: one shared repo

Every site reports to [`jiacode2030/ap-labs-feedback`](https://github.com/jiacode2030/ap-labs-feedback). That repo has issue forms for **Content error**, **Bug** and **Suggestion**, each with a Course dropdown. A small workflow adds the `course:*` label from the dropdown, or from the `**Course:**` line the sites pre-fill.

To see issues across courses, filter by label:

- One course: `is:issue is:open label:course:mechanics`
- One type everywhere: `is:issue is:open label:type:bug`
- Everything open: `is:issue is:open`, then sort by newest or by most commented

Create the labels once (Issues → Labels): `course:mechanics`, `course:em`, `course:chem`, `course:landing`, `type:content`, `type:bug` and `type:suggestion`. The workflow creates any `course:*` label that's missing the first time it's used.

**Snippet for each course site.** The Mechanics site builds its issue link from `REPO` in its Report code. Replace that constant and the `issue.href=...` line with this, and change the three constants per site:

```js
const REPO='https://github.com/jiacode2030/ap-labs-feedback';
const COURSE='Mechanics Lab', COURSE_LABEL='course:mechanics', SITE_VERSION='2026-10-23';
// in fallback(r):
issue.href=REPO+'/issues/new?labels='+encodeURIComponent(COURSE_LABEL)
  +'&title='+encodeURIComponent(clip(`[${COURSE}] [${r.type}] ${viewName(r.where)}: ${r.details.replace(/\s+/g,' ')}`,100))
  +'&body='+encodeURIComponent(`**Course:** ${COURSE}\n**Module:** ${viewName(r.where)} (#${r.where})\n**Type:** ${r.type}\n**Site version:** ${SITE_VERSION}\n\n${r.details}\n\n**Context:** ${r.context}`);
```

The values per site are:

| Site | `COURSE` | `COURSE_LABEL` |
|---|---|---|
| Mechanics | `Mechanics Lab` | `course:mechanics` |
| E&M | `E&M Lab` | `course:em` |
| Chemistry | `Chemistry Lab` | `course:chem` |

(GitHub applies the `labels=` URL parameter only for people with triage access. For everyone else, the workflow labels the issue from the `**Course:**` line.)

### Analytics: GoatCounter

GoatCounter is free and uses no cookies, so no consent banner is needed. It sends anonymous counts only, with no personal data. Every site reports to one GoatCounter property, so you see views per path (`/ap-labs/`, `/physics-mechanics/projectile`, `/physics-em/gauss`, ...) in one dashboard.

The landing page has one config line in `index.html`:

```js
const GOATCOUNTER = 'aplabs';   // the part before .goatcounter.com
```

The page loads the counter only on `*.github.io`, so local testing isn't counted. Your dashboard is at https://aplabs.goatcounter.com.

**Snippet for each course site.** The Mechanics site already has this pattern. Point it at the shared code:

```js
(function analytics(){if(!/\.github\.io$/.test(location.hostname))return;window.goatcounter={no_onload:true};
  const s=document.createElement('script');s.async=true;s.src='https://gc.zgo.at/count.js';
  s.dataset.goatcounter='https://aplabs.goatcounter.com/count';
  const view=()=>{const id=(location.hash||'').slice(1)||'overview';if(window.goatcounter&&window.goatcounter.count)
    window.goatcounter.count({path:location.pathname.replace(/\/$/,'')+'/'+id,title:id});};
  s.onload=()=>{view();addEventListener('hashchange',view);};document.head.appendChild(s);})();
```

**Events.** The landing page sends `open:<course-id>` when someone opens a course card. A course site can send a module event in one line, for example when a module opens or is marked done:

```js
window.goatcounter?.count?.({path:'module:'+id, title:'module:'+id, event:true});
```

Use `module:<id>` for opens and `done:<id>` for "marked as done" (for example, call it in `setDone` when `v` is true).

**Reading the counts.** In the GoatCounter dashboard:

- **Pages** lists views per path. Filter by `/physics-mechanics/` to see one course.
- Events (`open:*`, `module:*`, `done:*`) appear in the same list, marked as events. Type `open:` in the filter box to compare which cards get clicked.
- Set the date range at the top. The **Referrers** panel shows where visitors came from.
