/* UniPath Africa — Prepare toolkit */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;

  const TABS = [
    ['checklist', 'list', 'Checklists'], ['vault', 'lock', 'Document vault'], ['statement', 'pen', 'Statement Studio'],
    ['references', 'mail', 'Reference kit'], ['costs', 'wallet', 'Cost planner'], ['scholarships', 'award', 'Scholarships'],
    ['interview', 'mic', 'Interview practice'], ['glossary', 'book', 'Glossary']
  ];
  const DOCS = [
    { key: 'transcripts', label: 'Academic transcripts', ic: 'file' }, { key: 'certificates', label: 'Certificates / results slips', ic: 'award' },
    { key: 'id', label: 'National ID', ic: 'user' }, { key: 'passport', label: 'Passport', ic: 'globe', expiry: true },
    { key: 'photo', label: 'Passport photo', ic: 'user' }, { key: 'birth', label: 'Birth certificate', ic: 'file' },
    { key: 'statement', label: 'Personal statement', ic: 'pen' }, { key: 'references', label: 'Recommendation letters', ic: 'mail' },
    { key: 'english', label: 'English test results / waiver', ic: 'message' }, { key: 'finance', label: 'Proof of funds', ic: 'wallet' },
    { key: 'cv', label: 'CV', ic: 'list' }, { key: 'degree', label: 'Degree certificate & transcript', ic: 'cap' }
  ];

  function shell(tab, inner) {
    const a = A();
    return '<div class="container page">' + a.journeySteps('prepare') +
      a.pageHead('Prepare', 'Your toolkit for strong, complete, on-time applications.') + a.accountNudge() +
      '<nav class="subnav" aria-label="Prepare tools">' + TABS.map((t) => '<a href="#/prepare/' + t[0] + '" class="' + (t[0] === tab ? 'active' : '') + '">' + icon(t[1]) + t[2] + '</a>').join('') + '</nav>' + inner + '</div>';
  }

  /* ---------------- Checklists ---------------- */
  function checklistView(appId) {
    const a = A(), S = a.S;
    const apps = S.applications.filter((x) => x.stage !== 'closed');
    if (!apps.length) return shell('checklist', a.emptyState('list', 'Start an application to get your checklist', 'Every application gets a personalised checklist built from its entry requirements, whether it’s local or international, and your level of study.', '<div class="row" style="justify-content:center"><a class="btn" href="#/match">' + icon('target') + 'Find programmes</a><button class="btn ghost" id="pc-add">Add manually</button></div>'));
    const app = apps.find((x) => x.id === appId) || apps[0];
    const info = a.appInfo(app), r = a.readiness(app), plan = a.planFor(app);
    const vaultDone = r.list.filter((i) => a.itemDone(app, i) === 'vault').length;
    const html = shell('checklist',
      '<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin-bottom:22px">' + apps.map((x) => {
        const i = a.appInfo(x), rr = a.readiness(x);
        return '<a href="#/prepare/checklist/' + x.id + '" class="card hover row" style="text-decoration:none;color:inherit;flex-wrap:nowrap;padding:14px;' + (x.id === app.id ? 'border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 18%,transparent)' : '') + '">' + a.ring(rr.pct, 'ring-sm', '', 'var(--brand)') + '<div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + esc(i.program) + '</b><small class="muted">' + esc(i.university) + '</small></div></a>';
      }).join('') + '<button class="card hover" id="pc-add" style="border-style:dashed;cursor:pointer;font:inherit;color:var(--muted);display:flex;align-items:center;justify-content:center;gap:8px">' + icon('plus') + 'Add application</button></div>' +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="ck-grid"><div class="card">' +
      '<div class="row between"><div><span class="eyebrow">' + (a.isInternational(info.country) ? 'International application' : 'Local application') + (info.level === 'Postgraduate' ? ' · Postgraduate' : '') + '</span><h3 class="mb0">' + esc(info.program) + '</h3><p class="muted small mb0">' + esc(info.university) + (info.country ? ' · ' + esc(info.country) : '') + '</p></div>' + a.ring(r.pct, '', 'ready', 'var(--brand)') + '</div>' +
      (vaultDone ? '<div class="notice ok mt2">' + icon('sparkle') + '<p><b>' + vaultDone + ' item' + (vaultDone > 1 ? 's' : '') + '</b> ticked automatically from your Document Vault — prepare once, reuse everywhere.</p></div>' : '') +
      '<ul class="checklist mt2">' + r.list.map((it) => {
        const d = a.itemDone(app, it);
        return '<li class="' + (d ? 'done' : '') + '"><button class="tick" data-tick="' + esc(it.id) + '" ' + (d === 'vault' ? 'disabled title="Ready in your vault"' : '') + ' aria-pressed="' + !!d + '" aria-label="Mark done">' + icon('check') + '</button><div style="flex:1"><div class="lbl">' + esc(it.label) + '</div><div class="tip">' + esc(it.tip || '') + '</div>' +
          '<div class="row mt1" style="gap:6px">' + (d === 'vault' ? '<span class="badge ok src">' + icon('lock') + 'From your vault</span>' : '') + (it.docKey && d !== 'vault' ? '<a class="badge sky src" href="#/prepare/vault" style="text-decoration:none">' + icon('upload') + 'Add to vault</a>' : '') + (it.docKey === 'statement' ? '<a class="badge src" href="#/prepare/statement" style="text-decoration:none">' + icon('pen') + 'Open Studio</a>' : '') + (it.docKey === 'references' ? '<a class="badge src" href="#/prepare/references" style="text-decoration:none">' + icon('mail') + 'Reference kit</a>' : '') + (it.custom ? '<button class="badge bad src" data-rmtask="' + esc(it.id) + '" style="border:0;cursor:pointer">' + icon('trash') + 'Remove</button>' : '') + '</div></div></li>';
      }).join('') + '</ul>' +
      '<form class="row mt2" id="addtask" style="flex-wrap:nowrap"><input name="t" placeholder="Add your own task, e.g. “Ask school for English-medium letter”" aria-label="New task"><button class="btn ghost">' + icon('plus') + 'Add</button></form>' +
      '<div class="row mt3 no-print"><button class="btn ghost sm" onclick="window.print()">' + icon('printer') + 'Print checklist</button>' + (U.safeUrl(info.url) ? '<a class="btn ghost sm" href="' + esc(U.safeUrl(info.url)) + '" target="_blank" rel="noopener">' + icon('external') + 'Official portal</a>' : '') + '<a class="btn ghost sm" href="#/track">' + icon('board') + 'Tracker</a></div></div>' +
      '<aside class="stack"><div class="card"><h3>Your preparation plan</h3><p class="small muted">Worked backwards from the deadline so nothing is left to the last week.</p>' +
      (plan.length ? '<ol class="timeline mt2">' + plan.map((m) => { const d = U.daysUntil(m.date); return '<li class="' + (d < 0 ? 'past' : d <= 14 ? 'soon' : '') + '"><div class="when">' + U.fmtDate(m.date) + (d < 0 ? ' · passed' : d === 0 ? ' · today' : ' · in ' + d + 'd') + '</div><b' + (m.deadline ? ' style="color:var(--bad)"' : '') + '>' + esc(m.title) + '</b></li>'; }).join('') + '</ol><button class="btn sm ghost" id="plan-ics">' + icon('calendar') + 'Add plan to calendar</button>' : '<p class="muted small">Add a deadline in Track to generate a plan.</p>') + '</div>' +
      '<div class="card sun"><h4>' + icon('sparkle', 'sr-only') + 'Next step</h4><p class="mb0"><b>' + esc(a.nextAction(app)) + '</b></p></div></aside></div>');
    setTimeout(() => {
      const g = $('#ck-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $$('#pc-add').forEach((b) => b.onclick = () => window.APP_ACTIONS.addCustomApplication());
      $$('[data-tick]').forEach((b) => b.onclick = () => { app.checks = app.checks || {}; app.checks[b.dataset.tick] = !app.checks[b.dataset.tick]; if (a.readiness(app).pct === 100 && app.stage === 'preparing') { app.stage = 'ready'; U.toast('All done — moved to “Ready to submit”', 'sparkle'); } a.save(); a.render(); });
      $$('[data-rmtask]').forEach((b) => b.onclick = () => { app.customTasks = (app.customTasks || []).filter((t) => t.id !== b.dataset.rmtask); a.save(); a.render(); });
      $('#addtask').onsubmit = (e) => { e.preventDefault(); const v = e.target.t.value.trim(); if (!v) return; app.customTasks = app.customTasks || []; app.customTasks.push({ id: U.uid('task'), label: v }); a.save(); a.render(); };
      const pi = $('#plan-ics'); if (pi) pi.onclick = () => U.download('plan-' + app.id + '.ics', U.ics(plan.map((m) => ({ date: m.date, title: m.title + ' — ' + info.university, desc: info.program }))), 'text/calendar');
    });
    return html;
  }

  /* ---------------- Document vault ---------------- */
  function vaultView() {
    const a = A(), S = a.S;
    const needed = new Set(); S.applications.forEach((x) => a.checklistFor(x).forEach((i) => i.docKey && needed.add(i.docKey)));
    const ready = DOCS.filter((d) => (S.docs[d.key] || {}).status === 'ready').length;
    const html = shell('vault',
      '<div class="grid g2 mb2" style="align-items:center"><div><h2 class="mb0">Your Admissions Passport</h2><p class="muted mb0">Prepare each document once and reuse it across every application. ' + (U.API.signedIn() ? 'Files are saved <b>securely in your account</b> so you — and your UniPath adviser — can access them anywhere.' : 'You’re not signed in, so files are stored <b>only on this device</b>. <a href="#/account/signup">Create an account</a> to keep them safe.') + '</p></div>' +
      '<div class="card row" style="flex-wrap:nowrap">' + a.ring(Math.round(ready / DOCS.length * 100), '', 'ready', 'var(--brand)') + '<div><b>' + ready + ' of ' + DOCS.length + ' documents ready</b><p class="small muted mb0">' + (needed.size ? needed.size + ' are needed by your current applications (marked “Needed”).' : 'Start an application to see which you need.') + '</p></div></div></div>' +
      '<div class="doc-grid">' + DOCS.map((d) => {
        const s = S.docs[d.key] || { status: 'missing' };
        const exp = d.expiry && s.expiry ? U.daysUntil(s.expiry) : null;
        return '<div class="doc ' + (s.status === 'ready' ? 'ready' : s.status === 'progress' ? 'progress-s' : '') + '"><div class="top"><div class="ic">' + icon(d.ic) + '</div><div style="flex:1;min-width:0"><b>' + esc(d.label) + '</b><div class="row" style="gap:5px;margin-top:3px">' +
          (s.status === 'ready' ? '<span class="badge ok">Ready</span>' : s.status === 'progress' ? '<span class="badge warn">In progress</span>' : '<span class="badge">Missing</span>') + (needed.has(d.key) ? '<span class="badge sky">Needed</span>' : '') + '</div></div></div>' +
          (s.fileName ? '<div class="file">' + icon('file', 'sr-only') + esc(s.fileName) + ' · ' + Math.max(1, Math.round((s.size || 0) / 1024)) + ' KB' + (s.cloud ? ' · <span style="color:var(--ok);font-weight:700">saved to account</span>' : '') + '</div>' : '') +
          (d.expiry ? '<label class="field"><span class="small">Expiry date</span><input type="date" data-exp="' + d.key + '" value="' + esc(s.expiry || '') + '"></label>' + (exp != null && exp < 180 ? '<span class="badge bad">' + (exp < 0 ? 'Expired' : 'Expires in ' + exp + ' days — renew early') + '</span>' : '') : '') +
          '<select data-st="' + d.key + '" aria-label="Status"><option value="missing" ' + (s.status === 'missing' ? 'selected' : '') + '>Missing</option><option value="progress" ' + (s.status === 'progress' ? 'selected' : '') + '>In progress</option><option value="ready" ' + (s.status === 'ready' ? 'selected' : '') + '>Ready</option></select>' +
          '<div class="row" style="gap:6px"><label class="btn sm ghost" style="cursor:pointer">' + icon('upload') + (s.fileName ? 'Replace' : 'Add file') + '<input type="file" data-up="' + d.key + '" hidden accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.heic"></label>' + (s.fileName ? '<button class="btn sm ghost" data-view="' + d.key + '">' + icon('eye') + 'View</button><button class="icon-btn" data-rm="' + d.key + '" aria-label="Remove file" style="width:34px;height:34px">' + icon('trash') + '</button>' : '') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="grid g3 mt3"><div class="card flat"><h4>' + icon('sparkle', 'sr-only') + 'Scan tips</h4><p class="small muted mb0">Use your phone’s document scanner (Google Drive, Notes or Adobe Scan). Save as PDF, all corners visible, no shadows.</p></div><div class="card flat"><h4>Name files clearly</h4><p class="small muted mb0">e.g. <span class="kbd">Ampiire_Peace_UACE_Certificate.pdf</span> — admissions teams handle thousands of files.</p></div><div class="card flat"><h4>Keep originals safe</h4><p class="small muted mb0">You’ll need original certificates at registration. Never post originals unless the university asks officially.</p></div></div>');
    setTimeout(() => {
      $$('[data-st]').forEach((s) => s.onchange = () => { S.docs[s.dataset.st] = Object.assign(S.docs[s.dataset.st] || {}, { status: s.value, updatedAt: new Date().toISOString() }); a.save(); a.render(); });
      $$('[data-exp]').forEach((s) => s.onchange = () => { S.docs[s.dataset.exp] = Object.assign(S.docs[s.dataset.exp] || { status: 'missing' }, { expiry: s.value }); a.save(); a.render(); });
      $$('[data-up]').forEach((inp) => inp.onchange = async () => {
        const f = inp.files[0]; if (!f) return;
        const signed = U.API.signedIn();
        if (f.size > (signed ? 4 : 15) * 1024 * 1024) return U.toast('That file is over ' + (signed ? 4 : 15) + ' MB — please save a compressed PDF or smaller photo', 'alert');
        try { await U.Vault.put(inp.dataset.up, f); } catch (e) {}
        const cur = S.docs[inp.dataset.up] || {};
        S.docs[inp.dataset.up] = Object.assign(cur, { fileName: f.name, size: f.size, type: f.type, status: 'ready', cloud: false, updatedAt: new Date().toISOString() });
        a.save();
        if (signed) { U.toast('Uploading…', 'upload'); try { await a.uploadDoc(inp.dataset.up, f); U.toast('Uploaded securely to your account', 'lock'); } catch (e) { U.toast('Saved on this device — upload failed: ' + e.message, 'alert'); } }
        else U.toast('Saved on this device — marked ready', 'lock');
        a.render();
      });
      $$('[data-view]').forEach((b) => b.onclick = async () => { let f = null; try { f = await a.fetchDoc(b.dataset.view); } catch (e) {} if (!f) return U.toast('File not found', 'alert'); const url = URL.createObjectURL(f); window.open(url, '_blank'); setTimeout(() => URL.revokeObjectURL(url), 60000); });
      $$('[data-rm]').forEach((b) => b.onclick = async () => { if (!(await U.confirmBox('Remove file?', 'The file will be deleted' + (U.API.signedIn() ? ' from your account and this device.' : ' from this device.'), 'Remove'))) return; await a.deleteDoc(b.dataset.rm); const d = S.docs[b.dataset.rm]; delete d.fileName; delete d.size; delete d.cloud; d.status = 'missing'; a.save(); a.render(); });
    });
    return html;
  }

  /* ---------------- Statement Studio ---------------- */
  const FORMATS = {
    common: { label: 'Common App essay', limit: 650, unit: 'words' },
    ucas: { label: 'UCAS personal statement', limit: 4000, unit: 'chars' },
    general: { label: 'Motivation letter', limit: 500, unit: 'words' },
    sop: { label: 'Statement of purpose (postgrad)', limit: 1000, unit: 'words' },
    scholarship: { label: 'Scholarship essay', limit: 500, unit: 'words' }
  };
  const PROMPTS = [
    ['Hook', 'Open with a specific moment, question or observation that sparked your interest — not a quote or a dictionary definition.'],
    ['Why this subject', 'What exactly fascinates you about this field? Name a concept, problem or idea.'],
    ['Evidence', 'What have you done about it? Subjects, projects, reading, work, volunteering, a business you ran — and what you learned.'],
    ['Skills & character', 'Show (don’t tell) qualities like resilience or leadership through a short example.'],
    ['Community & impact', 'How do your background and community shape what you want to do? Who will benefit?'],
    ['Future & fit', 'What do you want to do after graduating, and why is this programme the right next step?']
  ];
  const CLICHES = ['passionate about', 'since i was a child', 'ever since i was', 'from a young age', 'dream come true', 'make a difference', 'in today\'s world', 'in today’s society', 'webster', 'dictionary defines', 'hard-working', 'think outside the box', 'i have always wanted', 'at the end of the day', 'thirst for knowledge', 'give back to the community', 'second to none', 'it is a well known fact'];
  function analyse(text, fmt) {
    const words = (text.match(/\b[\w’'-]+\b/g) || []);
    const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 2);
    const paras = text.split(/\n\s*\n/).filter((p) => p.trim()).length;
    const lower = text.toLowerCase();
    const cl = CLICHES.filter((c) => lower.includes(c));
    const iStarts = sentences.filter((s) => /^\s*I\b/.test(s)).length;
    const avg = sentences.length ? Math.round(words.length / sentences.length) : 0;
    const freq = {}; words.map((w) => w.toLowerCase()).filter((w) => w.length > 4 && !['which', 'their', 'about', 'there', 'would', 'these', 'where'].includes(w)).forEach((w) => freq[w] = (freq[w] || 0) + 1);
    const repeats = Object.entries(freq).filter(([, n]) => n >= 4).sort((x, y) => y[1] - x[1]).slice(0, 4);
    const f = FORMATS[fmt] || FORMATS.general; const used = f.unit === 'chars' ? text.length : words.length;
    const flags = [];
    if (used > f.limit) flags.push(['no', 'Over the limit by ' + (used - f.limit) + ' ' + f.unit + '.']);
    else if (used < f.limit * 0.6 && used > 0) flags.push(['maybe', 'You have room to add ' + (f.limit - used) + ' more ' + f.unit + ' of specific detail.']);
    else if (used > 0) flags.push(['yes', 'Length is in a good range.']);
    if (cl.length) flags.push(['maybe', 'Overused phrases: “' + cl.join('”, “') + '”. Replace with something only you could write.']);
    if (sentences.length && iStarts / sentences.length > 0.35) flags.push(['maybe', iStarts + ' of ' + sentences.length + ' sentences start with “I”. Vary your openings.']);
    if (avg > 28) flags.push(['maybe', 'Average sentence is ' + avg + ' words — try splitting long sentences.']);
    if (paras < 3 && words.length > 200) flags.push(['maybe', 'Only ' + paras + ' paragraph' + (paras === 1 ? '' : 's') + ' — break it up for readability (blank line between paragraphs).']);
    if (repeats.length) flags.push(['maybe', 'Repeated words: ' + repeats.map(([w, n]) => w + ' (' + n + '×)').join(', ') + '.']);
    if (words.length > 120 && !cl.length && avg <= 28 && !(iStarts / Math.max(1, sentences.length) > 0.35)) flags.push(['yes', 'No clichés detected and sentences read well.']);
    return { words: words.length, chars: text.length, paras, sentences: sentences.length, used, limit: f.limit, unit: f.unit, flags };
  }
  function statementView(id) {
    const a = A(), S = a.S;
    if (!S.statements.length) S.statements.push({ id: U.uid('st'), title: 'My personal statement', format: 'common', text: '', updatedAt: new Date().toISOString() });
    const st = S.statements.find((x) => x.id === id) || S.statements[0];
    const an = analyse(st.text, st.format);
    const pct = Math.min(100, Math.round(an.used / an.limit * 100));
    const html = shell('statement',
      '<div class="row between mb2"><div class="row"><select id="st-pick" style="width:auto">' + S.statements.map((x) => '<option value="' + x.id + '" ' + (x.id === st.id ? 'selected' : '') + '>' + esc(x.title) + '</option>').join('') + '</select><button class="btn sm ghost" id="st-new">' + icon('plus') + 'New</button></div>' +
      '<div class="row"><select id="st-fmt" style="width:auto" aria-label="Format">' + Object.entries(FORMATS).map(([k, f]) => '<option value="' + k + '" ' + (st.format === k ? 'selected' : '') + '>' + f.label + ' (' + f.limit.toLocaleString() + ' ' + f.unit + ')</option>').join('') + '</select></div></div>' +
      '<div class="editor-wrap"><div class="card"><input id="st-title" value="' + esc(st.title) + '" aria-label="Title" style="border:0;padding:0 0 10px;font-family:var(--font-display);font-size:1.4rem;font-weight:600;box-shadow:none;background:transparent">' +
      '<textarea id="st-text" class="editor" placeholder="Start writing — or click a prompt on the right to add a guided outline. Leave a blank line between paragraphs. Saves automatically.">' + esc(st.text) + '</textarea>' +
      '<div class="row between mt2 no-print"><span class="small muted" id="st-saved">Saved on this device</span><div class="row" style="gap:6px"><button class="btn sm ghost" id="st-copy">' + icon('copy') + 'Copy</button><button class="btn sm ghost" id="st-dl">' + icon('download') + 'Download</button><button class="btn sm ghost" id="st-ai">' + icon('sparkle') + 'AI review prompt</button><button class="btn sm" id="st-ready">' + icon('check') + 'Mark ready</button><button class="icon-btn" id="st-del" aria-label="Delete statement">' + icon('trash') + '</button></div></div></div>' +
      '<aside class="stack"><div class="card"><div class="meter"><span>' + (an.unit === 'chars' ? 'Characters' : 'Words') + '</span><span id="st-count">' + an.used.toLocaleString() + ' / ' + an.limit.toLocaleString() + '</span></div><div class="progress ' + (an.used > an.limit ? 'sun' : '') + '"><span id="st-bar" style="width:' + pct + '%;' + (an.used > an.limit ? 'background:var(--bad)' : '') + '"></span></div>' +
      '<div class="row small muted mt1" style="gap:14px" id="st-stats"><span>' + an.words + ' words</span><span>' + an.paras + ' paragraphs</span><span>' + an.sentences + ' sentences</span></div>' +
      '<h4 class="mt2">Feedback</h4><ul class="flag-list" id="st-flags">' + flagsHTML(an.flags) + '</ul></div>' +
      '<div class="card"><h4>Guided prompts</h4><p class="small muted">Click to insert a section heading and question into your draft.</p><div class="stack" style="--g:8px">' + PROMPTS.map((p, i) => '<button class="option" data-prompt="' + i + '" style="width:100%">' + icon('plus') + '<span><b>' + p[0] + '</b><small>' + p[1] + '</small></span></button>').join('') + '</div></div></aside></div>');
    setTimeout(() => {
      const ta = $('#st-text'); let t;
      const live = () => {
        st.text = ta.value; st.updatedAt = new Date().toISOString();
        const x = analyse(st.text, st.format), p = Math.min(100, Math.round(x.used / x.limit * 100));
        $('#st-count').textContent = x.used.toLocaleString() + ' / ' + x.limit.toLocaleString();
        $('#st-bar').style.width = p + '%'; $('#st-bar').style.background = x.used > x.limit ? 'var(--bad)' : '';
        $('#st-stats').innerHTML = '<span>' + x.words + ' words</span><span>' + x.paras + ' paragraphs</span><span>' + x.sentences + ' sentences</span>';
        $('#st-flags').innerHTML = flagsHTML(x.flags);
        $('#st-saved').textContent = 'Saving…'; clearTimeout(t); t = setTimeout(() => { if (st.text.trim() && (!S.docs.statement || S.docs.statement.status === 'missing')) S.docs.statement = Object.assign(S.docs.statement || {}, { status: 'progress' }); a.save(); $('#st-saved').textContent = 'Saved on this device · ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }, 500);
      };
      ta.addEventListener('input', live);
      $('#st-title').onchange = (e) => { st.title = e.target.value || 'Untitled'; a.save(); a.render(); };
      $('#st-pick').onchange = (e) => { location.hash = '#/prepare/statement/' + e.target.value; };
      $('#st-fmt').onchange = (e) => { st.format = e.target.value; a.save(); a.render(); };
      $('#st-new').onclick = () => { const n = { id: U.uid('st'), title: 'Statement ' + (S.statements.length + 1), format: 'general', text: '', updatedAt: new Date().toISOString() }; S.statements.push(n); a.save(); location.hash = '#/prepare/statement/' + n.id; };
      $$('[data-prompt]').forEach((b) => b.onclick = () => { const p = PROMPTS[+b.dataset.prompt]; const ins = (ta.value && !ta.value.endsWith('\n\n') ? (ta.value.endsWith('\n') ? '\n' : '\n\n') : '') + '[' + p[0] + ' — ' + p[1] + ']\n'; ta.value += ins; ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); live(); });
      $('#st-copy').onclick = async () => { try { await navigator.clipboard.writeText(ta.value); U.toast('Copied to clipboard', 'copy'); } catch (e) { ta.select(); document.execCommand('copy'); U.toast('Copied', 'copy'); } };
      $('#st-dl').onclick = () => U.download((st.title || 'statement').replace(/[^\w-]+/g, '_') + '.txt', ta.value);
      $('#st-ai').onclick = async () => {
        const f = FORMATS[st.format];
        const prompt = 'You are an experienced university admissions reader. Review my ' + f.label + ' (limit ' + f.limit + ' ' + f.unit + '). Do NOT rewrite it for me. Instead: 1) summarise in two sentences what you learn about me; 2) list the three strongest moments; 3) list the three weakest parts with a specific question that would help me improve each; 4) point out any clichés, vague claims or grammar issues. Keep my voice.\n\n---\n' + ta.value;
        try { await navigator.clipboard.writeText(prompt); U.toast('Review prompt copied — paste it into your AI assistant', 'sparkle'); } catch (e) { U.modal({ title: 'AI review prompt', body: '<textarea style="min-height:240px">' + esc(prompt) + '</textarea>' }); }
      };
      $('#st-ready').onclick = () => { S.docs.statement = Object.assign(S.docs.statement || {}, { status: 'ready', updatedAt: new Date().toISOString() }); a.save(); U.toast('Statement marked ready in your vault', 'check'); };
      $('#st-del').onclick = async () => { if (!(await U.confirmBox('Delete statement?', 'This permanently deletes “' + st.title + '”.'))) return; S.statements = S.statements.filter((x) => x.id !== st.id); a.save(); location.hash = '#/prepare/statement'; a.render(); };
    });
    return html;
  }
  function flagsHTML(flags) { return flags.length ? flags.map((f) => '<li style="color:' + (f[0] === 'yes' ? 'var(--ok)' : f[0] === 'no' ? 'var(--bad)' : 'var(--ink-2)') + '">' + icon(f[0] === 'yes' ? 'check' : f[0] === 'no' ? 'x' : 'alert') + '<span>' + esc(f[1]) + '</span></li>').join('') : '<li class="muted">' + icon('info') + '<span>Start writing to get feedback.</span></li>'; }

  /* ---------------- Reference kit ---------------- */
  const REF_ST = [['toask', 'To ask'], ['asked', 'Asked'], ['confirmed', 'Agreed'], ['submitted', 'Submitted']];
  function referencesView() {
    const a = A(), S = a.S;
    const apps = S.applications;
    const html = shell('references',
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px" id="rf-grid"><div class="card"><h3>Ask for a recommendation</h3><p class="small muted">Fill this in and we’ll write a polite, complete request email you can send in one tap.</p>' +
      '<form id="rf" class="form-grid mt2"><label class="field"><span>Referee’s name</span><input name="name" required placeholder="e.g. Mr. Okello"></label><label class="field"><span>Their email</span><input type="email" name="email" placeholder="teacher@school.ac.ug"></label>' +
      '<label class="field"><span>Relationship</span><select name="role"><option>Class teacher</option><option>Subject teacher</option><option>Head teacher / Principal</option><option>Career counsellor</option><option>Lecturer / Supervisor</option><option>Employer / Manager</option><option>Community leader</option></select></label>' +
      '<label class="field"><span>Letter needed by</span><input type="date" name="due" required></label>' +
      '<label class="field full"><span>For which application(s)?</span><input name="for" value="' + esc(apps.map((x) => a.appInfo(x).university).slice(0, 3).join(', ')) + '" placeholder="University and programme"></label>' +
      '<label class="field full"><span>What should they mention? <small class="muted">(your achievements, one per line)</small></span><textarea name="points" placeholder="Top 5 in UACE mocks&#10;Led the debate club to regional finals&#10;Started a small poultry business"></textarea></label>' +
      '<label class="field full"><span>Your name</span><input name="me" value="' + esc((S.profile && S.profile.name) || '') + '" required></label>' +
      '<div class="full row"><button class="btn">' + icon('sparkle') + 'Create request</button></div></form></div>' +
      '<div class="stack"><div class="card"><h3>Your referees</h3>' + (S.references.length ? '<div class="stack mt2">' + S.references.map((r) => '<div class="card flat" style="padding:14px"><div class="row between"><div><b>' + esc(r.name) + '</b><div class="small muted">' + esc(r.role) + ' · due ' + U.fmtDate(r.due) + ' · ' + U.countdownLabel(r.due).text + '</div></div><select data-rs="' + r.id + '" style="width:auto;padding:6px 30px 6px 10px;font-size:.82rem">' + REF_ST.map(([k, l]) => '<option value="' + k + '" ' + (r.status === k ? 'selected' : '') + '>' + l + '</option>').join('') + '</select></div><div class="row mt1" style="gap:6px"><button class="btn sm ghost" data-rview="' + r.id + '">' + icon('mail') + 'Email</button><button class="btn sm ghost" data-rthank="' + r.id + '">' + icon('heart') + 'Thank-you note</button><button class="icon-btn" data-rdel="' + r.id + '" style="width:34px;height:34px" aria-label="Delete">' + icon('trash') + '</button></div></div>').join('') + '</div>' : '<p class="muted small">No referees yet. Most programmes need one or two letters — ask at least 4–6 weeks before the deadline.</p>') + '</div>' +
      '<div class="card tint"><h4>Make it easy to say yes</h4><ul class="reasons small"><li class="yes">' + icon('check') + '<span>Ask in person first, then send the email with details.</span></li><li class="yes">' + icon('check') + '<span>Give a deadline one week earlier than the real one.</span></li><li class="yes">' + icon('check') + '<span>Attach your CV or achievement list.</span></li><li class="yes">' + icon('check') + '<span>Send a reminder a week before, and a thank-you after.</span></li></ul></div></div></div>');
    setTimeout(() => {
      const g = $('#rf-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      const f = $('#rf'); if (!f.due.value) f.due.value = U.addDays(new Date().toISOString().slice(0, 10), 28);
      f.onsubmit = (e) => { e.preventDefault(); const d = Object.fromEntries(new FormData(f)); const r = Object.assign({ id: U.uid('ref'), status: 'toask', createdAt: new Date().toISOString() }, d); S.references.push(r); syncRefDoc(); a.save(); a.render(); showEmail(r, 'ask'); };
      $$('[data-rs]').forEach((s) => s.onchange = () => { const r = S.references.find((x) => x.id === s.dataset.rs); r.status = s.value; syncRefDoc(); a.save(); a.render(); if (s.value === 'submitted') U.toast('Don’t forget a thank-you note!', 'heart'); });
      $$('[data-rview]').forEach((b) => b.onclick = () => showEmail(S.references.find((x) => x.id === b.dataset.rview), 'ask'));
      $$('[data-rthank]').forEach((b) => b.onclick = () => showEmail(S.references.find((x) => x.id === b.dataset.rthank), 'thanks'));
      $$('[data-rdel]').forEach((b) => b.onclick = () => { S.references = S.references.filter((x) => x.id !== b.dataset.rdel); syncRefDoc(); a.save(); a.render(); });
    });
    return html;
    function syncRefDoc() { const sub = S.references.filter((r) => r.status === 'submitted').length, any = S.references.length; const cur = S.docs.references || {}; if (cur.fileName && cur.status === 'ready') return; S.docs.references = Object.assign(cur, { status: sub >= 1 ? 'ready' : any ? 'progress' : 'missing' }); }
  }
  function showEmail(r, kind) {
    const pts = (r.points || '').split('\n').map((s) => s.trim()).filter(Boolean);
    const subj = kind === 'ask' ? 'Request for a recommendation letter — ' + r.me : 'Thank you for my recommendation, ' + r.name;
    const body = kind === 'ask'
      ? 'Dear ' + r.name + ',\n\nI hope you are well. I am applying to ' + (r.for || 'university') + ' and would be very grateful if you could write a recommendation letter for me, as my ' + (r.role || 'teacher').toLowerCase() + '.\n\nThe letter is needed by ' + U.fmtDate(r.due, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.' + (pts.length ? '\n\nTo help, here are a few things you may wish to mention:\n' + pts.map((p) => '• ' + p).join('\n') : '') + '\n\nI can share my CV, results and the submission instructions, and I am happy to meet if that is helpful.\n\nThank you very much for your time and support.\n\nKind regards,\n' + r.me
      : 'Dear ' + r.name + ',\n\nThank you so much for writing my recommendation letter. I really appreciate the time and care you took, and I will let you know how my applications go.\n\nWith gratitude,\n' + r.me;
    const m = U.modal({ title: kind === 'ask' ? 'Your request email' : 'Thank-you note', body: '<label class="field"><span>Subject</span><input id="em-s" value="' + esc(subj) + '"></label><label class="field mt2"><span>Message</span><textarea id="em-b" style="min-height:280px">' + esc(body) + '</textarea></label>', footer: '<button class="btn ghost" data-copy>' + icon('copy') + 'Copy</button><a class="btn" data-mail>' + icon('mail') + 'Open in email</a>' });
    const upd = () => { m.el.querySelector('[data-mail]').href = 'mailto:' + encodeURIComponent(r.email || '') + '?subject=' + encodeURIComponent(m.el.querySelector('#em-s').value) + '&body=' + encodeURIComponent(m.el.querySelector('#em-b').value); };
    upd(); m.el.addEventListener('input', upd);
    m.el.querySelector('[data-mail]').addEventListener('click', () => { if (kind === 'ask' && r.status === 'toask') { r.status = 'asked'; A().save(); setTimeout(() => A().render(), 300); } });
    m.el.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(m.el.querySelector('#em-b').value); U.toast('Copied', 'copy'); } catch (e) {} };
  }

  /* ---------------- Cost planner ---------------- */
  function costsView(pid) {
    const a = A(), S = a.S, C = a.C;
    const progs = C.programs || [];
    const preferred = S.applications.map((x) => x.programId).concat(S.shortlist).filter(Boolean);
    let cp = S.costPlan || {};
    if (pid) { const p = a.progById(decodeURIComponent(pid)); if (p) cp = planFromProgram(p); }
    if (!cp.tuition && !cp.programId) { const p = a.progById(preferred[0]) || progs[0]; cp = p ? planFromProgram(p) : { tuition: 0, living: 0, years: 3, appFee: 0, oneOff: 0, insurance: 0, scholarshipPct: 0, saved: 0, start: '2027-08-01' }; }
    function planFromProgram(p) { const intl = a.isInternational(p.country); return { programId: p.id, tuition: +p.tuitionUSD || 0, living: +p.livingUSD || 0, years: +p.durationYears || 3, appFee: +p.appFeeUSD || 0, oneOff: intl ? 1200 : 100, insurance: intl ? 600 : 0, scholarshipPct: 0, saved: (S.costPlan && S.costPlan.saved) || 0, start: guessStart(p.intake) }; }
    function guessStart(intake) { const m = /([A-Za-z]+)\s+(\d{4})/.exec(intake || ''); if (!m) return '2027-08-01'; const d = new Date(m[1] + ' 1, ' + m[2]); return isNaN(d) ? '2027-08-01' : d.toISOString().slice(0, 10); }
    S.costPlan = cp; a.save();
    const c = a.cur(), r = U.rateOf(c);
    const calc = () => {
      const yearGross = cp.tuition + cp.living + cp.insurance;
      const schol = cp.tuition * (cp.scholarshipPct / 100);
      const yearNet = yearGross - schol;
      const total = yearNet * cp.years + cp.appFee + cp.oneOff;
      const firstYear = yearNet + cp.appFee + cp.oneOff;
      const months = Math.max(1, Math.round((U.parseDate(cp.start) - U.today()) / (30.44 * 86400000)));
      const need = Math.max(0, firstYear - cp.saved);
      return { yearGross, schol, yearNet, total, firstYear, months, monthly: need / months, need };
    };
    const k = calc();
    const v = (usd) => Math.round(usd * r);
    const field = (name, label, val, hint) => '<label class="field"><span>' + label + '</span><input type="number" min="0" step="any" data-cp="' + name + '" value="' + v(val) + '">' + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</label>';
    const max = Math.max(cp.tuition, cp.living, cp.insurance, cp.appFee + cp.oneOff, 1);
    const cmp = preferred.length ? Array.from(new Set(preferred)).map(a.progById).filter(Boolean) : [];
    const html = shell('costs',
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 380px;gap:24px" id="cp-grid"><div class="card"><div class="row between"><h3 class="mb0">Plan the real cost</h3><select id="cp-cur" style="width:auto">' + Object.keys(C.currencies || {}).map((x) => '<option ' + (x === c ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<label class="field mt2"><span>Start from a programme</span><select id="cp-prog"><option value="">Custom figures</option>' + progs.map((p) => '<option value="' + p.id + '" ' + (cp.programId === p.id ? 'selected' : '') + '>' + esc(p.program + ' — ' + p.university) + (preferred.includes(p.id) ? ' ★' : '') + '</option>').join('') + '</select></label>' +
      '<div class="form-grid mt2">' + field('tuition', 'Tuition per year (' + c + ')', cp.tuition) + field('living', 'Living costs per year', cp.living, 'Rent, food, transport, books') +
      field('insurance', 'Health insurance per year', cp.insurance) + field('appFee', 'Application fee(s)', cp.appFee) +
      field('oneOff', 'One-off costs', cp.oneOff, 'Visa, flights, deposits, laptop') +
      '<label class="field"><span>Programme length (years)</span><input type="number" min="1" max="7" data-raw="years" value="' + cp.years + '"></label>' +
      '<label class="field"><span>Scholarship covers <b>' + cp.scholarshipPct + '%</b> of tuition</span><input type="range" min="0" max="100" step="5" data-raw="scholarshipPct" value="' + cp.scholarshipPct + '"></label>' +
      field('saved', 'Already saved / pledged', cp.saved, 'Family support, savings, sponsors') +
      '<label class="field"><span>Programme starts</span><input type="date" data-raw="start" value="' + esc(cp.start) + '"></label></div>' +
      '<p class="small muted mt2 mb0">Exchange rate used: 1 USD ≈ ' + r.toLocaleString() + ' ' + c + ' (indicative). Figures are estimates — confirm fees with the university.</p></div>' +
      '<aside class="stack"><div class="card" style="background:var(--ink);color:var(--bg);border:0"><span class="eyebrow" style="color:var(--sun)">Whole programme</span><div class="big-num" style="color:var(--bg)">' + U.money(k.total, c) + '</div><p class="small" style="opacity:.75">' + cp.years + ' years after scholarships, including one-off costs</p>' +
      '<hr class="divider" style="background:rgba(255,255,255,.15)"><div class="row between"><span style="opacity:.75">First year</span><b>' + U.money(k.firstYear, c) + '</b></div><div class="row between mt1"><span style="opacity:.75">Each later year</span><b>' + U.money(k.yearNet, c) + '</b></div>' + (k.schol ? '<div class="row between mt1"><span style="opacity:.75">Scholarship saves / yr</span><b style="color:var(--sun)">− ' + U.money(k.schol, c) + '</b></div>' : '') + '</div>' +
      '<div class="card sun"><h4>Savings plan</h4>' + (k.need > 0 ? '<p class="mb0">To cover the first year by the start date, save about</p><div class="big-num mt1">' + U.money(k.monthly, c) + '<small style="font-size:1rem;font-family:var(--font-body)"> /month</small></div><p class="small muted mb0">for ' + k.months + ' months (still needed: ' + U.money(k.need, c) + ').</p>' : '<p class="mb0"><b>You’re covered for year one.</b> Plan ahead for year two.</p>') + '</div>' +
      '<div class="card"><h4>Yearly breakdown</h4><div class="bars mt1">' + [['Tuition', cp.tuition - k.schol, 'var(--brand)'], ['Living', cp.living, 'var(--sun)'], ['Insurance', cp.insurance, 'var(--sky)'], ['One-off', cp.appFee + cp.oneOff, 'var(--coral)']].map(([l, x, col]) => '<div class="bar-row"><span>' + l + '</span><div class="track"><div class="fill" style="width:' + Math.max(0, x) / max * 100 + '%;background:' + col + '"></div></div><span class="v">' + U.money(Math.max(0, x), c, { compact: true }) + '</span></div>').join('') + '</div></div>' +
      '<a class="btn ghost block" href="#/prepare/scholarships">' + icon('award') + 'Find scholarships to close the gap</a></aside></div>' +
      (cmp.length > 1 ? '<h3 class="mt4">Compare your shortlist</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Per year</th><th>Years</th><th>Whole programme</th><th>Funding</th></tr></thead><tbody>' + cmp.map((p) => { const yr = +p.tuitionUSD + +p.livingUSD; return '<tr><td><b>' + esc(p.program) + '</b><br><small class="muted">' + esc(p.university) + '</small></td><td class="num">' + U.money(yr, c, { compact: true }) + '</td><td>' + p.durationYears + '</td><td class="num"><b>' + U.money(yr * p.durationYears + +p.appFeeUSD + (a.isInternational(p.country) ? 1200 : 100), c, { compact: true }) + '</b></td><td>' + (p.scholarships ? '<span class="badge brand">Available</span>' : '—') + '</td></tr>'; }).join('') + '</tbody></table></div>' : ''));
    setTimeout(() => {
      const g = $('#cp-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#cp-cur').onchange = (e) => { S.settings.currency = e.target.value; a.save(); a.render(); };
      $('#cp-prog').onchange = (e) => { const p = a.progById(e.target.value); if (p) { S.costPlan = planFromProgram(p); } else { S.costPlan.programId = ''; } a.save(); location.hash = '#/prepare/costs'; a.render(); };
      $$('[data-cp]').forEach((i) => i.onchange = () => { cp[i.dataset.cp] = (+i.value || 0) / r; if (i.dataset.cp !== 'saved') cp.programId = ''; a.save(); a.render(); });
      $$('[data-raw]').forEach((i) => { const ev = i.type === 'range' ? 'input' : 'change'; i.addEventListener(ev, () => { cp[i.dataset.raw] = i.type === 'date' ? i.value : (+i.value || 0); a.save(); if (i.type === 'range') { clearTimeout(i._t); i._t = setTimeout(() => a.render(), 250); } else a.render(); }); });
    });
    return html;
  }

  /* ---------------- Scholarships ---------------- */
  let schF = { level: null, q: '' };
  function scholarshipsView() {
    const a = A(), S = a.S, C = a.C;
    let list = (C.scholarships || []).slice();
    const lvl = schF.level === null ? (S.profile ? S.profile.level : '') : schF.level;
    if (lvl) list = list.filter((s) => s.level === 'Both' || s.level === lvl);
    if (schF.q) { const q = schF.q.toLowerCase(); list = list.filter((s) => (s.name + s.provider + s.destinations + s.eligibility).toLowerCase().includes(q)); }
    const tracked = new Set(S.applications.filter((x) => x.kind === 'scholarship').map((x) => (x.custom || {}).program));
    const html = shell('scholarships',
      '<div class="row between mb2"><div class="row"><input type="search" id="sch-q" placeholder="Search scholarships…" value="' + esc(schF.q) + '" style="width:260px"><div class="seg" style="width:auto">' + [['', 'All'], ['Undergraduate', 'Undergraduate'], ['Postgraduate', 'Postgraduate']].map(([v, l]) => '<button data-lvl="' + v + '" aria-pressed="' + (lvl === v) + '">' + l + '</button>').join('') + '</div></div><span class="small muted">' + list.length + ' opportunities</span></div>' +
      '<div class="notice warn mb2">' + icon('alert') + '<p>Real scholarships never charge an application fee to apply. Always apply through the official website.</p></div>' +
      '<div class="grid g2">' + list.map((s) => '<article class="card"><div class="row between" style="align-items:flex-start"><div><span class="badge brand">' + esc(s.coverage) + '</span> <span class="badge">' + esc(s.level === 'Both' ? 'UG & PG' : s.level) + '</span><h3 class="mt1">' + esc(s.name) + '</h3><p class="small muted mb0">' + esc(s.provider) + '</p></div><div class="feature-icon sun" style="margin:0">' + icon('award') + '</div></div>' +
        '<p class="small mt2"><b>Where:</b> ' + esc(s.destinations) + '<br><b>Who:</b> ' + esc(s.eligibility) + '<br><b>When:</b> ' + esc(s.deadlineNote) + '</p>' +
        '<div class="row">' + (U.safeUrl(s.url) ? '<a class="btn sm ghost" href="' + esc(U.safeUrl(s.url)) + '" target="_blank" rel="noopener">' + icon('external') + 'Official site</a>' : '') + (tracked.has(s.name) ? '<a class="btn sm soft" href="#/track">' + icon('check') + 'Tracking</a>' : '<button class="btn sm" data-track="' + esc(s.id) + '">' + icon('plus') + 'Track this</button>') + '</div></article>').join('') + '</div>');
    setTimeout(() => {
      let t; $('#sch-q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { schF.q = e.target.value; a.render(); const q = $('#sch-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 300); };
      $$('[data-lvl]').forEach((b) => b.onclick = () => { schF.level = b.dataset.lvl; a.render(); });
      $$('[data-track]').forEach((b) => b.onclick = () => { const s = (C.scholarships || []).find((x) => x.id === b.dataset.track); window.APP_ACTIONS.addCustomApplication({ kind: 'scholarship', university: s.provider, program: s.name, url: s.url, country: '' }); });
    });
    return html;
  }

  /* ---------------- Interview practice ---------------- */
  let iv = { i: 0, timer: null, left: 120, rec: null, chunks: [], audioUrl: null };
  function interviewView() {
    const a = A(), S = a.S, C = a.C;
    const qs = C.interviewQuestions || []; if (!qs.length) return shell('interview', a.emptyState('mic', 'No questions yet', 'Questions will appear here once added.'));
    iv.i = iv.i % qs.length; const q = qs[iv.i];
    const canRec = !!(navigator.mediaDevices && window.MediaRecorder);
    const html = shell('interview',
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="iv-grid"><div class="card pad-lg"><div class="row between"><span class="eyebrow">Question ' + (iv.i + 1) + ' of ' + qs.length + '</span><span class="big-num" id="iv-time" style="font-size:1.8rem;color:var(--brand)">' + fmt(iv.left) + '</span></div>' +
      '<h2 style="font-size:clamp(1.5rem,3.2vw,2.1rem)">' + esc(q.q) + '</h2>' +
      '<div class="row mt2"><button class="btn" id="iv-start">' + icon(iv.timer ? 'pause' : 'play') + (iv.timer ? 'Pause' : 'Start 2-minute answer') + '</button>' + (canRec ? '<button class="btn ghost" id="iv-rec">' + icon('mic') + (iv.rec ? 'Stop recording' : 'Record my answer') + '</button>' : '') + '<button class="btn ghost" id="iv-next">Next question ' + icon('right') + '</button><button class="btn link" id="iv-rand">Random</button></div>' +
      (iv.audioUrl ? '<div class="mt2"><p class="small muted mb0">Your recording (stays on this device):</p><audio controls src="' + iv.audioUrl + '" style="width:100%"></audio></div>' : '') +
      '<label class="field mt3"><span>My key points for this question</span><textarea id="iv-notes" placeholder="Bullet points, not a script — so you sound natural.">' + esc(S.interviewNotes[q.id] || '') + '</textarea></label></div>' +
      '<aside class="stack"><div class="card tint"><h4>Use the STAR method</h4><ul class="reasons small"><li class="yes">' + icon('check') + '<span><b>Situation</b> — set the scene briefly.</span></li><li class="yes">' + icon('check') + '<span><b>Task</b> — what you had to do.</span></li><li class="yes">' + icon('check') + '<span><b>Action</b> — what <i>you</i> did (most of your answer).</span></li><li class="yes">' + icon('check') + '<span><b>Result</b> — what happened and what you learned.</span></li></ul></div>' +
      '<div class="card"><h4>All questions</h4><ol class="small" style="padding-left:18px;margin:0;display:grid;gap:6px">' + qs.map((x, i) => '<li><a href="#" data-q="' + i + '" style="' + (i === iv.i ? 'font-weight:800' : '') + '">' + esc(x.q) + '</a>' + (S.interviewNotes[x.id] ? ' <span class="badge ok">notes</span>' : '') + '</li>').join('') + '</ol></div></aside></div>');
    function fmt(s) { return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
    setTimeout(() => {
      const g = $('#iv-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#iv-notes').oninput = (e) => { S.interviewNotes[q.id] = e.target.value; a.save(); };
      const stop = () => { clearInterval(iv.timer); iv.timer = null; };
      $('#iv-start').onclick = () => {
        if (iv.timer) { stop(); a.render(); return; }
        if (iv.left <= 0) iv.left = 120;
        iv.timer = setInterval(() => { iv.left--; const el = $('#iv-time'); if (el) { el.textContent = fmt(Math.max(0, iv.left)); el.style.color = iv.left <= 15 ? 'var(--bad)' : ''; } if (iv.left <= 0) { stop(); U.toast('Time! Aim for 60–120 seconds per answer.', 'clock'); a.render(); } }, 1000);
        a.render();
      };
      const go = (i) => { stop(); iv.left = 120; iv.i = i; if (iv.audioUrl) { URL.revokeObjectURL(iv.audioUrl); iv.audioUrl = null; } a.render(); };
      $('#iv-next').onclick = () => go((iv.i + 1) % qs.length);
      $('#iv-rand').onclick = () => go(Math.floor(Math.random() * qs.length));
      $$('[data-q]').forEach((l) => l.onclick = (e) => { e.preventDefault(); go(+l.dataset.q); });
      const rb = $('#iv-rec');
      if (rb) rb.onclick = async () => {
        if (iv.rec) { iv.rec.stop(); return; }
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          iv.chunks = []; iv.rec = new MediaRecorder(stream);
          iv.rec.ondataavailable = (e) => iv.chunks.push(e.data);
          iv.rec.onstop = () => { stream.getTracks().forEach((t) => t.stop()); iv.audioUrl = URL.createObjectURL(new Blob(iv.chunks, { type: iv.rec.mimeType })); iv.rec = null; a.render(); };
          iv.rec.start(); U.toast('Recording… press again to stop', 'mic'); a.render();
        } catch (e) { U.toast('Microphone permission was blocked', 'alert'); }
      };
    });
    return html;
  }

  /* ---------------- Glossary ---------------- */
  let gq = '';
  function glossaryView() {
    const a = A(), C = a.C;
    const list = (C.glossary || []).filter((g) => !gq || (g.term + ' ' + g.definition).toLowerCase().includes(gq.toLowerCase())).sort((x, y) => x.term.localeCompare(y.term));
    const html = shell('glossary', '<div class="row between mb2"><h2 class="mb0">Admissions glossary</h2><input type="search" id="gl-q" value="' + esc(gq) + '" placeholder="Search terms…" style="max-width:300px"></div>' +
      (list.length ? '<div class="grid g2">' + list.map((g) => '<div class="card"><h4 style="color:var(--brand)">' + esc(g.term) + '</h4><p class="small mb0">' + esc(g.definition) + '</p></div>').join('') + '</div>' : a.emptyState('book', 'No terms found', 'Try another word, or <a href="#/help">ask an adviser</a>.')));
    setTimeout(() => { let t; $('#gl-q').oninput = (e) => { clearTimeout(t); t = setTimeout(() => { gq = e.target.value; a.render(); const q = $('#gl-q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); }; });
    return html;
  }

  window.APP_VIEWS = window.APP_VIEWS || {};
  window.APP_VIEWS.prepare = function (tab, arg) {
    switch (tab) {
      case 'vault': return vaultView();
      case 'statement': return statementView(arg);
      case 'references': return referencesView();
      case 'costs': return costsView(arg);
      case 'scholarships': return scholarshipsView();
      case 'interview': return interviewView();
      case 'glossary': return glossaryView();
      default: return checklistView(arg);
    }
  };
})();
