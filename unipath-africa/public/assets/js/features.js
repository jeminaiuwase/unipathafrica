/* UniPath Africa — Share with family, Subject checker, Scholarship calendar, Offer comparison */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;
  const V = window.APP_VIEWS = window.APP_VIEWS || {};
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* ================= Share with family ================= */
  const b64e = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = (s) => { try { return JSON.parse(decodeURIComponent(escape(atob(String(s).replace(/-/g, '+').replace(/_/g, '/'))))); } catch (e) { return null; } };
  function shareLink() {
    const a = A(), S = a.S, prof = S.profile || {};
    const d = { n: prof.name || '', c: a.cur(), h: prof.homeCountry || '', s: [...new Set(S.shortlist)].slice(0, 12), a: S.applications.filter((x) => x.programId).slice(0, 12).map((x) => [x.programId, x.stage, x.deadlineOverride || '']), t: new Date().toISOString().slice(0, 10) };
    return location.origin + '/share?d=' + b64e(d);
  }
  function openShare() {
    const a = A(), S = a.S;
    if (!S.shortlist.length && !S.applications.length) return U.toast('Save some programmes first, then share them', 'info');
    const link = shareLink();
    const wa = 'https://wa.me/?text=' + encodeURIComponent('Here are the universities I’m considering, with the full costs: ' + link);
    U.modal({ title: 'Share my plan with family', body: '<p class="mt0">Anyone with this link can see your saved programmes, applications and the <b>true cost</b> of each — read-only. It doesn’t include your documents, statements or contact details.</p><label class="field"><span>Your link</span><input id="sh-l" readonly value="' + esc(link) + '"></label><div class="row mt2"><button class="btn" id="sh-copy">' + icon('copy') + 'Copy link</button><a class="btn ghost" href="' + esc(wa) + '" target="_blank" rel="noopener">' + icon('phone') + 'Send on WhatsApp</a><a class="btn ghost" href="mailto:?subject=' + encodeURIComponent('My university plan') + '&body=' + encodeURIComponent(link) + '">' + icon('mail') + 'Email</a></div><p class="small muted mt2 mb0">The link is a snapshot of today. Share again after you make changes.</p>', footer: '<button class="btn ghost" data-close>Done</button>',
      onOpen: (el) => { el.querySelector('#sh-copy').onclick = () => { const i = el.querySelector('#sh-l'); i.select(); try { navigator.clipboard.writeText(i.value); } catch (e) { document.execCommand('copy'); } U.toast('Link copied', 'copy'); }; } });
    U.track('feature', 'share-family');
  }
  V.share = function () {
    const a = A(), C = a.C;
    const d = b64d(new URLSearchParams(location.search).get('d'));
    if (!d) return '<div class="container page">' + a.emptyState('users', 'This link doesn’t work', 'Ask the student to share their plan again.', '<a class="btn" href="/">Go to UniPath Africa</a>') + '</div>';
    const cur = (C.currencies || {})[d.c] ? d.c : 'USD', m = (usd) => U.money(usd, cur, { compact: true });
    const ids = [...new Set(d.s.concat(d.a.map((x) => x[0])))];
    const rows = ids.map((id) => a.progById(id)).filter(Boolean).map((p) => { const plan = window.UP_COSTS ? window.UP_COSTS.compute(Object.assign(window.UP_COSTS.defaultsFor(p), { saved: 0 })) : null; const app = d.a.find((x) => x[0] === p.id); return { p, k: plan, app }; });
    const stage = { preparing: 'Preparing', ready: 'Ready to submit', submitted: 'Submitted', decision: 'Awaiting decision', offer: 'Offer received', enrolled: 'Enrolled', closed: 'Closed' };
    return '<div class="container page" style="max-width:960px"><span class="eyebrow">Shared plan · ' + U.fmtDate(d.t) + '</span><h1 style="font-size:clamp(1.8rem,4vw,2.5rem)">' + esc(d.n ? d.n + '’s university plan' : 'A student’s university plan') + '</h1>' +
      '<p class="lead" style="font-size:1.05rem">' + esc(d.n || 'This student') + ' is using UniPath Africa to choose a university. Below are the programmes they’re considering, with an estimate of the <b>full cost</b> — not just tuition.</p>' +
      '<div class="notice mb2">' + icon('shield') + '<p class="mb0"><b>For family and sponsors:</b> UniPath is free. All fees are paid <b>directly</b> to the university or government — never to UniPath or to an agent. Figures are estimates; the university’s official fee page is final.</p></div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Status</th><th>Deadline</th><th>Tuition only</th><th>Estimated full cost</th></tr></thead><tbody>' + rows.map(({ p, k, app }) => '<tr><td><a href="/program/' + encodeURIComponent(p.id) + '"><b>' + esc(p.program) + '</b></a><div class="small muted">' + esc(p.university + ' · ' + p.country + ' · ' + p.durationYears + ' yrs') + '</div></td><td>' + (app ? '<span class="badge brand">' + esc(stage[app[1]] || app[1]) + '</span>' : '<span class="badge">Saved</span>') + '</td><td>' + U.fmtDate((app && app[2]) || p.deadline) + '</td><td class="num">' + (k ? m(k.sticker) : '—') + '</td><td class="num"><b>' + (k ? m(k.totalCost) : '—') + '</b></td></tr>').join('') + '</tbody></table></div>' +
      '<p class="small muted">Full cost includes tuition, accommodation, food, transport, books, fees, travel, visa (if abroad), a laptop, likely fee rises and a 10% emergency buffer, shown in ' + esc(cur) + '.</p>' +
      '<div class="grid g2 mt3"><div class="card"><h3 class="mt0">How you can help</h3><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:5px"><li>Agree together how much you can contribute each year, and by when — in writing.</li><li>Help find <a href="/prepare/scholarships">scholarships</a> and government loans.</li><li>Pay fees only to accounts on the official offer letter or university portal.</li><li>Read <a href="/money/sponsors">Family money & sponsors</a> (4 minutes).</li></ul></div>' +
      '<div class="card tint"><h3 class="mt0">Questions?</h3><p class="small">Book a free call with a UniPath adviser — parents and guardians are welcome.</p><a class="btn" href="/book">' + icon('calendar') + 'Book a free consultation</a></div></div></div>';
  };

  /* ================= Subject combination checker ================= */
  const rules = () => (A().C.subjectRules || []).map((l) => { const [fam, kw, req, opt, note] = String(l).split(/\s\|\s/).map((x) => (x || '').trim()); return { fam, rx: kw ? new RegExp(kw, 'i') : null, req: req ? req.split(',').map((x) => x.trim()).filter(Boolean) : [], opt: opt ? opt.split(',').map((x) => x.trim()).filter(Boolean) : [], note: note || '' }; });
  function subjectsView(shell) {
    const a = A(), S = a.S, C = a.C;
    S.subjects = S.subjects || { system: Object.keys(C.subjectLists || {})[0] || 'UACE (Uganda)', picked: [] };
    const st = S.subjects, list = String((C.subjectLists || {})[st.system] || '').split(',').map((x) => x.trim()).filter(Boolean);
    const has = (x) => st.picked.includes(x) || (x === 'Divinity/CRE' && st.picked.some((p) => /divinity|cre/i.test(p))) || (x === 'Economics' && st.picked.includes('Business Studies') && false);
    const R = rules().map((r) => { const missing = r.req.filter((x) => !has(x)); const opt = r.opt.filter(has); const status = missing.length ? 'no' : (r.opt.length && !opt.length && r.req.length < 2 ? 'maybe' : 'yes'); return Object.assign(r, { missing, optHave: opt, status }); });
    const order = { yes: 0, maybe: 1, no: 2 };
    R.sort((x, y) => order[x.status] - order[y.status]);
    const progsFor = (r) => (C.programs || []).filter((p) => p.level === 'Undergraduate' && r.rx && r.rx.test(p.program));
    const prof = S.profile || {};
    const html = shell('subjects',
      '<div class="grid" style="grid-template-columns:340px minmax(0,1fr);gap:24px" id="sj-grid"><aside class="card"><h3 class="mt0">My subjects</h3><p class="small muted">Tick the A-level (or final-year) subjects you take or passed.</p><label class="field"><span>Exam system</span><select id="sj-sys">' + Object.keys(C.subjectLists || {}).map((k) => '<option' + (k === st.system ? ' selected' : '') + '>' + esc(k) + '</option>').join('') + '</select></label>' +
      '<div class="stack mt2" style="gap:4px">' + list.map((x) => '<label class="check small"><input type="checkbox" data-sj="' + esc(x) + '"' + (st.picked.includes(x) ? ' checked' : '') + '><span>' + esc(x) + '</span></label>').join('') + '</div>' +
      '<p class="small muted mt2 mb0">This is a general guide based on common rules in East and West Africa. Every university sets its own subject requirements and weighting — always check the programme’s official page. Ugandan applicants: see <a href="https://news.mak.ac.ug/wp-content/uploads/2025/10/Notes-to-Schools-2026-2027-Academic-Year.pdf" target="_blank" rel="noopener">Makerere’s weighting notes for 2026/27 ↗</a>.</p></aside>' +
      '<div>' + (st.picked.length < 2 ? '<div class="notice">' + icon('info') + '<p class="mb0">Tick at least two subjects to see which courses they open.</p></div>' : '') +
      '<div class="stack">' + R.map((r) => { const ps = progsFor(r); const inDest = (prof.destinations || []).length ? ps.filter((p) => prof.destinations.includes(p.country)) : ps; return '<div class="card"><div class="row between"><h3 class="mt0 mb0">' + esc(r.fam) + '</h3>' + (r.status === 'yes' ? '<span class="badge ok">' + icon('check') + 'Your subjects fit</span>' : r.status === 'maybe' ? '<span class="badge warn">Possible</span>' : '<span class="badge">Needs ' + esc(r.missing.join(' + ')) + '</span>') + '</div>' +
        '<p class="small mt1 mb0">' + (r.req.length ? '<b>Usually needs:</b> ' + esc(r.req.join(' and ')) : '<b>Usually needs:</b> any two principal passes') + (r.opt.length ? ' · <b>Helpful:</b> ' + esc(r.opt.join(', ')) : '') + '</p>' + (r.note ? '<p class="small muted mt1 mb0">' + esc(r.note) + '</p>' : '') +
        (r.status !== 'no' && ps.length ? '<div class="row mt2" style="gap:6px">' + inDest.slice(0, 4).map((p) => '<a class="chip" style="text-decoration:none" href="/program/' + encodeURIComponent(p.id) + '">' + esc(p.program.length > 40 ? p.program.slice(0, 38) + '…' : p.program) + ' · ' + esc(p.university.split(' ').slice(0, 2).join(' ')) + '</a>').join('') + '<a class="small" href="/browse?q=' + encodeURIComponent((r.rx.source.split('|')[0] || '').replace(/\\\\/g, '')) + '">See all ' + ps.length + ' →</a></div>' : '') + '</div>'; }).join('') + '</div></div></div>');
    setTimeout(() => {
      const g = $('#sj-grid'); if (g && innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#sj-sys').onchange = (e) => { st.system = e.target.value; st.picked = []; a.save(); a.render(); };
      $$('[data-sj]').forEach((c) => c.onchange = () => { const y = scrollY; if (c.checked) st.picked.push(c.dataset.sj); else st.picked = st.picked.filter((x) => x !== c.dataset.sj); a.save(); a.render(); scrollTo(0, y); });
    });
    U.track('feature', 'subject-checker');
    return html;
  }

  /* ================= Scholarship calendar ================= */
  function calendarView(shell) {
    const a = A(), S = a.S, C = a.C;
    const lvl = (S.profile && S.profile.level) || '';
    const list = (C.scholarships || []).filter((s) => !lvl || s.level === 'Both' || s.level === lvl);
    const mo = (s) => String(s.usualMonths || '').split(',').map((x) => +x).filter((x) => x >= 1 && x <= 12);
    const dated = list.filter((s) => s.deadline || mo(s).length), undated = list.filter((s) => !s.deadline && !mo(s).length);
    const start = new Date().getMonth();
    const months = Array.from({ length: 12 }, (_, i) => (start + i) % 12 + 1);
    const watching = new Set((S.watch || []).filter((w) => w.type === 'scholarship').map((w) => w.id));
    const card = (s, m) => { const ms = mo(s), closes = s.deadline ? (new Date(s.deadline).getMonth() + 1) === m : ms[ms.length - 1] === m, opens = ms[0] === m && ms.length > 1; return '<li class="row between" style="gap:8px;padding:7px 0;border-bottom:1px dashed var(--line);flex-wrap:nowrap"><span class="small"><b>' + esc(s.name) + '</b> ' + (closes ? '<span class="badge bad">Usually closes</span>' : opens ? '<span class="badge ok">Usually opens</span>' : '<span class="badge">Open</span>') + '<br><span class="muted">' + esc(s.coverage || '') + ' · ' + esc(s.level === 'Both' ? 'UG & PG' : s.level) + '</span></span><span class="row" style="gap:4px;flex-wrap:nowrap">' + (U.safeUrl(s.url) ? '<a class="icon-btn" href="' + esc(U.safeUrl(s.url)) + '" target="_blank" rel="noopener" title="Official site">' + icon('external') + '</a>' : '') + '<button class="icon-btn" data-sw="' + esc(s.id) + '" title="' + (watching.has(s.id) ? 'Watching' : 'Remind me') + '" style="color:' + (watching.has(s.id) ? 'var(--warn)' : 'inherit') + '">' + icon('clock') + '</button></span></li>'; };
    const html = shell('scholarships',
      '<div class="row between mb2"><div><h2 class="mb0">Scholarship calendar</h2><p class="small muted mb0">When applications usually open and close, month by month' + (lvl ? ' (' + esc(lvl) + ')' : '') + '. Dates move every year — tap ' + icon('clock') + ' to get an email reminder, and always confirm on the official site.</p></div><div class="row"><a class="btn sm ghost" href="/prepare/scholarships">' + icon('list') + 'List view</a><button class="btn sm" id="sc-ics">' + icon('calendar') + 'Add to my calendar</button></div></div>' +
      '<div class="grid g3">' + months.map((m) => { const items = dated.filter((s) => s.deadline ? new Date(s.deadline).getMonth() + 1 === m : mo(s).includes(m)); return '<div class="card"><h3 class="mt0 mb1">' + MONTHS[m - 1] + '</h3>' + (items.length ? '<ul style="list-style:none;padding:0;margin:0">' + items.map((s) => card(s, m)).join('') + '</ul>' : '<p class="small muted mb0">Nothing usually due.</p>') + '</div>'; }).join('') + '</div>' +
      (undated.length ? '<div class="card mt3"><h3 class="mt0">Dates vary — check each year</h3><ul class="small" style="padding-left:18px;margin:0">' + undated.map((s) => '<li><b>' + esc(s.name) + '</b> — ' + esc(s.deadlineNote || '') + (U.safeUrl(s.url) ? ' · <a href="' + esc(U.safeUrl(s.url)) + '" target="_blank" rel="noopener">official site ↗</a>' : '') + '</li>').join('') + '</ul></div>' : ''));
    setTimeout(() => {
      $$('[data-sw]').forEach((b) => b.onclick = () => { const s = list.find((x) => x.id === b.dataset.sw); window.APP_ACTIONS.toggleWatch('scholarship', s.id, s.name); });
      $('#sc-ics').onclick = () => { const y = new Date().getFullYear(); const ev = dated.map((s) => { if (s.deadline) return { date: s.deadline, title: 'Scholarship deadline: ' + s.name, desc: s.url || '' }; const ms = mo(s); const last = ms[ms.length - 1]; let yy = y; if (last - 1 < new Date().getMonth()) yy++; const d = new Date(Date.UTC(yy, last - 1, 1)); return { date: d.toISOString().slice(0, 10), title: 'Scholarship usually closes this month: ' + s.name + ' (check exact date)', desc: s.url || '' }; }); U.download('unipath-scholarships.ics', U.ics(ev), 'text/calendar'); };
    });
    U.track('feature', 'scholarship-calendar');
    return html;
  }

  /* ================= Offer comparison ================= */
  const CRIT = [['cost', 'Total cost (lower is better)', 5], ['course', 'How much I like the course', 4], ['place', 'Location & student life', 3], ['visa', 'Visa ease', 3], ['work', 'Work during & after study', 2], ['reputation', 'Reputation in my field', 3]];
  V.offers = function () {
    const a = A(), S = a.S, C = a.C;
    S.offerCmp = S.offerCmp || { picks: [], ratings: {}, sch: {}, weights: {} };
    const st = S.offerCmp;
    const offers = S.applications.filter((x) => ['offer', 'enrolled'].includes(x.stage) && x.programId).map((x) => x.programId);
    const pool = [...new Set(offers.concat(S.applications.map((x) => x.programId).filter(Boolean), S.shortlist))];
    if (!st.picks.length) st.picks = pool.slice(0, 3);
    const picks = st.picks.map(a.progById).filter(Boolean).slice(0, 3);
    const cur = a.cur();
    const info = picks.map((p) => {
      const k = window.UP_COSTS.compute(Object.assign(window.UP_COSTS.defaultsFor(p), { saved: 0 }));
      const c = window.UP_DEST && window.UP_DEST.findCountry(p.country); const home = p.country === ((S.profile && S.profile.homeCountry) || 'Uganda');
      const sch = +(st.sch[p.id] || 0) / U.rateOf(cur) * p.durationYears;
      const net = Math.max(0, k.totalCost - sch);
      const visaScore = home ? 5 : !c ? 3 : ({ Rare: 4, Sometimes: 3, Likely: 2 }[c.visaInterview] || 3) - ((+c.leadWeeks || 10) > 14 ? 1 : 0);
      const workScore = home ? 4 : c && /graduate|post-graduation|opt|stamp 1g|485|orientation|18 months/i.test(c.postStudyWork || '') ? 4 : 2;
      return { p, k, net, c, home, auto: { visa: Math.max(1, Math.min(5, visaScore)), work: workScore } };
    });
    const minNet = Math.min(...info.map((x) => x.net)), maxNet = Math.max(...info.map((x) => x.net));
    const rate = (x, crit) => crit === 'cost' ? (maxNet === minNet ? 5 : 1 + 4 * (maxNet - x.net) / (maxNet - minNet)) : crit === 'visa' || crit === 'work' ? (st.ratings[x.p.id + ':' + crit] || x.auto[crit]) : (st.ratings[x.p.id + ':' + crit] || 3);
    const weight = (crit) => st.weights[crit] != null ? st.weights[crit] : CRIT.find((c) => c[0] === crit)[2];
    const total = (x) => { let sw = 0, s = 0; CRIT.forEach(([k]) => { const w = weight(k); sw += w; s += w * rate(x, k); }); return sw ? Math.round(s / sw / 5 * 100) : 0; };
    const best = info.length ? info.reduce((m, x) => total(x) > total(m) ? x : m, info[0]) : null;
    const m = (usd) => U.money(usd, cur, { compact: true });
    const html = '<div class="container page">' + a.journeySteps('enroll') + a.pageHead('Compare offers', 'Put up to three offers (or favourites) side by side: the true cost after scholarships, visa and work rules, and what matters to you.') +
      (pool.length < 2 ? a.emptyState('grid', 'Add at least two programmes', 'Save programmes or record offers in Track, then compare them here.', '<a class="btn" href="/match">Find programmes</a>') :
      '<div class="row mb2" style="gap:8px">' + [0, 1, 2].map((i) => '<select data-op="' + i + '" style="max-width:300px"><option value="">— none —</option>' + pool.map(a.progById).filter(Boolean).map((p) => '<option value="' + esc(p.id) + '"' + (st.picks[i] === p.id ? ' selected' : '') + '>' + esc(p.program + ' — ' + p.university) + (offers.includes(p.id) ? ' (offer)' : '') + '</option>').join('') + '</select>').join('') + '</div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th></th>' + info.map((x) => '<th style="min-width:200px"><a href="/program/' + encodeURIComponent(x.p.id) + '">' + esc(x.p.program) + '</a><div class="small muted" style="font-weight:500">' + esc(x.p.university + ' · ' + x.p.country) + '</div></th>').join('') + '</tr></thead><tbody>' +
      '<tr><th>Estimated true cost</th>' + info.map((x) => '<td class="num">' + m(x.k.totalCost) + '</td>').join('') + '</tr>' +
      '<tr><th>Scholarship / bursary per year (' + cur + ')</th>' + info.map((x) => '<td><input type="number" min="0" data-sch="' + esc(x.p.id) + '" value="' + esc(st.sch[x.p.id] || '') + '" placeholder="0" style="max-width:150px"></td>').join('') + '</tr>' +
      '<tr><th><b>Cost to you</b></th>' + info.map((x) => '<td class="num"><b>' + m(x.net) + '</b></td>').join('') + '</tr>' +
      '<tr><th>Accept / deposit by</th>' + info.map((x) => { const app = S.applications.find((y) => y.programId === x.p.id); return '<td>' + (app && app.acceptBy ? U.fmtDate(app.acceptBy) : '<span class="small muted">Set in Track</span>') + '</td>'; }).join('') + '</tr>' +
      '<tr><th>Visa</th>' + info.map((x) => '<td class="small">' + (x.home ? 'Not needed' : x.c ? esc((x.c.visaName || '') + ' · interview ' + (x.c.visaInterview || 'rare').toLowerCase() + ' · ' + (x.c.visaProcessing || '')) + ' <a href="/country/' + (x.c.slug || '') + '/visa">help</a>' : '—') + '</td>').join('') + '</tr>' +
      '<tr><th>Work after graduating</th>' + info.map((x) => '<td class="small">' + esc(x.home ? 'Home country' : (x.c && x.c.postStudyWork) || '—') + '</td>').join('') + '</tr>' +
      '<tr><th colspan="' + (info.length + 1) + '" style="background:var(--bg-2)">Your ratings (1 = poor, 5 = great)</th></tr>' +
      CRIT.filter(([k]) => k !== 'cost').map(([k, l]) => '<tr><th>' + l + '</th>' + info.map((x) => '<td><select data-rt="' + esc(x.p.id) + ':' + k + '" style="width:auto">' + [1, 2, 3, 4, 5].map((v) => '<option' + (Math.round(rate(x, k)) === v ? ' selected' : '') + '>' + v + '</option>').join('') + '</select>' + ((k === 'visa' || k === 'work') && !st.ratings[x.p.id + ':' + k] ? ' <small class="muted">suggested</small>' : '') + '</td>').join('') + '</tr>').join('') +
      '<tr><th><b>Overall fit for you</b></th>' + info.map((x) => '<td><div class="big-num" style="font-size:1.5rem;color:' + (x === best ? 'var(--ok)' : 'inherit') + '">' + total(x) + '%</div>' + (x === best ? '<span class="badge ok">Best fit so far</span>' : '') + '</td>').join('') + '</tr></tbody></table></div>' +
      '<details class="card mt3"><summary><b>What matters most to you?</b> <span class="small muted">— change the weights</span></summary><div class="form-grid mt2">' + CRIT.map(([k, l]) => '<label class="field"><span>' + l + ' — <b>' + weight(k) + '</b></span><input type="range" min="0" max="5" data-w="' + k + '" value="' + weight(k) + '"></label>').join('') + '</div></details>' +
      '<div class="notice mt3">' + icon('info') + '<p class="mb0">This is a thinking tool, not a verdict. Talk it through with family and an adviser before you pay any deposit — and only pay the university directly. <a href="/book">Book a free session</a>.</p></div>') + '</div>';
    setTimeout(() => {
      const keep = (fn) => { const y = scrollY; fn(); a.save(); a.render(); scrollTo(0, y); };
      $$('[data-op]').forEach((s) => s.onchange = () => keep(() => { st.picks[+s.dataset.op] = s.value; st.picks = st.picks.filter(Boolean); }));
      $$('[data-sch]').forEach((i) => i.onchange = () => keep(() => { st.sch[i.dataset.sch] = +i.value || 0; }));
      $$('[data-rt]').forEach((s) => s.onchange = () => keep(() => { st.ratings[s.dataset.rt] = +s.value; }));
      $$('[data-w]').forEach((r) => r.onchange = () => keep(() => { st.weights[r.dataset.w] = +r.value; }));
    });
    U.track('feature', 'compare-offers');
    return html;
  };

  window.UP_FEATURES = { openShare, subjectsView, calendarView };
})();
