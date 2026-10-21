/* UniPath Africa — Admin console */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const SESSION = 'unipath.admin.session';
  const RESEARCH_KEY = 'unipath.research.log';
  let D = null;          // working draft
  let PUB = null;        // published content
  let section = 'dashboard';
  let editState = { q: '', filter: '' };

  const FIELDS = ['Business & Management', 'Computing & IT', 'Economics & Finance', 'Health & Medicine', 'Engineering', 'Law', 'Education', 'Agriculture & Environment', 'Arts & Social Sciences', 'Science & Mathematics', 'Architecture & Design', 'Media & Communication'];
  const DOC_KEYS = ['', 'transcripts', 'certificates', 'id', 'passport', 'photo', 'birth', 'statement', 'references', 'english', 'finance', 'cv', 'degree'];

  /* ---------- Collection schemas ---------- */
  const SCHEMAS = {
    programs: {
      title: 'Programmes', icon: 'cap', singular: 'programme', idPrefix: 'prog',
      cols: [['program', 'Programme'], ['university', 'University'], ['country', 'Country'], ['deadline', 'Deadline', 'date'], ['verified', 'Data', 'verified']],
      search: ['program', 'university', 'country', 'city', 'field'],
      fields: [
        ['university', 'University', 'text', { required: true }], ['program', 'Programme name', 'text', { required: true }],
        ['country', 'Country', 'text', { required: true }], ['city', 'City', 'text'],
        ['region', 'Region', 'select', { options: ['Africa', 'International'] }], ['level', 'Level', 'select', { options: ['Undergraduate', 'Postgraduate'] }],
        ['field', 'Field of study', 'select', { options: FIELDS }], ['mode', 'Study mode', 'text', { placeholder: 'On campus / Online / Evening' }],
        ['durationYears', 'Duration (years)', 'number'], ['intake', 'Intake', 'text', { placeholder: 'e.g. August 2027' }],
        ['tuitionUSD', 'Tuition per year (USD)', 'number', { hint: 'Enter in US dollars — the site converts to each student’s currency.' }], ['livingUSD', 'Living costs per year (USD)', 'number'],
        ['appFeeUSD', 'Application fee (USD)', 'number'], ['deadline', 'Application deadline', 'date'],
        ['minScore', 'Minimum academic score (0–100)', 'number', { hint: 'Normalised scale used for matching. Guide: UACE 14–16 pts ≈ 74 · KCSE B ≈ 78 · WASSCE 6 credits (B) ≈ 80 · IB 32–35 ≈ 78 · 2:1 degree ≈ 80 · 2:2 ≈ 66.' }],
        ['scholarships', 'Scholarships / financial aid available', 'bool'],
        ['requirementsText', 'Entry requirements (shown to students)', 'textarea', { full: true }], ['englishTest', 'English requirement', 'text', { full: true }],
        ['officialUrl', 'Official website', 'url'], ['applyUrl', 'Application portal', 'url'],
        ['verified', 'Verified against the official website', 'bool'], ['lastVerified', 'Date verified', 'date'],
        ['notes', 'Notes for students', 'textarea', { full: true }], ['id', 'ID (used in links)', 'text', { hint: 'Leave as is. Short, no spaces.' }]
      ],
      defaults: { region: 'Africa', level: 'Undergraduate', field: FIELDS[0], durationYears: 3, tuitionUSD: 0, livingUSD: 0, appFeeUSD: 0, minScore: 60, scholarships: false, verified: false, mode: 'On campus' }
    },
    scholarships: {
      title: 'Scholarships', icon: 'award', singular: 'scholarship', idPrefix: 'sch',
      cols: [['name', 'Scholarship'], ['provider', 'Provider'], ['level', 'Level'], ['coverage', 'Coverage']], search: ['name', 'provider', 'destinations'],
      fields: [['name', 'Name', 'text', { required: true, full: true }], ['provider', 'Provider', 'text'], ['coverage', 'Coverage', 'text', { placeholder: 'Full / Partial / Tuition only' }],
        ['level', 'Level', 'select', { options: ['Undergraduate', 'Postgraduate', 'Both'] }], ['destinations', 'Where students study', 'text'],
        ['deadlineNote', 'Deadline / timing', 'text'], ['url', 'Official link', 'url'], ['eligibility', 'Who can apply', 'textarea', { full: true }], ['id', 'ID', 'text']],
      defaults: { level: 'Both' }
    },
    checklistItems: {
      title: 'Checklist items', icon: 'list', singular: 'checklist item', idPrefix: 'chk',
      cols: [['label', 'Item'], ['group', 'Applies to'], ['docKey', 'Linked document']], search: ['label', 'tip', 'group'],
      intro: 'These build every student’s personalised checklist. “Common” items apply to all applications; “Local” when studying in their home country; “International” when abroad; “Postgraduate” for master’s applications. Linking a document lets the student’s vault tick it automatically.',
      fields: [['label', 'Checklist item', 'text', { required: true, full: true }], ['group', 'Applies to', 'select', { options: ['common', 'local', 'international', 'postgraduate'] }],
        ['docKey', 'Linked vault document', 'select', { options: DOC_KEYS }], ['tip', 'Helpful tip', 'textarea', { full: true }], ['id', 'ID', 'text']],
      defaults: { group: 'common', docKey: '' }
    },
    glossary: { title: 'Glossary', icon: 'book', singular: 'term', cols: [['term', 'Term'], ['definition', 'Definition']], search: ['term', 'definition'], fields: [['term', 'Term', 'text', { required: true, full: true }], ['definition', 'Plain-language definition', 'textarea', { required: true, full: true }]], defaults: {} },
    faqs: { title: 'FAQs', icon: 'help', singular: 'question', cols: [['q', 'Question'], ['a', 'Answer']], search: ['q', 'a'], fields: [['q', 'Question', 'text', { required: true, full: true }], ['a', 'Answer', 'textarea', { required: true, full: true }]], defaults: {} },
    enrollSteps: { title: 'Enrolment steps', icon: 'cap', singular: 'step', idPrefix: 'e', cols: [['title', 'Step'], ['detail', 'Detail']], search: ['title', 'detail'], fields: [['title', 'Step title', 'text', { required: true, full: true }], ['detail', 'What to do', 'textarea', { full: true }], ['id', 'ID', 'text']], defaults: {} },
    quotes: {
      title: 'User quotes', icon: 'message', singular: 'quote', cols: [['text', 'Quote'], ['who', 'Attributed to'], ['consent', 'Consent', 'bool'], ['show', 'On homepage', 'bool']], search: ['text', 'who'],
      intro: 'Add genuine quotes from your interviews and testing. A quote only appears on the homepage when consent is ticked AND “Show” is on. Use participant codes or roles (e.g. “P03, S6 student, Kampala”) rather than full names unless the person agreed.',
      fields: [['text', 'Quote (exact words)', 'textarea', { required: true, full: true }], ['who', 'Attribution', 'text', { placeholder: 'e.g. P02 · Prospective student, Mbarara', full: true }], ['consent', 'Participant gave consent to be quoted', 'bool'], ['show', 'Show on homepage', 'bool']],
      defaults: { consent: false, show: true }
    },
    testerTasks: { title: 'Usability tasks', icon: 'test', singular: 'task', idPrefix: 't', cols: [['title', 'Task'], ['instruction', 'Instruction'], ['route', 'Starts at']], search: ['title', 'instruction'], intro: 'Tasks shown to participants in the guided usability test (Help us test → Start usability test). “Starts at” is the page they are sent to, e.g. #/discover.', fields: [['title', 'Task title', 'text', { required: true }], ['route', 'Starts at (page)', 'text', { placeholder: '#/match' }], ['instruction', 'Instruction to participant', 'textarea', { full: true }], ['id', 'ID', 'text']], defaults: { route: '#/' } },
    interviewQuestions: { title: 'Interview questions', icon: 'mic', singular: 'question', idPrefix: 'q', cols: [['q', 'Question']], search: ['q'], fields: [['q', 'Question', 'text', { required: true, full: true }], ['id', 'ID', 'text']], defaults: {} }
  };

  /* ---------- Draft helpers ---------- */
  const clone = (o) => JSON.parse(JSON.stringify(o));
  function persist() { U.Content.saveDraft(D); renderTopPill(); }
  function isDirty() { const a = clone(D), b = clone(PUB); [a, b].forEach((x) => { if (x.meta) { delete x.meta.draftSavedAt; delete x.meta.updatedAt; delete x.meta.publishedBy; delete x.meta.version; } if (x.site) delete x.site.adminPassHash; }); return JSON.stringify(a) !== JSON.stringify(b); }
  function renderTopPill() { const el = $('#pill'); if (!el) return; const d = isDirty(); el.className = 'draft-pill ' + (d ? 'dirty' : 'clean'); el.innerHTML = icon(d ? 'alert' : 'check') + (d ? 'Unpublished changes' : 'In sync with live site'); }

  /* ---------- Boot & auth ---------- */
  let ONLINE = false, ME = null;
  async function boot() {
    ONLINE = await U.API.check();
    await U.Content.load();
    PUB = clone(U.Content.published);
    D = U.Content.draft() || clone(PUB);
    ['site', 'currencies'].forEach((k) => { D[k] = D[k] || {}; });
    Object.keys(SCHEMAS).forEach((k) => { D[k] = D[k] || []; });
    const sess = U.store(SESSION);
    if (sess && sess.until > Date.now() && (!ONLINE || U.API.token('admin'))) { ME = sess.who || null; shell(); } else login();
  }
  function api(method, path, body, opts) { return U.API.call(method, 'admin/' + path, body, Object.assign({ admin: true }, opts || {})).catch((e) => { if (e.status === 401) { U.store(SESSION, null); U.API.setToken('', 'admin'); login(); U.toast('Please sign in again', 'lock'); } throw e; }); }
  function login() {
    $('#root').innerHTML = '<div class="login"><form class="card pad-lg" id="lf"><div class="brand"><span class="brand-mark">' + icon('cap') + '</span><span>' + esc((D.site || {}).name || 'UniPath Africa') + '<small>Admin console</small></span></div>' +
      '<h2 class="mt3" style="font-size:1.6rem">Team sign-in</h2><p class="muted small">' + (ONLINE ? 'Sign in with your team email and password — or leave email blank and use the owner passcode.' : 'Enter the admin passcode.') + '</p>' +
      (ONLINE ? '<label class="field"><span>Email <small class="muted">(blank for owner)</small></span><input type="email" name="email" autocomplete="username"></label>' : '') +
      '<label class="field mt2"><span>' + (ONLINE ? 'Password / passcode' : 'Passcode') + '</span><input type="password" name="p" autocomplete="current-password" required autofocus></label>' +
      '<label class="check small mt2"><input type="checkbox" name="keep" checked>Keep me signed in on this device for 7 days</label>' +
      '<button class="btn block lg mt3">' + icon('lock') + 'Sign in</button><p class="small muted mt2 mb0"><a href="index.html">← Back to the site</a></p><p class="small mt1 mb0" id="lerr" style="color:var(--bad)"></p>' +
      (ONLINE ? '' : '<div class="notice warn mt2">' + icon('alert') + '<p class="small">Server not connected — this copy of the site was deployed without its backend, so student accounts and live publishing are unavailable.</p></div>') + '</form></div>';
    $('#lf').onsubmit = async (e) => {
      e.preventDefault(); const f = e.target; const keep = f.keep.checked;
      if (ONLINE) {
        try { const r = await U.API.call('POST', 'admin/login', { email: f.email.value, password: f.p.value }); U.API.setToken(r.token, 'admin'); ME = r.admin; U.store(SESSION, { until: Date.now() + (keep ? 7 : 0.5) * 86400000, who: r.admin }); shell(); }
        catch (err) { $('#lerr').textContent = err.message; f.p.select(); }
        return;
      }
      const h = await U.sha256('unipath:' + f.p.value);
      const okHash = (PUB.site && PUB.site.adminPassHash) || (D.site && D.site.adminPassHash);
      if (h === okHash) { U.store(SESSION, { until: Date.now() + (keep ? 7 : 0.5) * 86400000 }); shell(); }
      else { $('#lerr').textContent = 'That passcode isn’t right.'; f.p.select(); }
    };
  }

  /* ---------- Shell ---------- */
  const NAV = [
    ['dashboard', 'grid', 'Dashboard'], ['sep', 'Students'], ['students', 'users', 'Students'], ['inbox', 'mail', 'Adviser inbox'], ['sep', 'Content'], ['site', 'home', 'Site & homepage'],
    ['programs', 'cap', 'Programmes'], ['scholarships', 'award', 'Scholarships'], ['checklistItems', 'list', 'Checklist items'], ['enrollSteps', 'flag', 'Enrolment steps'],
    ['glossary', 'book', 'Glossary'], ['faqs', 'help', 'FAQs'], ['currencies', 'wallet', 'Currencies'], ['sep', 'Research'],
    ['responses', 'chart', 'Responses & insights'], ['quotes', 'message', 'User quotes'], ['testerTasks', 'test', 'Usability tasks'], ['interviewQuestions', 'mic', 'Interview questions'],
    ['sep', 'Go live'], ['publish', 'upload', 'Publish'], ['settings', 'lock', 'Settings']
  ];
  function shell() {
    const count = (k) => Array.isArray(D[k]) ? D[k].length : '';
    $('#root').innerHTML = '<div class="adm"><aside class="adm-side" id="side"><a class="brand" href="index.html" target="_blank" rel="noopener" style="padding:0;background:none"><span class="brand-mark" style="background:var(--sun);color:#2A1B00">' + icon('cap') + '</span><span>' + esc(D.site.name || 'UniPath') + '<small>Admin console</small></span></a>' +
      NAV.map((n) => n[0] === 'sep' ? '<div class="sep">' + n[1] + '</div>' : '<a href="#" data-sec="' + n[0] + '" class="' + (section === n[0] ? 'active' : '') + '">' + icon(n[1]) + n[2] + (SCHEMAS[n[0]] ? '<span class="n">' + count(n[0]) + '</span>' : '') + '</a>').join('') +
      '<div style="margin-top:auto;padding-top:16px">' + (ME ? '<div class="small" style="padding:6px 12px;color:#93a49d">Signed in as ' + esc(ME.name || ME.email) + '</div>' : '') + (ONLINE ? '' : '<div class="small" style="padding:6px 12px;color:var(--sun)">Server offline</div>') + '<a href="index.html" target="_blank" rel="noopener">' + icon('external') + 'View live site</a><button class="navbtn" id="theme">' + icon('moon') + 'Toggle theme</button><button class="navbtn" id="logout">' + icon('logout') + 'Sign out</button></div></aside>' +
      '<main class="adm-main"><div class="adm-top"><div class="row"><button class="icon-btn mobile-nav" id="burger" aria-label="Menu">' + icon('menu') + '</button><h1 id="sec-title"></h1></div><div class="row"><span id="pill"></span><button class="btn sm ghost" id="preview">' + icon('eye') + 'Preview</button><button class="btn sm sun" data-go="publish">' + icon('upload') + 'Publish</button></div></div><div id="sec"></div></main></div>';
    $$('[data-sec]').forEach((a) => a.onclick = (e) => { e.preventDefault(); section = a.dataset.sec; editState = { q: '', filter: '' }; $('#side').classList.remove('open'); shell(); window.scrollTo(0, 0); });
    $$('[data-go]').forEach((b) => b.onclick = () => { section = b.dataset.go; shell(); });
    $('#logout').onclick = () => { U.store(SESSION, null); U.API.setToken('', 'admin'); login(); };
    $('#theme').onclick = () => { const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = t; U.store('unipath.admin.theme', t); try { localStorage.setItem('unipath.admin.theme', t); } catch (e) {} };
    $('#burger').onclick = () => $('#side').classList.toggle('open');
    $('#preview').onclick = previewSite;
    renderTopPill();
    const titles = Object.fromEntries(NAV.filter((n) => n[0] !== 'sep').map((n) => [n[0], n[2]]));
    $('#sec-title').textContent = titles[section] || '';
    const fn = { dashboard, site: siteForm, currencies, responses, publish, settings, students, inbox }[section];
    $('#sec').innerHTML = '';
    if (fn) fn(); else if (SCHEMAS[section]) collection(section);
  }
  function previewSite() { persist(); U.Content.setPreview(true); window.open('index.html', '_blank'); U.toast('Preview opened in a new tab — only you can see it', 'eye'); }

  /* ---------- Dashboard ---------- */
  function dashboard() {
    const ps = D.programs || [];
    const ver = ps.filter((p) => p.verified).length;
    const past = ps.filter((p) => U.daysUntil(p.deadline) != null && U.daysUntil(p.deadline) < 0);
    const soon = ps.filter((p) => { const n = U.daysUntil(p.deadline); return n != null && n >= 0 && n <= 30; });
    const noUrl = ps.filter((p) => !U.safeUrl(p.officialUrl));
    const stale = ps.filter((p) => p.verified && p.lastVerified && U.daysUntil(p.lastVerified) < -180);
    const log = U.store(RESEARCH_KEY) || [];
    const health = [];
    if (ps.length - ver) health.push(['warn', (ps.length - ver) + ' programme' + (ps.length - ver > 1 ? 's are' : ' is') + ' still “Indicative”. Check them against official websites and tick “Verified”.', 'programs', 'unverified']);
    if (past.length) health.push(['bad', past.length + ' deadline' + (past.length > 1 ? 's have' : ' has') + ' passed: ' + past.slice(0, 3).map((p) => p.university).join(', ') + (past.length > 3 ? '…' : '') + '. Update to the next intake.', 'programs', 'past']);
    if (stale.length) health.push(['warn', stale.length + ' verified programme(s) were last checked over 6 months ago.', 'programs', 'stale']);
    if (noUrl.length) health.push(['warn', noUrl.length + ' programme(s) have no official website link.', 'programs', '']);
    if (!(D.quotes || []).some((q) => q.consent)) health.push(['info', 'No consented user quotes yet — add the best ones from your interviews to show on the homepage.', 'quotes', '']);
    if (!health.length) health.push(['ok', 'Everything looks healthy.', '', '']);
    $('#sec').innerHTML = (ONLINE ? '<div id="live" class="mb2"><p class="muted small">Loading live student data…</p></div>' : '<div class="notice warn mb2">' + icon('alert') + '<p>Server not connected. Student accounts and live data appear here once the site is deployed with its backend (see the deployment guide).</p></div>') + '<h3 class="mt3">Content</h3><div class="grid g4">' +
      kpi(ps.length, 'Programmes', 'cap') + kpi(ver + '/' + ps.length, 'Verified', 'shield') + kpi((D.scholarships || []).length, 'Scholarships', 'award') + kpi(new Set(ps.map((p) => p.country)).size, 'Countries', 'globe') + '</div>' +
      '<div class="grid g2 mt3"><div class="card"><h3>Data health</h3><ul class="health" style="list-style:none;padding:0;margin:0">' + health.map((h) => '<li class="row between" style="flex-wrap:nowrap;align-items:flex-start"><span class="row" style="flex-wrap:nowrap;align-items:flex-start;gap:10px"><span style="color:var(--' + (h[0] === 'bad' ? 'bad' : h[0] === 'ok' ? 'ok' : h[0] === 'info' ? 'sky' : 'warn') + ')">' + icon(h[0] === 'ok' ? 'check' : h[0] === 'info' ? 'info' : 'alert') + '</span><span class="small">' + esc(h[1]) + '</span></span>' + (h[2] ? '<button class="btn sm ghost" data-jump="' + h[2] + '" data-f="' + h[3] + '">Fix</button>' : '') + '</li>').join('') + '</ul></div>' +
      '<div class="card"><h3>Deadlines in the next 30 days</h3>' + (soon.length ? '<ul class="reasons mt2">' + soon.map((p) => '<li class="maybe">' + icon('clock') + '<span><b>' + esc(p.program) + '</b> — ' + esc(p.university) + ' · ' + U.fmtDate(p.deadline) + '</span></li>').join('') + '</ul>' : '<p class="muted small">None.</p>') +
      '<hr class="divider"><h4>Quick actions</h4><div class="row"><button class="btn sm" data-new="programs">' + icon('plus') + 'Add programme</button><button class="btn sm ghost" data-new="scholarships">' + icon('plus') + 'Add scholarship</button><button class="btn sm ghost" data-new="quotes">' + icon('plus') + 'Add quote</button><button class="btn sm ghost" data-jump="site">' + icon('edit') + 'Edit announcement</button></div></div></div>' +
      '<div class="card mt3 tint"><h3>How publishing works</h3><ol class="steps-num mt2"><li><div><b>Edit anything here.</b> Changes save automatically as a draft on this device.</div></li><li><div><b>Preview</b> to see the real site with your changes — only on your device.</div></li><li><div><b>Publish</b> pushes your changes to the live site instantly — no redeploy needed.</div></li></ol></div>';
    if (ONLINE) liveOverview();
    $$('[data-jump]').forEach((b) => b.onclick = () => { section = b.dataset.jump; editState = { q: '', filter: b.dataset.f || '' }; shell(); });
    $$('[data-new]').forEach((b) => b.onclick = () => { section = b.dataset.new; shell(); editItem(section, -1); });
  }
  async function liveOverview() {
    let o; try { o = await api('GET', 'overview'); } catch (e) { const el = $('#live'); if (el) el.innerHTML = '<p class="small" style="color:var(--bad)">Couldn’t load live data: ' + esc(e.message) + '</p>'; return; }
    const el = $('#live'); if (!el) return;
    const top = (obj, n) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]).slice(0, n || 6);
    const bars = (rows, total, label) => rows.length ? rows.map(([k, v]) => '<div class="bar-mini"><span>' + esc(label ? label(k) : k) + '</span><b style="text-align:right">' + v + '</b><div class="track"><div class="fill" style="width:' + (v / Math.max(1, total) * 100) + '%"></div></div></div>').join('') : '<p class="muted small">No data yet.</p>';
    const progName = (id) => { const p = (D.programs || []).find((x) => x.id === id); return p ? p.program + ' — ' + p.university : id; };
    const stageOrder = ['preparing', 'ready', 'submitted', 'decision', 'offer', 'enrolled', 'closed'];
    const stageLabel = { preparing: 'Preparing', ready: 'Ready', submitted: 'Submitted', decision: 'Awaiting decision', offer: 'Offer', enrolled: 'Enrolled', closed: 'Closed' };
    const maxStage = Math.max(1, ...Object.values(o.stages || {}));
    el.innerHTML = '<h3>Students (live)</h3><div class="grid g4">' + kpi(o.students, 'Student accounts', 'users') + kpi(o.newThisWeek, 'New this week', 'sparkle') + kpi(o.applications, 'Applications', 'list') + kpi(o.openAdviser, 'Open adviser requests', 'mail') + '</div>' +
      '<div class="grid g3 mt2"><div class="card"><h4>Application funnel</h4>' + stageOrder.filter((k) => (o.stages || {})[k]).map((k) => '<div class="bar-mini"><span>' + stageLabel[k] + '</span><b style="text-align:right">' + o.stages[k] + '</b><div class="track"><div class="fill" style="width:' + o.stages[k] / maxStage * 100 + '%"></div></div></div>').join('') + (Object.keys(o.stages || {}).length ? '' : '<p class="muted small">No applications yet.</p>') + '</div>' +
      '<div class="card"><h4>Most popular programmes</h4>' + bars(top(o.programmes, 6), Math.max(1, ...Object.values(o.programmes || { a: 1 })), progName) + '</div>' +
      '<div class="card"><h4>Where students live</h4>' + bars(top(o.countries, 6), o.students) + '<hr class="divider"><h4>Research responses</h4>' + ['survey', 'usability', 'feedback', 'adviser'].map((k) => '<div class="row between small"><span>' + ({ survey: 'Questionnaires', usability: 'Usability tests', feedback: 'Feedback', adviser: 'Adviser requests' }[k]) + '</span><b>' + ((o.responses || {})[k] || 0) + '</b></div>').join('') + '</div></div>';
  }
  const kpi = (v, l, ic) => '<div class="card kpi"><div class="row between"><span class="l">' + l + '</span><span style="color:var(--muted)">' + icon(ic) + '</span></div><div class="v mt1">' + v + '</div></div>';

  /* ---------- Site settings ---------- */
  function siteForm() {
    const s = D.site;
    const f = [
      ['name', 'Platform name', 'text'], ['tagline', 'Tagline', 'text'], ['heroTitle', 'Homepage headline', 'text', 'Tip: keep the phrase “fits your future” to get the italic highlight.'],
      ['heroSubtitle', 'Homepage introduction', 'textarea'], ['announcementEnabled', 'Show announcement bar', 'bool'], ['announcementText', 'Announcement text', 'text'],
      ['announcementLink', 'Announcement link', 'text', 'e.g. #/research or a full https:// link'], ['dataNotice', 'Data accuracy notice', 'textarea'],
      ['contactEmail', 'Contact email', 'text'], ['whatsapp', 'WhatsApp number (international format)', 'text', 'e.g. +256 700 000000 — leave blank to hide the button'],
      ['founder', 'Founder name', 'text'], ['surveyUrl', 'External survey link (optional)', 'text', 'e.g. your Google Form — shown on the research page alongside the built-in questionnaire'],
      ['prototypeVersion', 'Version label', 'text']
    ];
    $('#sec').innerHTML = '<form class="card pad-lg form-grid" id="sf">' + f.map(([k, l, t, h]) => fieldHTML(k, l, t, { hint: h, full: t === 'textarea' || k === 'heroTitle' || k === 'announcementText' }, s[k])).join('') + '<div class="full row"><button class="btn">' + icon('check') + 'Save changes</button><span class="small muted">Saved to your draft. Publish to make it live.</span></div></form>';
    $('#sf').onsubmit = (e) => { e.preventDefault(); Object.assign(D.site, readForm(e.target, f.map((x) => [x[0], x[1], x[2]]))); persist(); U.toast('Saved to draft'); };
  }

  /* ---------- Generic collection editor ---------- */
  function collection(key) {
    const sc = SCHEMAS[key]; const list = D[key];
    let rows = list.map((it, i) => ({ it, i }));
    if (editState.q) { const q = editState.q.toLowerCase(); rows = rows.filter(({ it }) => sc.search.some((f) => String(it[f] || '').toLowerCase().includes(q))); }
    if (key === 'programs' && editState.filter) {
      if (editState.filter === 'unverified') rows = rows.filter(({ it }) => !it.verified);
      if (editState.filter === 'verified') rows = rows.filter(({ it }) => it.verified);
      if (editState.filter === 'past') rows = rows.filter(({ it }) => U.daysUntil(it.deadline) < 0);
      if (editState.filter === 'stale') rows = rows.filter(({ it }) => it.verified && it.lastVerified && U.daysUntil(it.lastVerified) < -180);
    }
    const cell = (it, c) => {
      const v = it[c[0]];
      if (c[2] === 'date') { const n = U.daysUntil(v); return U.fmtDate(v) + (n != null && n < 0 ? ' <span class="badge bad">passed</span>' : ''); }
      if (c[2] === 'verified') return v ? '<span class="badge ok">Verified</span>' : '<span class="badge warn">Indicative</span>';
      if (c[2] === 'bool') return v ? '<span class="badge ok">Yes</span>' : '<span class="badge">No</span>';
      return '<div class="clip" title="' + esc(v) + '">' + esc(v) + '</div>';
    };
    $('#sec').innerHTML = (sc.intro ? '<div class="notice mb2">' + icon('info') + '<p>' + esc(sc.intro) + '</p></div>' : '') +
      '<div class="row between mb2"><div class="row"><input type="search" id="cq" placeholder="Search ' + esc(sc.title.toLowerCase()) + '…" value="' + esc(editState.q) + '" style="width:260px">' +
      (key === 'programs' ? '<select id="cf" style="width:auto"><option value="">All</option><option value="unverified">Indicative only</option><option value="verified">Verified only</option><option value="past">Deadline passed</option><option value="stale">Verified &gt; 6 months ago</option></select>' : '') + '</div>' +
      '<div class="row">' + (key === 'programs' ? '<button class="btn sm ghost" id="csv-out">' + icon('download') + 'Export CSV</button><label class="btn sm ghost" style="cursor:pointer">' + icon('upload') + 'Import CSV<input type="file" id="csv-in" accept=".csv,text/csv" hidden></label>' : '') + '<button class="btn sm" id="cadd">' + icon('plus') + 'Add ' + sc.singular + '</button></div></div>' +
      (rows.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th style="width:36px">#</th>' + sc.cols.map((c) => '<th>' + c[1] + '</th>').join('') + '<th style="text-align:right">Actions</th></tr></thead><tbody>' +
        rows.map(({ it, i }) => '<tr><td class="muted">' + (i + 1) + '</td>' + sc.cols.map((c) => '<td>' + cell(it, c) + '</td>').join('') + '<td><div class="acts">' +
          (key === 'programs' ? '<button class="icon-btn" data-ver="' + i + '" title="' + (it.verified ? 'Mark indicative' : 'Mark verified today') + '">' + icon('shield') + '</button>' : '') +
          '<button class="icon-btn" data-up="' + i + '" title="Move up" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button class="icon-btn" data-edit="' + i + '" title="Edit">' + icon('edit') + '</button><button class="icon-btn" data-dup="' + i + '" title="Duplicate">' + icon('dup') + '</button><button class="icon-btn" data-del="' + i + '" title="Delete" style="color:var(--bad)">' + icon('trash') + '</button></div></td></tr>').join('') + '</tbody></table></div>'
        : '<div class="empty">' + icon(sc.icon) + '<h3>Nothing here' + (editState.q || editState.filter ? ' matching your filter' : ' yet') + '</h3><button class="btn" id="cadd2">' + icon('plus') + 'Add ' + sc.singular + '</button></div>') +
      '<p class="small muted mt2">' + list.length + ' total · order here is the order students see.</p>';
    const cq = $('#cq'); let t; cq.oninput = () => { clearTimeout(t); t = setTimeout(() => { editState.q = cq.value; collection(key); const n = $('#cq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    const cf = $('#cf'); if (cf) { cf.value = editState.filter; cf.onchange = () => { editState.filter = cf.value; collection(key); }; }
    [$('#cadd'), $('#cadd2')].forEach((b) => b && (b.onclick = () => editItem(key, -1)));
    $$('[data-edit]').forEach((b) => b.onclick = () => editItem(key, +b.dataset.edit));
    $$('[data-dup]').forEach((b) => b.onclick = () => { const c = clone(list[+b.dataset.dup]); if ('id' in c) c.id = (sc.idPrefix || 'x') + '-' + Math.random().toString(36).slice(2, 7); ['program', 'name', 'title', 'term', 'label'].forEach((f) => { if (c[f]) { c[f] += ' (copy)'; } }); list.splice(+b.dataset.dup + 1, 0, c); persist(); collection(key); U.toast('Duplicated'); });
    $$('[data-del]').forEach((b) => b.onclick = async () => { const it = list[+b.dataset.del]; const name = it.program || it.name || it.title || it.term || it.label || it.q || it.text || 'this item'; if (await U.confirmBox('Delete ' + sc.singular + '?', 'Remove “' + String(name).slice(0, 80) + '”? You can undo by discarding your draft before publishing.')) { list.splice(+b.dataset.del, 1); persist(); collection(key); U.toast('Deleted', 'trash'); refreshCounts(); } });
    $$('[data-up]').forEach((b) => b.onclick = () => { const i = +b.dataset.up; if (i < 1) return; [list[i - 1], list[i]] = [list[i], list[i - 1]]; persist(); collection(key); });
    $$('[data-ver]').forEach((b) => b.onclick = () => { const it = list[+b.dataset.ver]; it.verified = !it.verified; if (it.verified) it.lastVerified = new Date().toISOString().slice(0, 10); persist(); collection(key); U.toast(it.verified ? 'Marked verified today' : 'Marked indicative', 'shield'); });
    const co = $('#csv-out'); if (co) co.onclick = () => U.download('unipath-programmes.csv', U.toCSV(list, sc.fields.map((f) => f[0])), 'text/csv');
    const ci = $('#csv-in'); if (ci) ci.onchange = async () => {
      const f = ci.files[0]; if (!f) return;
      try {
        const rows = U.parseCSV(await f.text()); if (!rows.length) throw new Error('empty');
        let added = 0, updated = 0;
        rows.forEach((r) => {
          const o = {}; sc.fields.forEach(([k, , t]) => { if (!(k in r)) return; let v = r[k]; if (t === 'number') v = +v || 0; if (t === 'bool') v = /^(true|yes|1|y)$/i.test(String(v).trim()); o[k] = v; });
          if (!o.id) o.id = 'prog-' + Math.random().toString(36).slice(2, 7);
          const ex = list.findIndex((p) => p.id === o.id); if (ex >= 0) { Object.assign(list[ex], o); updated++; } else { list.push(Object.assign({}, sc.defaults, o)); added++; }
        });
        persist(); collection(key); refreshCounts(); U.toast('Imported: ' + added + ' added, ' + updated + ' updated', 'upload');
      } catch (e) { U.toast('Couldn’t read that CSV — export one first to see the format', 'alert'); }
    };
  }
  function refreshCounts() { $$('[data-sec]').forEach((a) => { const n = a.querySelector('.n'); if (n && Array.isArray(D[a.dataset.sec])) n.textContent = D[a.dataset.sec].length; }); }

  function fieldHTML(k, label, type, o, val) {
    o = o || {};
    const req = o.required ? ' required' : '';
    const full = o.full || type === 'textarea' ? ' full' : '';
    const hint = o.hint ? '<span class="hint">' + esc(o.hint) + '</span>' : '';
    if (type === 'bool') return '<label class="check field' + full + '" style="align-self:end;padding-bottom:10px"><input type="checkbox" name="' + k + '" ' + (val ? 'checked' : '') + '><span><b>' + esc(label) + '</b>' + (o.hint ? '<br><small class="muted">' + esc(o.hint) + '</small>' : '') + '</span></label>';
    if (type === 'textarea') return '<label class="field' + full + '"><span>' + esc(label) + '</span><textarea name="' + k + '"' + req + ' style="min-height:90px">' + esc(val == null ? '' : val) + '</textarea>' + hint + '</label>';
    if (type === 'select') return '<label class="field' + full + '"><span>' + esc(label) + '</span><select name="' + k + '">' + o.options.map((x) => '<option value="' + esc(x) + '" ' + (String(val) === String(x) ? 'selected' : '') + '>' + esc(x || '— none —') + '</option>').join('') + '</select>' + hint + '</label>';
    const it = { number: 'number', date: 'date', url: 'url' }[type] || 'text';
    return '<label class="field' + full + '"><span>' + esc(label) + '</span><input type="' + it + '" name="' + k + '"' + req + (it === 'number' ? ' step="any"' : '') + ' value="' + esc(val == null ? '' : val) + '"' + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + '>' + hint + '</label>';
  }
  function readForm(form, fields) {
    const o = {};
    fields.forEach(([k, , t]) => { const el = form.elements[k]; if (!el) return; if (t === 'bool') o[k] = el.checked; else if (t === 'number') o[k] = el.value === '' ? 0 : +el.value; else o[k] = el.value.trim(); });
    return o;
  }
  function editItem(key, idx) {
    const sc = SCHEMAS[key]; const isNew = idx < 0;
    const it = isNew ? Object.assign({}, sc.defaults, sc.fields.some((f) => f[0] === 'id') ? { id: (sc.idPrefix || 'x') + '-' + Math.random().toString(36).slice(2, 7) } : {}) : D[key][idx];
    const m = U.modal({
      title: (isNew ? 'Add ' : 'Edit ') + sc.singular, wide: key === 'programs',
      body: '<form class="form-grid" id="ef">' + sc.fields.map(([k, l, t, o]) => fieldHTML(k, l, t, o, it[k])).join('') + '</form>',
      footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-save>' + icon('check') + (isNew ? 'Add' : 'Save') + '</button>'
    });
    const vbox = m.el.querySelector('[name=verified]'), vdate = m.el.querySelector('[name=lastVerified]');
    if (vbox && vdate) vbox.onchange = () => { if (vbox.checked && !vdate.value) vdate.value = new Date().toISOString().slice(0, 10); };
    m.el.querySelector('[data-save]').onclick = () => {
      const f = m.el.querySelector('#ef'); if (!f.reportValidity()) return;
      const o = readForm(f, sc.fields);
      if ('id' in o) { o.id = (o.id || '').replace(/\s+/g, '-').toLowerCase() || ((sc.idPrefix || 'x') + '-' + Math.random().toString(36).slice(2, 7)); if (D[key].some((x, i) => x.id === o.id && i !== idx)) return U.toast('That ID is already used', 'alert'); }
      if (isNew) D[key].push(o); else Object.assign(D[key][idx], o);
      persist(); m.close(); U.toast(isNew ? 'Added to draft' : 'Saved to draft'); if (section === key) collection(key); else { section = key; shell(); } refreshCounts();
    };
  }

  /* ---------- Currencies ---------- */
  function currencies() {
    const c = D.currencies;
    $('#sec').innerHTML = '<div class="notice mb2">' + icon('info') + '<p>Rates are “1 US dollar equals…”. All programme costs are stored in USD and converted for students. Update these occasionally — they are indicative.</p></div>' +
      '<form class="card" id="cf"><div class="table-wrap"><table class="tbl"><thead><tr><th>Code</th><th>Name</th><th>Rate (per 1 USD)</th><th></th></tr></thead><tbody>' +
      Object.entries(c).map(([k, v]) => '<tr><td><b>' + esc(k) + '</b></td><td><input name="l_' + esc(k) + '" value="' + esc(v.label || '') + '"></td><td><input type="number" step="any" min="0" name="r_' + esc(k) + '" value="' + esc(v.rate) + '"' + (k === 'USD' ? ' readonly' : '') + '></td><td>' + (k === 'USD' ? '' : '<button type="button" class="icon-btn" data-rm="' + esc(k) + '" style="color:var(--bad)">' + icon('trash') + '</button>') + '</td></tr>').join('') +
      '</tbody></table></div><div class="row mt2"><input id="nc" placeholder="Code e.g. ZMW" style="width:140px" maxlength="4"><input id="nl" placeholder="Name" style="width:200px"><input id="nr" type="number" step="any" placeholder="Rate" style="width:140px"><button type="button" class="btn ghost" id="cadd">' + icon('plus') + 'Add currency</button></div>' +
      '<div class="row mt3"><button class="btn">' + icon('check') + 'Save rates</button></div></form>';
    $('#cf').onsubmit = (e) => { e.preventDefault(); Object.keys(c).forEach((k) => { c[k].label = e.target['l_' + k].value; c[k].rate = +e.target['r_' + k].value || c[k].rate; }); persist(); U.toast('Rates saved to draft'); };
    $$('[data-rm]').forEach((b) => b.onclick = () => { delete c[b.dataset.rm]; persist(); currencies(); });
    $('#cadd').onclick = () => { const k = $('#nc').value.trim().toUpperCase(); const r = +$('#nr').value; if (!/^[A-Z]{3,4}$/.test(k) || !r) return U.toast('Enter a 3-letter code and a rate', 'info'); c[k] = { rate: r, label: $('#nl').value || k }; persist(); currencies(); };
  }

  /* ---------- Students ---------- */
  let stuState = { q: '', country: '', stage: '' }, STUDENTS = null;
  const STAGE_LABEL = { preparing: 'Preparing', ready: 'Ready to submit', submitted: 'Submitted', decision: 'Awaiting decision', offer: 'Offer received', enrolled: 'Enrolled', closed: 'Closed' };
  const progById = (id) => (D.programs || []).find((x) => x.id === id);
  const ago = (iso) => { if (!iso) return '—'; const d = (Date.now() - Date.parse(iso)) / 1000; if (d < 3600) return Math.max(1, Math.round(d / 60)) + ' min ago'; if (d < 86400) return Math.round(d / 3600) + ' h ago'; if (d < 86400 * 30) return Math.round(d / 86400) + ' days ago'; return U.fmtDate(iso.slice(0, 10)); };
  function offlineBlock(what) { $('#sec').innerHTML = '<div class="empty">' + icon('db') + '<h3>' + what + ' needs the server</h3><p>This copy of the site is running without its backend. Deploy from GitHub or the Netlify CLI (see the deployment guide) to collect student accounts.</p></div>'; }
  async function students(refresh) {
    if (!ONLINE) return offlineBlock('Student data');
    if (!STUDENTS || refresh) { $('#sec').innerHTML = '<p class="muted">Loading students…</p>'; try { STUDENTS = await api('GET', 'users'); } catch (e) { $('#sec').innerHTML = '<p style="color:var(--bad)">' + esc(e.message) + '</p>'; return; } }
    const all = STUDENTS;
    const countries = Array.from(new Set(all.map((u) => (u.summary || {}).homeCountry).filter(Boolean))).sort();
    let rows = all.filter((u) => {
      const s = u.summary || {}; const q = stuState.q.toLowerCase();
      if (q && !((u.name || '') + ' ' + u.email + ' ' + (u.phone || '') + ' ' + (s.field || '')).toLowerCase().includes(q)) return false;
      if (stuState.country && s.homeCountry !== stuState.country) return false;
      if (stuState.stage && !(s.stages || {})[stuState.stage]) return false;
      return true;
    });
    $('#sec').innerHTML = '<div class="notice mb2">' + icon('shield') + '<p>Students agreed that UniPath advisers can view their profile, applications and documents to support them. Use this data only for that purpose and never share it outside the team.</p></div>' +
      '<div class="row between mb2"><div class="row"><input type="search" id="sq" placeholder="Search name, email, phone, field…" value="' + esc(stuState.q) + '" style="width:280px">' +
      '<select id="sc" style="width:auto"><option value="">All countries</option>' + countries.map((c) => '<option ' + (stuState.country === c ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select>' +
      '<select id="ss" style="width:auto"><option value="">Any stage</option>' + Object.entries(STAGE_LABEL).map(([k, l]) => '<option value="' + k + '" ' + (stuState.stage === k ? 'selected' : '') + '>Has: ' + l + '</option>').join('') + '</select></div>' +
      '<div class="row"><button class="btn sm ghost" id="s-ref">' + icon('refresh') + 'Refresh</button><button class="btn sm ghost" id="s-csv">' + icon('download') + 'Export CSV</button><button class="btn sm ghost" id="s-json">' + icon('db') + 'Full export (JSON)</button></div></div>' +
      (rows.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Student</th><th>Country</th><th>Studying</th><th>Applications</th><th>Docs ready</th><th>Last active</th><th></th></tr></thead><tbody>' +
        rows.map((u) => { const s = u.summary || {}; return '<tr style="cursor:pointer" data-open="' + esc(u.id) + '"><td><b>' + esc(u.name || '—') + '</b><br><small class="muted">' + esc(u.email) + (u.phone ? ' · ' + esc(u.phone) : '') + '</small></td><td>' + esc(s.homeCountry || '—') + '</td><td><small>' + esc([s.level, s.field].filter(Boolean).join(' · ') || '—') + '</small></td><td>' + (s.applications || 0) + (Object.keys(s.stages || {}).length ? '<br><small class="muted">' + Object.entries(s.stages).map(([k, v]) => v + ' ' + (STAGE_LABEL[k] || k).toLowerCase()).join(', ') + '</small>' : '') + '</td><td>' + (s.docsReady || 0) + '</td><td><small>' + ago(u.lastActive) + '</small></td><td>' + ((u.notes || []).length ? '<span class="badge brand">' + u.notes.length + ' note' + (u.notes.length > 1 ? 's' : '') + '</span>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="empty">' + icon('users') + '<h3>' + (all.length ? 'No students match' : 'No student accounts yet') + '</h3><p>' + (all.length ? 'Try clearing the filters.' : 'When students create a free account on the site, they appear here with their profile, applications and documents.') + '</p></div>') +
      '<p class="small muted mt2">' + all.length + ' student account' + (all.length === 1 ? '' : 's') + ' in total.</p>';
    let t; $('#sq').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { stuState.q = e.target.value; students(); const n = $('#sq'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
    $('#sc').onchange = (e) => { stuState.country = e.target.value; students(); };
    $('#ss').onchange = (e) => { stuState.stage = e.target.value; students(); };
    $('#s-ref').onclick = () => students(true);
    $('#s-csv').onclick = () => U.download('unipath-students-' + new Date().toISOString().slice(0, 10) + '.csv', U.toCSV(all.map((u) => { const s = u.summary || {}; return { name: u.name, email: u.email, phone: u.phone, createdAt: u.createdAt, lastActive: u.lastActive, homeCountry: s.homeCountry, level: s.level, field: s.field, qualification: s.qualification, grade: s.grade, budget: s.budget, destinations: (s.destinations || []).join('; '), seekingScholarships: s.scholarship ? 'yes' : 'no', applications: s.applications, docsReady: s.docsReady }; }), ['name', 'email', 'phone', 'createdAt', 'lastActive', 'homeCountry', 'level', 'field', 'qualification', 'grade', 'budget', 'destinations', 'seekingScholarships', 'applications', 'docsReady']), 'text/csv');
    $('#s-json').onclick = async () => { try { const d = await api('GET', 'export'); U.download('unipath-full-export-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(d, null, 1), 'application/json'); } catch (e) { U.toast(e.message, 'alert'); } };
    $$('[data-open]').forEach((r) => r.onclick = () => openStudent(r.dataset.open));
  }
  async function openStudent(id) {
    let d; try { d = await api('GET', 'users/' + encodeURIComponent(id)); } catch (e) { return U.toast(e.message, 'alert'); }
    const u = d.user, st = d.state || {}, p = st.profile || {};
    const apps = st.applications || [];
    const docKeys = { transcripts: 'Academic transcripts', certificates: 'Certificates', id: 'National ID', passport: 'Passport', photo: 'Passport photo', birth: 'Birth certificate', statement: 'Personal statement', references: 'Recommendation letters', english: 'English test', finance: 'Proof of funds', cv: 'CV', degree: 'Degree certificate' };
    const tab = (id2, label) => '<button data-tab="' + id2 + '" aria-pressed="' + (id2 === 'profile') + '">' + label + '</button>';
    const sec = {
      profile: '<table class="tbl"><tbody>' + [['Name', u.name], ['Email', '<a href="mailto:' + esc(u.email) + '">' + esc(u.email) + '</a>'], ['Phone / WhatsApp', u.phone ? esc(u.phone) + (u.phone.replace(/\D/g, '').length > 8 ? ' · <a href="https://wa.me/' + u.phone.replace(/\D/g, '') + '" target="_blank" rel="noopener">WhatsApp</a>' : '') : '—'], ['Joined', U.fmtDate((u.createdAt || '').slice(0, 10))], ['Last active', ago(u.lastActive)], ['Lives in', esc(p.homeCountry || '—')], ['Level · field', esc([p.level, p.field].filter(Boolean).join(' · ') || '—')], ['Result', esc(p.gradeLabel || '—')], ['Destinations', esc((p.destinations || []).join(', ') || 'Anywhere')], ['Budget / yr', p.budgetAmount ? esc((p.budgetCurrency || '') + ' ' + Number(p.budgetAmount).toLocaleString()) : '—'], ['Seeking scholarships', p.scholarship ? 'Yes' : 'No'], ['Consent', u.consent ? 'Given ' + U.fmtDate(u.consent.at.slice(0, 10)) : '—']].map((r) => '<tr><th style="position:static;width:34%">' + r[0] + '</th><td>' + (r[0] === 'Email' || r[0] === 'Phone / WhatsApp' ? r[1] : (r[1] == null ? '—' : r[1])) + '</td></tr>').join('') + '</tbody></table>' +
        ((st.shortlist || []).length ? '<h4 class="mt2">Saved programmes</h4><ul class="small">' + st.shortlist.map((x) => { const pr = progById(x); return '<li>' + esc(pr ? pr.program + ' — ' + pr.university : x) + '</li>'; }).join('') + '</ul>' : ''),
      apps: apps.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Stage</th><th>Deadline</th><th>Checklist ticks</th><th>Notes</th></tr></thead><tbody>' + apps.map((a) => { const pr = a.programId ? progById(a.programId) : null; const c = a.custom || {}; return '<tr><td><b>' + esc(pr ? pr.program : c.program || '—') + '</b><br><small class="muted">' + esc(pr ? pr.university : c.university || '') + (a.applicantId ? ' · ID ' + esc(a.applicantId) : '') + '</small></td><td><span class="badge brand">' + esc(STAGE_LABEL[a.stage] || a.stage) + '</span></td><td>' + U.fmtDate(a.deadlineOverride || (pr ? pr.deadline : c.deadline)) + '</td><td>' + Object.values(a.checks || {}).filter(Boolean).length + (a.customTasks && a.customTasks.length ? ' + ' + a.customTasks.length + ' own tasks' : '') + '</td><td><small>' + esc(a.notes || '') + '</small></td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No applications yet.</p>',
      docs: '<div class="table-wrap"><table class="tbl"><thead><tr><th>Document</th><th>Status</th><th>File</th><th></th></tr></thead><tbody>' + Object.entries(docKeys).map(([k, l]) => { const s2 = (st.docs || {})[k] || {}; const f = (d.docs || []).find((x) => x.key === k); return '<tr><td>' + l + '</td><td>' + (s2.status === 'ready' ? '<span class="badge ok">Ready</span>' : s2.status === 'progress' ? '<span class="badge warn">In progress</span>' : '<span class="badge">Missing</span>') + '</td><td><small>' + (f ? esc(f.name || k) + ' · ' + Math.max(1, Math.round((f.size || 0) / 1024)) + ' KB' : (s2.fileName ? esc(s2.fileName) + ' <span class="muted">(only on student’s device)</span>' : '—')) + '</small></td><td>' + (f ? '<button class="btn sm ghost" data-doc="' + k + '">' + icon('download') + 'Download</button>' : '') + '</td></tr>'; }).join('') + '</tbody></table></div>',
      writing: ((st.statements || []).length ? (st.statements || []).map((x) => '<details class="faq"><summary>' + esc(x.title || 'Statement') + ' <span class="muted small">(' + ((x.text || '').match(/\S+/g) || []).length + ' words)</span></summary><p style="white-space:pre-wrap">' + esc(x.text || '') + '</p></details>').join('') : '<p class="muted">No statements yet.</p>') +
        '<h4 class="mt3">Referees</h4>' + ((st.references || []).length ? '<ul class="small">' + st.references.map((r) => '<li><b>' + esc(r.name) + '</b> (' + esc(r.role || '') + ') — ' + esc(r.status || '') + ', due ' + U.fmtDate(r.due) + (r.email ? ' · ' + esc(r.email) : '') + '</li>').join('') + '</ul>' : '<p class="muted small">None yet.</p>'),
      notes: '<p class="small muted mt0">Notes are shown to the student on their dashboard as “Message from your UniPath adviser”.</p><div id="note-list" class="stack"></div><textarea id="note-txt" placeholder="e.g. Great progress! Please upload your UACE results slip and ask your head teacher for a reference this week." class="mt2"></textarea><div class="row mt1"><button class="btn" id="note-add">' + icon('message') + 'Send note to student</button></div>' +
        ((d.responses || []).length ? '<h4 class="mt3">Their research responses & requests</h4><ul class="small">' + d.responses.map((r) => '<li>' + esc(r.kind) + ' — ' + U.fmtDate(r.at.slice(0, 10)) + (r.data && r.data.message ? ': ' + esc(r.data.message) : '') + '</li>').join('') + '</ul>' : '')
    };
    const m = U.modal({ title: u.name || u.email, wide: true, body: '<div class="seg mb2" id="stabs" style="width:auto">' + tab('profile', 'Profile') + tab('apps', 'Applications (' + apps.length + ')') + tab('docs', 'Documents (' + (d.docs || []).length + ')') + tab('writing', 'Statements & referees') + tab('notes', 'Adviser notes (' + (u.notes || []).length + ')') + '</div><div id="spane">' + sec.profile + '</div>',
      footer: '<button class="btn danger" data-del>' + icon('trash') + 'Delete account</button><button class="btn ghost" data-reset>' + icon('lock') + 'Reset password</button><span style="flex:1"></span><a class="btn ghost" href="mailto:' + esc(u.email) + '">' + icon('mail') + 'Email student</a><button class="btn" data-close>Done</button>' });
    let notes = u.notes || [];
    const renderNotes = () => { const el = m.el.querySelector('#note-list'); if (!el) return; el.innerHTML = notes.length ? notes.slice().reverse().map((n) => '<div class="card flat" style="padding:12px"><div class="row between small muted"><span>' + esc(n.by) + ' · ' + ago(n.at) + '</span><button class="btn link" data-rmnote="' + n.id + '" style="color:var(--bad)">Remove</button></div><p class="mb0 mt1" style="white-space:pre-wrap">' + esc(n.text) + '</p></div>').join('') : '<p class="muted small">No notes yet.</p>'; $$('[data-rmnote]', el).forEach((b) => b.onclick = async () => { try { notes = (await api('DELETE', 'users/' + encodeURIComponent(id) + '/notes/' + b.dataset.rmnote)).notes; renderNotes(); } catch (e) { U.toast(e.message, 'alert'); } }); };
    const bindPane = (k) => {
      $$('[data-doc]', m.el).forEach((b) => b.onclick = async () => { try { const r = await U.API.call('GET', 'admin/users/' + encodeURIComponent(id) + '/docs/' + b.dataset.doc, undefined, { admin: true, raw: true }); const blob = await r.blob(); const f = (d.docs || []).find((x) => x.key === b.dataset.doc); U.download((f && f.name) || b.dataset.doc, blob); } catch (e) { U.toast(e.message, 'alert'); } });
      if (k === 'notes') { renderNotes(); m.el.querySelector('#note-add').onclick = async () => { const txt = m.el.querySelector('#note-txt').value.trim(); if (!txt) return; try { notes = (await api('POST', 'users/' + encodeURIComponent(id) + '/notes', { text: txt })).notes; m.el.querySelector('#note-txt').value = ''; renderNotes(); U.toast('Note sent — the student sees it next time they open UniPath', 'message'); STUDENTS = null; } catch (e) { U.toast(e.message, 'alert'); } }; }
    };
    $$('[data-tab]', m.el).forEach((b) => b.onclick = () => { $$('[data-tab]', m.el).forEach((x) => x.setAttribute('aria-pressed', x === b)); m.el.querySelector('#spane').innerHTML = sec[b.dataset.tab]; bindPane(b.dataset.tab); });
    m.el.querySelector('[data-reset]').onclick = async () => { if (!(await U.confirmBox('Reset password?', 'A temporary password will be created for ' + u.email + '. Share it with the student privately and ask them to change it.', 'Reset'))) return; try { const r = await api('POST', 'users/' + encodeURIComponent(id) + '/reset'); U.modal({ title: 'Temporary password', body: '<p>Share this with <b>' + esc(u.email) + '</b> privately:</p><p class="big-num" style="font-family:ui-monospace,monospace;letter-spacing:.05em">' + esc(r.tempPassword) + '</p><p class="small muted mb0">They can change it under My Passport → Change password.</p>', footer: '<button class="btn" data-close>Done</button>' }); } catch (e) { U.toast(e.message, 'alert'); } };
    m.el.querySelector('[data-del]').onclick = async () => { if (!(await U.confirmBox('Delete this student?', 'This permanently deletes ' + u.email + '’s account, saved progress and uploaded documents. This cannot be undone.', 'Delete permanently'))) return; try { await api('DELETE', 'users/' + encodeURIComponent(id)); m.close(); STUDENTS = null; students(true); U.toast('Student deleted', 'trash'); } catch (e) { U.toast(e.message, 'alert'); } };
  }

  /* ---------- Adviser inbox ---------- */
  let inboxFilter = 'open';
  async function inbox() {
    if (!ONLINE) return offlineBlock('The adviser inbox');
    $('#sec').innerHTML = '<p class="muted">Loading…</p>';
    let all; try { all = (await api('GET', 'responses')).filter((r) => r.kind === 'adviser'); } catch (e) { $('#sec').innerHTML = '<p style="color:var(--bad)">' + esc(e.message) + '</p>'; return; }
    const rows = all.filter((r) => inboxFilter === 'all' || (inboxFilter === 'open' ? r.status !== 'closed' : r.status === 'closed'));
    $('#sec').innerHTML = '<div class="row between mb2"><div class="seg" style="width:auto">' + [['open', 'Open'], ['closed', 'Closed'], ['all', 'All']].map(([k, l]) => '<button data-if="' + k + '" aria-pressed="' + (inboxFilter === k) + '">' + l + ' (' + all.filter((r) => k === 'all' || (k === 'open' ? r.status !== 'closed' : r.status === 'closed')).length + ')</button>').join('') + '</div><button class="btn sm ghost" id="ib-ref">' + icon('refresh') + 'Refresh</button></div>' +
      (rows.length ? '<div class="stack">' + rows.map((r) => { const d = r.data || {}; const wa = String(d.phone || '').replace(/\D/g, ''); return '<div class="card"><div class="row between"><div><b>' + esc(d.name || 'Student') + '</b> <span class="badge">' + esc(d.topic || 'Question') + '</span> ' + (r.userId ? '<button class="badge brand" data-stu="' + esc(r.userId) + '" style="border:0;cursor:pointer">' + icon('user') + 'Has account</button>' : '') + '<div class="small muted">' + esc(d.email || '') + (d.phone ? ' · ' + esc(d.phone) : '') + ' · ' + ago(r.at) + '</div></div>' +
        '<select data-st="' + esc(r.id) + '" style="width:auto"><option value="open" ' + (r.status !== 'replied' && r.status !== 'closed' ? 'selected' : '') + '>Open</option><option value="replied" ' + (r.status === 'replied' ? 'selected' : '') + '>Replied</option><option value="closed" ' + (r.status === 'closed' ? 'selected' : '') + '>Closed</option></select></div>' +
        '<p class="mt2" style="white-space:pre-wrap">' + esc(d.message || '') + '</p>' + (r.reply ? '<div class="notice ok small">' + icon('check') + '<p><b>Internal note' + (r.handledBy ? ' (' + esc(r.handledBy) + ')' : '') + ':</b> ' + esc(r.reply) + '</p></div>' : '') +
        '<div class="row mt2">' + (d.email ? '<a class="btn sm" href="mailto:' + esc(d.email) + '?subject=' + encodeURIComponent('Re: your UniPath question — ' + (d.topic || '')) + '&body=' + encodeURIComponent('Hi ' + (d.name || '') + ',\n\n') + '">' + icon('mail') + 'Reply by email</a>' : '') + (wa.length > 8 ? '<a class="btn sm ghost" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon('phone') + 'WhatsApp</a>' : '') + '<button class="btn sm ghost" data-note="' + esc(r.id) + '">' + icon('pen') + 'Internal note</button></div></div>'; }).join('') + '</div>' : '<div class="empty">' + icon('mail') + '<h3>Inbox zero</h3><p>Questions sent from the site’s “Ask an adviser” form land here.</p></div>');
    $$('[data-if]').forEach((b) => b.onclick = () => { inboxFilter = b.dataset.if; inbox(); });
    $('#ib-ref').onclick = inbox;
    $$('[data-st]').forEach((s) => s.onchange = async () => { try { await api('PATCH', 'responses/' + encodeURIComponent(s.dataset.st), { status: s.value }); U.toast('Marked ' + s.value); inbox(); } catch (e) { U.toast(e.message, 'alert'); } });
    $$('[data-stu]').forEach((b) => b.onclick = () => openStudent(b.dataset.stu));
    $$('[data-note]').forEach((b) => b.onclick = () => { const r = all.find((x) => x.id === b.dataset.note); const m = U.modal({ title: 'Internal note', body: '<textarea id="in-n">' + esc(r.reply || '') + '</textarea><p class="small muted">Only the team sees this.</p>', footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-ok>Save</button>' }); m.el.querySelector('[data-ok]').onclick = async () => { try { await api('PATCH', 'responses/' + encodeURIComponent(r.id), { reply: m.el.querySelector('#in-n').value }); m.close(); inbox(); } catch (e) { U.toast(e.message, 'alert'); } }; });
  }

  /* ---------- Responses & insights ---------- */
  let respTab = 'survey';
  async function loadResponses() {
    if (ONLINE) { try { return (await api('GET', 'responses')).map((r) => Object.assign({}, r.data || {}, { id: r.id, kind: r.kind, at: r.at, status: r.status, userId: r.userId, _server: true })); } catch (e) { U.toast('Couldn’t load server responses: ' + e.message, 'alert'); } }
    return U.store(RESEARCH_KEY) || [];
  }
  async function responses() {
    $('#sec').innerHTML = '<p class="muted">Loading responses…</p>';
    const log = await loadResponses();
    const surveys = log.filter((x) => x.kind === 'survey'), tests = log.filter((x) => x.kind === 'usability'), fb = log.filter((x) => x.kind === 'feedback'), adv = log.filter((x) => x.kind === 'adviser');
    const types = {}; surveys.forEach((s) => { const t = s.stakeholderType || 'Unspecified'; types[t] = (types[t] || 0) + 1; });
    const primary = surveys.filter((s) => /student|applicant/i.test(s.stakeholderType || '')).length, secondary = surveys.length - primary;
    const npsVals = surveys.map((s) => s.nps).filter((v) => v !== '' && v != null).map(Number);
    const nps = npsVals.length ? Math.round((npsVals.filter((v) => v >= 9).length - npsVals.filter((v) => v <= 6).length) / npsVals.length * 100) : null;
    const feat = {}; surveys.forEach((s) => String(s.usefulFeatures || '').split(';').map((x) => x.trim()).filter(Boolean).forEach((f) => feat[f] = (feat[f] || 0) + 1));
    const featTop = Object.entries(feat).sort((a, b) => b[1] - a[1]).slice(0, 6); const maxFeat = Math.max(1, ...featTop.map((x) => x[1]));
    const taskAgg = {}; tests.forEach((t) => (Array.isArray(t.results) ? t.results : safeJSON(t.results) || []).forEach((r) => { const a = taskAgg[r.task] = taskAgg[r.task] || { n: 0, ok: 0, secs: 0, ease: 0, en: 0 }; a.n++; if (r.success) a.ok++; a.secs += +r.seconds || 0; if (r.ease) { a.ease += +r.ease; a.en++; } }));
    const pay = {}; surveys.forEach((s) => { if (s.wouldPay) pay[s.wouldPay] = (pay[s.wouldPay] || 0) + 1; });
    const rated = fb.filter((f) => +f.rating); const fbAvg = rated.length ? (rated.reduce((a, f) => a + +f.rating, 0) / rated.length).toFixed(1) : '—';
    const tabs = [['survey', 'Questionnaires', surveys], ['usability', 'Usability tests', tests], ['feedback', 'Feedback', fb], ['adviser', 'Adviser requests', adv]];
    const cur = tabs.find((t) => t[0] === respTab);
    const COLS = { survey: ['at', 'participant', 'stakeholderType', 'country', 'q1_hardest', 'q2_useful', 'q3_trust', 'usefulFeatures', 'wouldPay', 'nps', 'mediaConsent', 'extra'], usability: ['at', 'participant', 'device', 'tasksCompleted', 'totalSeconds'], feedback: ['at', 'rating', 'page', 'comment', 'contact'], adviser: ['at', 'name', 'email', 'phone', 'topic', 'message', 'status'] };
    $('#sec').innerHTML = '<div class="notice mb2">' + icon('info') + '<p>' + (ONLINE ? 'Showing every response collected on the live site, from any device. Use these numbers for your evidence slides.' : 'Server not connected — showing responses saved on this device only.') + '</p></div>' +
      '<div class="grid g4">' + kpi(surveys.length, 'Questionnaires', 'pen') + kpi(primary + ' / ' + secondary, 'Primary / secondary', 'users') + kpi(tests.length, 'Usability tests', 'test') + kpi(nps == null ? '—' : (nps > 0 ? '+' : '') + nps, 'Net Promoter Score', 'star') + '</div>' +
      '<div class="grid g2 mt3"><div class="card"><h3>Most-wanted features</h3>' + (featTop.length ? featTop.map(([f, n]) => '<div class="bar-mini"><span>' + esc(f) + '</span><b style="text-align:right">' + n + '</b><div class="track"><div class="fill" style="width:' + n / maxFeat * 100 + '%"></div></div></div>').join('') : '<p class="muted small">No questionnaire data yet.</p>') +
      (Object.keys(types).length ? '<hr class="divider"><h4>Who responded</h4>' + Object.entries(types).map(([t, n]) => '<div class="row between small"><span>' + esc(t) + '</span><b>' + n + '</b></div>').join('') : '') + '</div>' +
      '<div class="card"><h3>Usability results by task</h3>' + (Object.keys(taskAgg).length ? '<div class="table-wrap mt1"><table class="tbl"><thead><tr><th>Task</th><th>Success</th><th>Avg time</th><th>Ease /5</th></tr></thead><tbody>' + Object.entries(taskAgg).map(([t, a]) => '<tr><td>' + esc(t) + '</td><td><b>' + Math.round(a.ok / a.n * 100) + '%</b> <small class="muted">(' + a.ok + '/' + a.n + ')</small></td><td>' + Math.round(a.secs / a.n) + 's</td><td>' + (a.en ? (a.ease / a.en).toFixed(1) : '—') + '</td></tr>').join('') + '</tbody></table></div>' : '<p class="muted small">No usability tests yet.</p>') +
      (Object.keys(pay).length ? '<hr class="divider"><h4>Willingness to pay</h4>' + Object.entries(pay).map(([t, n]) => '<div class="row between small"><span>' + esc(t) + '</span><b>' + n + '</b></div>').join('') : '') + '<hr class="divider"><div class="row between small"><span>Average feedback rating</span><b>' + fbAvg + ' / 5</b></div></div></div>' +
      '<div class="row between mt4 mb2"><div class="seg" style="width:auto">' + tabs.map((t) => '<button data-rt="' + t[0] + '" aria-pressed="' + (respTab === t[0]) + '">' + t[1] + ' (' + t[2].length + ')</button>').join('') + '</div>' +
      '<div class="row"><label class="btn sm ghost" style="cursor:pointer">' + icon('upload') + 'Import CSV<input type="file" id="rin" accept=".csv" hidden></label><button class="btn sm ghost" id="rout">' + icon('download') + 'Export CSV</button></div></div>' +
      (cur[2].length ? '<div class="table-wrap"><table class="tbl"><thead><tr>' + COLS[respTab].map((c) => '<th>' + esc(c) + '</th>').join('') + '<th></th></tr></thead><tbody>' + cur[2].slice().sort((a, b) => String(b.at).localeCompare(String(a.at))).map((r) => '<tr>' + COLS[respTab].map((c) => '<td><div class="clip" title="' + esc(r[c]) + '">' + esc(c === 'at' ? new Date(r.at).toLocaleString() : r[c]) + '</div></td>').join('') + '<td><button class="icon-btn" data-rv="' + esc(r.id) + '" style="width:32px;height:32px">' + icon('eye') + '</button></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">' + icon('chart') + '<h3>No ' + cur[1].toLowerCase() + ' yet</h3><p>Share your site’s <b>Help us test</b> page to start collecting responses.</p></div>');
    $$('[data-rt]').forEach((b) => b.onclick = () => { respTab = b.dataset.rt; responses(); });
    $$('[data-rv]').forEach((b) => b.onclick = () => { const r = log.find((x) => x.id === b.dataset.rv); U.modal({ title: 'Response', wide: true, body: '<table class="tbl"><tbody>' + Object.entries(r).filter(([k]) => !['id', '_server'].includes(k)).map(([k, v]) => '<tr><th style="position:static;width:180px">' + esc(k) + '</th><td style="white-space:pre-wrap">' + esc(typeof v === 'object' ? JSON.stringify(v, null, 2) : v) + '</td></tr>').join('') + '</tbody></table>', footer: '<button class="btn danger" data-delr>' + icon('trash') + 'Delete</button><button class="btn" data-close>Close</button>', onOpen: (el, close) => { el.querySelector('[data-delr]').onclick = async () => { if (r._server) { try { await api('DELETE', 'responses/' + encodeURIComponent(r.id)); } catch (e) { return U.toast(e.message, 'alert'); } } else U.store(RESEARCH_KEY, (U.store(RESEARCH_KEY) || []).filter((x) => x.id !== r.id)); close(); responses(); }; } }); });
    $('#rout').onclick = () => { if (!cur[2].length) return U.toast('Nothing to export', 'info'); const rows = cur[2].map((r) => Object.assign({}, r, { results: typeof r.results === 'object' ? JSON.stringify(r.results) : r.results })); const cols = respTab === 'usability' ? COLS.usability.concat(['results']) : COLS[respTab]; U.download('unipath-' + respTab + '-' + new Date().toISOString().slice(0, 10) + '.csv', U.toCSV(rows, cols), 'text/csv'); };
    $('#rin').onchange = async (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rows = U.parseCSV(await f.text());
      if (ONLINE) { let n = 0; for (const r of rows) { try { if (respTab === 'usability' && r.results) r.results = String(r.results); await U.API.call('POST', 'submit', { kind: respTab, data: r }); n++; } catch (err) {} } U.toast(n + ' responses imported', 'upload'); }
      else { const ex = U.store(RESEARCH_KEY) || []; rows.forEach((r) => { const o = Object.assign({ kind: respTab, id: U.uid(respTab), at: r.submittedAt || r.created_at || new Date().toISOString() }, r); if (respTab === 'usability') o.results = safeJSON(r.results) || []; ex.push(o); }); U.store(RESEARCH_KEY, ex); U.toast(rows.length + ' responses imported', 'upload'); }
      responses();
    };
  }
  function safeJSON(s) { try { return typeof s === 'string' ? JSON.parse(s) : s; } catch (e) { return null; } }

  /* ---------- Publish ---------- */
  function cleanForPublish() { const out = clone(D); if (out.meta) delete out.meta.draftSavedAt; if (out.site) delete out.site.adminPassHash; out.meta = Object.assign({}, out.meta, { version: ((PUB.meta || {}).version || 1) + 1 }); return out; }
  function publish() {
    const dirty = isDirty();
    $('#sec').innerHTML = '<div class="grid g2"><div class="card pad-lg"><span class="draft-pill ' + (dirty ? 'dirty' : 'clean') + '">' + icon(dirty ? 'alert' : 'check') + (dirty ? 'You have unpublished changes' : 'Live site matches your draft') + '</span>' +
      '<h2 class="mt2">Publish your changes</h2>' + (ONLINE ? '<p class="muted">Publishing updates programmes, scholarships, text and settings on the live site instantly for every visitor. A backup of each version is kept.</p><button class="btn lg" id="go-live" ' + (dirty ? '' : 'disabled') + '>' + icon('upload') + 'Publish live now</button><p class="small muted mt2 mb0" id="last-pub"></p>' :
        '<div class="notice warn">' + icon('alert') + '<p>Server not connected. Download <b>content.json</b>, replace <span class="kbd">public/data/content.json</span> in your repository and redeploy.</p></div>') + '</div>' +
      '<div class="stack"><div class="card"><h3>Other options</h3><div class="stack"><button class="btn ghost block" id="json">' + icon('db') + 'Download content.json backup</button>' +
      '<label class="btn ghost block" style="cursor:pointer">' + icon('upload') + 'Load a content.json into the draft<input type="file" id="jin" accept=".json" hidden></label>' +
      '<button class="btn ghost block" id="prev">' + icon('eye') + 'Preview draft on the site</button>' +
      '<button class="btn danger block" id="discard" ' + (dirty ? '' : 'disabled') + '>' + icon('refresh') + 'Discard all unpublished changes</button></div></div>' +
      (ONLINE ? '<div class="card"><h3>Recent publishes</h3><div id="hist" class="small muted">Loading…</div></div>' : '') + '</div></div>';
    $('#json').onclick = () => U.download('content.json', JSON.stringify(cleanForPublish(), null, 2), 'application/json');
    $('#prev').onclick = previewSite;
    $('#discard').onclick = async () => { if (await U.confirmBox('Discard changes?', 'Your draft will be replaced with what is currently live.', 'Discard')) { U.Content.clearDraft(); D = clone(PUB); U.Content.saveDraft(D); shell(); U.toast('Draft discarded', 'refresh'); } };
    $('#jin').onchange = async (e) => { try { const j = JSON.parse(await e.target.files[0].text()); if (!j.programs || !j.site) throw new Error(); D = j; persist(); shell(); U.toast('Content loaded into your draft', 'upload'); } catch (err) { U.toast('That isn’t a valid content.json', 'alert'); } };
    const gl = $('#go-live'); if (gl) gl.onclick = async () => {
      gl.disabled = true; gl.innerHTML = icon('refresh') + 'Publishing…';
      try { const out = cleanForPublish(); const r = await api('PUT', 'content', out); out.meta.updatedAt = r.updatedAt; PUB = clone(out); D = clone(out); U.Content.saveDraft(D); U.Content.setPreview(false); U.toast('Published — the live site is updated', 'check'); shell(); }
      catch (e) { U.toast('Publish failed: ' + e.message, 'alert'); gl.disabled = false; gl.innerHTML = icon('upload') + 'Publish live now'; }
    };
    if (ONLINE) api('GET', 'content/history').then((h) => { const el = $('#hist'); if (el) el.innerHTML = h.length ? '<ul style="padding-left:18px;margin:0">' + h.slice(0, 8).map((x) => '<li>' + new Date(x.at).toLocaleString() + ' — ' + esc(x.by) + ' (' + x.programmes + ' programmes)</li>').join('') + '</ul>' : 'Nothing published from the console yet — the site is using the content that shipped with the code.'; }).catch(() => {});
  }

  /* ---------- Settings ---------- */
  async function settings() {
    const owner = !ME || ME.role === 'owner';
    $('#sec').innerHTML = '<div class="grid g2"><form class="card pad-lg" id="pw"><h3>' + (owner ? 'Change owner passcode' : 'Change your password') + '</h3><p class="small muted">' + (ONLINE ? 'Takes effect immediately.' : 'Saved to the draft — publish to apply.') + '</p>' +
      '<label class="field"><span>New ' + (owner ? 'passcode' : 'password') + '</span><input type="password" name="a" minlength="8" required autocomplete="new-password"></label><label class="field mt2"><span>Repeat</span><input type="password" name="b" minlength="8" required autocomplete="new-password"></label><button class="btn mt3">' + icon('lock') + 'Update</button></form>' +
      '<div class="card"><h3>Team access</h3>' + (ONLINE ? '<p class="small muted">Give each adviser their own sign-in so you can see who did what. Only the owner can add or remove people.</p><div id="team">Loading…</div>' + (owner ? '<form id="addadm" class="form-grid mt2"><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>Email</span><input type="email" name="email" required></label><label class="field full"><span>Temporary password</span><input name="password" minlength="8" required></label><div class="full"><button class="btn">' + icon('plus') + 'Add team member</button></div></form>' : '') : '<p class="small muted">Available once the server is connected.</p>') + '</div></div>' +
      '<div class="card mt3"><h3>About security</h3><p class="small mb0">Passwords are stored as salted hashes, sessions are signed tokens, and student documents are only downloadable by signed-in team members. Keep your Netlify account protected with two-factor authentication — it controls the server and its data.</p></div>';
    $('#pw').onsubmit = async (e) => {
      e.preventDefault(); if (e.target.a.value !== e.target.b.value) return U.toast('They don’t match', 'alert');
      if (ONLINE) { try { await api('POST', 'password', { password: e.target.a.value }); e.target.reset(); U.toast('Updated', 'lock'); } catch (err) { U.toast(err.message, 'alert'); } }
      else { D.site.adminPassHash = await U.sha256('unipath:' + e.target.a.value); persist(); e.target.reset(); U.toast('Saved to draft — publish to apply', 'lock'); }
    };
    if (!ONLINE) return;
    const loadTeam = async () => {
      try { const t = await api('GET', 'team'); $('#team').innerHTML = '<table class="tbl"><tbody><tr><td><b>Owner</b><br><small class="muted">Passcode sign-in</small></td><td></td></tr>' + t.admins.map((a) => '<tr><td><b>' + esc(a.name) + '</b><br><small class="muted">' + esc(a.email) + '</small></td><td style="text-align:right">' + (owner ? '<button class="btn sm danger" data-rmadm="' + esc(a.email) + '">Remove</button>' : '') + '</td></tr>').join('') + '</tbody></table>';
        $$('[data-rmadm]').forEach((b) => b.onclick = async () => { if (!(await U.confirmBox('Remove access?', b.dataset.rmadm + ' will no longer be able to sign in.', 'Remove'))) return; try { await api('DELETE', 'team/' + encodeURIComponent(b.dataset.rmadm)); loadTeam(); } catch (e) { U.toast(e.message, 'alert'); } });
      } catch (e) { $('#team').textContent = e.message; }
    };
    loadTeam();
    const f = $('#addadm'); if (f) f.onsubmit = async (e) => { e.preventDefault(); try { await api('POST', 'team', Object.fromEntries(new FormData(f))); f.reset(); U.toast('Team member added — share their password privately', 'users'); loadTeam(); } catch (err) { U.toast(err.message, 'alert'); } };
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
