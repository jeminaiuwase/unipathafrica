/* UniPath Africa — student app */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;

  /* ================= State ================= */
  const STATE_KEY = 'unipath.state';
  const DEFAULT_STATE = () => ({
    profile: null, shortlist: [], compare: [], applications: [], docs: {}, statements: [], references: [],
    enrollChecks: {}, interviewNotes: {}, costPlan: null, visa: {}, watch: [],
    settings: { theme: null, text: 'normal', currency: 'UGX' }, dismissed: {}, createdAt: new Date().toISOString()
  });
  let S = Object.assign(DEFAULT_STATE(), U.store(STATE_KEY) || {});
  S.settings = Object.assign(DEFAULT_STATE().settings, S.settings || {});
  let syncTimer = null, syncState = 'idle';
  function save() {
    S.updatedAt = new Date().toISOString();
    U.store(STATE_KEY, S);
    if (U.API.signedIn() && !testerActive()) { clearTimeout(syncTimer); setSync('pending'); syncTimer = setTimeout(pushState, 1200); }
  }
  function testerActive() { const t = U.store('unipath.tester'); return !!(t && t.active); }
  async function pushState(keepalive) {
    if (!U.API.signedIn() || testerActive()) return;
    try { await U.API.call('PUT', 'state', { state: S }, { keepalive: !!keepalive }); setSync('saved'); }
    catch (e) { if (e.status === 401) { signOut(true); U.toast('Your session expired — please sign in again', 'lock'); } else setSync('offline'); }
  }
  function setSync(st) { syncState = st; const el = document.getElementById('sync-dot'); if (el) { el.className = 'dot ' + st; el.title = { pending: 'Saving…', saved: 'Saved to your account', offline: 'Offline — will sync later' }[st] || ''; } }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && syncState === 'pending') { clearTimeout(syncTimer); pushState(true); } });
  window.addEventListener('online', () => { if (syncState === 'offline') pushState(); });

  /* ---------- Accounts ---------- */
  async function adoptSession(res, opts) {
    U.API.setToken(res.token || U.API.token()); U.API.setUser(res.user);
    const hasLocal = !!(S.profile || S.applications.length || S.shortlist.length);
    const serverState = res.state;
    if (serverState && hasLocal && !(opts && opts.fresh)) {
      const choice = await chooseState(serverState);
      if (choice === 'server') { S = Object.assign(DEFAULT_STATE(), serverState); U.store(STATE_KEY, S); }
      else await pushState();
    } else if (serverState) { S = Object.assign(DEFAULT_STATE(), serverState); U.store(STATE_KEY, S); }
    else await pushState();
    await uploadLocalDocs();
    updateUserChip();
  }
  function chooseState(server) {
    return new Promise((res) => {
      const n = (x) => ((x.applications || []).length) + ' application(s), ' + ((x.shortlist || []).length) + ' saved';
      const m = U.modal({ title: 'Which progress should we keep?', body: '<p class="mt0">This device has progress that isn’t in your account yet.</p><div class="grid g2"><div class="card flat"><b>In your account</b><p class="small muted mb0">' + n(server) + '</p></div><div class="card flat"><b>On this device</b><p class="small muted mb0">' + n(S) + '</p></div></div>', footer: '<button class="btn ghost" data-s>Use my account</button><button class="btn" data-l>Keep this device’s progress</button>', onClose: () => res('server') });
      m.el.querySelector('[data-s]').onclick = () => { m.close(); };
      m.el.querySelector('[data-l]').onclick = () => { res('local'); m.close(); };
    });
  }
  async function uploadLocalDocs() {
    for (const [k, d] of Object.entries(S.docs || {})) {
      if (!d || !d.fileName || d.cloud) continue;
      try { const f = await U.Vault.get(k); if (f) { await uploadDoc(k, f); } } catch (e) {}
    }
  }
  async function uploadDoc(key, file) {
    if (!U.API.signedIn()) return null;
    const r = await U.API.call('PUT', 'docs/' + encodeURIComponent(key), file, { type: file.type || 'application/octet-stream', headers: { 'x-file-name': encodeURIComponent(file.name || key) } });
    S.docs[key] = Object.assign(S.docs[key] || {}, { cloud: true }); save();
    return r;
  }
  async function fetchDoc(key) {
    try { const f = await U.Vault.get(key); if (f) return f; } catch (e) {}
    if (!U.API.signedIn()) return null;
    const r = await U.API.call('GET', 'docs/' + encodeURIComponent(key), undefined, { raw: true });
    return await r.blob();
  }
  async function deleteDoc(key) {
    try { await U.Vault.del(key); } catch (e) {}
    if (U.API.signedIn()) { try { await U.API.call('DELETE', 'docs/' + encodeURIComponent(key)); } catch (e) {} }
  }
  async function signOut(silent) {
    clearTimeout(syncTimer);
    if (!silent && syncState === 'pending') await pushState();
    U.API.setToken(''); U.API.setUser(null);
    localStorage.removeItem(STATE_KEY); try { await U.Vault.clear(); } catch (e) {}
    S = DEFAULT_STATE(); U.store(STATE_KEY, S); updateUserChip();
    if (!silent) { U.toast('Signed out — your progress is safe in your account', 'logout'); U.go('/'); }
  }
  function updateUserChip() {
    const b = document.querySelector('[aria-label="My Admissions Passport"]'); if (!b) return;
    const u = U.API.user();
    let dot = document.getElementById('sync-dot');
    if (U.API.signedIn() && u) { b.title = 'Signed in as ' + (u.name || u.email); if (!dot) { dot = document.createElement('span'); dot.id = 'sync-dot'; dot.className = 'dot saved'; b.appendChild(dot); } }
    else { b.title = 'My Admissions Passport'; if (dot) dot.remove(); }
  }
  function authForm(mode) {
    const signup = mode === 'signup';
    return '<form id="auth-form" class="stack">' +
      (signup ? '<label class="field"><span>Full name</span><input name="name" required autocomplete="name" value="' + esc((S.profile && S.profile.name) || '') + '"></label>' : '') +
      '<label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email"></label>' +
      (signup ? '<label class="field"><span>Phone / WhatsApp <small class="muted">(optional)</small></span><input type="tel" name="phone" autocomplete="tel"></label>' : '') +
      '<label class="field"><span>Password</span><input type="password" name="password" required minlength="8" autocomplete="' + (signup ? 'new-password' : 'current-password') + '">' + (signup ? '<span class="hint">At least 8 characters.</span>' : '') + '</label>' +
      (signup ? '<label class="check small"><input type="checkbox" name="consent" required><span>I agree that UniPath Africa stores my profile, applications and uploaded documents securely, and that UniPath advisers may view them to support my applications. I can download or delete my data at any time. <a href="/privacy" target="_blank">Privacy notice</a>. If I am under 18, a parent or guardian knows I am using UniPath.</span></label>' : '') +
      '<p class="small" id="auth-err" style="color:var(--bad);margin:0"></p>' +
      '<button class="btn block lg">' + icon(signup ? 'user' : 'lock') + (signup ? 'Create my free account' : 'Sign in') + '</button></form>';
  }
  function bindAuthForm(mode, done) {
    const f = $('#auth-form'); if (!f) return;
    f.onsubmit = async (e) => {
      e.preventDefault(); if (!f.reportValidity()) return;
      const d = Object.fromEntries(new FormData(f)); const btn = f.querySelector('button.btn'); btn.disabled = true;
      try {
        let res;
        if (mode === 'signup') { res = await U.API.call('POST', 'auth/signup', { name: d.name, email: d.email, phone: d.phone, password: d.password, consent: !!d.consent, state: S }); await adoptSession(res, { fresh: true }); }
        else { res = await U.API.call('POST', 'auth/login', { email: d.email, password: d.password }); await adoptSession(res); }
        U.toast(mode === 'signup' ? 'Account created — your progress is saved' : 'Welcome back' + (res.user.name ? ', ' + res.user.name.split(' ')[0] : ''), 'check');
        done && done();
      } catch (err) { $('#auth-err').textContent = err.message; btn.disabled = false; }
    };
  }
  function promptAccount(reason, after) {
    if (!U.API.online || U.API.signedIn()) { after && after(); return; }
    let mode = 'signup';
    const m = U.modal({
      title: 'Save your progress', body: '<p class="muted mt0">' + esc(reason || 'Create a free account so your profile, applications and documents are saved — and a UniPath adviser can help you.') + '</p><div id="auth-box">' + authForm(mode) + '</div><p class="small tc mt2 mb0">Already have an account? <button class="btn link" id="auth-switch">Sign in</button></p>',
      footer: '<button class="btn ghost" data-close>Maybe later</button>', onClose: () => after && after()
    });
    const bind = () => bindAuthForm(mode, () => m.close());
    bind();
    m.el.querySelector('#auth-switch').onclick = () => { mode = mode === 'signup' ? 'login' : 'signup'; m.el.querySelector('#auth-box').innerHTML = authForm(mode); m.el.querySelector('#auth-switch').textContent = mode === 'signup' ? 'Sign in' : 'Create an account'; bind(); };
  }
  function accountNudge() {
    if (!U.API.online) return '';
    if (U.API.signedIn()) return adviserNotes();
    return '<div class="notice mb2 signin-note" style="align-items:center">' + icon('user') + '<p style="flex:1 1 220px;min-width:0"><b>You’re not signed in.</b> Your progress is only on this device. Create a free account to save it and get help from a UniPath adviser.</p><span class="row" style="gap:6px;flex-wrap:wrap"><a class="btn sm" href="/account/signup">Create account</a><a class="btn sm ghost" href="/account">Sign in</a></span></div>';
  }
  function adviserNotes() {
    const u = U.API.user(); const notes = (u && u.notes) || [];
    if (!notes.length) return '';
    const n = notes[notes.length - 1];
    return '<div class="notice ok mb2">' + icon('message') + '<div><b>Message from your UniPath adviser</b> <span class="small muted">· ' + U.fmtDate(n.at.slice(0, 10)) + '</span><p class="mt1" style="white-space:pre-wrap">' + esc(n.text) + '</p>' + (notes.length > 1 ? '<a class="small" href="/passport">See all ' + notes.length + ' messages</a>' : '') + '</div></div>';
  }
  const RESEARCH_KEY = 'unipath.research.log';
  function logResearch(kind, data) {
    const log = U.store(RESEARCH_KEY) || [];
    log.push(Object.assign({ kind, id: U.uid(kind), at: new Date().toISOString() }, data));
    U.store(RESEARCH_KEY, log);
  }

  let C = null; // content

  /* ================= Reference data ================= */
  const QUALS = {
    UACE: { label: 'UACE — Uganda A-Level', level: 'Undergraduate', options: [['20+ points', 95], ['17–19 points', 85], ['14–16 points', 74], ['11–13 points', 63], ['8–10 points', 52], ['5–7 points', 42], ['Below 5 points', 30]] },
    KCSE: { label: 'KCSE — Kenya', level: 'Undergraduate', options: [['A', 95], ['A-', 90], ['B+', 84], ['B', 78], ['B-', 72], ['C+', 66], ['C', 58], ['C-', 50], ['D+ or below', 38]] },
    ACSEE: { label: 'ACSEE — Tanzania', level: 'Undergraduate', options: [['Division I', 90], ['Division II', 76], ['Division III', 58], ['Division IV', 40]] },
    RWA: { label: 'Rwanda Advanced Certificate', level: 'Undergraduate', options: [['3 principal passes, strong grades', 88], ['3 principal passes', 75], ['2 principal passes', 60], ['1 principal pass', 42]] },
    WASSCE: { label: 'WASSCE — West Africa', level: 'Undergraduate', options: [['8–9 credits, mostly A1–B3', 92], ['6–7 credits incl. English & Maths, mostly B', 80], ['6 credits incl. English & Maths (C4–C6)', 64], ['5 credits or fewer', 45]] },
    ALEVEL: { label: 'A-Levels (Cambridge / Edexcel)', level: 'Undergraduate', options: [['A*A*A or better', 98], ['AAA', 92], ['AAB', 86], ['ABB', 80], ['BBB', 74], ['BBC', 68], ['CCC', 58], ['Below CCC', 45]] },
    IB: { label: 'IB Diploma', level: 'Undergraduate', options: [['40–45 points', 96], ['36–39 points', 88], ['32–35 points', 78], ['28–31 points', 66], ['24–27 points', 54]] },
    DIPLOMA: { label: 'Diploma', level: 'Undergraduate', options: [['Distinction', 82], ['Credit', 68], ['Pass', 52]] },
    BACHELOR: { label: "Bachelor's degree", level: 'Postgraduate', options: [['First class', 92], ['Upper second (2:1)', 80], ['Lower second (2:2)', 66], ['Pass / Third class', 52]] }
  };
  const FIELDS = ['Business & Management', 'Computing & IT', 'Economics & Finance', 'Health & Medicine', 'Engineering', 'Law', 'Education', 'Agriculture & Environment', 'Arts & Social Sciences', 'Science & Mathematics', 'Architecture & Design', 'Media & Communication', 'Any field'];
  const HOME_COUNTRIES = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'DR Congo', 'Ethiopia', 'Ghana', 'Nigeria', 'South Africa', 'Zambia', 'Zimbabwe', 'Other'];
  const STAGES = [
    { id: 'preparing', label: 'Preparing' }, { id: 'ready', label: 'Ready to submit' }, { id: 'submitted', label: 'Submitted' },
    { id: 'decision', label: 'Awaiting decision' }, { id: 'offer', label: 'Offer received' }, { id: 'enrolled', label: 'Enrolled' }, { id: 'closed', label: 'Closed' }
  ];
  const stageLabel = (id) => (STAGES.find((s) => s.id === id) || { label: id }).label;

  /* ================= Helpers ================= */
  const cur = () => S.settings.currency || 'UGX';
  const money = (usd, c, o) => U.money(usd, c || cur(), o);
  const progById = (id) => (C.programs || []).find((p) => p.id === id);
  function appInfo(a) {
    const p = a.programId ? progById(a.programId) : null;
    const c = a.custom || {};
    return {
      p, kind: a.kind || 'programme',
      university: p ? p.university : (c.university || 'Custom application'),
      program: p ? p.program : (c.program || 'Programme'),
      country: p ? p.country : (c.country || ''),
      level: p ? p.level : (c.level || 'Undergraduate'),
      deadline: a.deadlineOverride || (p ? p.deadline : c.deadline),
      url: p ? (p.applyUrl || p.officialUrl) : c.url,
      requirementsText: p ? p.requirementsText : '',
      englishTest: p ? p.englishTest : ''
    };
  }
  function homeCountry() { return (S.profile && S.profile.homeCountry) || 'Uganda'; }
  function isInternational(country) { return country && country !== homeCountry(); }

  function ring(v, cls, label, color) {
    const col = color || (v >= 80 ? 'var(--ok)' : v >= 60 ? 'var(--brand)' : v >= 45 ? 'var(--sun)' : 'var(--coral)');
    return '<div class="ring ' + (cls || '') + '" role="img" aria-label="' + v + (label ? ' ' + label : '') + '"><svg viewBox="0 0 36 36"><circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--bg-2)" stroke-width="3.4"/>' + (v > 0 ? '<circle cx="18" cy="18" r="15.9" fill="none" stroke="' + col + '" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="' + v + ' 100"/>' : '') + '</svg><div class="val">' + v + (label ? '<small>' + label + '</small>' : '') + '</div></div>';
  }
  function dataBadge(p) {
    return p.verified ? '<span class="badge ok" title="Fees checked on the official website">' + icon('shield') + 'Verified' + (p.lastVerified ? ' ' + U.fmtDate(p.lastVerified, { month: 'short', year: 'numeric' }) : '') + '</span>' : p.listed ? '<span class="badge sky" title="Programme confirmed on the university’s official list; fees are estimates">' + icon('check') + 'On official list</span>' : '<span class="badge warn" title="Estimated figures — confirm on the official website">' + icon('info') + 'Indicative</span>';
  }
  function journeySteps(active) {
    const steps = [['discover', 'Discover'], ['match', 'Match'], ['prepare', 'Prepare'], ['track', 'Track'], ['enroll', 'Enrol'], ['thrive', 'Thrive']];
    const done = { discover: !!S.profile, match: S.shortlist.length > 0 || S.applications.length > 0, prepare: S.applications.some((a) => readiness(a).pct >= 100), track: S.applications.some((a) => ['submitted', 'decision', 'offer', 'enrolled'].includes(a.stage)), enroll: S.applications.some((a) => a.stage === 'enrolled'), thrive: !!(S.thrive && Object.values(S.thrive.checks || {}).filter(Boolean).length >= 5) };
    return '<nav class="journey-steps" aria-label="Your journey">' + steps.map((s, i) => '<a href="/' + s[0] + '" class="' + (s[0] === active ? 'active' : '') + ' ' + (done[s[0]] && s[0] !== active ? 'done' : '') + '"><i>' + (done[s[0]] && s[0] !== active ? '✓' : i + 1) + '</i>' + s[1] + '</a>').join('') + '</nav>';
  }
  function pageHead(title, sub, right) {
    return '<div class="page-head"><div><h1>' + title + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (right ? '<div class="row">' + right + '</div>' : '') + '</div>';
  }
  function emptyState(ic, title, text, cta) {
    return '<div class="empty">' + icon(ic) + '<h3>' + title + '</h3><p>' + text + '</p>' + (cta || '') + '</div>';
  }

  /* ================= Matching engine ================= */
  function scoreProgram(p, prof) {
    const r = []; let s = 0;
    const diff = prof.score - (+p.minScore || 0);
    if (diff >= 8) { s += 40; r.push(['yes', 'Your results are comfortably above the typical entry level']); }
    else if (diff >= 0) { s += 34; r.push(['yes', 'Your results meet the typical entry level']); }
    else if (diff >= -6) { s += 20; r.push(['maybe', 'Slightly below the typical entry level — a reach, or ask about foundation routes']); }
    else { s += 6; r.push(['no', 'Below the typical entry level for this programme']); }

    const total = (+p.tuitionUSD || 0) + (+p.livingUSD || 0);
    const budget = prof.budgetAmount ? U.toUSD(prof.budgetAmount, prof.budgetCurrency || 'UGX') : 0;
    if (!budget) { s += 18; r.push(['maybe', 'Est. ' + money(total, null, { compact: true }) + ' per year (tuition + living)']); }
    else if (total <= budget) { s += 25; r.push(['yes', 'Within your budget — est. ' + money(total, null, { compact: true }) + '/yr']); }
    else if (total <= budget * 1.3) { s += 15; r.push(['maybe', 'About ' + Math.round((total / budget - 1) * 100) + '% over your budget — est. ' + money(total, null, { compact: true }) + '/yr']); }
    else if (p.scholarships && prof.scholarship) { s += 10; r.push(['maybe', 'Above your budget — scholarships could close the gap']); }
    else { s += 3; r.push(['no', 'Well above your budget — est. ' + money(total, null, { compact: true }) + '/yr']); }

    const dests = prof.destinations || [];
    if (!dests.length || dests.includes('Anywhere')) s += 15;
    else if (dests.includes(p.country)) { s += 15; r.push(['yes', 'In a destination you chose']); }
    else if (dests.includes('Anywhere in Africa') && p.region === 'Africa') { s += 15; r.push(['yes', 'In Africa, as you prefer']); }
    else { s += 4; r.push(['maybe', 'Outside your chosen destinations']); }

    if (prof.scholarship) { if (p.scholarships) { s += 10; r.push(['yes', 'Scholarships or financial aid available']); } else { s += 3; r.push(['maybe', 'No scholarships listed — check with the university']); } }
    else s += 8;

    const n = U.daysUntil(p.deadline);
    if (n == null) s += 6;
    else if (n < 0) r.push(['no', 'Deadline has passed for this intake']);
    else if (n <= 21) { s += 5; r.push(['maybe', 'Deadline is soon — ' + n + ' days left']); }
    else { s += 10; r.push(['yes', 'Applications open — ' + n + ' days to deadline']); }

    if (isInternational(p.country) && /ielts|toefl|duolingo/i.test(p.englishTest || '')) r.push(['maybe', 'English test may be needed (' + p.englishTest + ') — ask about waivers']);
    const score = U.clamp(Math.round(s), 0, 100);
    const label = score >= 80 ? 'Strong' : score >= 62 ? 'Good' : score >= 45 ? 'Possible' : 'Reach';
    return { score, label, reasons: r, fieldMatch: prof.field === 'Any field' || p.field === prof.field, closed: n != null && n < 0 };
  }

  /* ================= Readiness ================= */
  function checklistFor(a) {
    const info = appInfo(a);
    const items = C.checklistItems || [];
    let list;
    if (info.kind === 'scholarship') {
      const ids = ['c-transcripts', 'c-certs', 'c-id', 'c-statement', 'i-refs'];
      list = items.filter((i) => ids.includes(i.id)).map((i) => Object.assign({}, i));
      list.push({ id: 'sch-elig', label: 'Confirm eligibility criteria on the official website', tip: 'Check nationality, level, subject and age rules before writing anything.' });
      list.push({ id: 'sch-essay', label: 'Write the scholarship essay', tip: 'Focus on impact and how you will give back — use the Statement Studio.' });
    } else {
      const groups = ['common', isInternational(info.country) ? 'international' : 'local'];
      if (info.level === 'Postgraduate') groups.push('postgraduate');
      list = items.filter((i) => groups.includes(i.group)).map((i) => Object.assign({}, i));
      if (info.requirementsText) list.splice(1, 0, { id: 'req-entry', label: 'Confirm you meet the entry requirements', tip: info.requirementsText });
      if (isInternational(info.country) && info.englishTest && !list.some((i) => i.docKey === 'english')) list.push({ id: 'req-eng', label: 'English requirement: ' + info.englishTest, tip: 'Ask whether an English-medium schooling letter can replace a test.', docKey: 'english' });
    }
    // de-duplicate by docKey (e.g. statement for PG)
    const seen = new Set();
    list = list.filter((i) => { const k = i.docKey ? 'd:' + i.docKey : 'i:' + i.id; if (seen.has(k)) return false; seen.add(k); return true; });
    (a.customTasks || []).forEach((t) => list.push({ id: t.id, label: t.label, tip: 'Your own task', custom: true }));
    return list;
  }
  function itemDone(a, item) {
    if (a.checks && a.checks[item.id]) return 'manual';
    if (item.docKey && S.docs[item.docKey] && S.docs[item.docKey].status === 'ready') return 'vault';
    return '';
  }
  function readiness(a) {
    const list = checklistFor(a); const done = list.filter((i) => itemDone(a, i)).length;
    return { list, done, total: list.length, pct: list.length ? Math.round(done / list.length * 100) : 0 };
  }
  function nextAction(a) {
    const info = appInfo(a);
    if (a.stage === 'submitted' || a.stage === 'decision') return 'Check the university portal weekly for a decision';
    if (a.stage === 'offer') return 'Review your offer and next steps in Enrol';
    if (a.stage === 'enrolled') return 'You are enrolled — congratulations!';
    if (a.stage === 'closed') return 'Closed';
    const r = readiness(a); const todo = r.list.find((i) => !itemDone(a, i));
    if (!todo) return 'Everything is ready — submit on the official portal' + (info.url ? '' : '');
    return todo.label;
  }
  function planFor(a) {
    const info = appInfo(a); const d = info.deadline; if (!d) return [];
    const intl = isInternational(info.country);
    const m = [
      [-56, 'Confirm your shortlist and ask referees for letters'],
      [-42, 'Request certified transcripts and certificates'],
      [-28, 'Finish the first full draft of your statement'],
      intl ? [-21, 'Complete your English test (or get a waiver letter)'] : [-21, 'Check sponsorship and loan options'],
      [-14, 'Final statement, all documents scanned and named clearly'],
      [-7, 'Submit — aim for one week before the deadline'],
      [0, 'Official deadline']
    ];
    return m.map(([off, t]) => ({ date: U.addDays(d, off), title: t, deadline: off === 0 }));
  }

  /* ================= App lifecycle ================= */
  function startApplication(programId, opts) {
    if (S.applications.some((a) => a.programId === programId)) { U.toast('Already in your applications'); U.go('/prepare/checklist/' + S.applications.find((a) => a.programId === programId).id); return; }
    const a = { id: U.uid('app'), programId, stage: 'preparing', checks: {}, notes: '', createdAt: new Date().toISOString(), customTasks: [] };
    S.applications.push(a);
    if (!S.shortlist.includes(programId)) S.shortlist.push(programId);
    save(); U.toast('Application started — your checklist is ready', 'list');
    if (!opts || !opts.stay) U.go('/prepare/checklist/' + a.id);
    return a;
  }
  function addCustomApplication(prefill) {
    const p = prefill || {};
    const m = U.modal({
      title: p.kind === 'scholarship' ? 'Track a scholarship' : 'Add an application',
      body: '<form class="form-grid" id="custom-app">' +
        '<label class="field full"><span>' + (p.kind === 'scholarship' ? 'Provider' : 'University') + '</span><input name="university" required value="' + esc(p.university || '') + '"></label>' +
        '<label class="field full"><span>' + (p.kind === 'scholarship' ? 'Scholarship' : 'Programme') + '</span><input name="program" required value="' + esc(p.program || '') + '"></label>' +
        '<label class="field"><span>Country</span><input name="country" value="' + esc(p.country || '') + '" placeholder="e.g. Uganda"></label>' +
        '<label class="field"><span>Deadline</span><input type="date" name="deadline" value="' + esc(p.deadline || '') + '"></label>' +
        '<label class="field"><span>Level</span><select name="level"><option>Undergraduate</option><option>Postgraduate</option></select></label>' +
        '<label class="field"><span>Official link</span><input type="url" name="url" value="' + esc(p.url || '') + '" placeholder="https://"></label>' +
        '</form>',
      footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-save>' + icon('plus') + 'Add</button>'
    });
    m.el.querySelector('[data-save]').addEventListener('click', () => {
      const f = m.el.querySelector('form'); if (!f.reportValidity()) return;
      const d = Object.fromEntries(new FormData(f));
      S.applications.push({ id: U.uid('app'), programId: null, kind: p.kind || 'programme', custom: d, stage: 'preparing', checks: {}, notes: '', createdAt: new Date().toISOString(), customTasks: [] });
      save(); m.close(); U.toast('Added to your applications'); render();
    });
  }
  window.APP_ACTIONS = { startApplication, addCustomApplication };

  function toggleShortlist(id) {
    const i = S.shortlist.indexOf(id);
    if (i >= 0) { S.shortlist.splice(i, 1); U.toast('Removed from saved', 'bookmark'); } else { S.shortlist.push(id); U.toast('Saved to your shortlist', 'heart'); }
    save();
  }

  /* ================= Views ================= */
  const views = {};

  /* ---------- Home ---------- */
  views.home = function () {
    const s = C.site || {};
    const prof = S.profile;
    const nProg = (C.programs || []).length, nCountries = new Set((C.programs || []).map((p) => p.country)).size, nSch = (C.scholarships || []).length;
    const quotes = (C.quotes || []).filter((q) => q.consent && q.show !== false && q.text);
    const resume = prof ? '<div class="card tint row between mt3"><div><b>Welcome back' + (prof.name ? ', ' + esc(prof.name) : '') + '.</b> <span class="muted">You have ' + S.applications.length + ' application' + (S.applications.length === 1 ? '' : 's') + ' and ' + S.shortlist.length + ' saved programme' + (S.shortlist.length === 1 ? '' : 's') + '.</span></div><a class="btn" href="/' + (S.applications.length ? 'track' : 'match') + '">Continue ' + icon('right') + '</a></div>' : '';
    return '<section class="hero"><div class="container hero-grid"><div>' +
      '<span class="eyebrow">Education technology · Built for African students</span>' +
      '<h1>' + esc(s.heroTitle || 'Find a university that fits your future.').replace(/fits your future/i, '<em>fits your future</em>') + '</h1>' +
      '<p class="lead">' + esc(s.heroSubtitle || '') + '</p>' +
      '<div class="cta"><a class="btn lg" href="/discover">' + icon('compass') + (prof ? 'Update my profile' : 'Find my matches') + '</a><a class="btn lg ghost" href="/book">' + icon('message') + 'Talk to an adviser</a></div>' +
      '<div class="trust-row"><span>' + icon('check') + 'Free for students</span><span>' + icon('lock') + 'Secure free account</span><span>' + icon('shield') + 'No pay-to-rank</span></div>' + resume +
      '</div><div class="hero-art"><div class="hero-blob"></div><div class="hero-phone">' +
      heroCard() +
      '</div></div></div></section>' +

      '<section class="block alt"><div class="container"><div class="section-head"><span class="eyebrow">How it works</span><h2>One guided path, from first search to graduation day.</h2><p class="muted">Most students juggle dozens of websites, deadlines and documents. UniPath Africa puts the whole journey in one place.</p></div>' +
      '<div class="journey">' + [
        ['Discover', 'Tell us your results, course, budget and where you’d like to study.', '/discover'],
        ['Match', 'See programmes that appear to fit — and exactly why — with real costs in your currency.', '/match'],
        ['Prepare', 'Get a personalised checklist, document vault, statement studio and cost planner.', '/prepare'],
        ['Track', 'Every application, deadline and next step on one board, with calendar reminders.', '/track'],
        ['Enrol', 'Turn an offer into a place: deposits, visas, housing and registration — safely.', '/enroll'],
        ['Thrive', 'Succeed once you’re there: support services, opportunities, grades, money and career.', '/thrive']
      ].map((j, i) => '<a class="card hover" href="' + j[2] + '" style="text-decoration:none;color:inherit"><div class="num">0' + (i + 1) + '</div><h3>' + j[0] + '</h3><p class="muted small mb0">' + j[1] + '</p></a>').join('') + '</div></div></section>' +

      '<section class="block"><div class="container"><div class="section-head"><span class="eyebrow">The Prepare toolkit</span><h2>Everything you need to apply — and to succeed once you’re in.</h2></div><div class="grid g4">' + [
        ['list', '', 'Personal checklist', 'Built from each programme’s requirements and whether you’re applying at home or abroad.', '/prepare'],
        ['lock', 'sky', 'Admissions Passport', 'Upload transcripts, IDs and certificates once — securely — and reuse them for every application.', '/prepare/vault'],
        ['pen', 'sun', 'Statement Studio', 'Guided prompts, word limits for Common App and UCAS, and a cliché checker.', '/prepare/statement'],
        ['wallet', 'coral', 'Cost Planner', 'Total cost in UGX, KES, NGN or USD — and how much to save each month.', '/prepare/costs'],
        ['mail', '', 'Reference Kit', 'Ready-to-send emails asking teachers for recommendation letters, with tracking.', '/prepare/references'],
        ['mic', 'sky', 'Interview practice', 'Common questions, a timer and a voice recorder to rehearse your answers.', '/prepare/interview'],
        ['chart', 'sun', 'Money Skills', 'Budgeting, saving, loans and exchange rates — 5-minute lessons with quizzes and calculators.', '/money'],
        ['sparkle', 'coral', 'Thrive at uni', 'The support programmes inside universities and how to get into them — plus a plan for every year.', '/thrive']
      ].map((f) => '<a class="card hover" href="' + f[4] + '" style="text-decoration:none;color:inherit"><div class="feature-icon ' + f[1] + '">' + icon(f[0]) + '</div><h3>' + f[2] + '</h3><p class="muted small mb0">' + f[3] + '</p></a>').join('') + '</div></div></section>' +

      '<section class="block alt"><div class="container grid g2" style="align-items:center;gap:40px"><div><span class="eyebrow">Built for Africa</span><h2>Designed around how African students actually apply.</h2>' +
      '<ul class="reasons" style="font-size:.98rem;gap:10px;margin-top:18px">' + [
        'Understands UACE, KCSE, ACSEE, WASSCE, Rwandan A-Level, IB, A-Levels and degrees',
        'Shows costs in your local currency, not just dollars',
        'Works on any phone, keeps working offline, and can be added to your home screen',
        'Local and international options side by side — Makerere to Manchester',
        'Scholarships and student loans surfaced with every match'
      ].map((t) => '<li class="yes">' + icon('check') + '<span>' + t + '</span></li>').join('') + '</ul></div>' +
      '<div class="grid g3">' +
      '<div class="card tc kpi"><div class="v" style="color:var(--brand)">' + nProg + '</div><div class="l">Programmes</div></div>' +
      '<div class="card tc kpi"><div class="v" style="color:var(--warn)">' + nCountries + '</div><div class="l">Countries</div></div>' +
      '<div class="card tc kpi"><div class="v" style="color:var(--coral)">' + nSch + '</div><div class="l">Scholarships</div></div>' +
      '<div class="card" style="grid-column:1/-1"><h4>' + icon('shield', 'mb0') + ' Our trust promise</h4><p class="small muted mb0">We never sell admission guarantees and universities can’t pay to rank higher. Every programme shows whether its data is <span class="badge ok">Verified</span> against the official site or <span class="badge warn">Indicative</span>, so you always know what to double-check.</p></div>' +
      '</div></div></section>' +

      '<section class="block"><div class="container"><div class="row between" style="align-items:flex-end"><div class="section-head mb0"><span class="eyebrow">Where to study</span><h2>Compare destinations honestly.</h2><p class="muted mb0">Real costs in your currency, step-by-step visa help, work rules and scholarships for each country.</p></div><div class="row"><a class="btn ghost" href="/visa">' + icon('plane') + 'Visa help</a><a class="btn ghost" href="/countries">All countries ' + icon('right') + '</a></div></div><div class="grid g4 mt3">' +
      (C.countries || []).slice(0, 8).map((c) => '<a class="card hover" href="/country/' + (c.slug || encodeURIComponent(c.name)) + '" style="text-decoration:none;color:inherit;padding:16px"><div style="font-size:1.8rem;line-height:1">' + esc(c.flag || '') + '</div><b class="mt1" style="display:block">' + esc(c.name) + '</b><small class="muted">' + esc(c.costLevel) + ' cost · ' + (C.programs || []).filter((p) => p.country === c.name).length + ' programmes</small></a>').join('') + '</div></div></section>' +
      '<section class="block alt"><div class="container grid g2" style="align-items:center;gap:36px"><div><span class="eyebrow">Real people, when you need them</span><h2>Free tools. Friendly advisers.</h2><p class="muted">' + ((C.site || {}).showPricing ? 'Everything on UniPath is free. When you want a real person to check your statement or guide your applications, book a free consultation or choose an affordable support plan.' : 'Every tool and every adviser session is free right now — no fees, no catch. Book a free consultation whenever you want a real person to help.') + '</p><div class="row"><a class="btn" href="/book">' + icon('calendar') + 'Book a free consultation</a><a class="btn ghost" href="/plans">' + ((C.site || {}).showPricing ? 'See plans' : 'What’s included') + '</a></div></div>' +
      '<div class="grid g3">' + (C.plans || []).map((p) => '<a class="card hover tc" href="/plans" style="text-decoration:none;color:inherit;padding:16px' + (p.highlight ? ';border:2px solid var(--brand)' : '') + '"><b>' + esc(p.name) + '</b><div class="big-num" style="font-size:1.3rem;margin-top:6px">' + ((C.site || {}).showPricing ? esc(p.price) : 'Free') + '</div><small class="muted">' + ((C.site || {}).showPricing ? esc(p.period || '') : 'for now') + '</small></a>').join('') + '</div></div></section>' +
      (quotes.length ? '<section class="block"><div class="container"><div class="section-head"><span class="eyebrow">From our user testing</span><h2>What students told us</h2></div><div class="grid g3">' + quotes.map((q) => '<figure class="card quote-card mt0"><blockquote>“' + esc(q.text) + '”</blockquote><figcaption class="small muted">— ' + esc(q.who || 'Participant') + '</figcaption></figure>').join('') + '</div></div></section>' : '') +

      '<section class="block"><div class="container"><div class="card pad-lg" style="background:var(--ink);color:var(--bg);border:0;display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center">' +
      '<div><h2 style="color:var(--bg)">Ready to find your path?</h2><p class="mb0" style="opacity:.8">It takes about two minutes. No account needed — your information stays on your device.</p></div>' +
      '<a class="btn lg sun" href="/discover">Start now ' + icon('right') + '</a></div></div></section>';
  };

  /* Watch list: "remind me when applications open" (programmes and scholarships) */
  function toggleWatch(type, id, title) {
    S.watch = S.watch || []; const i = S.watch.findIndex((w) => w.type === type && w.id === id);
    if (i >= 0) { S.watch.splice(i, 1); save(); U.toast('Stopped watching', 'x'); render(); return; }
    S.watch.push({ type, id, title, at: new Date().toISOString() }); save(); render();
    if (!U.API.signedIn()) { if (U.API.online) promptAccount('Create a free account so we can email you when applications open and before the deadline.'); else U.toast('Saved. Reminders by email need a free account on the live site.', 'info'); }
    else U.toast('We’ll email you when applications open and before the deadline', 'clock');
  }
  window.APP_ACTIONS = Object.assign(window.APP_ACTIONS || {}, { toggleWatch });

  /* Homepage preview card: the student's real matches and next step, or a clearly labelled example */
  function heroCard() {
    const real = !!(S.profile && S.profile.score != null);
    const prof = real ? S.profile : { score: 74, level: 'Undergraduate', field: 'Business & Management', qual: 'UACE', budgetAmount: 15000000, budgetCurrency: 'UGX', scholarship: true, destinations: ['Uganda'] };
    let pool = (C.programs || []).filter((p) => p.level === (prof.level || 'Undergraduate'));
    if ((prof.destinations || []).length) { const d = pool.filter((p) => prof.destinations.includes(p.country)); if (d.length >= 3) pool = d; }
    const top = pool.map((p) => ({ p, s: scoreProgram(p, prof).score })).sort((x, y) => ((y.p.field === prof.field) - (x.p.field === prof.field)) || y.s - x.s || (y.p.verified - x.p.verified)).slice(0, 3);
    const q = QUALS[prof.qual]; const bits = [q ? q.label.split(' — ')[0] : '', prof.budgetAmount ? 'Budget ' + (prof.budgetCurrency || 'UGX') + ' ' + (+prof.budgetAmount >= 1e6 ? (+prof.budgetAmount / 1e6).toFixed(+prof.budgetAmount >= 1e7 ? 0 : 1) + 'M' : (+prof.budgetAmount).toLocaleString('en-US')) + '/yr' : '', prof.scholarship ? 'Seeking scholarships' : ''].filter(Boolean);
    const active = S.applications.filter((a) => !['enrolled', 'closed'].includes(a.stage)).map((a) => ({ a, i: appInfo(a) })).sort((x, y) => String(x.i.deadline || '9999').localeCompare(String(y.i.deadline || '9999')));
    let next;
    if (!real) next = ['Next step: request transcripts', 'Example — your own next step appears here', '/discover'];
    else if (active.length) { const { a, i } = active[0], r = readiness(a), cd = U.countdownLabel(i.deadline); next = ['Next: ' + nextAction(a), esc(i.university) + ' · ' + cd.text + ' · ' + r.done + ' of ' + r.total + ' items ready', '/prepare/checklist/' + a.id]; }
    else if (S.shortlist.length) next = ['Next step: start an application', S.shortlist.length + ' saved programme' + (S.shortlist.length > 1 ? 's' : '') + ' — turn one into a checklist', '/match'];
    else next = ['Next step: save programmes you like', 'Tap the heart on any match', '/match'];
    return '<div class="row between"><b style="font-family:var(--font-display);font-size:1.1rem">' + (real ? 'Your matches' : 'Example matches') + '</b>' + (prof.field && prof.field !== 'Any field' ? '<span class="badge brand">' + esc(prof.field) + '</span>' : '') + '</div>' +
      '<p class="small muted mt1 mb0">' + (real ? 'Based on ' : 'Sample student · ') + esc(bits.join(' · ')) + '</p>' +
      top.map((t) => '<a class="mini-match" href="/program/' + encodeURIComponent(t.p.id) + '" style="text-decoration:none;color:inherit">' + ring(t.s, 'ring-sm') + '<div><b>' + esc(t.p.program) + '</b><small>' + esc(t.p.university) + ' · ' + esc(t.p.country) + '</small></div></a>').join('') +
      '<a class="mini-match" href="' + next[2] + '" style="background:var(--sun-soft);border-color:transparent;text-decoration:none;color:inherit"><span class="feature-icon sun" style="margin:0;width:40px;height:40px">' + icon('clock') + '</span><div><b>' + esc(next[0]) + '</b><small>' + next[1] + '</small></div></a>' +
      (real ? '' : '<a class="small" href="/discover" style="display:block;margin-top:8px">See your own matches in 2 minutes →</a>');
  }

  /* ---------- Discover (profile wizard) ---------- */
  let wiz = null;
  views.discover = function () {
    const prof = S.profile || {};
    if (!wiz) wiz = { step: 0, d: Object.assign({ level: 'Undergraduate', field: '', qual: 'UACE', grade: '', homeCountry: 'Uganda', destinations: [], budgetAmount: '', budgetCurrency: cur(), scholarship: true, intake: '2027', name: '' }, prof) };
    const d = wiz.d;
    const countries = Array.from(new Set((C.programs || []).map((p) => p.country))).sort();
    const steps = [
      { title: 'What do you want to study?', body: () =>
        '<div class="field"><span class="label">Level</span><div class="seg" role="group">' + ['Undergraduate', 'Postgraduate'].map((l) => '<button type="button" data-level="' + l + '" aria-pressed="' + (d.level === l) + '">' + l + '</button>').join('') + '</div></div>' +
        '<div class="field mt3"><span class="label">Field of study</span><div class="option-grid">' + FIELDS.map((f) => '<button type="button" class="option" data-field="' + esc(f) + '" aria-pressed="' + (d.field === f) + '">' + icon(f === 'Any field' ? 'sparkle' : 'book') + '<span><b>' + esc(f) + '</b></span></button>').join('') + '</div></div>' +
        '<label class="field mt3"><span>Your first name <small class="muted">(optional)</small></span><input name="name" value="' + esc(d.name || '') + '" placeholder="So we can personalise your dashboard"></label>' },
      { title: 'Tell us about your results', body: () => {
        const quals = Object.entries(QUALS).filter(([, q]) => q.level === d.level || (d.level === 'Undergraduate' && q.level === 'Undergraduate'));
        if (!quals.some(([k]) => k === d.qual)) d.qual = quals[0][0];
        const q = QUALS[d.qual];
        return '<div class="form-grid"><label class="field"><span>Where do you live?</span><select name="homeCountry">' + HOME_COUNTRIES.map((c) => '<option ' + (d.homeCountry === c ? 'selected' : '') + '>' + c + '</option>').join('') + '</select><span class="hint">Used to tell local from international requirements.</span></label>' +
          '<label class="field"><span>Qualification</span><select name="qual">' + quals.map(([k, v]) => '<option value="' + k + '" ' + (d.qual === k ? 'selected' : '') + '>' + v.label + '</option>').join('') + '</select></label>' +
          '<label class="field full"><span>Your overall result (actual or predicted)</span><select name="grade"><option value="">Choose…</option>' + q.options.map((o, i) => '<option value="' + i + '" ' + (String(d.grade) === String(i) ? 'selected' : '') + '>' + esc(o[0]) + '</option>').join('') + '</select><span class="hint">Don’t have results yet? Use your mock or predicted grades.</span></label></div>';
      } },
      { title: 'Where would you like to study?', body: () =>
        '<p class="muted">Pick as many as you like.</p><div class="chips">' + ['Anywhere', 'Anywhere in Africa'].concat(countries).map((c) => '<button type="button" class="chip" data-dest="' + esc(c) + '" aria-pressed="' + (d.destinations || []).includes(c) + '">' + (c.startsWith('Anywhere') ? icon('globe') : icon('pin')) + esc(c) + '</button>').join('') + '</div>' +
        '<label class="field mt3" style="max-width:260px"><span>Preferred intake year</span><select name="intake">' + ['2027', '2028', 'Not sure'].map((y) => '<option ' + (d.intake === y ? 'selected' : '') + '>' + y + '</option>').join('') + '</select></label>' },
      { title: 'What can you budget per year?', body: () =>
        '<p class="muted">Include tuition and living costs. A rough figure is fine — we’ll show what fits.</p><div class="form-grid"><label class="field"><span>Annual budget</span><input type="number" min="0" step="any" name="budgetAmount" value="' + esc(d.budgetAmount) + '" placeholder="e.g. 15000000"></label>' +
        '<label class="field"><span>Currency</span><select name="budgetCurrency">' + Object.keys(C.currencies || { USD: 1 }).map((c) => '<option ' + (d.budgetCurrency === c ? 'selected' : '') + '>' + c + '</option>').join('') + '</select></label></div>' +
        '<div class="chips mt2">' + [['UGX', 5e6], ['UGX', 15e6], ['UGX', 30e6], ['USD', 10000], ['USD', 30000]].map(([c, v]) => '<button type="button" class="chip" data-budget="' + v + '" data-bcur="' + c + '">' + c + ' ' + (v >= 1e6 ? v / 1e6 + 'M' : v.toLocaleString()) + '</button>').join('') + '</div>' +
        '<label class="check mt3"><input type="checkbox" name="scholarship" ' + (d.scholarship ? 'checked' : '') + '><span><b>I’m looking for scholarships or financial aid</b><br><small class="muted">We’ll prioritise programmes with funding options.</small></span></label>' }
    ];
    const st = steps[wiz.step];
    const html = '<div class="container page">' + journeySteps('discover') +
      '<div class="wizard"><div class="wizard-progress" aria-hidden="true"><span style="width:' + ((wiz.step + 1) / steps.length * 100) + '%"></span></div>' +
      '<span class="eyebrow">Step ' + (wiz.step + 1) + ' of ' + steps.length + '</span><h1 style="font-size:clamp(1.7rem,4vw,2.4rem)">' + st.title + '</h1>' +
      '<form id="wiz" class="card pad-lg mt2" onsubmit="return false">' + st.body() + '</form>' +
      '<div class="wizard-nav">' + (wiz.step ? '<button class="btn ghost" id="wiz-back">' + icon('left') + 'Back</button>' : '<span></span>') +
      '<button class="btn lg" id="wiz-next">' + (wiz.step === steps.length - 1 ? 'See my matches ' + icon('target') : 'Continue ' + icon('right')) + '</button></div>' +
      '<p class="small muted tc mt3">' + icon('lock', 'sr-only') + 'Create a free account at the end to save your progress. You can download or delete your data anytime.</p></div></div>';
    setTimeout(() => {
      const f = $('#wiz');
      const collect = () => { new FormData(f).forEach((v, k) => { d[k] = v; }); if (f.querySelector('[name=scholarship]')) d.scholarship = f.querySelector('[name=scholarship]').checked; };
      f.addEventListener('change', (e) => { collect(); if (e.target.name === 'qual') { d.grade = ''; render(); } });
      $$('[data-level]', f).forEach((b) => b.onclick = () => { collect(); d.level = b.dataset.level; d.qual = d.level === 'Postgraduate' ? 'BACHELOR' : (d.qual === 'BACHELOR' ? 'UACE' : d.qual); render(); });
      $$('[data-field]', f).forEach((b) => b.onclick = () => { collect(); d.field = b.dataset.field; $$('[data-field]', f).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
      $$('[data-dest]', f).forEach((b) => b.onclick = () => { const v = b.dataset.dest; d.destinations = d.destinations || []; const i = d.destinations.indexOf(v); if (i >= 0) d.destinations.splice(i, 1); else d.destinations.push(v); b.setAttribute('aria-pressed', i < 0); });
      $$('[data-budget]', f).forEach((b) => b.onclick = () => { f.budgetAmount.value = b.dataset.budget; f.budgetCurrency.value = b.dataset.bcur; collect(); });
      const back = $('#wiz-back'); if (back) back.onclick = () => { collect(); wiz.step--; render(); };
      $('#wiz-next').onclick = () => {
        collect();
        if (wiz.step === 0 && !d.field) return U.toast('Choose a field of study (or “Any field”)', 'info');
        if (wiz.step === 1 && d.grade === '') return U.toast('Choose your overall result', 'info');
        if (wiz.step < steps.length - 1) { wiz.step++; render(); window.scrollTo(0, 0); return; }
        const q = QUALS[d.qual]; d.score = q.options[+d.grade] ? q.options[+d.grade][1] : 60; d.gradeLabel = q.options[+d.grade] ? q.options[+d.grade][0] : '';
        d.budgetAmount = +d.budgetAmount || 0;
        S.profile = Object.assign({}, d, { updatedAt: new Date().toISOString() });
        if (d.budgetCurrency) S.settings.currency = d.budgetCurrency;
        save(); wiz = null; U.toast('Profile saved — here are your matches', 'target');
        U.go('/match');
        if (U.API.online && !U.API.signedIn()) setTimeout(() => promptAccount('Your matches are ready. Create a free account to save your profile and applications, use any device, and get help from a UniPath adviser.'), 900);
      };
    });
    return html;
  };

  /* ---------- Match ---------- */
  let mf = { sort: 'best', maxBudget: 0, country: '', scholarshipsOnly: false, hideClosed: true, q: '', limit: 20 };
  views.match = function () {
    const prof = S.profile;
    if (!prof) return '<div class="container page">' + journeySteps('match') + emptyState('compass', 'Let’s build your profile first', 'Answer four quick questions so we can match you with programmes that fit your results, budget and goals.', '<a class="btn" href="/discover">Start Discover ' + icon('right') + '</a>') + '<p class="tc mt2"><a href="/browse">Or browse all programmes</a></p></div>';
    let rows = (C.programs || []).filter((p) => p.level === prof.level).map((p) => Object.assign({ p }, scoreProgram(p, prof)));
    const countries = Array.from(new Set(rows.map((r) => r.p.country))).sort();
    if (mf.country) rows = rows.filter((r) => r.p.country === mf.country);
    if (mf.scholarshipsOnly) rows = rows.filter((r) => r.p.scholarships);
    if (mf.hideClosed) rows = rows.filter((r) => !r.closed);
    if (mf.maxBudget) rows = rows.filter((r) => U.fromUSD((+r.p.tuitionUSD || 0) + (+r.p.livingUSD || 0), cur()) <= mf.maxBudget);
    if (mf.q) { const q = mf.q.toLowerCase(); rows = rows.filter((r) => (r.p.program + ' ' + r.p.university + ' ' + r.p.city + ' ' + r.p.country).toLowerCase().includes(q)); }
    const sorters = { best: (a, b) => b.score - a.score, cost: (a, b) => (a.p.tuitionUSD + a.p.livingUSD) - (b.p.tuitionUSD + b.p.livingUSD), deadline: (a, b) => (U.daysUntil(a.p.deadline) ?? 9999) - (U.daysUntil(b.p.deadline) ?? 9999) };
    rows.sort(sorters[mf.sort] || sorters.best);
    const fit = rows.filter((r) => r.fieldMatch), other = rows.filter((r) => !r.fieldMatch);
    const budgetMax = Math.max(1, ...(C.programs || []).map((p) => U.fromUSD((+p.tuitionUSD || 0) + (+p.livingUSD || 0), cur())));
    const card = (r) => {
      const p = r.p, saved = S.shortlist.includes(p.id), cmp = S.compare.includes(p.id), started = S.applications.some((a) => a.programId === p.id);
      const cd = U.countdownLabel(p.deadline);
      return '<article class="card match-card">' + ring(r.score, '', r.label) +
        '<div><div class="uni">' + esc(p.university) + ' ' + dataBadge(p) + (p.scholarships ? '<span class="badge brand">' + icon('award') + 'Funding</span>' : '') + '</div>' +
        '<h3><a href="/program/' + encodeURIComponent(p.id) + '" style="color:inherit;text-decoration:none">' + esc(p.program) + '</a></h3>' +
        '<div class="meta"><span>' + icon('pin') + esc(p.city) + ', ' + esc(p.country) + '</span><span>' + icon('wallet') + money((+p.tuitionUSD || 0) + (+p.livingUSD || 0), null, { compact: true }) + '/yr</span><span>' + icon('clock') + '<b class="countdown ' + cd.cls + '">' + cd.text + '</b></span><span>' + icon('calendar') + esc(p.intake) + '</span></div>' +
        '<ul class="reasons">' + r.reasons.slice(0, 4).map((x) => '<li class="' + x[0] + '">' + icon(x[0] === 'yes' ? 'check' : x[0] === 'no' ? 'x' : 'alert') + '<span>' + esc(x[1]) + '</span></li>').join('') + '</ul></div>' +
        '<div class="actions">' + (started ? '<a class="btn sm soft" href="/prepare">' + icon('list') + 'In progress</a>' : '<button class="btn sm" data-start="' + esc(p.id) + '">' + icon('plus') + 'Start application</button>') +
        '<a class="btn sm ghost" href="/program/' + encodeURIComponent(p.id) + '">Details</a>' +
        '<div class="row" style="gap:6px"><button class="icon-btn" data-save="' + esc(p.id) + '" aria-pressed="' + saved + '" title="' + (saved ? 'Saved' : 'Save') + '" style="' + (saved ? 'color:var(--coral)' : '') + '">' + icon('heart') + '</button>' +
        '<label class="check small" title="Compare"><input type="checkbox" data-cmp="' + esc(p.id) + '" ' + (cmp ? 'checked' : '') + '>Compare</label></div></div></article>';
    };
    const html = '<div class="container page">' + journeySteps('match') +
      pageHead('Your matches', esc(prof.field) + ' · ' + esc(prof.level) + ' · ' + esc(QUALS[prof.qual] ? QUALS[prof.qual].label.split(' — ')[0] : '') + ' ' + esc(prof.gradeLabel || '') + (prof.budgetAmount ? ' · Budget ' + esc(prof.budgetCurrency) + ' ' + Number(prof.budgetAmount).toLocaleString() + '/yr' : ''), '<a class="btn ghost sm" href="/discover">' + icon('edit') + 'Edit profile</a>') +
      '<div class="notice warn mb2">' + icon('info') + '<p>Matches show programmes that <b>appear</b> to fit based on published requirements — not guaranteed admission. ' + esc((C.site || {}).dataNotice || '') + '</p></div>' +
      accountNudge() + '<div class="layout-side"><details class="sidebar card" aria-label="Filters" ' + (window.innerWidth >= 920 || mf.open ? 'open' : '') + ' id="mf-box"><summary style="cursor:pointer;list-style:none"><h4 style="display:inline-flex;gap:8px;align-items:center;margin:0">' + icon('sliders') + 'Refine &amp; sort</h4></summary><div class="mt2">' +
      '<label class="field"><span>Search</span><input type="search" id="mf-q" value="' + esc(mf.q) + '" placeholder="University, city…"></label>' +
      '<label class="field mt2"><span>Sort by</span><select id="mf-sort"><option value="best">Best match</option><option value="cost">Lowest cost</option><option value="deadline">Soonest deadline</option></select></label>' +
      '<label class="field mt2"><span>Country</span><select id="mf-country"><option value="">All countries</option>' + countries.map((c) => '<option ' + (mf.country === c ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select></label>' +
      '<label class="field mt2"><span>Max cost per year: <b id="mf-bv">' + (mf.maxBudget ? cur() + ' ' + Math.round(mf.maxBudget).toLocaleString() : 'Any') + '</b></span><input type="range" id="mf-budget" min="0" max="' + Math.ceil(budgetMax) + '" step="' + Math.ceil(budgetMax / 100) + '" value="' + (mf.maxBudget || 0) + '"></label>' +
      '<label class="check mt2"><input type="checkbox" id="mf-sch" ' + (mf.scholarshipsOnly ? 'checked' : '') + '>Has scholarships / aid</label>' +
      '<label class="check mt1"><input type="checkbox" id="mf-closed" ' + (mf.hideClosed ? 'checked' : '') + '>Hide closed deadlines</label>' +
      '<label class="field mt2"><span>Show costs in</span><select id="mf-cur">' + Object.keys(C.currencies || {}).map((c) => '<option ' + (cur() === c ? 'selected' : '') + '>' + c + '</option>').join('') + '</select></label>' +
      '<hr class="divider"><p class="small mb1"><a href="/browse">Browse all ' + (C.programs || []).length + ' programmes →</a></p><p class="small muted mb0">Can’t find your university? <button class="btn link" id="add-custom">Add it manually</button></p></div></details>' +
      '<div class="stack">' + (fit.length ? '<p class="muted mb0"><b>' + fit.length + '</b> programme' + (fit.length === 1 ? '' : 's') + ' in ' + esc(prof.field) + '</p>' + fit.slice(0, mf.limit).map(card).join('') + (fit.length > mf.limit ? '<button class="btn ghost block" id="mf-more">Show ' + Math.min(20, fit.length - mf.limit) + ' more of ' + (fit.length - mf.limit) + ' remaining</button>' : '') : emptyState('search', 'No programmes match those filters', 'Try widening your budget, clearing the country filter, or showing closed deadlines.')) +
      (other.length ? '<h3 class="mt4">Also worth a look</h3><p class="muted small">Programmes in related fields that fit your results and budget.</p>' + other.slice(0, 8).map(card).join('') : '') + '</div></div>' +
      (S.compare.length ? '<div class="compare-tray no-print"><span><b>' + S.compare.length + '</b> to compare</span><button class="btn sm" id="do-compare">' + icon('grid') + 'Compare</button><button class="icon-btn" id="clear-compare" style="background:transparent;color:inherit;border-color:rgba(255,255,255,.2)" aria-label="Clear">' + icon('x') + '</button></div>' : '') +
      '</div>';
    setTimeout(() => {
      $('#mf-sort').value = mf.sort;
      $('#mf-sort').onchange = (e) => { mf.sort = e.target.value; mf.limit = 20; render(); };
      $('#mf-country').onchange = (e) => { mf.country = e.target.value; mf.limit = 20; render(); };
      $('#mf-budget').oninput = (e) => { $('#mf-bv').textContent = +e.target.value ? cur() + ' ' + Math.round(+e.target.value).toLocaleString() : 'Any'; };
      $('#mf-budget').onchange = (e) => { mf.maxBudget = +e.target.value; render(); };
      $('#mf-sch').onchange = (e) => { mf.scholarshipsOnly = e.target.checked; render(); };
      $('#mf-closed').onchange = (e) => { mf.hideClosed = e.target.checked; render(); };
      $('#mf-cur').onchange = (e) => { S.settings.currency = e.target.value; mf.maxBudget = 0; save(); render(); };
      let t; $('#mf-q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { mf.q = e.target.value; render(); const q = $('#mf-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 300); };
      $('#add-custom').onclick = () => addCustomApplication();
      const more = $('#mf-more'); if (more) more.onclick = () => { mf.limit += 20; const y = window.scrollY; render(); window.scrollTo(0, y); };
      $('#mf-box').addEventListener('toggle', (e) => { mf.open = e.target.open; });
      bindProgramActions();
      const dc = $('#do-compare'); if (dc) dc.onclick = openCompare;
      const cc = $('#clear-compare'); if (cc) cc.onclick = () => { S.compare = []; save(); render(); };
    });
    return html;
  };
  function bindProgramActions(root) {
    $$('[data-start]', root).forEach((b) => b.onclick = () => startApplication(b.dataset.start));
    $$('[data-save]', root).forEach((b) => b.onclick = () => { toggleShortlist(b.dataset.save); render(); });
    $$('[data-cmp]', root).forEach((b) => b.onchange = () => {
      const id = b.dataset.cmp, i = S.compare.indexOf(id);
      if (b.checked && i < 0) { if (S.compare.length >= 3) { b.checked = false; return U.toast('Compare up to 3 programmes', 'info'); } S.compare.push(id); }
      if (!b.checked && i >= 0) S.compare.splice(i, 1);
      save(); render();
    });
  }
  function openCompare() {
    const ps = S.compare.map(progById).filter(Boolean); if (!ps.length) return;
    const prof = S.profile;
    const rowsDef = [
      ['Match', (p) => prof ? scoreProgram(p, prof).score + '/100' : '—'], ['University', (p) => esc(p.university)], ['Location', (p) => esc(p.city + ', ' + p.country)], ['Level', (p) => esc(p.level)],
      ['Duration', (p) => p.durationYears + ' years'], ['Tuition / yr', (p) => money(p.tuitionUSD)], ['Living / yr', (p) => money(p.livingUSD)],
      ['Total programme cost', (p) => '<b>' + money((+p.tuitionUSD + +p.livingUSD) * (+p.durationYears || 1) + (+p.appFeeUSD || 0)) + '</b>'],
      ['Application fee', (p) => money(p.appFeeUSD)], ['Deadline', (p) => U.fmtDate(p.deadline) + '<br><small class="muted">' + U.countdownLabel(p.deadline).text + '</small>'],
      ['Intake', (p) => esc(p.intake)], ['Entry requirements', (p) => esc(p.requirementsText)], ['English', (p) => esc(p.englishTest)], ['Scholarships', (p) => p.scholarships ? 'Yes' : 'Not listed'], ['Data status', dataBadge]
    ];
    U.modal({ title: 'Compare programmes', wide: true, body: '<div class="table-wrap"><table class="tbl"><thead><tr><th></th>' + ps.map((p) => '<th style="text-transform:none;letter-spacing:0;font-size:.9rem;color:var(--ink)">' + esc(p.program) + '</th>').join('') + '</tr></thead><tbody>' + rowsDef.map(([l, f]) => '<tr><th style="position:static">' + l + '</th>' + ps.map((p) => '<td>' + f(p) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div><p class="small muted mt2">Costs in ' + cur() + ' using indicative exchange rates.</p>', footer: '<button class="btn ghost" onclick="window.print()">' + icon('printer') + 'Print</button><button class="btn" data-close>Done</button>' });
  }

  /* ---------- Browse all ---------- */
  let bf = { q: '', country: '', level: '', field: '' };
  views.browse = function () {
    const all = (C.programs || []);
    const bq = new URLSearchParams(location.search);
    if (bq.get('country') || bq.get('field') || bq.get('q')) { bf.country = bq.get('country') || bf.country; bf.field = bq.get('field') || bf.field; bf.q = bq.get('q') || bf.q; history.replaceState(null, '', '/browse'); }
    const countries = Array.from(new Set(all.map((p) => p.country))).sort();
    let ps = all.filter((p) => (!bf.country || p.country === bf.country) && (!bf.level || p.level === bf.level) && (!bf.field || p.field === bf.field) && (!bf.q || (p.program + ' ' + p.university + ' ' + p.city).toLowerCase().includes(bf.q.toLowerCase())));
    ps = ps.slice().sort((a, b) => a.country.localeCompare(b.country) || a.university.localeCompare(b.university));
    const html = '<div class="container page">' + pageHead('All programmes', all.length + ' programmes across ' + countries.length + ' countries. Build your profile for personalised matches.', '<a class="btn" href="/discover">' + icon('target') + 'Get matched</a>') +
      '<div class="row mb2"><input type="search" id="bf-q" placeholder="Search programme, university or city…" value="' + esc(bf.q) + '" style="flex:1;min-width:220px"><select id="bf-c" style="width:auto"><option value="">All countries</option>' + countries.map((c) => '<option ' + (bf.country === c ? 'selected' : '') + '>' + esc(c) + '</option>').join('') + '</select>' +
      '<select id="bf-l" style="width:auto"><option value="">All levels</option><option ' + (bf.level === 'Undergraduate' ? 'selected' : '') + '>Undergraduate</option><option ' + (bf.level === 'Postgraduate' ? 'selected' : '') + '>Postgraduate</option></select>' +
      '<select id="bf-f" style="width:auto"><option value="">All fields</option>' + FIELDS.filter((f) => f !== 'Any field').map((f) => '<option ' + (bf.field === f ? 'selected' : '') + '>' + esc(f) + '</option>').join('') + '</select></div>' +
      '<p class="small muted">' + ps.length + ' shown</p><div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>University</th><th>Country</th><th>Level</th><th>Est. cost / yr</th><th>Deadline</th><th></th></tr></thead><tbody>' +
      ps.map((p) => '<tr><td><a href="/program/' + encodeURIComponent(p.id) + '"><b>' + esc(p.program) + '</b></a></td><td>' + esc(p.university) + '</td><td>' + esc(p.country) + '</td><td>' + esc(p.level) + '</td><td class="num">' + money(+p.tuitionUSD + +p.livingUSD, null, { compact: true }) + '</td><td>' + U.fmtDate(p.deadline) + '</td><td>' + dataBadge(p) + '</td></tr>').join('') + '</tbody></table></div></div>';
    setTimeout(() => {
      let t; $('#bf-q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { bf.q = e.target.value; render(); const q = $('#bf-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 300); };
      $('#bf-c').onchange = (e) => { bf.country = e.target.value; render(); };
      $('#bf-l').onchange = (e) => { bf.level = e.target.value; render(); };
      $('#bf-f').onchange = (e) => { bf.field = e.target.value; render(); };
    });
    return html;
  };

  /* ---------- Program detail ---------- */
  views.program = function (id) {
    const p = progById(decodeURIComponent(id || ''));
    if (!p) return '<div class="container page">' + emptyState('search', 'Programme not found', 'It may have been removed or renamed.', '<a class="btn" href="/match">Back to matches</a>') + '</div>';
    const prof = S.profile; const sc = prof ? scoreProgram(p, prof) : null;
    const saved = S.shortlist.includes(p.id), started = S.applications.find((a) => a.programId === p.id);
    const years = +p.durationYears || 1, yr = (+p.tuitionUSD || 0) + (+p.livingUSD || 0);
    const intl = isInternational(p.country);
    const oneOff = (+p.appFeeUSD || 0) + (intl ? 1200 : 100);
    const total = yr * years + oneOff;
    const max = Math.max(+p.tuitionUSD || 0, +p.livingUSD || 0, oneOff, 1);
    const similar = (C.programs || []).filter((x) => x.id !== p.id && x.field === p.field && x.level === p.level).slice(0, 3);
    U.track('program', p.id); U.track('country', p.country);
    const watching = (S.watch || []).some((w) => w.type === 'program' && w.id === p.id);
    const dest = window.UP_DEST && window.UP_DEST.findCountry ? window.UP_DEST.findCountry(p.country) : null;
    const dslug = dest ? (dest.slug || '') : '';
    const schFor = dest && window.UP_DEST.scholarshipsFor ? window.UP_DEST.scholarshipsFor(dest) : [];
    const link = (u, l) => U.safeUrl(u) ? '<li><a href="' + esc(U.safeUrl(u)) + '" target="_blank" rel="noopener">' + l + ' ↗</a></li>' : '';
    const route = p.country === 'United Kingdom' && p.level === 'Undergraduate' ? ['Apply through UCAS (up to 5 choices, one personal statement).', 'https://www.ucas.com', 'UCAS'] : p.country === 'United States' && p.level === 'Undergraduate' ? ['Most universities accept the Common App. Ask about need-based aid for international students.', 'https://www.commonapp.org', 'Common App'] : p.country === 'Netherlands' && p.level === 'Undergraduate' ? ['Register in Studielink first, then complete the university’s own application.', 'https://www.studielink.nl', 'Studielink'] : null;
    const howTo = ['Check you meet the entry requirements below', route ? route[0] : 'Create an account on the university’s application portal' + (U.safeUrl(p.applyUrl) ? '' : ' (find it on the university website)'), 'Upload transcripts, ID/passport' + (intl ? ', English test' : '') + ' and your personal statement', 'Pay the application fee (' + money(p.appFeeUSD) + ') on the official portal only', 'Track your application and check your email for interviews or offers'];
    const html = '<div class="container page"><a href="/match" class="btn link" data-back>' + icon('left') + 'Back</a>' +
      '<div class="grid mt2" style="grid-template-columns:minmax(0,1fr) 340px;gap:26px" id="pgrid"><div class="stack">' +
      '<div><div class="uni row" style="gap:8px">' + '<span class="muted" style="font-weight:700">' + esc(p.university) + '</span>' + dataBadge(p) + (p.scholarships ? '<span class="badge brand">' + icon('award') + 'Funding available</span>' : '') + '</div>' +
      '<h1 class="mt1" style="font-size:clamp(1.8rem,4vw,2.6rem)">' + esc(p.program) + '</h1><p class="muted">' + icon('pin', 'sr-only') + esc(p.city) + ', ' + esc(p.country) + ' · ' + esc(p.level) + ' · ' + years + ' year' + (years > 1 ? 's' : '') + ' · ' + esc(p.mode || '') + '</p></div>' +
      (sc ? '<div class="card row" style="gap:20px;align-items:flex-start">' + ring(sc.score, '', sc.label) + '<div style="flex:1;min-width:220px"><h3>Why this ' + (sc.score >= 62 ? 'fits' : 'may be a stretch') + '</h3><ul class="reasons">' + sc.reasons.map((x) => '<li class="' + x[0] + '">' + icon(x[0] === 'yes' ? 'check' : x[0] === 'no' ? 'x' : 'alert') + '<span>' + esc(x[1]) + '</span></li>').join('') + '</ul></div></div>' : '<div class="notice">' + icon('info') + '<p><a href="/discover">Build your profile</a> to see how well this programme fits you.</p></div>') +
      '<div class="card"><h3>Entry requirements</h3><p>' + esc(p.requirementsText || 'See the official website.') + '</p><p class="mb0"><b>English:</b> ' + esc(p.englishTest || '—') + '</p>' + (p.notes ? '<p class="mt2 mb0 small muted">' + esc(p.notes) + '</p>' : '') + (U.safeUrl(p.programmeUrl || p.admissionsUrl) ? '<p class="small mt2 mb0"><a href="' + esc(U.safeUrl(p.programmeUrl || p.admissionsUrl)) + '" target="_blank" rel="noopener">Full requirements on the official site ↗</a></p>' : '') + '</div>' +
      '<div class="card"><h3>How to apply</h3><ol class="small" style="padding-left:20px;display:grid;gap:6px;margin:0">' + howTo.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ol><div class="row mt2">' + (U.safeUrl(p.applyUrl) ? '<a class="btn sm" href="' + esc(U.safeUrl(p.applyUrl)) + '" target="_blank" rel="noopener">' + icon('external') + 'Go to the application</a>' : '') + (route ? '<a class="btn sm ghost" href="' + route[1] + '" target="_blank" rel="noopener">' + icon('external') + route[2] + '</a>' : '') + '<a class="btn sm ghost" href="/prepare/statement">' + icon('pen') + 'Write my statement</a></div></div>' +
      '<div class="card"><h3>Planning to study in ' + esc(p.country) + '</h3><div class="grid g2" style="gap:10px">' +
        (dest ? '<a class="card hover flat" href="/country/' + dslug + '" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('globe') + ' ' + esc(p.country) + ' guide</b><div class="small muted">Costs, work rules, intakes</div></a>' : '') +
        (intl && dest ? '<a class="card hover flat" href="/country/' + dslug + '/visa" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('plane') + ' Visa help</b><div class="small muted">' + esc(dest.visaName || 'Student visa') + ' · ' + esc(dest.visaProcessing || '') + '</div></a>' : '') +
        '<a class="card hover flat" href="/prepare/costs/' + encodeURIComponent(p.id) + '" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('wallet') + ' True cost</b><div class="small muted">Everything beyond tuition</div></a>' +
        '<a class="card hover flat" href="' + (dest ? '/country/' + dslug + '/funding' : '/prepare/scholarships') + '" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('award') + ' Scholarships</b><div class="small muted">' + (schFor.length ? schFor.length + ' for ' + esc(p.country) : 'Find funding') + '</div></a>' +
        (dest ? '<a class="card hover flat" href="/country/' + dslug + '/apply" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('calendar') + ' My timeline</b><div class="small muted">Every step, dated</div></a>' : '') +
        '<a class="card hover flat" href="/thrive/support" data-uni="' + esc(p.university) + '" style="text-decoration:none;color:inherit;padding:12px"><b>' + icon('shield') + ' Support at ' + esc(p.university.length > 28 ? p.university.slice(0, 26) + '…' : p.university) + '</b><div class="small muted">Tutoring, careers, counselling…</div></a>' +
      '</div></div>' +
      '<div class="card"><div class="row between"><h3 class="mb0">Estimated cost</h3><select id="pc-cur" style="width:auto">' + Object.keys(C.currencies || {}).map((c) => '<option ' + (cur() === c ? 'selected' : '') + '>' + c + '</option>').join('') + '</select></div>' +
      '<div class="bars mt2">' + [['Tuition / yr', +p.tuitionUSD || 0, 'var(--brand)'], ['Living / yr', +p.livingUSD || 0, 'var(--sun)'], ['One-off costs', oneOff, 'var(--coral)']].map(([l, v, c]) => '<div class="bar-row"><span>' + l + '</span><div class="track"><div class="fill" style="width:' + (v / max * 100) + '%;background:' + c + '"></div></div><span class="v">' + money(v, null, { compact: true }) + '</span></div>').join('') + '</div>' +
      '<hr class="divider"><div class="row between"><span class="muted">Whole programme (' + years + ' yrs, incl. application' + (intl ? ', visa & travel' : '') + ')</span><span class="big-num">' + money(total, null, { compact: true }) + '</span></div>' +
      '<p class="small muted mt1 mb0">Indicative figures using approximate exchange rates. <a href="/prepare/costs/' + encodeURIComponent(p.id) + '">Plan this in the Cost Planner →</a></p></div>' +
      (similar.length ? '<div><h3>Similar programmes</h3><div class="grid g3">' + similar.map((x) => '<a class="card hover" href="/program/' + encodeURIComponent(x.id) + '" style="text-decoration:none;color:inherit"><small class="muted">' + esc(x.university) + '</small><h4 class="mt1">' + esc(x.program) + '</h4><small>' + esc(x.country) + ' · ' + money(+x.tuitionUSD + +x.livingUSD, null, { compact: true }) + '/yr</small></a>').join('') + '</div></div>' : '') +
      '</div><aside class="stack"><div class="card" style="position:sticky;top:calc(var(--header-h) + 16px)">' +
      '<div class="row between"><span class="muted small" style="font-weight:700">DEADLINE</span><span class="countdown ' + U.countdownLabel(p.deadline).cls + '">' + U.countdownLabel(p.deadline).text + '</span></div><div class="big-num mt1">' + U.fmtDate(p.deadline) + '</div><p class="small muted">Intake: ' + esc(p.intake) + (p.opensOn ? ' · Applications open ' + U.fmtDate(p.opensOn) : '') + '</p><div class="notice mb2" style="padding:10px 12px">' + icon('wallet') + '<p class="small mb0"><b>Application fee: ' + (p.appFeeText ? esc(p.appFeeText) : 'about ' + money(p.appFeeUSD)) + '</b> — paid directly to <b>' + esc(p.university) + '</b> on its official portal' + (p.appFeeText ? '' : ' (estimate — check the official site)') + '. UniPath is free and never collects application, tuition or visa fees.</p></div>' +
      (started ? '<a class="btn block" href="/prepare/checklist/' + started.id + '">' + icon('list') + 'Open my checklist</a>' : '<button class="btn block lg" data-start="' + esc(p.id) + '">' + icon('plus') + 'Start application</button>') +
      '<button class="btn ghost block mt1" data-save="' + esc(p.id) + '">' + icon('heart') + (saved ? 'Saved' : 'Save to shortlist') + '</button>' +
      '<button class="btn ghost block mt1" id="p-ics">' + icon('calendar') + 'Add deadline to calendar</button>' +
      '<button class="btn ghost block mt1" id="p-watch" aria-pressed="' + watching + '">' + icon('clock') + (watching ? 'Watching — we’ll remind you' : 'Remind me when applications open') + '</button>' +
      '<hr class="divider"><p class="small mb0"><b>Official links</b></p><ul class="small" style="padding-left:18px;margin:6px 0">' + link(p.applyUrl, 'Apply online') + link(p.programmeUrl, 'Programme page') + link(p.admissionsUrl, 'Admissions & requirements') + link(p.intlUrl, 'International students') + link(p.feesUrl, 'Fees') + link(p.officialUrl, 'University website') + '</ul>' +
      '<p class="small muted mb0">' + (p.verified ? icon('shield') + ' Fees checked against the official website' + (U.safeUrl(p.sourceUrl) ? ' (<a href="' + esc(U.safeUrl(p.sourceUrl)) + '" target="_blank" rel="noopener">source</a>)' : '') + (p.lastVerified ? ' on ' + U.fmtDate(p.lastVerified) : '') + '.' : (p.listed ? 'This programme is on the university’s official programme list' + (U.safeUrl(p.sourceUrl) ? ' (<a href="' + esc(U.safeUrl(p.sourceUrl)) + '" target="_blank" rel="noopener">source</a>)' : '') + '. Fees, scores and deadline are <b>estimates</b> — confirm them before paying anything.' : 'Fees, scores and deadline are <b>indicative</b> — confirm them on the official website before paying anything.')) + (p.linksChecked ? '<br>' + icon('check') + ' Links checked ' + U.fmtDate(p.linksChecked) + '.' : '') + (p.sourceNote ? '<br>' + esc(p.sourceNote) : '') + '</p></div></aside></div></div>';
    setTimeout(() => {
      bindProgramActions();
      $('#p-watch').onclick = () => toggleWatch('program', p.id, p.program + ' — ' + p.university);
      $$('[data-uni]').forEach((x) => x.addEventListener('click', () => { S.thrive = S.thrive || {}; S.thrive.uni = x.dataset.uni; save(); }));
      $$('[data-back]').forEach((x) => x.onclick = (e) => { if (window.__upDepth > 0) { e.preventDefault(); window.__upDepth -= 1; history.back(); } });
      $('#pc-cur').onchange = (e) => { S.settings.currency = e.target.value; save(); render(); };
      $('#p-ics').onclick = () => U.download('deadline-' + p.id + '.ics', U.ics([{ date: p.deadline, title: 'Deadline: ' + p.program + ' — ' + p.university, desc: 'Apply: ' + (p.applyUrl || p.officialUrl) }]), 'text/calendar');
      const g = $('#pgrid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
    });
    return html;
  };

  /* ---------- Track ---------- */
  views.track = function () {
    const apps = S.applications;
    const n = (st) => apps.filter((a) => a.stage === st).length;
    const upcoming = [];
    apps.filter((a) => !['enrolled', 'closed'].includes(a.stage)).forEach((a) => {
      const info = appInfo(a);
      planFor(a).forEach((m) => { if (['submitted', 'decision', 'offer'].includes(a.stage) && !m.deadline) return; upcoming.push(Object.assign({ app: a, info }, m)); });
      if (a.acceptBy) upcoming.push({ app: a, info, date: a.acceptBy, title: 'Accept offer by', deadline: true });
    });
    upcoming.sort((x, y) => x.date.localeCompare(y.date));
    const soon = upcoming.filter((u) => U.daysUntil(u.date) >= -3).slice(0, 8);
    const nextDl = upcoming.filter((u) => u.deadline && U.daysUntil(u.date) >= 0)[0];
    const html = '<div class="container page">' + journeySteps('track') + accountNudge() +
      pageHead('Application tracker', 'Every application, its status and your next step. Drag cards between columns or change the stage on each card.', '<button class="btn ghost sm" id="t-ics">' + icon('calendar') + 'Export calendar</button><button class="btn sm" id="t-add">' + icon('plus') + 'Add application</button>') +
      (apps.length ? '' : emptyState('board', 'No applications yet', 'Start an application from your matches, or add any university or scholarship manually.', '<div class="row" style="justify-content:center"><a class="btn" href="/match">Go to my matches</a><button class="btn ghost" id="t-add2">Add manually</button></div>')) +
      (apps.length ? '<div class="grid g4 mb2">' +
        '<div class="card kpi"><div class="l">Applications</div><div class="v">' + apps.length + '</div></div>' +
        '<div class="card kpi"><div class="l">Submitted</div><div class="v">' + (n('submitted') + n('decision')) + '</div></div>' +
        '<div class="card kpi"><div class="l">Offers</div><div class="v" style="color:var(--ok)">' + (n('offer') + n('enrolled')) + '</div></div>' +
        '<div class="card kpi"><div class="l">Next deadline</div><div class="v" style="font-size:1.3rem">' + (nextDl ? U.fmtDate(nextDl.date, { day: 'numeric', month: 'short' }) : '—') + '</div><small class="muted">' + (nextDl ? esc(nextDl.info.university) : 'Nothing due') + '</small></div></div>' +
        '<div class="board" id="board">' + STAGES.map((st) => {
          const list = apps.filter((a) => a.stage === st.id);
          return '<div class="col" data-col="' + st.id + '"><h4>' + st.label + '<span class="count">' + list.length + '</span></h4>' + list.map((a) => {
            const info = appInfo(a), r = readiness(a), cd = U.countdownLabel(info.deadline);
            return '<div class="app-card" draggable="true" data-app="' + a.id + '"><div class="u">' + esc(info.university) + (a.kind === 'scholarship' ? ' · <span class="badge brand">Scholarship</span>' : '') + '</div><h5>' + esc(info.program) + '</h5>' +
              '<div class="progress mt1"><span style="width:' + r.pct + '%"></span></div><div class="row between small mt1"><span class="muted">' + r.done + '/' + r.total + ' ready</span><span class="countdown ' + cd.cls + '">' + cd.text + '</span></div>' +
              '<div class="next"><b>Next:</b> ' + esc(nextAction(a)) + '</div>' +
              '<div class="foot"><select data-stage="' + a.id + '" aria-label="Stage" style="padding:6px 30px 6px 10px;font-size:.8rem;border-radius:9px;width:auto">' + STAGES.map((s) => '<option value="' + s.id + '" ' + (s.id === a.stage ? 'selected' : '') + '>' + s.label + '</option>').join('') + '</select><button class="btn sm ghost" data-open="' + a.id + '">Open</button></div></div>';
          }).join('') + '</div>';
        }).join('') + '</div>' +
        '<div class="grid g2 mt3"><div class="card"><h3>Coming up</h3>' + (soon.length ? '<ol class="timeline mt2">' + soon.map((u) => { const d = U.daysUntil(u.date); return '<li class="' + (d < 0 ? 'past' : d <= 14 ? 'soon' : '') + '"><div class="when">' + U.fmtDate(u.date) + ' · ' + (d < 0 ? 'overdue' : d === 0 ? 'today' : 'in ' + d + 'd') + '</div><b>' + esc(u.title) + '</b><div class="small muted">' + esc(u.info.university) + ' — ' + esc(u.info.program) + '</div></li>'; }).join('') + '</ol>' : '<p class="muted">Nothing due soon.</p>') + '</div>' +
        '<div class="card"><h3>Reminders</h3><p class="muted small">Add every deadline and milestone to Google Calendar, Outlook or your phone — with a reminder two days before.</p><button class="btn" id="t-ics2">' + icon('download') + 'Download calendar file (.ics)</button>' +
        '<hr class="divider"><h4>Tips</h4><ul class="reasons"><li class="yes">' + icon('check') + '<span>Submit at least a week early — portals slow down near deadlines.</span></li><li class="yes">' + icon('check') + '<span>Save every confirmation email and payment receipt in your vault.</span></li><li class="yes">' + icon('check') + '<span>Record your applicant ID for each portal in the card notes.</span></li></ul></div></div>' : '') +
      '</div>';
    setTimeout(() => {
      [$('#t-add'), $('#t-add2')].forEach((b) => b && (b.onclick = () => addCustomApplication()));
      const exp = () => {
        const ev = []; S.applications.forEach((a) => { const info = appInfo(a); planFor(a).forEach((m) => ev.push({ date: m.date, title: (m.deadline ? 'DEADLINE: ' : '') + m.title + ' — ' + info.university, desc: info.program + (info.url ? '\n' + info.url : '') })); });
        if (!ev.length) return U.toast('Add an application with a deadline first', 'info');
        U.download('unipath-deadlines.ics', U.ics(ev), 'text/calendar'); U.toast('Calendar file downloaded — open it to import', 'calendar');
      };
      [$('#t-ics'), $('#t-ics2')].forEach((b) => b && (b.onclick = exp));
      $$('[data-stage]').forEach((s) => s.onchange = () => setStage(s.dataset.stage, s.value));
      $$('[data-open]').forEach((b) => b.onclick = () => openApp(b.dataset.open));
      $$('.app-card').forEach((c) => c.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', c.dataset.app); }));
      $$('.col').forEach((col) => {
        col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('drag-over'); });
        col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
        col.addEventListener('drop', (e) => { e.preventDefault(); col.classList.remove('drag-over'); setStage(e.dataTransfer.getData('text/plain'), col.dataset.col); });
      });
    });
    return html;
  };
  function setStage(id, stage) {
    const a = S.applications.find((x) => x.id === id); if (!a || a.stage === stage) return;
    a.stage = stage; a.history = a.history || []; a.history.push({ stage, at: new Date().toISOString() }); save();
    U.toast('Moved to ' + stageLabel(stage), stage === 'offer' ? 'award' : 'check');
    if (stage === 'offer') setTimeout(() => U.toast('Congratulations! Head to Enrol for your next steps', 'sparkle'), 600);
    render();
  }
  function openApp(id) {
    const a = S.applications.find((x) => x.id === id); if (!a) return;
    const info = appInfo(a), r = readiness(a);
    const m = U.modal({
      title: info.program, body: '<p class="muted mt0">' + esc(info.university) + (info.country ? ' · ' + esc(info.country) : '') + '</p>' +
        '<div class="form-grid"><label class="field"><span>Stage</span><select name="stage">' + STAGES.map((s) => '<option value="' + s.id + '" ' + (s.id === a.stage ? 'selected' : '') + '>' + s.label + '</option>').join('') + '</select></label>' +
        '<label class="field"><span>My deadline</span><input type="date" name="deadlineOverride" value="' + esc(a.deadlineOverride || info.deadline || '') + '"></label>' +
        '<label class="field"><span>Applicant / reference ID</span><input name="applicantId" value="' + esc(a.applicantId || '') + '" placeholder="From the university portal"></label>' +
        '<label class="field"><span>Accept offer by</span><input type="date" name="acceptBy" value="' + esc(a.acceptBy || '') + '"></label>' +
        '<label class="field full"><span>Notes</span><textarea name="notes" placeholder="Portal login hints, contacts, conditions…">' + esc(a.notes || '') + '</textarea></label></div>' +
        '<div class="row between mt2"><span class="small muted">Checklist: ' + r.done + '/' + r.total + ' ready</span><a class="btn link" href="/prepare/checklist/' + a.id + '">Open checklist →</a></div>' +
        '<div class="row mt2" style="gap:6px">' + (info.p ? '<a class="btn sm ghost" href="/program/' + encodeURIComponent(info.p.id) + '" data-close>' + icon('info') + 'Programme details</a><a class="btn sm ghost" href="/prepare/costs/' + encodeURIComponent(info.p.id) + '" data-close>' + icon('wallet') + 'True cost</a>' : '') + (window.UP_DEST && isInternational(info.country) && window.UP_DEST.findCountry(info.country) ? '<a class="btn sm ghost" href="/country/' + (window.UP_DEST.findCountry(info.country).slug || '') + '/visa" data-close>' + icon('plane') + 'Visa help</a>' : '') + (U.safeUrl(info.url) ? '<a class="btn sm ghost" href="' + esc(U.safeUrl(info.url)) + '" target="_blank" rel="noopener">' + icon('external') + 'Application portal</a>' : '') + (a.stage === 'offer' ? '<a class="btn sm" href="/enroll/' + a.id + '" data-close>' + icon('cap') + 'Enrolment steps</a>' : '') + '</div>',
      footer: '<button class="btn danger" data-del>' + icon('trash') + 'Delete</button><span style="flex:1"></span><button class="btn ghost" data-close>Cancel</button><button class="btn" data-save>Save</button>'
    });
    m.el.querySelector('[data-save]').onclick = () => {
      const d = Object.fromEntries(new FormData(wrapForm(m.el)));
      if (d.stage !== a.stage) { a.history = a.history || []; a.history.push({ stage: d.stage, at: new Date().toISOString() }); }
      const orig = a.programId && progById(a.programId) ? progById(a.programId).deadline : (a.custom || {}).deadline;
      Object.assign(a, d); if (!a.deadlineOverride || a.deadlineOverride === orig) delete a.deadlineOverride;
      save(); m.close(); U.toast('Saved'); render();
    };
    m.el.querySelector('[data-del]').onclick = async () => {
      m.close();
      if (await U.confirmBox('Delete application?', 'This removes "' + info.program + '" and its checklist progress from this device.')) { S.applications = S.applications.filter((x) => x.id !== id); save(); U.toast('Deleted', 'trash'); render(); }
    };
  }
  function wrapForm(el) { const f = document.createElement('form'); $$('input,select,textarea', el).forEach((i) => { if (i.name) { const c = document.createElement('input'); c.name = i.name; c.value = i.value; f.appendChild(c); } }); return f; }

  /* ---------- Enrol ---------- */
  views.enroll = function (appId) {
    const offers = S.applications.filter((a) => ['offer', 'enrolled'].includes(a.stage));
    const sel = appId && offers.find((a) => a.id === appId) ? appId : (offers[0] ? offers[0].id : 'general');
    const checks = S.enrollChecks[sel] || {};
    const steps = C.enrollSteps || [];
    const done = steps.filter((s) => checks[s.id]).length;
    const html = '<div class="container page">' + journeySteps('enroll') +
      pageHead('From offer to enrolment', 'Received an offer? Work through these steps to secure your place — safely and on time.') + ((C.site || {}).scopeNote ? '<div class="notice warn mb2">' + icon('shield') + '<p>' + esc(C.site.scopeNote) + '</p></div>' : '') +
      (offers.length ? '<div class="chips mb2">' + offers.map((a) => { const i = appInfo(a); return '<a class="chip ' + (a.id === sel ? 'on' : '') + '" href="/enroll/' + a.id + '" style="text-decoration:none">' + icon('award') + esc(i.university) + '</a>'; }).join('') + '</div>' :
        '<div class="notice mb2">' + icon('info') + '<p>When you move an application to <b>Offer received</b> in Track, it will appear here with its own checklist. Until then, here’s the general guide.</p></div>') +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="egrid"><div class="card"><div class="row between"><h3 class="mb0">' + (sel === 'general' ? 'General enrolment checklist' : esc(appInfo(offers.find((a) => a.id === sel)).program)) + '</h3><span class="badge brand">' + done + '/' + steps.length + ' done</span></div><div class="progress mt2"><span style="width:' + (steps.length ? done / steps.length * 100 : 0) + '%"></span></div>' +
      '<ul class="checklist mt2">' + steps.map((s, i) => '<li class="' + (checks[s.id] ? 'done' : '') + '"><button class="tick" data-es="' + esc(s.id) + '" aria-label="Mark ' + esc(s.title) + ' done" aria-pressed="' + !!checks[s.id] + '">' + icon('check') + '</button><div><div class="lbl">' + (i + 1) + '. ' + esc(s.title) + '</div><div class="tip">' + esc(s.detail) + '</div></div></li>').join('') + '</ul></div>' +
      '<aside class="stack"><div class="notice bad">' + icon('alert') + '<div><b>Stay safe from admission scams</b><ul style="margin:8px 0 0;padding-left:18px" class="small"><li>No one can guarantee admission or a visa for a fee.</li><li>Pay only to accounts printed on your official offer letter or portal.</li><li>Universities never ask for payment by mobile money to a personal number.</li><li>If in doubt, email the admissions office directly from their official website.</li></ul></div></div>' +
      (offers.length > 1 ? '<div class="card"><h4>Compare your offers</h4><div class="table-wrap mt1"><table class="tbl"><thead><tr><th>Offer</th><th>Total / yr</th><th>Accept by</th></tr></thead><tbody>' + offers.map((a) => { const i = appInfo(a); return '<tr><td>' + esc(i.university) + '</td><td class="num">' + (i.p ? money(+i.p.tuitionUSD + +i.p.livingUSD, null, { compact: true }) : '—') + '</td><td>' + (a.acceptBy ? U.fmtDate(a.acceptBy) : '<span class="muted">Set in Track</span>') + '</td></tr>'; }).join('') + '</tbody></table></div></div>' : '') +
      (function () { const o = offers.find((x) => x.id === sel); const i = o ? appInfo(o) : null; const d = i && window.UP_DEST ? window.UP_DEST.findCountry(i.country) : null; return '<div class="card"><h4>Useful next steps</h4><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:5px">' + (d && isInternational(i.country) ? '<li><a href="/country/' + (d.slug || '') + '/visa">Visa help for ' + esc(d.name) + '</a></li>' : '') + (i && i.p ? '<li><a href="/prepare/costs/' + encodeURIComponent(i.p.id) + '">True cost of this offer</a></li>' : '<li><a href="/prepare/costs">True Cost Planner</a></li>') + (i && U.safeUrl(i.url) ? '<li><a href="' + esc(U.safeUrl(i.url)) + '" target="_blank" rel="noopener">Your university portal ↗</a></li>' : '') + '<li><a href="/thrive/first100">Your first 100 days</a></li><li><a href="/thrive/support">Support services at your university</a></li></ul></div>'; })() +
      '<a class="btn block" href="/offers">' + icon('grid') + 'Compare my offers side by side</a>' +
      '<div class="card tint"><h4>Need a hand?</h4><p class="small">Offers, deposits and visas can be confusing. Talk to an adviser — free.</p><a class="btn sm" href="/book">' + icon('calendar') + 'Book a free session</a></div></aside></div></div>';
    setTimeout(() => {
      $$('[data-es]').forEach((b) => b.onclick = () => { S.enrollChecks[sel] = S.enrollChecks[sel] || {}; S.enrollChecks[sel][b.dataset.es] = !S.enrollChecks[sel][b.dataset.es]; save(); render(); });
      const g = $('#egrid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
    });
    return html;
  };

  /* ---------- Help ---------- */
  views.help = function () {
    const s = C.site || {};
    const wa = (s.whatsapp || '').replace(/[^\d]/g, '');
    const html = '<div class="container page">' + pageHead('Help & FAQ', 'Quick answers, plain-language explanations, and a real person when you need one.') +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 380px;gap:26px" id="hgrid"><div><div class="card"><h3>Frequently asked questions</h3>' + (C.faqs || []).map((f) => '<details class="faq"><summary>' + esc(f.q) + '</summary><p>' + esc(f.a) + '</p></details>').join('') + '</div>' +
      '<div class="card mt3 row between"><div><h3 class="mb0">Confused by a term?</h3><p class="muted small mb0">“Conditional offer”, “CAS”, “principal pass” — explained simply.</p></div><a class="btn ghost" href="/prepare/glossary">' + icon('book') + 'Open glossary</a></div></div>' +
      '<aside class="stack"><a class="btn sun block lg" href="/book">' + icon('calendar') + 'Book a free consultation</a><div class="card"><h3>Ask an adviser</h3><p class="small muted">Tell us what you’re stuck on. We usually reply within 2 working days.</p><form id="adv" class="stack"><label class="field"><span>Name</span><input name="name" required></label><label class="field"><span>Email</span><input type="email" name="email" required></label><label class="field"><span>Phone / WhatsApp <small class="muted">(optional)</small></span><input name="phone" type="tel"></label>' +
      '<label class="field"><span>Topic</span><select name="topic"><option>Choosing a university</option><option>Entry requirements</option><option>Documents</option><option>Personal statement</option><option>Scholarships &amp; funding</option><option>Offers &amp; enrolment</option><option>Visa</option><option>Something else</option></select></label>' +
      '<label class="field"><span>Your question</span><textarea name="message" required></textarea></label><button class="btn block">' + icon('message') + 'Send question</button></form>' +
      (wa ? '<a class="btn ghost block mt1" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon('phone') + 'Chat on WhatsApp</a>' : '') +
      (s.contactEmail ? '<p class="small muted tc mt2 mb0">Or email <a href="mailto:' + esc(s.contactEmail) + '">' + esc(s.contactEmail) + '</a></p>' : '') + '</div></aside></div></div>';
    setTimeout(() => {
      const g = $('#hgrid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#adv').onsubmit = async (e) => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(e.target)); d.submittedAt = new Date().toISOString();
        const ok = await U.submitResponse('adviser', 'adviser-request', d); logResearch('adviser', d);
        e.target.reset(); U.toast(ok ? 'Sent! We’ll be in touch soon.' : 'Saved — we’ll send it when you’re back online', 'mail');
      };
    });
    return html;
  };

  /* ---------- About ---------- */
  views.about = function () {
    const s = C.site || {};
    return '<div class="container page" style="max-width:900px">' + '<span class="eyebrow">About UniPath Africa</span><h1>Education should be accessible — wherever you start.</h1>' +
      '<p class="lead" style="font-size:1.1rem;color:var(--ink-2)">' + esc(s.name || 'UniPath Africa') + ' empowers students across Africa to access higher education by simplifying the journey from university discovery to enrolment — using technology, verified admissions information, personalised guidance and trusted partnerships.</p>' +
      '<div class="grid g3 mt3">' + [['WHY', 'heart', 'Every student deserves a fair chance at higher education. We exist to remove the information, administrative and financial-navigation barriers that keep capable African students from suitable universities.'], ['HOW', 'sparkle', 'We combine personalised matching, verified requirements, a reusable document vault, deadline reminders and guided tracking in one accessible platform — backed by universities, schools and advisers.'], ['WHAT', 'cap', 'A mobile-first admissions platform that helps students discover courses, assess eligibility, prepare applications, find scholarships, track decisions and enrol — locally or abroad.']].map((g) => '<div class="card"><div class="feature-icon">' + icon(g[1]) + '</div><span class="eyebrow">' + g[0] + '</span><p class="small mb0">' + g[2] + '</p></div>').join('') + '</div>' +
      '<h2 class="mt4">Our principles</h2><div class="grid g2">' + [['shield', 'No pay-to-rank', 'Matches are ordered by fit, never by who pays us. Any partnership is disclosed.'], ['check', 'Verified vs indicative', 'Every programme shows whether its data was checked against the official source.'], ['lock', 'Your data, protected', 'Accounts and documents are stored securely, used only to support your applications, and never sold.'], ['users', 'Built with students', 'We design by testing with real applicants, counsellors and admissions staff.']].map((p) => '<div class="card row" style="align-items:flex-start;flex-wrap:nowrap"><div class="feature-icon" style="margin:0">' + icon(p[0]) + '</div><div><h4>' + p[1] + '</h4><p class="small muted mb0">' + p[2] + '</p></div></div>').join('') + '</div>' +
      '<div class="card tint mt4"><h3>Founder</h3><p class="mb0">' + esc(s.founder || 'Peace Ampiire') + ' — student entrepreneur at African Leadership University. UniPath Africa began as a response to a simple question: why is getting into university so much harder than it needs to be?</p></div></div>';
  };

  /* ---------- Passport (my data) ---------- */
  views.passport = function () {
    const p = S.profile;
    const docsReady = Object.values(S.docs).filter((d) => d.status === 'ready').length;
    const html = '<div class="container page">' + pageHead('My Admissions Passport', 'Your reusable student profile — and full control over your data.') +
      '<div class="grid g2"><div class="card"><div class="row between"><h3 class="mb0">Profile</h3><a class="btn sm ghost" href="/discover">' + icon('edit') + 'Edit</a></div>' +
      (p ? '<table class="tbl mt2"><tbody>' + [['Name', p.name || '—'], ['Lives in', p.homeCountry], ['Level', p.level], ['Field', p.field], ['Qualification', (QUALS[p.qual] || {}).label + ' — ' + (p.gradeLabel || '')], ['Destinations', (p.destinations || []).join(', ') || 'Anywhere'], ['Budget / yr', p.budgetAmount ? p.budgetCurrency + ' ' + Number(p.budgetAmount).toLocaleString() : '—'], ['Seeking scholarships', p.scholarship ? 'Yes' : 'No']].map((r) => '<tr><th style="position:static;width:40%">' + r[0] + '</th><td>' + esc(r[1]) + '</td></tr>').join('') + '</tbody></table>' : '<p class="muted mt2">No profile yet. <a href="/discover">Create one</a>.</p>') + '</div>' +
      '<div class="stack"><div class="card tint row between"><div><b>Share my plan with family</b><p class="small mb0">A read-only link with your programmes and their true costs.</p></div><button class="btn sm" id="pp-share">' + icon('users') + 'Share</button></div><div class="grid g3"><div class="card kpi"><div class="l">Saved</div><div class="v">' + S.shortlist.length + '</div></div><div class="card kpi"><div class="l">Applications</div><div class="v">' + S.applications.length + '</div></div><div class="card kpi"><div class="l">Docs ready</div><div class="v">' + docsReady + '</div></div></div>' +
      accountCard() +
      '<div class="card"><h3>Your data & privacy</h3><p class="small muted">' + (U.API.signedIn() ? 'Your profile, applications, statements and documents are saved securely in your UniPath account and visible to UniPath advisers who support you. You can download a copy or delete your account at any time.' : 'You are not signed in, so everything is stored only in this browser on this device. Create a free account to keep it safe and use it on any device.') + ' <a href="/privacy">Privacy notice</a></p>' +
      '<label class="check small"><input type="checkbox" id="inc-files">Include document files in the backup</label>' +
      '<div class="row mt2"><button class="btn" id="exp">' + icon('download') + 'Export backup</button><label class="btn ghost" style="cursor:pointer">' + icon('upload') + 'Import backup<input type="file" id="imp" accept=".json,application/json" hidden></label></div>' +
      '<hr class="divider"><button class="btn danger" id="wipe">' + icon('trash') + (U.API.signedIn() ? 'Delete my account and all data' : 'Delete all my data') + '</button></div></div></div>' + allNotes() +
      (S.shortlist.length ? '<h3 class="mt4">Saved programmes</h3><div class="grid g3">' + S.shortlist.map(progById).filter(Boolean).map((x) => '<a class="card hover" href="/program/' + encodeURIComponent(x.id) + '" style="text-decoration:none;color:inherit"><small class="muted">' + esc(x.university) + '</small><h4 class="mt1">' + esc(x.program) + '</h4><small>' + esc(x.country) + ' · ' + U.countdownLabel(x.deadline).text + '</small></a>').join('') + '</div>' : '') + '</div>';
    setTimeout(() => {
      const shb = $('#pp-share'); if (shb) shb.onclick = () => window.UP_FEATURES && window.UP_FEATURES.openShare();
      $('#exp').onclick = async () => {
        const out = { app: 'UniPath Africa', exportedAt: new Date().toISOString(), state: S, files: {} };
        if ($('#inc-files').checked) {
          for (const k of Object.keys(S.docs)) { try { const f = await U.Vault.get(k); if (f) out.files[k] = { name: f.name, type: f.type, data: await blobToDataURL(f) }; } catch (e) {} }
        }
        U.download('unipath-passport-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(out), 'application/json'); U.toast('Backup downloaded', 'download');
      };
      $('#imp').onchange = async (e) => {
        const f = e.target.files[0]; if (!f) return;
        try {
          const j = JSON.parse(await f.text()); if (!j.state) throw new Error();
          S = Object.assign(DEFAULT_STATE(), j.state); save();
          for (const [k, v] of Object.entries(j.files || {})) { const b = await (await fetch(v.data)).blob(); await U.Vault.put(k, new File([b], v.name, { type: v.type })); }
          U.toast('Backup restored'); render();
        } catch (err) { U.toast('That file isn’t a UniPath backup', 'alert'); }
      };
      bindAccountCard();
      $('#wipe').onclick = async () => {
        const acct = U.API.signedIn();
        if (!(await U.confirmBox('Delete everything?', acct ? 'This permanently deletes your UniPath account, profile, applications, statements and uploaded documents from our servers and this device.' : 'This permanently removes your profile, applications, statements and stored documents from this device.', 'Delete everything'))) return;
        if (acct) { try { await U.API.call('DELETE', 'me'); } catch (e) { return U.toast('Couldn’t delete your account — please try again', 'alert'); } U.API.setToken(''); U.API.setUser(null); updateUserChip(); }
        localStorage.removeItem(STATE_KEY); try { await U.Vault.clear(); } catch (e) {}
        S = DEFAULT_STATE(); save(); U.toast('All your data was deleted', 'trash'); U.go('/');
      };
    });
    return html;
  };
  function accountCard() {
    if (!U.API.online) return '';
    const u = U.API.user();
    if (!U.API.signedIn() || !u) return '<div class="card tint"><h3>Save your progress</h3><p class="small">Create a free account to keep your profile, applications and documents safe, use any device, and get help from a UniPath adviser.</p><div class="row"><a class="btn" href="/account/signup">' + icon('user') + 'Create free account</a><a class="btn ghost" href="/account">Sign in</a></div></div>';
    return '<div class="card"><div class="row between"><h3 class="mb0">Account</h3><span class="badge ok">' + icon('check') + 'Synced</span></div><p class="mt2 mb0"><b>' + esc(u.name || '') + '</b><br><span class="muted">' + esc(u.email) + '</span></p>' +
      '<hr class="divider"><h4 class="mt0">Reminders</h4><label class="check small"><input type="checkbox" id="pref-rem"' + ((u.prefs || {}).reminders !== false ? ' checked' : '') + '><span><b>Email me before my deadlines</b><br><span class="muted">14, 7 and 2 days before each application, offer and visa date — plus alerts for programmes I ask to watch.</span></span></label>' +
      '<label class="check small mt1"><input type="checkbox" id="pref-wa"' + ((u.prefs || {}).whatsapp ? ' checked' : '') + '><span><b>An adviser may also remind me on WhatsApp</b>' + (u.phone ? ' (' + esc(u.phone) + ')' : ' — add your number in your profile') + '</span></label>' +
      '<div class="row mt2"><button class="btn sm ghost" id="acc-pw">' + icon('lock') + 'Change password</button><button class="btn sm ghost" id="acc-out">' + icon('logout') + 'Sign out</button></div></div>';
  }
  function bindAccountCard() {
    const o = $('#acc-out'); if (o) o.onclick = () => signOut();
    const savePrefs = async () => { try { const r = await U.API.call('PATCH', 'me/profile', { prefs: { reminders: $('#pref-rem').checked, whatsapp: $('#pref-wa').checked } }); U.API.setUser(r.user); U.toast('Reminder settings saved', 'check'); } catch (e) { U.toast(e.message, 'alert'); } };
    ['#pref-rem', '#pref-wa'].forEach((id) => { const el = $(id); if (el) el.onchange = savePrefs; });
    const p = $('#acc-pw'); if (p) p.onclick = () => {
      const m = U.modal({ title: 'Change password', body: '<form id="pwf" class="stack"><label class="field"><span>Current password</span><input type="password" name="current" required autocomplete="current-password"></label><label class="field"><span>New password</span><input type="password" name="next" required minlength="8" autocomplete="new-password"></label><p class="small" id="pwerr" style="color:var(--bad);margin:0"></p></form>', footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-ok>Update</button>' });
      m.el.querySelector('[data-ok]').onclick = async () => { const f = m.el.querySelector('#pwf'); if (!f.reportValidity()) return; try { await U.API.call('POST', 'me/password', Object.fromEntries(new FormData(f))); m.close(); U.toast('Password updated', 'lock'); } catch (e) { m.el.querySelector('#pwerr').textContent = e.message; } };
    };
  }
  function allNotes() {
    const u = U.API.user(); const notes = (U.API.signedIn() && u && u.notes) || [];
    if (!notes.length) return '';
    return '<h3 class="mt4">Messages from your adviser</h3><div class="stack">' + notes.slice().reverse().map((n) => '<div class="card"><div class="small muted">' + U.fmtDate(n.at.slice(0, 10)) + '</div><p class="mb0 mt1" style="white-space:pre-wrap">' + esc(n.text) + '</p></div>').join('') + '</div>';
  }

  /* ---------- Account page ---------- */
  views.account = function (mode) {
    mode = mode === 'signup' ? 'signup' : 'login';
    if (!U.API.online) return '<div class="container page" style="max-width:560px">' + emptyState('lock', 'Accounts aren’t available right now', 'You can keep using UniPath — your progress is saved on this device.', '<a class="btn" href="/">Go home</a>') + '</div>';
    if (U.API.signedIn()) { setTimeout(() => { U.go('/passport'); }); return ''; }
    const html = '<div class="container page" style="max-width:520px"><div class="card pad-lg"><span class="eyebrow">' + (mode === 'signup' ? 'Free for students' : 'Welcome back') + '</span><h1 style="font-size:2rem">' + (mode === 'signup' ? 'Create your account' : 'Sign in') + '</h1><p class="muted">' + (mode === 'signup' ? 'Save your profile, applications and documents, use any device, and get help from a UniPath adviser.' : 'Pick up where you left off on any device.') + '</p>' +
      authForm(mode) + '<p class="small tc mt2 mb0">' + (mode === 'signup' ? 'Already have an account? <a href="/account">Sign in</a>' : 'New to UniPath? <a href="/account/signup">Create a free account</a>') + '</p>' + (mode === 'login' ? '<p class="small tc muted mt1 mb0">Forgot your password? <a href="/help">Ask an adviser</a> to reset it.</p>' : '') + '</div></div>';
    setTimeout(() => bindAuthForm(mode, () => { U.go(S.applications.length ? '/track' : (S.profile ? '/match' : '/discover')); }));
    return html;
  };
  views.scholarships = function () { setTimeout(() => U.go('/prepare/scholarships', { replace: true })); return ''; };
  views.privacy = function () {
    return '<div class="container page" style="max-width:780px"><span class="eyebrow">Privacy notice</span><h1>How we look after your data</h1>' +
      '<div class="card stack"><p><b>What we collect.</b> If you create an account: your name, email, optional phone number, the study profile you enter, saved programmes, applications, checklists, statements, referee details and documents you upload. If you take part in research: your questionnaire and test answers.</p>' +
      '<p><b>Why.</b> To run your account, show your matches and progress on any device, and let UniPath advisers support your applications. Anonymised, combined figures help us improve the service.</p>' +
      '<p><b>Who can see it.</b> You, and authorised UniPath team members who support students. We never sell your data or share it with universities without asking you first.</p>' +
      '<p><b>Where it is stored.</b> On secure cloud infrastructure provided by our hosting provider (Netlify). Data is sent over encrypted connections.</p>' +
      '<p><b>Your choices.</b> You can use UniPath without an account (data stays on your device), download a copy of your data from My Passport, or delete your account and all data at any time.</p>' +
      '<p class="mb0"><b>Under 18?</b> Please make sure a parent or guardian knows you are using UniPath. Questions: <a href="mailto:' + esc((C.site && C.site.contactEmail) || '') + '">' + esc((C.site && C.site.contactEmail) || '') + '</a>.</p></div></div>';
  };

  function blobToDataURL(b) { return new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(b); }); }

  /* ---------- Research (survey + usability test) ---------- */
  views.research = function (sub) {
    const s = C.site || {};
    if (sub === 'survey') return researchSurvey();
    const tester = U.store('unipath.tester');
    return '<div class="container page" style="max-width:980px"><span class="eyebrow">Help shape UniPath Africa</span><h1>Test the platform with us</h1><p class="lead muted" style="font-size:1.08rem">We’re a student-founded startup testing whether UniPath Africa genuinely helps. Your honest feedback — good and bad — decides what we build next.</p>' +
      '<div class="grid g2 mt3"><div class="card pad-lg"><div class="feature-icon">' + icon('message') + '</div><h3>Share your experience</h3><p class="muted small">A 5–7 minute questionnaire about how you find and apply to universities, and what would make you trust a platform like this.</p><a class="btn" href="/research/survey">' + icon('pen') + 'Take the questionnaire</a>' + (U.safeUrl(s.surveyUrl) ? '<p class="small mt2 mb0">Prefer Google Forms? <a href="' + esc(U.safeUrl(s.surveyUrl)) + '" target="_blank" rel="noopener">Open the external form ↗</a></p>' : '') + '</div>' +
      '<div class="card pad-lg" style="border:2px solid var(--sun)"><div class="feature-icon sun">' + icon('test') + '</div><h3>Usability test (guided)</h3><p class="muted small">Try ' + (C.testerTasks || []).length + ' short tasks while we time them. A floating panel guides you; rate how easy each one was. Takes about 10 minutes.</p>' +
      (tester && tester.active ? '<button class="btn sun" id="resume-test">' + icon('play') + 'Resume test</button>' : '<button class="btn sun" id="start-test">' + icon('play') + 'Start usability test</button>') + '</div></div>' +
      '<div class="card mt3"><h3>How we handle your answers</h3><ul class="reasons"><li class="yes">' + icon('check') + '<span>Participation is voluntary — you can stop at any time.</span></li><li class="yes">' + icon('check') + '<span>We use a participant code (like P01), not your name, in our analysis.</span></li><li class="yes">' + icon('check') + '<span>We only use quotes, photos or video if you separately agree.</span></li><li class="yes">' + icon('check') + '<span>Responses are used only to improve UniPath Africa for an academic project at African Leadership University.</span></li></ul></div></div>';
  };
  function researchSurvey() {
    const features = ['Personalised university matching', 'Eligibility checker', 'Document checklist', 'Document vault', 'Deadline reminders', 'Cost planner in my currency', 'Scholarship finder', 'Personal statement help', 'Talking to a human adviser', 'Offer & visa guidance'];
    const html = '<div class="container page" style="max-width:820px"><a href="/research" class="btn link">' + icon('left') + 'Back</a><h1 class="mt1">Student & stakeholder questionnaire</h1><p class="muted">About 5–7 minutes. There are no right or wrong answers.</p>' +
      '<form id="survey" class="card pad-lg stack mt2">' +
      '<div class="notice ok">' + icon('shield') + '<p>Your answers are anonymous. We’ll refer to you only by a participant code.</p></div>' +
      '<label class="check"><input type="checkbox" name="consent" value="yes" required><span><b>I agree to take part</b> and understand my answers will be used to improve UniPath Africa for an academic project.</span></label>' +
      '<div class="form-grid"><label class="field"><span>Participant code <small class="muted">(given by the researcher, or leave blank)</small></span><input name="participant" placeholder="e.g. P01 or S01"></label>' +
      '<label class="field"><span>I am a…</span><select name="stakeholderType" required><option value="">Choose…</option><option>Prospective student / applicant</option><option>Current university student</option><option>Parent or guardian</option><option>School counsellor or teacher</option><option>University admissions staff</option><option>Education adviser / agent</option><option>Other</option></select></label>' +
      '<label class="field"><span>Country</span><input name="country" placeholder="e.g. Uganda"></label>' +
      '<label class="field"><span>Education level</span><select name="educationLevel"><option value="">Choose…</option><option>Secondary school (S4–S6 / Form 4 / SS3)</option><option>Finished secondary</option><option>Undergraduate</option><option>Graduate</option><option>Not applicable</option></select></label>' +
      '<label class="field full"><span>Where are you (or your students) most interested in studying?</span><input name="destination" placeholder="e.g. Uganda, Kenya, UK, Canada…"></label></div>' +
      '<label class="field"><span>1. Which part of finding and applying to university has been most confusing, time-consuming, or expensive for you?</span><textarea name="q1_hardest" required></textarea></label>' +
      '<label class="field"><span>2. Looking at this platform, which feature would be most useful — and what is missing or unclear?</span><textarea name="q2_useful" required></textarea></label>' +
      '<div class="field"><span class="label">Which features would you use? (pick any)</span><div class="chips">' + features.map((f) => '<label class="chip"><input type="checkbox" name="feat" value="' + esc(f) + '" style="accent-color:var(--brand)"> ' + esc(f) + '</label>').join('') + '</div></div>' +
      '<label class="field"><span>3. What would make you trust this platform enough to use it, recommend it, or pay for an optional service?</span><textarea name="q3_trust" required></textarea></label>' +
      '<div class="form-grid"><label class="field"><span>Would you pay for optional human help (e.g. document review)?</span><select name="wouldPay"><option value="">Choose…</option><option>Yes — up to UGX 30,000</option><option>Yes — UGX 30,000–150,000</option><option>Yes — more than UGX 150,000</option><option>Maybe</option><option>No — only if free</option></select></label>' +
      '<div class="field"><span class="label">How likely are you to recommend UniPath to a friend? (0–10)</span><div class="scale" id="nps">' + Array.from({ length: 11 }, (_, i) => '<button type="button" data-v="' + i + '" aria-pressed="false">' + i + '</button>').join('') + '</div><input type="hidden" name="nps"></div></div>' +
      '<label class="field"><span>Anything else you’d like to tell us?</span><textarea name="extra"></textarea></label>' +
      '<label class="check"><input type="checkbox" name="mediaConsent" value="yes"><span>I agree that my words may be quoted anonymously, and that photos/video taken during this session may be used in the project presentation.</span></label>' +
      '<button class="btn lg">' + icon('check') + 'Submit my answers</button></form></div>';
    setTimeout(() => {
      const f = $('#survey');
      $$('#nps button').forEach((b) => b.onclick = () => { $$('#nps button').forEach((x) => x.setAttribute('aria-pressed', x === b)); f.nps.value = b.dataset.v; });
      f.onsubmit = async (e) => {
        e.preventDefault(); if (!f.reportValidity()) return;
        const fd = new FormData(f); const d = {};
        fd.forEach((v, k) => { if (k !== 'feat') d[k] = v; });
        d.usefulFeatures = fd.getAll('feat').join('; '); d.mediaConsent = d.mediaConsent || 'no'; d.submittedAt = new Date().toISOString();
        const ok = await U.submitResponse('survey', 'research-survey', d); logResearch('survey', d);
        $('#app').innerHTML = '<div class="container page tc" style="max-width:640px"><div class="feature-icon" style="margin:0 auto 16px;width:64px;height:64px">' + icon('check') + '</div><h1>Thank you!</h1><p class="muted">Your answers ' + (ok ? 'were sent to the UniPath team' : 'were saved on this device') + '. They genuinely shape what we build next.</p><div class="row" style="justify-content:center"><a class="btn" href="/">Explore UniPath</a><button class="btn ghost" onclick="UP.go(\'/research\')">Back to research</button></div></div>';
        window.scrollTo(0, 0);
      };
    });
    return html;
  }

  /* ---------- Usability tester ---------- */
  function startTester() {
    const m = U.modal({
      title: 'Start usability test', body: '<p class="muted mt0">You’ll get ' + (C.testerTasks || []).length + ' short tasks. Try each one without help — it’s the platform being tested, not you. Think aloud if a researcher is with you.</p>' +
        '<form class="stack" id="tform"><label class="field"><span>Participant code</span><input name="participant" placeholder="e.g. P01" required></label>' +
        '<label class="field"><span>Device</span><select name="device"><option>Phone</option><option>Laptop / desktop</option><option>Tablet</option></select></label>' +
        '<label class="check"><input type="checkbox" required name="consent"><span>I agree to take part. My task times and ratings will be recorded anonymously.</span></label>' +
        '<label class="check small"><input type="checkbox" name="fresh" checked><span>Start with a fresh, empty profile (recommended)</span></label></form>',
      footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn sun" data-go>' + icon('play') + 'Begin</button>'
    });
    m.el.querySelector('[data-go]').onclick = () => {
      const f = m.el.querySelector('#tform'); if (!f.reportValidity()) return;
      if (f.fresh.checked) { U.store('unipath.state.beforeTest', S); S = DEFAULT_STATE(); save(); }
      U.store('unipath.tester', { active: true, participant: f.participant.value, device: f.device.value, i: 0, startedAt: Date.now(), taskStart: Date.now(), results: [] });
      m.close(); const t = (C.testerTasks || [])[0]; U.go(t && t.route ? t.route : '/'); renderTester();
    };
  }
  let testerTimer = null;
  function renderTester() {
    const root = $('#tester-root'); const t = U.store('unipath.tester');
    clearInterval(testerTimer);
    if (!t || !t.active) { root.innerHTML = ''; return; }
    const tasks = C.testerTasks || []; const task = tasks[t.i];
    if (!task) { finishTester(); return; }
    root.innerHTML = '<aside class="tester-bar" role="complementary" aria-label="Usability test"><div class="t-title"><span>' + icon('test', 'sr-only') + 'Task ' + (t.i + 1) + ' of ' + tasks.length + '</span><span class="timer" id="t-time">0:00</span></div>' +
      '<b class="mt1" style="display:block">' + esc(task.title) + '</b><p class="small muted mt1 mb0">' + esc(task.instruction) + '</p>' +
      '<div class="progress sun mt1"><span style="width:' + (t.i / tasks.length * 100) + '%"></span></div>' +
      '<div class="row mt2" style="gap:6px"><button class="btn sm" id="t-done">' + icon('check') + 'Done</button><button class="btn sm ghost" id="t-skip">Couldn’t do it</button><button class="btn sm link" id="t-quit">Quit</button></div></aside>';
    const tick = () => { const s = Math.floor((Date.now() - t.taskStart) / 1000); const el = $('#t-time'); if (el) el.textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
    tick(); testerTimer = setInterval(tick, 1000);
    const finishTask = (success) => {
      const secs = Math.round((Date.now() - t.taskStart) / 1000);
      const m = U.modal({
        title: 'How easy was that?', body: '<p class="muted mt0">' + esc(task.title) + ' · ' + secs + 's</p><div class="scale" id="ease">' + [1, 2, 3, 4, 5].map((v) => '<button type="button" data-v="' + v + '" aria-pressed="false">' + v + '</button>').join('') + '</div><div class="row between small muted mt1"><span>1 = very hard</span><span>5 = very easy</span></div><label class="field mt2"><span>Anything confusing? <small class="muted">(optional)</small></span><textarea name="c" style="min-height:80px"></textarea></label>',
        footer: '<button class="btn" data-next>Next task ' + icon('right') + '</button>'
      });
      let ease = 0; $$('#ease button', m.el).forEach((b) => b.onclick = () => { ease = +b.dataset.v; $$('#ease button', m.el).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
      m.el.querySelector('[data-next]').onclick = () => {
        t.results.push({ task: task.title, success, seconds: secs, ease, comment: m.el.querySelector('textarea').value });
        t.i++; t.taskStart = Date.now(); U.store('unipath.tester', t); m.close();
        const nt = tasks[t.i]; if (nt && nt.route) U.go(nt.route); renderTester();
      };
    };
    $('#t-done').onclick = () => finishTask(true);
    $('#t-skip').onclick = () => finishTask(false);
    $('#t-quit').onclick = async () => { if (await U.confirmBox('Quit the test?', 'Your progress so far will be saved.', 'Quit')) finishTester(); };
  }
  async function finishTester() {
    clearInterval(testerTimer);
    const t = U.store('unipath.tester'); if (!t) return;
    t.active = false; U.store('unipath.tester', null); $('#tester-root').innerHTML = '';
    const done = t.results.filter((r) => r.success).length, total = Math.round((Date.now() - t.startedAt) / 1000);
    const d = { participant: t.participant, device: t.device, tasksCompleted: done + '/' + t.results.length, totalSeconds: String(total), results: JSON.stringify(t.results), submittedAt: new Date().toISOString() };
    const ok = await U.submitResponse('usability', 'usability-test', d); logResearch('usability', Object.assign({}, d, { results: t.results }));
    const before = U.store('unipath.state.beforeTest'); if (before) { S = Object.assign(DEFAULT_STATE(), before); save(); U.store('unipath.state.beforeTest', null); }
    U.modal({ title: 'Thank you!', body: '<p>You completed <b>' + done + ' of ' + t.results.length + '</b> tasks in ' + Math.floor(total / 60) + 'm ' + (total % 60) + 's. Your results ' + (ok ? 'were sent to the team' : 'were saved on this device') + '.</p><p class="muted mb0">Would you also answer the short questionnaire? It helps us understand the “why”.</p>', footer: '<button class="btn ghost" data-close>Not now</button><a class="btn" href="/research/survey" data-close>Take questionnaire</a>' });
  }

  /* ---------- Feedback widget ---------- */
  function openFeedback() {
    const t = U.store('unipath.tester');
    const m = U.modal({
      title: 'How’s UniPath working for you?', body: '<div class="rating" id="rate">' + ['😞', '🙁', '😐', '🙂', '😍'].map((e, i) => '<button type="button" data-v="' + (i + 1) + '" aria-label="' + (i + 1) + ' of 5" aria-pressed="false">' + e + '</button>').join('') + '</div>' +
        '<label class="field mt2"><span>What’s on your mind?</span><textarea name="comment" placeholder="Something confusing, missing, or that you loved…"></textarea></label>' +
        '<label class="field mt2"><span>Email or phone <small class="muted">(optional — only if you’d like a reply)</small></span><input name="contact"></label>',
      footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-send>' + icon('message') + 'Send feedback</button>'
    });
    let rating = 0; $$('#rate button', m.el).forEach((b) => b.onclick = () => { rating = +b.dataset.v; $$('#rate button', m.el).forEach((x) => x.setAttribute('aria-pressed', x === b)); });
    m.el.querySelector('[data-send]').onclick = async () => {
      const comment = m.el.querySelector('textarea').value.trim();
      if (!rating && !comment) return U.toast('Add a rating or a comment', 'info');
      const d = { rating: String(rating || ''), page: location.pathname || '/', task: t ? (t.participant + ' task ' + (t.i + 1)) : '', comment, contact: m.el.querySelector('[name=contact]').value, submittedAt: new Date().toISOString() };
      const ok = await U.submitResponse('feedback', 'feedback', d); logResearch('feedback', d);
      m.close(); U.toast(ok ? 'Thanks — feedback sent!' : 'Thanks — saved on this device', 'heart');
    };
  }

  /* ================= Shell: settings, announcement, router ================= */
  function applySettings() {
    const r = document.documentElement;
    r.dataset.theme = S.settings.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (S.settings.text === 'large') r.dataset.text = 'large'; else delete r.dataset.text;
  }
  function settingsPop() {
    const ex = $('.settings-pop'); if (ex) { ex.remove(); $('#settings-btn').setAttribute('aria-expanded', 'false'); return; }
    const el = document.createElement('div'); el.className = 'settings-pop';
    const th = document.documentElement.dataset.theme;
    el.innerHTML = '<h4>Display</h4><div class="field"><span class="label">Theme</span><div class="seg"><button data-th="light" aria-pressed="' + (th === 'light') + '">' + 'Light</button><button data-th="dark" aria-pressed="' + (th === 'dark') + '">Dark</button></div></div>' +
      '<div class="field"><span class="label">Text size</span><div class="seg"><button data-tx="normal" aria-pressed="' + (S.settings.text !== 'large') + '">Normal</button><button data-tx="large" aria-pressed="' + (S.settings.text === 'large') + '">Large</button></div></div>' +
      '<label class="field"><span>Language</span><select id="set-lang">' + Object.entries(U.LANGS).map(([k, l]) => '<option value="' + k + '"' + ((S.settings.lang || 'en') === k ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Currency</span><select id="set-cur">' + Object.keys(C.currencies || {}).map((c) => '<option ' + (cur() === c ? 'selected' : '') + ' value="' + c + '">' + c + ' — ' + esc(C.currencies[c].label || '') + '</option>').join('') + '</select></label>';
    $('.site-header .container').appendChild(el); $('#settings-btn').setAttribute('aria-expanded', 'true');
    $$('[data-th]', el).forEach((b) => b.onclick = () => { S.settings.theme = b.dataset.th; save(); applySettings(); el.remove(); settingsPop(); });
    $$('[data-tx]', el).forEach((b) => b.onclick = () => { S.settings.text = b.dataset.tx; save(); applySettings(); el.remove(); settingsPop(); });
    $('#set-cur', el).onchange = (e) => { S.settings.currency = e.target.value; save(); render(); };
    $('#set-lang', el).onchange = (e) => { S.settings.lang = e.target.value; save(); render(); U.translateDom(); if (e.target.value === 'lg') U.toast('Luganda is in beta — help us improve it with the feedback button', 'info'); };
    setTimeout(() => document.addEventListener('click', function off(e) { if (!el.contains(e.target) && e.target.closest('#settings-btn') == null) { el.remove(); $('#settings-btn').setAttribute('aria-expanded', 'false'); document.removeEventListener('click', off); } }), 0);
  }
  function chrome() {
    const s = C.site || {};
    const an = $('#announce');
    const key = 'a:' + (s.announcementText || '');
    if (s.announcementEnabled && s.announcementText && !S.dismissed[key]) {
      an.innerHTML = '<div class="announce">' + esc(s.announcementText) + (U.safeUrl(s.announcementLink) ? ' <a href="' + esc(U.safeUrl(s.announcementLink)) + '">Take part →</a>' : '') + '<button aria-label="Dismiss">' + icon('x') + '</button></div>';
      an.querySelector('button').onclick = () => { S.dismissed[key] = true; save(); an.innerHTML = ''; };
    } else an.innerHTML = '';
    $('#preview-bar').innerHTML = U.Content.previewing ? '<div class="preview-bar">' + icon('eye', 'sr-only') + 'Admin preview — you’re seeing unpublished changes. <button class="btn sm dark" id="exit-prev">Exit preview</button> <a class="btn sm ghost" href="/admin.html" style="background:#fff">Back to admin</a></div>' : '';
    const ep = $('#exit-prev'); if (ep) ep.onclick = () => { U.Content.setPreview(false); location.reload(); };
    ['brand-name', 'foot-name', 'foot-name-2'].forEach((id) => { const el = $('#' + id); if (el) el.textContent = s.name || 'UniPath Africa'; });
    $('#foot-tagline').textContent = s.tagline || ''; $('#foot-notice').textContent = s.dataNotice || ''; $('#foot-founder').textContent = s.founder || '';
    $('#year').textContent = new Date().getFullYear();
    $$('.site-footer a[href="/plans"]').forEach((x) => x.textContent = s.showPricing ? 'Plans & pricing' : 'Free for everyone');
    const fl = $('#foot-lang'); if (fl) { fl.innerHTML = Object.entries(U.LANGS).map(([k, l]) => '<option value="' + k + '"' + ((S.settings.lang || 'en') === k ? ' selected' : '') + '>' + l + '</option>').join(''); fl.onchange = () => { S.settings.lang = fl.value; save(); render(); U.translateDom(); if (fl.value === 'lg') U.toast('Luganda is in beta — help us improve it with the feedback button', 'info'); }; }
  }

  function render() {
    const parts = (location.pathname.replace(/^\/+/, '').replace(/\/index\.html$/, '').replace(/^index\.html$/, '') || '').split('/').filter(Boolean).map((x) => { try { return decodeURIComponent(x); } catch (e) { return x; } });
    const route = parts[0] || 'home';
    const view = views[route] || (window.APP_VIEWS && window.APP_VIEWS[route]);
    const app = $('#app');
    U.pageTitle = view ? '' : 'Page not found';
    app.innerHTML = view ? view.apply(null, parts.slice(1)) : '<div class="container page">' + emptyState('compass', 'Page not found', 'That page doesn’t exist.', '<a class="btn" href="/">Go home</a>') + '</div>';
    $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === route));
    const TITLES = { discover: 'Discover', match: 'Your matches', browse: 'All programmes', program: 'Programme', prepare: 'Prepare', track: 'Track applications', enroll: 'Enrol', help: 'Help & FAQ', about: 'About', passport: 'My Passport', account: 'Account', privacy: 'Privacy', research: 'Help us test', countries: 'Where to study', visa: 'Visa help', plans: 'Plans', book: 'Book a consultation', search: 'Search', summary: 'My plan', thrive: 'Thrive at university', money: 'Money Skills' };
    if (route !== 'country') document.title = (U.pageTitle || (route === 'home' ? '' : (TITLES[route] || route.charAt(0).toUpperCase() + route.slice(1)))) .replace(/(.)$/, '$1 · ') + ((C.site && C.site.name) || 'UniPath Africa');
    if (route === 'research') { const st = $('#start-test'); if (st) st.onclick = startTester; const rt = $('#resume-test'); if (rt) rt.onclick = renderTester; }
  }
  let lastRoute = '';
  function onRoute() {
    const r = location.pathname;
    render();
    U.translateDom(); U.track('view', '', location.pathname);
    if (r !== lastRoute && !location.hash) { window.scrollTo(0, 0); $('#app').focus({ preventScroll: true }); }
    lastRoute = r;
  }

  // Expose for prepare.js
  window.APP = { get S() { return S; }, save, uploadDoc, fetchDoc, deleteDoc, accountNudge, get C() { return C; }, render, views, readiness, checklistFor, itemDone, appInfo, planFor, nextAction, progById, money, cur, ring, journeySteps, pageHead, emptyState, isInternational, dataBadge, QUALS, stageLabel, logResearch };

  async function boot() {
    applySettings();
    C = await U.Content.load();
    chrome();
    if (U.API.online && U.API.token()) {
      try { const res = await U.API.call('GET', 'me'); U.API.setUser(res.user); if (res.state && (!S.updatedAt || (res.updatedAt && res.updatedAt > S.updatedAt))) { S = Object.assign(DEFAULT_STATE(), res.state); U.store(STATE_KEY, S); } else if (S.profile || S.applications.length) pushState(); }
      catch (e) { if (e.status === 401) { U.API.setToken(''); U.API.setUser(null); } }
    }
    updateUserChip();
    $('#settings-btn').onclick = settingsPop;
    $('#feedback-fab').onclick = openFeedback;
    if (location.hash.startsWith('#/')) history.replaceState(null, '', location.hash.slice(1));
    window.addEventListener('popstate', onRoute);
    window.addEventListener('up:route', onRoute);
    onRoute();
    renderTester();
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  document.addEventListener('DOMContentLoaded', boot);
})();
