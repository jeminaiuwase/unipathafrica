/* UniPath Africa — Destinations, Visa help, Compare, Plans, Book, Search, Summary */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;
  window.APP_VIEWS = window.APP_VIEWS || {};
  const V = window.APP_VIEWS;

  /* ================= Helpers ================= */
  const slugify = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const slugOf = (c) => c.slug || slugify(c.name);
  const countries = () => (A().C.countries || []);
  function findCountry(key) {
    key = String(key || ''); const k = slugify(key);
    return countries().find((c) => slugOf(c) === k || c.name === key || slugify(c.name) === k) || null;
  }
  const qs = () => new URLSearchParams(location.search);
  const hasRate = (code) => !!((A().C.currencies || {})[code]);
  const local = (amt, code) => (code || '') + ' ' + Math.round(+amt || 0).toLocaleString('en-US');
  /** amount in a local currency → string in the student's currency (with local in brackets when different) */
  function both(amt, code, opts) {
    if (amt == null || amt === '' || isNaN(+amt)) return '—';
    const a = A(), uc = a.cur();
    if (!hasRate(code) || code === uc) return local(amt, code);
    const conv = a.money(U.toUSD(+amt, code), null, opts);
    return (opts && opts.only) ? conv : conv + ' <small class="muted">(' + local(amt, code) + ')</small>';
  }
  const toUSDsafe = (amt, code) => hasRate(code) ? U.toUSD(+amt || 0, code) : 0;
  function parseFees(c) {
    return (c.visaFees || []).map((line) => {
      const [label, amount, currency, per, note] = String(line).split('|').map((x) => (x || '').trim());
      return { label, amount: amount === '' || amount == null ? null : +amount, currency: currency || c.currency || 'USD', per: per || 'once', note: note || '' };
    }).filter((f) => f.label);
  }
  function feesUSD(c, years) {
    return parseFees(c).reduce((s, f) => s + (f.amount == null ? 0 : toUSDsafe(f.amount, f.currency) * (f.per === 'year' ? (years || 1) : 1)), 0);
  }
  function fundsLocal(c) {
    if (c.fundsAmount == null || c.fundsAmount === '') return null;
    const n = +c.fundsAmount; if (c.fundsPer === 'month') return n * (+c.fundsMonths || 12); return n;
  }
  function countryStats(name) {
    const ps = (A().C.programs || []).filter((p) => p.country === name);
    if (!ps.length) return null;
    const med = (arr) => { const a = arr.filter((x) => x > 0).sort((x, y) => x - y); return a.length ? a[Math.floor(a.length / 2)] : 0; };
    return { n: ps.length, unis: new Set(ps.map((p) => p.university)).size, tuition: med(ps.map((p) => +p.tuitionUSD || 0)), living: med(ps.map((p) => +p.livingUSD || 0)), sch: ps.filter((p) => p.scholarships).length, verified: ps.filter((p) => p.verified).length, ps };
  }
  function scholarshipsFor(c) {
    const n = c.name.toLowerCase();
    return (A().C.scholarships || []).filter((x) => {
      const d = (x.destinations || '').toLowerCase();
      return d.includes(n) || (c.name === 'United Kingdom' && /\buk\b|united kingdom|britain/.test(d)) || (c.name === 'United States' && /united states|\busa?\b/.test(d)) || (c.region === 'Africa' && /\bafrica\b/.test(d) && !/outside africa/.test(d));
    });
  }
  function vstate(slug) {
    const S = A().S; S.visa = S.visa || {};
    return S.visa[slug] = S.visa[slug] || { steps: {}, docs: {}, answers: {}, start: '', calc: {} };
  }
  const isHome = (c) => c.name === ((A().S.profile && A().S.profile.homeCountry) || 'Uganda');
  const EAC = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'DR Congo', 'Democratic Republic of the Congo', 'Somalia'];
  const isEAC = () => EAC.includes((A().S.profile && A().S.profile.homeCountry) || 'Uganda');
  const pct = (done, total) => total ? Math.round(done / total * 100) : 0;
  function visaProgress(c) {
    const st = (A().S.visa || {})[slugOf(c)]; if (!st) return null;
    const steps = c.visaSteps || [], docs = c.visaDocs || [];
    const d = steps.filter((_, i) => st.steps[i]).length + docs.filter((_, i) => st.docs[i]).length;
    const t = steps.length + docs.length; if (!d) return null;
    return { done: d, total: t, pct: pct(d, t) };
  }
  const interviewBadge = (v) => '<span class="badge ' + (v === 'Likely' ? 'warn' : v === 'Sometimes' ? '' : 'ok') + '">' + icon('mic') + ' Interview: ' + esc((v || 'Rare').toLowerCase()) + '</span>';
  const lastChecked = (c) => c.lastChecked ? '<p class="small muted mt2">' + icon('refresh') + ' Last checked by UniPath: ' + U.fmtDate(c.lastChecked) + '. Fees and rules change — always confirm on the official website before you pay.</p>' : '';
  const sources = (c) => (c.sources || []).length ? '<details class="faq mt2"><summary>Sources we used</summary><ul class="small">' + c.sources.map((s) => U.safeUrl(s) ? '<li><a href="' + esc(U.safeUrl(s)) + '" target="_blank" rel="noopener">' + esc(s.replace(/^https?:\/\//, '').slice(0, 80)) + '</a></li>' : '').join('') + '</ul></details>' : '';
  const ext = (url, label, cls) => U.safeUrl(url) ? '<a class="btn ' + (cls || 'ghost') + '" href="' + esc(U.safeUrl(url)) + '" target="_blank" rel="noopener">' + icon('external') + esc(label) + '</a>' : '';
  function costPerYearUSD(c) { const s = countryStats(c.name); return s ? s.tuition + s.living : 0; }

  window.UP_DEST = { findCountry, feesUSD, parseFees, fundsLocal, slugOf, countryStats, scholarshipsFor };

  /* ================= Countries list ================= */
  let cf = 'all', csort = 'name', cq = '';
  const cmpSel = new Set();
  V.countries = function (sub) {
    if (sub === 'compare') return compareView();
    const a = A(), list0 = countries();
    let list = list0.filter((c) => (cf === 'all' || c.region === cf) && (!cq || (c.name + ' ' + (c.highlights || '')).toLowerCase().includes(cq.toLowerCase())));
    list = list.slice().sort((x, y) => csort === 'cost' ? costPerYearUSD(x) - costPerYearUSD(y) : csort === 'programmes' ? ((countryStats(y.name) || {}).n || 0) - ((countryStats(x.name) || {}).n || 0) : x.name.localeCompare(y.name));
    const html = '<div class="container page">' + a.pageHead('Where to study', 'Honest destination guides: real costs in your currency, how the student visa works step by step, work rules, and scholarships — for ' + list0.length + ' countries.', '<a class="btn" href="/visa">' + icon('plane') + 'Visa help</a>') +
      '<div class="row mb2" style="gap:10px"><div class="seg" style="width:auto">' + [['all', 'All'], ['Africa', 'In Africa'], ['International', 'Abroad']].map(([k, l]) => '<button data-cf="' + k + '" aria-pressed="' + (cf === k) + '">' + l + '</button>').join('') + '</div>' +
      '<input id="c-q" type="search" placeholder="Search countries…" value="' + esc(cq) + '" style="max-width:220px" aria-label="Search countries">' +
      '<label class="row small" style="gap:6px;flex-wrap:nowrap">Sort <select id="c-sort" style="width:auto"><option value="name"' + (csort === 'name' ? ' selected' : '') + '>A–Z</option><option value="cost"' + (csort === 'cost' ? ' selected' : '') + '>Cheapest first</option><option value="programmes"' + (csort === 'programmes' ? ' selected' : '') + '>Most programmes</option></select></label></div>' +
      '<div class="grid g3">' + list.map((c) => {
        const s = countryStats(c.name), vp = visaProgress(c), sl = slugOf(c), home = isHome(c);
        return '<div class="card hover" style="display:flex;flex-direction:column"><a href="/country/' + sl + '" style="text-decoration:none;color:inherit;flex:1"><div class="row between"><span style="font-size:2rem;line-height:1">' + esc(c.flag || '🌍') + '</span><span class="badge">' + esc(c.costLevel || '') + '</span></div>' +
          '<h3 class="mt2 mb0">' + esc(c.name) + '</h3><p class="small muted">' + esc(c.highlights || '') + '</p>' +
          '<ul class="small c-facts" style="list-style:none;padding:0;margin:0 0 10px;display:grid;gap:5px">' +
          (s ? '<li>' + icon('wallet') + '<span>About <b>' + a.money(s.tuition + s.living, null, { compact: true }) + '</b> a year (fees + living)</span></li><li>' + icon('cap') + '<span>' + s.n + ' programmes · ' + s.unis + ' universities</span></li>' : '') +
          '<li>' + icon('plane') + '<span>' + (home ? 'No visa needed — your home country' : esc(c.visaName || 'Student visa') + (c.visaProcessing ? ' · ' + esc(c.visaProcessing) : '')) + '</span></li></ul>' +
          (vp ? '<div class="small">Your visa prep: <b>' + vp.pct + '%</b></div><div class="progress mt1"><span style="width:' + vp.pct + '%"></span></div>' : '') + '</a>' +
          '<label class="check small mt2"><input type="checkbox" data-cmp="' + sl + '"' + (cmpSel.has(sl) ? ' checked' : '') + '><span>Compare</span></label></div>';
      }).join('') + (list.length ? '' : '<p class="muted">No countries match.</p>') + '</div>' +
      '<div id="cmp-bar"></div>' +
      '<div class="notice mt3">' + icon('info') + '<p>We don’t apply for visas for you, but we help you get every part right: what to prepare, how much money to show, how long it takes, and how to answer interview questions. Always pay fees only on official government websites.</p></div></div>';
    setTimeout(() => {
      $$('[data-cf]').forEach((b) => b.onclick = () => { cf = b.dataset.cf; a.render(); });
      const q = $('#c-q'); if (q) { q.oninput = () => { cq = q.value; clearTimeout(q._t); q._t = setTimeout(() => { a.render(); const n = $('#c-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); }; }
      $('#c-sort').onchange = (e) => { csort = e.target.value; a.render(); };
      const bar = () => { const el = $('#cmp-bar'); if (!el) return; el.innerHTML = cmpSel.size ? '<div class="compare-tray"><span><b>' + cmpSel.size + '</b> selected' + (cmpSel.size < 2 ? ' — pick at least 2' : '') + '</span><button class="btn sm ghost" id="cmp-clear">Clear</button><a class="btn sm" href="/countries/compare?c=' + [...cmpSel].join(',') + '"' + (cmpSel.size < 2 ? ' aria-disabled="true" style="pointer-events:none;opacity:.5"' : '') + '>' + icon('grid') + 'Compare</a></div>' : ''; const cl = $('#cmp-clear'); if (cl) cl.onclick = () => { cmpSel.clear(); a.render(); }; };
      $$('[data-cmp]').forEach((cb) => cb.onchange = () => { if (cb.checked) { if (cmpSel.size >= 4) { cb.checked = false; return U.toast('Compare up to 4 countries', 'info'); } cmpSel.add(cb.dataset.cmp); } else cmpSel.delete(cb.dataset.cmp); bar(); });
      bar();
    });
    return html;
  };

  /* ================= Compare ================= */
  function compareView() {
    const a = A();
    let picks = (qs().get('c') || '').split(',').map(findCountry).filter(Boolean);
    if (picks.length < 2) picks = countries().filter((c) => ['United Kingdom', 'Canada', 'Kenya'].includes(c.name));
    const all = countries();
    const row = (label, fn) => '<tr><th style="min-width:150px">' + label + '</th>' + picks.map((c) => '<td>' + fn(c) + '</td>').join('') + '</tr>';
    const years = 3;
    const html = '<div class="container page"><a href="/countries" class="btn link">' + icon('left') + 'All countries</a>' + a.pageHead('Compare destinations', 'Side by side, in ' + a.cur() + '. Totals assume a ' + years + '-year degree using typical fees on UniPath.') +
      '<div class="row mb2" style="gap:8px">' + [0, 1, 2, 3].map((i) => '<select data-pick="' + i + '" aria-label="Country ' + (i + 1) + '"><option value="">' + (i < 2 ? 'Choose…' : '— none —') + '</option>' + all.map((c) => '<option value="' + slugOf(c) + '"' + (picks[i] === c ? ' selected' : '') + '>' + esc(c.flag + ' ' + c.name) + '</option>').join('') + '</select>').join('') + '</div>' +
      '<div class="table-wrap"><table class="tbl"><thead><tr><th></th>' + picks.map((c) => '<th><a href="/country/' + slugOf(c) + '">' + esc(c.flag + ' ' + c.name) + '</a></th>').join('') + '</tr></thead><tbody>' +
      row('Typical tuition / year', (c) => { const s = countryStats(c.name); return s ? a.money(s.tuition, null, { compact: true }) : '—'; }) +
      row('Typical living / year', (c) => { const s = countryStats(c.name); return s ? a.money(s.living, null, { compact: true }) : '—'; }) +
      row('Visa & health fees (' + years + ' yrs)', (c) => isHome(c) ? 'None (home)' : a.money(feesUSD(c, years), null, { compact: true }) + (parseFees(c).some((f) => f.amount == null) ? ' <small class="muted">+ fees to confirm</small>' : '')) +
      row('<b>Estimated total, ' + years + ' years</b>', (c) => { const s = countryStats(c.name); return s ? '<b>' + a.money((s.tuition + s.living) * years + (isHome(c) ? 0 : feesUSD(c, years)), null, { compact: true }) + '</b>' : '—'; }) +
      row('Money to show for the visa', (c) => isHome(c) ? '—' : fundsLocal(c) != null ? both(fundsLocal(c), c.fundsCurrency, { compact: true }) + ' <small class="muted">+ tuition</small>' : '<small>' + esc(c.fundsNote || 'Proof you can pay') + '</small>') +
      row('Visa processing', (c) => esc(c.visaProcessing || '—')) +
      row('Visa interview', (c) => esc(c.visaInterview || 'Rare')) +
      row('Work while studying', (c) => '<small>' + esc(c.studentWork || '—') + '</small>') +
      row('Work after graduating', (c) => '<small>' + esc(c.postStudyWork || '—') + '</small>') +
      row('Course start dates', (c) => '<small>' + esc(c.intakes || '—') + '</small>') +
      row('Programmes on UniPath', (c) => { const s = countryStats(c.name); return s ? s.n + ' at ' + s.unis + ' universities' : '0'; }) +
      row('Scholarships listed', (c) => String(scholarshipsFor(c).length)) +
      row('', (c) => '<a class="btn sm" href="/country/' + slugOf(c) + '">Open guide</a>') +
      '</tbody></table></div><p class="small muted mt2">Estimates use median programme costs on UniPath and current exchange rates set by our team. Real costs depend on the university and city.</p></div>';
    setTimeout(() => $$('[data-pick]').forEach((s) => s.onchange = () => {
      const vals = $$('[data-pick]').map((x) => x.value).filter(Boolean); U.go('/countries/compare?c=' + [...new Set(vals)].join(','), { replace: true });
    }));
    return html;
  }

  /* ================= Country guide ================= */
  const TABS = [['overview', 'compass', 'Overview'], ['costs', 'wallet', 'Costs'], ['apply', 'calendar', 'Timeline'], ['visa', 'plane', 'Visa help'], ['work', 'clock', 'Work'], ['funding', 'award', 'Scholarships & courses']];
  V.country = function (key, tab) {
    const a = A(), C = a.C;
    const c = findCountry(key);
    if (!c) return '<div class="container page">' + a.emptyState('globe', 'Country not found', 'Try the full list of destinations.', '<a class="btn" href="/countries">All countries</a>') + '</div>';
    const sl = slugOf(c);
    const askedTab = tab;
    if (key !== sl) setTimeout(() => U.go('/country/' + sl + (askedTab ? '/' + askedTab : ''), { replace: true }));
    tab = TABS.some((t) => t[0] === tab) ? tab : 'overview';
    const s = countryStats(c.name); U.track('country', c.name);
    const body = { overview: tabOverview, costs: tabCosts, apply: tabApply, visa: tabVisa, work: tabWork, funding: tabFunding }[tab](c, s);
    document.title = c.name + ' — ' + (TABS.find((t) => t[0] === tab) || [])[2] + ' · ' + ((C.site && C.site.name) || 'UniPath Africa');
    return '<div class="container page"><a href="/countries" class="btn link">' + icon('left') + 'All countries</a>' +
      '<div class="row mt2" style="gap:16px;flex-wrap:nowrap"><span style="font-size:3rem;line-height:1">' + esc(c.flag || '🌍') + '</span><div><h1 class="mb0" style="font-size:clamp(1.7rem,4vw,2.5rem)">Study in ' + esc(c.name) + '</h1><p class="muted mb0">' + esc(c.highlights || '') + '</p></div></div>' +
      '<nav class="subnav mt3" aria-label="' + esc(c.name) + ' guide">' + TABS.map((t) => '<a href="/country/' + sl + (t[0] === 'overview' ? '' : '/' + t[0]) + '" class="' + (t[0] === tab ? 'active' : '') + '"' + (t[0] === tab ? ' aria-current="page"' : '') + '>' + icon(t[1]) + t[2] + '</a>').join('') + '</nav>' +
      body + '</div>';
  };

  function tabOverview(c, s) {
    const a = A(), prof = a.S.profile || {}, sl = slugOf(c), home = isHome(c);
    const fact = (ic, label, val) => '<div class="card"><div class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start"><div class="feature-icon" style="margin:0;width:40px;height:40px;flex:none">' + icon(ic) + '</div><div><b>' + label + '</b><p class="small mb0 mt1">' + esc(val || '—') + '</p></div></div></div>';
    let fit = '';
    if (s) {
      const budget = prof.budgetAmount ? U.toUSD(prof.budgetAmount, prof.budgetCurrency || 'UGX') : 0;
      const yr = s.tuition + s.living;
      const fields = prof.field ? s.ps.filter((p) => p.field === prof.field).length : null;
      fit = '<div class="card tint mt3"><h3 class="mt0">Is ' + esc(c.name) + ' a good fit for you?</h3><ul class="reasons">' +
        (budget ? (yr <= budget ? '<li class="yes">' + icon('check') + '<span>Typical yearly cost (' + a.money(yr, null, { compact: true }) + ') is within your budget.</span></li>' : '<li class="' + (yr <= budget * 1.5 ? 'maybe' : 'no') + '">' + icon('alert') + '<span>Typical yearly cost (' + a.money(yr, null, { compact: true }) + ') is above your budget of ' + a.money(budget, null, { compact: true }) + ' — you’d likely need a scholarship.</span></li>') : '<li class="maybe">' + icon('info') + '<span>Typical yearly cost: ' + a.money(yr, null, { compact: true }) + '. <a href="/discover">Add your budget</a> to see if it fits.</span></li>') +
        (fields != null ? '<li class="' + (fields ? 'yes' : 'no') + '">' + icon(fields ? 'check' : 'x') + '<span>' + fields + ' ' + esc(prof.field) + ' programme' + (fields === 1 ? '' : 's') + ' listed here.</span></li>' : '') +
        (home ? '<li class="yes">' + icon('check') + '<span>This is your home country — no visa needed.</span></li>' : '<li class="maybe">' + icon('plane') + '<span>' + esc(c.visaName || 'Student visa') + ' needed · ' + esc(c.visaProcessing || 'check processing time') + '. <a href="/country/' + sl + '/visa">See visa help</a></span></li>') +
        (scholarshipsFor(c).length ? '<li class="yes">' + icon('award') + '<span>' + scholarshipsFor(c).length + ' scholarships listed for ' + esc(c.name) + '.</span></li>' : '') +
        '</ul></div>';
    }
    return (s ? '<div class="grid g4"><div class="card kpi"><div class="l">Programmes</div><div class="v">' + s.n + '</div></div><div class="card kpi"><div class="l">Universities</div><div class="v">' + s.unis + '</div></div><div class="card kpi"><div class="l">Typical tuition / yr</div><div class="v" style="font-size:1.35rem">' + a.money(s.tuition, null, { compact: true }) + '</div></div><div class="card kpi"><div class="l">Typical living / yr</div><div class="v" style="font-size:1.35rem">' + a.money(s.living, null, { compact: true }) + '</div></div></div>' : '') +
      fit +
      '<div class="grid g2 mt3">' + fact('calendar', 'When courses start', c.intakes) + fact('wallet', 'Cost level', (c.costLevel || '') + (c.livingNote ? ' — ' + c.livingNote : '')) + fact('clock', 'Working while you study', c.studentWork) + fact('award', 'Working after you graduate', c.postStudyWork) + fact('shield', 'Health cover', c.healthCover) + fact('plane', home ? 'Visa' : c.visaName || 'Student visa', home ? 'Not needed — this is your home country.' : (c.visaWhere || '')) + '</div>' +
      '<div class="grid g3 mt3">' +
      '<a class="card hover" href="/country/' + sl + '/costs" style="text-decoration:none;color:inherit">' + icon('wallet') + '<h4 class="mt1 mb0">Work out the full cost</h4><p class="small muted mb0">Tuition, living, visa and health fees in ' + a.cur() + '.</p></a>' +
      '<a class="card hover" href="/country/' + sl + '/apply" style="text-decoration:none;color:inherit">' + icon('calendar') + '<h4 class="mt1 mb0">Build my timeline</h4><p class="small muted mb0">Every step dated back from your start date.</p></a>' +
      '<a class="card hover" href="/country/' + sl + '/visa" style="text-decoration:none;color:inherit">' + icon('plane') + '<h4 class="mt1 mb0">Get visa-ready</h4><p class="small muted mb0">Checklist, money rules, interview practice.</p></a></div>' +
      '<div class="row mt3">' + ext(c.officialLink, 'Official study website') + (home ? '' : ext(c.visaLink, 'Official visa website')) + '</div>' + lastChecked(c) + sources(c);
  }

  function tabCosts(c, s) {
    const a = A(), sl = slugOf(c), st = vstate(sl), home = isHome(c), prof = a.S.profile || {};
    const calc = Object.assign({ years: prof.level === 'Postgraduate' ? 1 : 3, tuition: s ? Math.round(U.fromUSD(s.tuition, a.cur())) : 0, living: s ? Math.round(U.fromUSD(s.living, a.cur())) : 0, travel: Math.round(U.fromUSD(home ? 0 : c.region === 'Africa' ? 300 : 900, a.cur())), scholarship: 0 }, st.calc && st.calc.cur === a.cur() ? st.calc : {});
    const fees = parseFees(c);
    const html = '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="cost-grid"><div class="card"><h3 class="mt0">Your cost calculator</h3><p class="small muted">Starts with typical figures for ' + esc(c.name) + '. Change any number to match your university’s offer. Amounts are in ' + a.cur() + ' (change currency with the ' + icon('sliders') + ' button at the top).</p>' +
      '<form id="cc" class="form-grid">' +
      '<label class="field"><span>Years of study</span><input type="number" name="years" min="1" max="7" value="' + calc.years + '"></label>' +
      '<label class="field"><span>Tuition per year (' + a.cur() + ')</span><input type="number" name="tuition" min="0" step="1" value="' + calc.tuition + '"></label>' +
      '<label class="field"><span>Living costs per year (' + a.cur() + ')</span><input type="number" name="living" min="0" step="1" value="' + calc.living + '"></label>' +
      '<label class="field"><span>Flights / travel (' + a.cur() + ', total)</span><input type="number" name="travel" min="0" step="1" value="' + calc.travel + '"></label>' +
      '<label class="field full"><span>Scholarship or sponsor support per year (' + a.cur() + ')</span><input type="number" name="scholarship" min="0" step="1" value="' + calc.scholarship + '"></label></form>' +
      '<div id="cc-out" class="mt3"></div></div>' +
      '<aside class="stack">' + (home ? '<div class="card"><b>No visa costs</b><p class="small muted mb0">This is your home country.</p></div>' : '<div class="card"><h4 class="mt0">Visa & official fees</h4><p class="small muted">Paid to the ' + esc(c.name) + ' government or its official visa centre — never to UniPath.</p><ul class="small" style="padding-left:18px">' + fees.map((f) => '<li><b>' + esc(f.label) + ':</b> ' + (f.amount == null ? '<span class="muted">' + esc(f.note || 'check official site') + '</span>' : both(f.amount, f.currency) + (f.per === 'year' ? ' per year' : '') + (f.note ? ' <span class="muted">— ' + esc(f.note) + '</span>' : '')) + '</li>').join('') + '</ul>' + (isEAC() && c.eacNote ? '<p class="small mb0">' + icon('star') + ' ' + esc(c.eacNote) + '</p>' : '') + '</div>' +
      '<div class="card"><h4 class="mt0">Money you must show</h4><p class="small">' + esc(c.fundsNote || 'Show you can pay tuition and living costs.') + '</p>' + (fundsLocal(c) != null ? '<div class="big-num" style="font-size:1.4rem">' + both(fundsLocal(c), c.fundsCurrency, { only: true }) + '</div><small class="muted">' + local(fundsLocal(c), c.fundsCurrency) + ' for living costs</small>' : '') + '</div>') +
      '<div class="card"><h4 class="mt0">Ways to bring the cost down</h4><ul class="small" style="padding-left:18px"><li>Choose a cheaper city (' + esc(c.livingNote || 'outside the capital') + ')</li><li><a href="/country/' + sl + '/funding">Scholarships for ' + esc(c.name) + '</a></li><li>Shorter programmes (one-year master’s, top-up degrees)</li><li>Ask about instalment plans and early-payment discounts</li></ul></div></aside></div>';
    setTimeout(() => {
      const g = $('#cost-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      const f = $('#cc'); if (!f) return;
      const draw = () => {
        const v = Object.fromEntries([...new FormData(f)].map(([k, x]) => [k, Math.max(0, +x || 0)]));
        v.years = Math.max(1, Math.min(7, v.years || 1));
        const uc = a.cur(), feesU = home ? 0 : U.fromUSD(feesUSD(c, v.years), uc);
        const tuitionT = v.tuition * v.years, livingT = v.living * v.years, sch = v.scholarship * v.years;
        const total = tuitionT + livingT + v.travel + feesU - sch;
        const fmt = (n) => uc + ' ' + Math.round(n).toLocaleString('en-US');
        const showFunds = !home && fundsLocal(c) != null ? U.fromUSD(toUSDsafe(fundsLocal(c), c.fundsCurrency), uc) + v.tuition : null;
        const bar = (label, n, cls) => total > 0 ? '<div class="bar-row"><span>' + label + '</span><div class="bars"><span class="' + (cls || '') + '" style="width:' + Math.max(1, Math.min(100, n / (total + sch) * 100)) + '%"></span></div><b class="num">' + fmt(n) + '</b></div>' : '';
        $('#cc-out').innerHTML = '<div class="card flat"><div class="row between"><div><div class="small muted">Estimated total for ' + v.years + ' year' + (v.years > 1 ? 's' : '') + '</div><div class="big-num">' + fmt(total) + '</div><div class="small muted">About ' + fmt(total / v.years / 12) + ' a month</div></div>' + (showFunds ? '<div class="tc"><div class="small muted">Money to show for the visa</div><b style="font-size:1.2rem">' + fmt(showFunds) + '</b><div class="small muted">(first-year tuition + living rule)</div></div>' : '') + '</div>' +
          '<div class="mt2">' + bar('Tuition', tuitionT) + bar('Living', livingT) + bar('Visa & health fees', feesU) + bar('Travel', v.travel) + (sch ? '<p class="small mt1">' + icon('award') + ' Minus scholarship / sponsor: <b>' + fmt(sch) + '</b></p>' : '') + '</div>' +
          '<div class="notice warn mt2">' + icon('alert') + '<p class="small mb0">This is a quick estimate. Uni usually costs more than people plan — deposits, fee rises, exchange rates and a dozen small costs. The <b>True Cost Planner</b> adds all of them.</p></div><div class="row mt2"><button class="btn sm" id="cc-plan">' + icon('wallet') + 'Open the True Cost Planner</button><button class="btn sm ghost" id="cc-print">' + icon('printer') + 'Print</button></div></div>';
        st.calc = Object.assign({ cur: uc }, v); A().save();
        $('#cc-plan').onclick = () => U.go('/prepare/costs');
        $('#cc-print').onclick = () => window.print();
      };
      f.oninput = draw; draw();
    });
    return html;
  }

  function nextIntake(c) {
    const now = new Date(); const y = now.getFullYear();
    const m = /jan/i.test(c.intakes || '') && !/sep|aug/i.test(c.intakes || '') ? 0 : /feb|march|mar/i.test(c.intakes || '') && !/sep/i.test(c.intakes || '') ? 1 : 8;
    let d = new Date(Date.UTC(y, m, 1)); if (d - now < 120 * 86400000) d = new Date(Date.UTC(y + 1, m, 1));
    return d.toISOString().slice(0, 10);
  }
  function timelineFor(c, start) {
    const home = isHome(c), lead = +c.leadWeeks || 10, w = (n) => U.addDays(start, -n * 7);
    const items = [
      [w(lead + 34), 'Shortlist universities and check entry requirements', '/match'],
      [w(lead + 30), 'Book any tests you need (English test, entrance exams)', '/prepare'],
      [w(lead + 26), 'Write your personal statement and ask for references', '/prepare/statement'],
      [w(lead + 22), 'Apply for scholarships (many close 6–12 months early)', '/country/' + slugOf(c) + '/funding'],
      [w(lead + 18), 'Submit university applications', '/track'],
      [w(lead + 6), 'Accept your offer and pay any deposit', '/track']
    ];
    if (!home) {
      if (fundsLocal(c) != null || /28 days/.test(c.fundsNote || '')) items.push([w(lead + 5), 'Have your proof of money ready' + (/28 days/.test(c.fundsNote || '') ? ' — it must stay in the account for 28 days' : ''), '/country/' + slugOf(c) + '/visa']);
      items.push([w(lead + 2), 'Gather visa documents (medicals, police clearance, photos)', '/country/' + slugOf(c) + '/visa']);
      items.push([w(lead), 'Start your ' + (c.visaName || 'visa') + ' application', '/country/' + slugOf(c) + '/visa']);
      if (c.visaInterview && c.visaInterview !== 'Rare') items.push([w(Math.max(3, lead - 4)), 'Practise visa interview questions', '/country/' + slugOf(c) + '/visa#interview']);
    }
    items.push([w(4), 'Book flights and accommodation', '/enroll'], [w(1), 'Travel — carry originals of every document', '/enroll'], [start, 'Course starts — register at the university', '/enroll']);
    return items.sort((x, y) => x[0].localeCompare(y[0]));
  }
  function tabApply(c) {
    const a = A(), sl = slugOf(c), st = vstate(sl);
    const start = st.start || nextIntake(c);
    const items = timelineFor(c, start);
    const html = '<div class="card"><div class="row between"><div><h3 class="mt0 mb0">Your ' + esc(c.name) + ' timeline</h3><p class="small muted mb0">Pick the date your course starts. We work backwards so nothing is left too late.</p></div><label class="field" style="min-width:200px"><span>Course start date</span><input type="date" id="t-start" value="' + start + '"></label></div>' +
      '<ol class="timeline mt3">' + items.map(([d, t, href]) => { const n = U.daysUntil(d); return '<li class="' + (n < 0 ? 'past' : n <= 30 ? 'soon' : '') + '"><div class="when">' + U.fmtDate(d) + ' · ' + (n < 0 ? (n > -400 ? 'should be done' : 'done') : n === 0 ? 'today' : 'in ' + n + ' days') + '</div><div><a href="' + href + '">' + esc(t) + '</a></div></li>'; }).join('') + '</ol>' +
      (items.some(([d]) => U.daysUntil(d) < 0 && d !== start) ? '<div class="notice warn mt2">' + icon('alert') + '<p>Some steps are already late for this start date. You can still try — move fast, or aim for the next intake (' + esc(c.intakes || '') + ').</p></div>' : '') +
      '<div class="row mt2"><button class="btn ghost" id="t-ics">' + icon('calendar') + 'Add all to my calendar</button><a class="btn ghost" href="/summary">' + icon('printer') + 'Printable plan</a></div></div>' +
      '<div class="card mt3"><h4 class="mt0">How applying works in ' + esc(c.name) + '</h4><p class="small">Course starts: <b>' + esc(c.intakes || '—') + '</b>.</p><p class="small mb0">' + (c.region === 'Africa' ? 'Most universities take applications directly on their own websites. Public universities may also use a national system (for example JAB in Uganda or KUCCPS in Kenya for government sponsorship).' : c.name === 'United Kingdom' ? 'Undergraduates apply through UCAS (up to 5 choices). Postgraduates apply directly to each university.' : c.name === 'United States' ? 'Most universities use the Common App. Ask each one about need-based aid for international students.' : c.name === 'Canada' ? 'Apply directly to each university (or OUAC in Ontario). After your offer you will need a PAL for the study permit.' : c.name === 'Germany' ? 'Apply directly or through uni-assist. Check whether the course is taught in English or German.' : c.name === 'Netherlands' ? 'Bachelor’s applicants register in Studielink and then apply to the university.' : 'Apply directly to each university on its website.') + '</p>' + ext(c.officialLink, 'Official study website', 'ghost sm mt2') + '</div>';
    setTimeout(() => {
      const t = $('#t-start'); if (t) t.onchange = () => { st.start = t.value; a.save(); a.render(); };
      const b = $('#t-ics'); if (b) b.onclick = () => U.download('unipath-' + sl + '-timeline.ics', U.ics(items.filter(([d]) => U.daysUntil(d) >= 0).map(([d, title]) => ({ date: d, title: title + ' (' + c.name + ')', desc: 'From your UniPath Africa timeline: ' + location.origin + '/country/' + sl + '/apply' }))), 'text/calendar');
    });
    return html;
  }

  function tabVisa(c) {
    const a = A(), C = a.C, sl = slugOf(c), st = vstate(sl), home = isHome(c), s = C.site || {};
    if (home) return '<div class="card tc pad-lg">' + icon('check') + '<h3>You don’t need a visa to study in ' + esc(c.name) + '</h3><p class="muted">It’s your home country. Focus on admission, money and preparing to enrol.</p><div class="row" style="justify-content:center"><a class="btn" href="/country/' + sl + '/apply">Build my timeline</a><a class="btn ghost" href="/visa">Visa help for other countries</a></div></div>';
    const steps = c.visaSteps || [], docs = c.visaDocs || [];
    const sd = steps.filter((_, i) => st.steps[i]).length, dd = docs.filter((_, i) => st.docs[i]).length, p = pct(sd + dd, steps.length + docs.length);
    const qsAll = (C.visaInterview || []).filter((q) => q.countries === 'all' || q.countries === c.name);
    const fees = parseFees(c);
    const html = '<div class="notice">' + icon('shield') + '<p><b>We don’t apply for visas — but we’ll help you get every part right.</b> Use the checklist, money rules and interview practice below, then apply yourself on the official website. ' + (s.scopeNote ? '' : '') + '</p></div>' +
      '<div class="grid g4 mt3"><div class="card kpi"><div class="l">Visa</div><div class="v" style="font-size:1.05rem">' + esc(c.visaName || 'Student visa') + '</div></div><div class="card kpi"><div class="l">Processing</div><div class="v" style="font-size:1.05rem">' + esc(c.visaProcessing || '—') + '</div></div><div class="card kpi"><div class="l">Main visa fee (to government)</div><div class="v" style="font-size:1.05rem">' + (fees[0] && fees[0].amount != null ? both(fees[0].amount, fees[0].currency, { only: true }) : 'Check official site') + '</div></div><div class="card kpi"><div class="l">Your progress</div><div class="v">' + p + '%</div><div class="progress mt1"><span style="width:' + p + '%"></span></div></div></div>' +
      '<div class="grid g2 mt3" style="align-items:start"><div class="stack">' +
      '<div class="card"><h3 class="mt0">Step by step</h3><p class="small muted">Tick each step as you finish. It saves' + (U.API.signedIn() ? ' to your account.' : ' on this device — <a href="/account">create an account</a> to keep it safe.') + '</p><ul class="checklist">' + steps.map((t, i) => '<li class="' + (st.steps[i] ? 'done' : '') + '"><button class="tick" data-vs="' + i + '" aria-pressed="' + !!st.steps[i] + '" aria-label="Mark step ' + (i + 1) + ' done">' + icon('check') + '</button><div><div class="lbl">' + (i + 1) + '. ' + esc(t) + '</div></div></li>').join('') + '</ul></div>' +
      '<div class="card"><div class="row between"><h3 class="mt0 mb0">Documents checklist</h3><span class="badge">' + dd + '/' + docs.length + '</span></div><ul class="checklist mt1">' + docs.map((t, i) => '<li class="' + (st.docs[i] ? 'done' : '') + '"><button class="tick" data-vd="' + i + '" aria-pressed="' + !!st.docs[i] + '" aria-label="Mark document ready">' + icon('check') + '</button><div><div class="lbl">' + esc(t) + '</div></div></li>').join('') + '</ul>' +
      '<div class="row mt2"><a class="btn sm ghost" href="/prepare/vault">' + icon('upload') + 'Store copies in my Document Vault</a><button class="btn sm ghost" id="v-print">' + icon('printer') + 'Print checklist</button></div></div>' +
      '</div><div class="stack">' +
      '<div class="card tint"><h3 class="mt0">Am I visa-ready?</h3><p class="small">A 2-minute check. We’ll tell you what’s missing and update your checklist.</p><button class="btn" id="v-ready">' + icon('test') + 'Check my readiness</button></div>' +
      '<div class="card"><h3 class="mt0">Key facts</h3><dl class="small" style="display:grid;grid-template-columns:auto 1fr;gap:6px 12px;margin:0"><dt><b>Where to apply</b></dt><dd style="margin:0">' + esc(c.visaWhere || '—') + '</dd><dt><b>When</b></dt><dd style="margin:0">' + esc(c.visaWhen || '—') + '</dd><dt><b>Interview</b></dt><dd style="margin:0">' + esc(c.visaInterview || 'Rare') + '</dd><dt><b>Health cover</b></dt><dd style="margin:0">' + esc(c.healthCover || '—') + '</dd></dl>' +
      '<h4>Fees <small class="muted" style="font-weight:500">— paid to the ' + esc(c.name) + ' government or its official visa centre, never to UniPath</small></h4><ul class="small" style="padding-left:18px">' + fees.map((f) => '<li>' + esc(f.label) + ': ' + (f.amount == null ? '<span class="muted">' + esc(f.note || 'check official site') + '</span>' : '<b>' + both(f.amount, f.currency) + '</b>' + (f.per === 'year' ? ' per year' : '') + (f.note ? ' <span class="muted">— ' + esc(f.note) + '</span>' : '')) + '</li>').join('') + '</ul>' +
      '<h4>Money you must show</h4><p class="small">' + esc(c.fundsNote || '') + '</p>' + (fundsLocal(c) != null ? '<p class="mb0"><b>' + both(fundsLocal(c), c.fundsCurrency) + '</b> <small class="muted">for living costs</small></p>' : '') +
      (isEAC() && c.eacNote ? '<div class="notice ok mt2">' + icon('star') + '<p class="small">' + esc(c.eacNote) + '</p></div>' : '') +
      '<div class="row mt2">' + ext(c.visaLink, 'Official visa website', '') + '</div></div>' +
      '<div class="card"><h3 class="mt0">Tips from advisers</h3><ul class="reasons small">' + (c.visaTips || []).map((t) => '<li class="yes">' + icon('star') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></div>' +
      '</div></div>' +
      visaTools(c, st) +
      '<div class="card mt3" id="interview"><div class="row between"><div><h3 class="mt0 mb0">Visa interview practice</h3><p class="small muted mb0">' + esc(c.name) + ' interview chance: <b>' + esc(c.visaInterview || 'Rare') + '</b>. Practise out loud, then note your key points. Officers like short, honest, specific answers.</p></div><button class="btn sm" id="iv-rand">' + icon('refresh') + 'Random question + 60s timer</button></div>' +
      '<div class="stack mt2">' + qsAll.map((q, i) => '<details class="faq"><summary>' + esc(q.q) + (st.answers[i] ? ' <span class="badge ok">practised</span>' : '') + '</summary><p class="small">' + icon('help') + ' <b>Tip:</b> ' + esc(q.tip) + '</p><textarea data-ans="' + i + '" placeholder="Your key points (1–3 sentences)…" style="min-height:70px">' + esc(st.answers[i] || '') + '</textarea></details>').join('') + '</div></div>' +
      '<div class="grid g2 mt3" style="align-items:start"><div class="card"><h3 class="mt0">Why visas get refused</h3><ul class="reasons small">' + (c.refusalReasons || []).map((t) => '<li class="no">' + icon('x') + '<span>' + esc(t) + '</span></li>').join('') + '</ul><details class="faq"><summary>What if I’m refused?</summary><p class="small">Read the refusal letter carefully — it lists the exact reasons. Fix each one with stronger evidence, then decide whether to reapply, ask for a review (if offered), or defer to the next intake. Tell your university straight away. Always declare past refusals in future applications. An adviser can go through the letter with you for free.</p></details></div>' +
      '<div class="card"><h3 class="mt0">' + icon('alert') + ' Avoid scams</h3><ul class="reasons small">' + (C.scamWarnings || []).map((t) => '<li class="maybe">' + icon('shield') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></div></div>' +
      ((c.arrivalSteps || []).length ? '<div class="grid g2 mt3" style="align-items:start"><div class="card"><h3 class="mt0">' + icon('plane') + ' Before you fly</h3><ul class="checklist">' + PREDEP.map((t, i) => '<li class="' + ((st.pre || {})[i] ? 'done' : '') + '"><button class="tick" data-vp="' + i + '" aria-pressed="' + !!(st.pre || {})[i] + '" aria-label="Done">' + icon('check') + '</button><div class="lbl small">' + esc(t) + '</div></li>').join('') + '</ul></div><div class="card"><h3 class="mt0">' + icon('flag') + ' After you arrive in ' + esc(c.name) + '</h3><ul class="checklist">' + c.arrivalSteps.map((t, i) => '<li class="' + ((st.arrive || {})[i] ? 'done' : '') + '"><button class="tick" data-va="' + i + '" aria-pressed="' + !!(st.arrive || {})[i] + '" aria-label="Done">' + icon('check') + '</button><div class="lbl small">' + esc(t) + '</div></li>').join('') + '</ul><a class="small" href="/thrive/first100">Then: your first 100 days at university →</a></div></div>' : '') +
      '<div class="card tint mt3 row between"><div><h3 class="mb0">Want someone to check your visa documents?</h3><p class="small mb0">Book a free session with an adviser. We review your checklist, money evidence and interview answers before you apply.</p></div><a class="btn" href="/book?topic=visa&country=' + encodeURIComponent(c.name) + '">' + icon('calendar') + 'Book a visa document check</a></div>' +
      lastChecked(c) + sources(c);
    setTimeout(() => {
      const tog = (attr, key) => $$('[' + attr + ']').forEach((b) => b.onclick = () => { const i = b.getAttribute(attr); st[key][i] = !st[key][i]; a.save(); const y = window.scrollY; a.render(); window.scrollTo(0, y); });
      tog('data-vs', 'steps'); tog('data-vd', 'docs'); st.pre = st.pre || {}; st.arrive = st.arrive || {}; tog('data-vp', 'pre'); tog('data-va', 'arrive');
      bindVisaTools(c, st);
      $$('[data-ans]').forEach((t) => t.oninput = () => { st.answers[t.dataset.ans] = t.value; a.save(); });
      $('#v-print').onclick = () => printChecklist(c, st);
      $('#v-ready').onclick = () => readinessCheck(c, st);
      $('#iv-rand').onclick = () => randomInterview(qsAll);
      if (location.hash === '#interview') setTimeout(() => { const el = $('#interview'); if (el) el.scrollIntoView(); }, 50);
    });
    return html;
  }

  const PREDEP = ['Visa received — every detail checked (name, dates, course, university)', 'Copies of passport, visa, offer letter and receipts in your bag and in your UniPath vault', 'Original certificates and transcripts packed in hand luggage', 'Some cash in the local currency for the first days', 'Health insurance active from your arrival date', 'Airport pickup or route to campus planned; accommodation address written down', 'Phone unlocked for a local SIM, or roaming bundle ready', 'Told the university your arrival date'];
  const STATUS = ['Not started', 'Preparing documents', 'Submitted', 'Biometrics done', 'Interview booked', 'Decision pending', 'Approved', 'Refused'];
  function visaTools(c, st) {
    const ap = st.app || {};
    const links = [[c.visaLink, 'Official visa website'], [c.processingLink, 'Official processing / wait times'], [c.centreLink, 'Find your visa centre / embassy'], [c.tbLink, 'TB test rules & clinics']].filter((x) => U.safeUrl(x[0]));
    const hold = +c.fundsHoldDays || 0;
    return '<div class="card mt3"><h3 class="mt0">' + icon('external') + ' Official tools for ' + esc(c.name) + '</h3><p class="small muted">Always use these government links — never a link sent by an agent on WhatsApp.</p><div class="row">' + links.map(([u, l]) => '<a class="btn sm ghost" href="' + esc(U.safeUrl(u)) + '" target="_blank" rel="noopener">' + icon('external') + esc(l) + '</a>').join('') + '</div></div>' +
      '<div class="grid g2 mt3" style="align-items:start">' +
      '<div class="card"><h3 class="mt0">My visa application</h3><p class="small muted">Keep your references and dates in one place. Add them to your calendar so nothing is missed.</p><div class="form-grid">' +
      '<label class="field"><span>Status</span><select data-va2="status">' + STATUS.map((x) => '<option' + (ap.status === x ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Application reference number</span><input data-va2="ref" value="' + esc(ap.ref || '') + '" placeholder="From the visa website"></label>' +
      '<label class="field"><span>Date submitted</span><input type="date" data-va2="submitted" value="' + esc(ap.submitted || '') + '"></label>' +
      '<label class="field"><span>Biometrics appointment</span><input type="date" data-va2="biometrics" value="' + esc(ap.biometrics || '') + '"></label>' +
      '<label class="field"><span>Interview date (if any)</span><input type="date" data-va2="interview" value="' + esc(ap.interview || '') + '"></label>' +
      '<label class="field"><span>Course starts</span><input type="date" data-va2="start" value="' + esc(ap.start || st.start || '') + '"></label></div>' +
      (ap.status === 'Refused' ? '<div class="notice bad mt2">' + icon('alert') + '<p class="small">Sorry — that’s hard. Read the refusal letter, then <a href="/book?topic=visa&country=' + encodeURIComponent(c.name) + '">book a free session</a> and we’ll go through each reason with you. Tell your university today; many will defer your place.</p></div>' : ap.status === 'Approved' ? '<div class="notice ok mt2">' + icon('check') + '<p class="small">Congratulations! Check every detail on the visa, then work through “Before you fly” below.</p></div>' : '') +
      '<div class="row mt2"><button class="btn sm ghost" id="va-ics">' + icon('calendar') + 'Add dates to calendar</button></div></div>' +
      '<div class="stack">' + (hold ? '<div class="card"><h3 class="mt0">Money timing check</h3><p class="small">' + (hold === 28 ? 'The money must stay in your account for <b>28 days in a row</b>, and the statement must be no more than 31 days old when you apply.' : 'Your bank statements must show about <b>' + Math.round(hold / 30) + ' months</b> of history — not just a recent deposit.') + '</p><label class="field"><span>When do you plan to apply?</span><input type="date" id="va-plan" value="' + esc(ap.planApply || '') + '"></label><div id="va-hold" class="small mt1"></div></div>' : '') +
      '<div class="card"><h3 class="mt0">Sponsor letter builder</h3><p class="small">If a parent, relative or organisation is paying, most embassies want a signed letter. Fill in the details and we’ll draft it for you to print and sign.</p><button class="btn sm" id="va-letter">' + icon('pen') + 'Draft a sponsor letter</button></div>' +
      '<div class="card"><h3 class="mt0">Letter of explanation / study plan</h3><p class="small">' + (['Canada', 'Australia'].includes(c.name) ? 'This matters a lot for ' + esc(c.name) + '. ' : '') + 'Explain why this course, why this country, how you’ll pay and your plans after. Write it in Statement Studio — it checks length and clichés.</p><a class="btn sm ghost" href="/prepare/statement">' + icon('pen') + 'Open Statement Studio</a></div></div></div>';
  }
  function bindVisaTools(c, st) {
    const a = A(); st.app = st.app || {};
    $$('[data-va2]').forEach((i) => i.onchange = () => { st.app[i.dataset.va2] = i.value; a.save(); if (i.dataset.va2 === 'status') { const y = scrollY; a.render(); scrollTo(0, y); } });
    const b = $('#va-ics'); if (b) b.onclick = () => { const ap = st.app, ev = [['submitted', 'Visa application submitted'], ['biometrics', 'Biometrics appointment'], ['interview', 'Visa interview'], ['start', 'Course starts']].filter(([k]) => ap[k]).map(([k, t]) => ({ date: ap[k], title: t + ' — ' + c.name, desc: (ap.ref ? 'Reference: ' + ap.ref + '\n' : '') + (c.visaLink || '') })); if (!ev.length) return U.toast('Add a date first', 'info'); U.download('visa-' + slugOf(c) + '.ics', U.ics(ev), 'text/calendar'); };
    const pl = $('#va-plan'); if (pl) { const out = () => { const d = pl.value, h = +c.fundsHoldDays; const el = $('#va-hold'); if (!d) { el.innerHTML = ''; return; } const by = U.addDays(d, -h), stmt = U.addDays(d, -31); el.innerHTML = '<div class="notice ' + (U.daysUntil(by) < 0 ? 'warn' : 'ok') + '">' + icon('calendar') + '<p class="small mb0">' + (h === 28 ? 'Have the full amount in the account by <b>' + U.fmtDate(by) + '</b> and don’t let it drop below. Print the statement after <b>' + U.fmtDate(stmt) + '</b>.' : 'Your statements should run from about <b>' + U.fmtDate(by) + '</b> to your application date.') + (U.daysUntil(by) < 0 ? ' That date has passed — check your balance history, or apply later.' : ' That’s ' + U.daysUntil(by) + ' days from today.') + '</p></div>'; }; pl.onchange = () => { st.app.planApply = pl.value; a.save(); out(); }; out(); }
    const lt = $('#va-letter'); if (lt) lt.onclick = () => sponsorLetter(c);
  }
  function sponsorLetter(c) {
    const a = A(), prof = a.S.profile || {}, user = U.API.user() || {};
    const m = U.modal({ title: 'Sponsor letter builder', wide: true, body: '<p class="small muted mt0">Use real details only. The sponsor must read, sign and date the letter, and attach their ID and bank statements or payslips.</p><form id="sl" class="form-grid">' +
      '<label class="field"><span>Student’s full name (as in passport)</span><input name="student" required value="' + esc(user.name || prof.name || '') + '"></label><label class="field"><span>Student’s passport number</span><input name="pass"></label>' +
      '<label class="field"><span>Sponsor’s full name</span><input name="sponsor" required></label><label class="field"><span>Relationship to student</span><input name="rel" placeholder="e.g. Father, Aunt, Employer" required></label>' +
      '<label class="field"><span>Sponsor’s occupation / employer</span><input name="job" required></label><label class="field"><span>Sponsor’s ID or passport number</span><input name="sid"></label>' +
      '<label class="field"><span>University</span><input name="uni" required></label><label class="field"><span>Course</span><input name="course" required></label>' +
      '<label class="field"><span>Amount per year (with currency)</span><input name="amount" placeholder="e.g. GBP 25,000" required></label><label class="field"><span>Number of years</span><input name="years" type="number" min="1" value="3"></label>' +
      '<label class="field full"><span>The sponsor will pay for</span><select name="covers"><option>tuition fees, accommodation and living expenses</option><option>tuition fees only</option><option>accommodation and living expenses only</option></select></label>' +
      '<label class="field full"><span>Sponsor’s address, phone and email</span><textarea name="contact" required></textarea></label></form><div id="sl-out"></div>',
      footer: '<button class="btn ghost" data-close>Close</button><button class="btn" id="sl-go">' + icon('pen') + 'Create letter</button>' });
    m.el.querySelector('#sl-go').onclick = () => {
      const f = m.el.querySelector('#sl'); if (!f.reportValidity()) return; const d = Object.fromEntries(new FormData(f));
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const txt = today + '\n\nTo: The Visa Officer\n' + (c.name ? 'Re: ' + (c.visaName || 'Student visa') + ' application for ' + d.student + '\n\n' : '\n') +
        'Dear Sir or Madam,\n\nI, ' + d.sponsor + (d.sid ? ' (ID/passport no. ' + d.sid + ')' : '') + ', am the ' + d.rel.toLowerCase() + ' of ' + d.student + (d.pass ? ' (passport no. ' + d.pass + ')' : '') + '. I confirm that I will sponsor their studies in ' + d.course + ' at ' + d.uni + (c.name ? ', ' + c.name : '') + '.\n\n' +
        'I will pay ' + d.covers + ', amounting to ' + d.amount + ' per year for ' + d.years + ' year' + (+d.years > 1 ? 's' : '') + ', until the course is completed.\n\n' +
        'I work as ' + d.job + '. Attached are copies of my identification and my bank statements / proof of income showing that I have the means to provide this support.\n\nPlease contact me if you need any further information.\n\nYours faithfully,\n\n\n______________________\n' + d.sponsor + '\n' + d.contact;
      m.el.querySelector('#sl-out').innerHTML = '<label class="field mt2"><span>Your draft (edit as needed)</span><textarea id="sl-txt" style="min-height:260px;font-family:ui-monospace,monospace;font-size:.85rem">' + esc(txt) + '</textarea></label><div class="row mt1"><button class="btn sm" id="sl-copy">' + icon('copy') + 'Copy</button><button class="btn sm ghost" id="sl-dl">' + icon('download') + 'Download (.txt)</button></div><p class="small muted">Some embassies have their own sponsor forms (for example the US I-134 is not for students; Canada and the UK accept letters). Check the official website.</p>';
      m.el.querySelector('#sl-copy').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(m.el.querySelector('#sl-txt').value); U.toast('Copied', 'copy'); };
      m.el.querySelector('#sl-dl').onclick = () => U.download('sponsor-letter.txt', m.el.querySelector('#sl-txt').value);
    };
  }
  function readinessCheck(c, st) {
    const a = A();
    const Q = [
      ['passport', 'Is your passport valid for your whole course (plus 6 months)?'],
      ['offer', 'Do you have an official admission letter (or CAS / I-20 / CoE / LOA)?'],
      ['money', 'Do you have the full amount of money you must show, in your or your sponsor’s name?'],
      ['source', 'Can you explain where the money comes from (salary, business, savings, scholarship)?'],
      ['why', 'Can you say in one or two sentences why you chose this course and university?'],
      ['plan', 'Can you explain what you will do after graduating?'],
      ['match', 'Do your names, dates and amounts match on every document?'],
      ['time', 'Is your course start date more than ' + (+c.leadWeeks || 8) + ' weeks away?']
    ].concat((c.visaDocs || []).map((d, i) => ['doc' + i, 'Do you have: ' + d + '?']));
    const m = U.modal({ title: 'Am I visa-ready for ' + c.name + '?', wide: true, body: '<p class="small muted mt0">Answer honestly — this is just for you.</p><div class="stack" id="rq">' + Q.map(([k, q]) => '<div class="row between" style="gap:8px;border-bottom:1px dashed var(--line);padding:6px 0"><span class="small" style="flex:1;min-width:200px">' + esc(q) + '</span><div class="seg" style="width:auto" data-q="' + k + '">' + ['Yes', 'Not yet', 'Not sure'].map((v) => '<button type="button" data-v="' + v + '" aria-pressed="' + ((k.startsWith('doc') && st.docs[k.slice(3)] && v === 'Yes') ? 'true' : 'false') + '">' + v + '</button>').join('') + '</div></div>').join('') + '</div>', footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn" data-go>See my result</button>' });
    $$('[data-q]', m.el).forEach((g) => $$('button', g).forEach((b) => b.onclick = () => $$('button', g).forEach((x) => x.setAttribute('aria-pressed', x === b))));
    m.el.querySelector('[data-go]').onclick = () => {
      const ans = {}; $$('[data-q]', m.el).forEach((g) => { const b = g.querySelector('[aria-pressed="true"]'); ans[g.dataset.q] = b ? b.dataset.v : ''; });
      Q.forEach(([k]) => { if (k.startsWith('doc')) st.docs[k.slice(3)] = ans[k] === 'Yes'; });
      a.save();
      const yes = Q.filter(([k]) => ans[k] === 'Yes').length, score = pct(yes, Q.length);
      const todo = Q.filter(([k]) => ans[k] !== 'Yes');
      m.close();
      U.modal({ title: 'Your visa readiness: ' + score + '%', wide: true, body: '<div class="progress"><span style="width:' + score + '%"></span></div><p class="mt2">' + (score >= 90 ? '<b>Looking strong.</b> Book a free document check before you submit.' : score >= 60 ? '<b>Getting there.</b> Fix these before you apply:' : '<b>Not ready yet.</b> That’s normal — start with these:') + '</p>' + (todo.length ? '<ul class="reasons small">' + todo.map(([, q]) => '<li class="maybe">' + icon('right') + '<span>' + esc(q.replace(/^Do you have: /, 'Get: ').replace(/\?$/, '')) + '</span></li>').join('') + '</ul>' : ''), footer: '<a class="btn ghost" href="/book?topic=visa&country=' + encodeURIComponent(c.name) + '" data-close>Book a document check</a><button class="btn" data-close>Back to checklist</button>', onClose: () => a.render() });
    };
  }
  function randomInterview(list) {
    if (!list.length) return;
    let i = Math.floor(Math.random() * list.length), left = 60, timer = null;
    const m = U.modal({ title: 'Visa interview practice', body: '<p class="small muted mt0">Answer out loud as if the officer asked you. Aim for 2–3 clear sentences.</p><h3 id="iv-q"></h3><div class="big-num tc" id="iv-t">60</div><details class="faq"><summary>Show tip</summary><p class="small" id="iv-tip"></p></details>', footer: '<button class="btn ghost" data-close>Done</button><button class="btn" id="iv-next">' + icon('refresh') + 'Next question</button>', onClose: () => clearInterval(timer) });
    const show = () => { const q = list[i]; m.el.querySelector('#iv-q').textContent = q.q; m.el.querySelector('#iv-tip').textContent = q.tip; left = 60; clearInterval(timer); const t = m.el.querySelector('#iv-t'); t.textContent = left; timer = setInterval(() => { left--; t.textContent = left > 0 ? left : 'Time!'; if (left <= 0) clearInterval(timer); }, 1000); };
    m.el.querySelector('#iv-next').onclick = () => { i = (i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length; show(); };
    show();
  }
  function printChecklist(c, st) {
    const w = window.open('', '_blank'); if (!w) return U.toast('Allow pop-ups to print', 'info');
    const li = (arr, key) => arr.map((t, i) => '<li>' + (st[key][i] ? '☑' : '☐') + ' ' + esc(t) + '</li>').join('');
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(c.name) + ' visa checklist</title><style>body{font:14px/1.5 system-ui,sans-serif;max-width:720px;margin:30px auto;padding:0 16px}li{list-style:none;margin:6px 0}h1{font-size:22px}</style><h1>' + esc(c.flag + ' ' + c.name + ' — ' + (c.visaName || 'visa') + ' checklist') + '</h1><p>Official website: ' + esc(c.visaLink || '') + '</p><h2>Steps</h2><ul>' + li(c.visaSteps || [], 'steps') + '</ul><h2>Documents</h2><ul>' + li(c.visaDocs || [], 'docs') + '</ul><h2>Money to show</h2><p>' + esc(c.fundsNote || '') + '</p><p style="color:#666;font-size:12px">From UniPath Africa · ' + new Date().toLocaleDateString('en-GB') + ' · Always confirm on the official website.</p><script>print()<\/script>');
    w.document.close();
  }

  function tabWork(c) {
    const home = isHome(c);
    return '<div class="grid g2"><div class="card"><h3 class="mt0">' + icon('clock') + ' While you study</h3><p>' + esc(c.studentWork || '—') + '</p><ul class="small" style="padding-left:18px"><li>Your visa conditions are the final word — breaking them can end your studies.</li><li>Campus jobs (library, labs, cafés) are often the easiest to get.</li><li>Don’t count on part-time work to pay tuition; use it for extra living costs.</li></ul></div>' +
      '<div class="card"><h3 class="mt0">' + icon('award') + ' After you graduate</h3><p>' + esc(c.postStudyWork || '—') + '</p><ul class="small" style="padding-left:18px"><li>Use your university’s careers service from year one.</li><li>Internships and placements make it much easier to get hired.</li><li>Keep your CV and LinkedIn up to date.</li></ul></div></div>' +
      (home ? '' : '<div class="notice mt3">' + icon('info') + '<p>Work rules change often. Check the official website before taking any job: ' + (U.safeUrl(c.visaLink) ? '<a href="' + esc(U.safeUrl(c.visaLink)) + '" target="_blank" rel="noopener">' + esc(c.visaLink.replace(/^https?:\/\//, '')) + '</a>' : '') + '</p></div>') + lastChecked(c);
  }

  function tabFunding(c, s) {
    const a = A(), sch = scholarshipsFor(c);
    return (sch.length ? '<h3>Scholarships for ' + esc(c.name) + '</h3><div class="grid g3">' + sch.map((x) => '<div class="card"><span class="badge brand">' + esc(x.coverage || '') + '</span><h4 class="mt1">' + esc(x.name) + '</h4><p class="small muted">' + esc(x.deadlineNote || '') + '</p>' + (U.safeUrl(x.url) ? '<a class="btn sm ghost" href="' + esc(U.safeUrl(x.url)) + '" target="_blank" rel="noopener">' + icon('external') + 'Official page</a>' : '') + '</div>').join('') + '</div><p class="small mt2"><a href="/prepare/scholarships">See every scholarship and track your applications →</a></p>' : '<div class="card"><p class="mb0">No scholarships listed for ' + esc(c.name) + ' yet. <a href="/prepare/scholarships">Browse all scholarships</a>.</p></div>') +
      (s ? '<h3 class="mt4">Programmes in ' + esc(c.name) + ' (' + s.n + ')</h3><div class="row mb2"><a class="btn sm ghost" href="/browse?country=' + encodeURIComponent(c.name) + '">' + icon('sliders') + 'Filter these programmes</a><a class="btn sm ghost" href="/discover">' + icon('target') + 'Get matched</a></div><div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>University</th><th>Level</th><th>Cost / yr</th><th>Deadline</th></tr></thead><tbody>' + s.ps.slice().sort((x, y) => x.university.localeCompare(y.university) || x.program.localeCompare(y.program)).map((p) => '<tr><td><a href="/program/' + encodeURIComponent(p.id) + '"><b>' + esc(p.program) + '</b></a>' + (p.verified ? ' <span class="badge ok">Verified</span>' : '') + '</td><td>' + esc(p.university) + '</td><td>' + esc(p.level) + '</td><td class="num">' + a.money(+p.tuitionUSD + +p.livingUSD, null, { compact: true }) + '</td><td>' + U.fmtDate(p.deadline) + '</td></tr>').join('') + '</tbody></table></div>' : '');
  }

  /* ================= Visa help hub ================= */
  V.visa = function () {
    const a = A(), C = a.C, list = countries().filter((c) => !isHome(c));
    const mine = list.map((c) => [c, visaProgress(c)]).filter((x) => x[1]);
    return '<div class="container page">' + a.pageHead('Visa help', 'We don’t submit visas — you apply directly with the government, which is cheaper and safer. But we help with everything around it: what to prepare, how much money to show, timing, interview practice, and avoiding scams.') +
      (mine.length ? '<div class="card tint mb2"><h3 class="mt0">Your visa preparation</h3><div class="grid g3">' + mine.map(([c, p]) => '<a class="card hover" href="/country/' + slugOf(c) + '/visa" style="text-decoration:none;color:inherit"><b>' + esc(c.flag + ' ' + c.name) + '</b><div class="progress mt1"><span style="width:' + p.pct + '%"></span></div><small class="muted">' + p.done + ' of ' + p.total + ' done</small></a>').join('') + '</div></div>' : '') +
      '<h3>Choose your destination</h3><div class="table-wrap"><table class="tbl"><thead><tr><th>Country</th><th>Visa</th><th>Main fee</th><th>Money to show (living)</th><th>Processing</th><th>Interview</th></tr></thead><tbody>' +
      list.map((c) => { const f = parseFees(c)[0]; return '<tr><td><a href="/country/' + slugOf(c) + '/visa"><b>' + esc(c.flag + ' ' + c.name) + '</b></a></td><td>' + esc(c.visaName || '') + '</td><td class="num">' + (f && f.amount != null ? both(f.amount, f.currency, { only: true }) : '<small class="muted">confirm</small>') + '</td><td class="num">' + (fundsLocal(c) != null ? both(fundsLocal(c), c.fundsCurrency, { only: true, compact: true }) : '<small class="muted">proof you can pay</small>') + '</td><td><small>' + esc(c.visaProcessing || '') + '</small></td><td>' + esc(c.visaInterview || 'Rare') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
      '<div class="grid g2 mt3" style="align-items:start"><div class="card"><h3 class="mt0">How every student visa works</h3><ol class="small" style="padding-left:20px;display:grid;gap:6px"><li><b>Get admitted.</b> You need an official letter (CAS, I-20, CoE, LOA or admission letter) first.</li><li><b>Prepare the money.</b> Show tuition + living costs. Some countries need it in the bank for a set time (UK: 28 days).</li><li><b>Collect documents.</b> Passport, certificates, medicals, police clearance, photos, insurance.</li><li><b>Apply online</b> on the official government website and pay the fee there.</li><li><b>Biometrics / interview.</b> Fingerprints and photo at a visa centre; some countries interview you.</li><li><b>Decision.</b> Check every detail on your visa the moment you get it.</li></ol></div>' +
      '<div class="card"><h3 class="mt0">Proof of money — get it right</h3><ul class="reasons small"><li class="yes">' + icon('check') + '<span>Use statements printed and stamped by the bank, with your (or your sponsor’s) full name.</span></li><li class="yes">' + icon('check') + '<span>Keep the balance above the required amount for the whole period — don’t withdraw.</span></li><li class="yes">' + icon('check') + '<span>If a parent pays, include a letter from them, their ID and proof of your relationship (birth certificate).</span></li><li class="yes">' + icon('check') + '<span>Explain any large recent deposits (sale of land, loan, business income) with documents.</span></li><li class="no">' + icon('x') + '<span>Never “borrow” money into your account just for the statement — officers notice.</span></li></ul></div></div>' +
      '<div class="card mt3"><div class="row between"><div><h3 class="mt0 mb0">Interview practice</h3><p class="small muted mb0">The most common questions across all countries, with tips.</p></div><button class="btn sm" id="hub-iv">' + icon('mic') + 'Practise now</button></div><div class="stack mt2">' + (C.visaInterview || []).filter((q) => q.countries === 'all').map((q) => '<details class="faq"><summary>' + esc(q.q) + '</summary><p class="small">' + esc(q.tip) + '</p></details>').join('') + '</div></div>' +
      '<div class="grid g2 mt3" style="align-items:start"><div class="card"><h3 class="mt0">If your visa is refused</h3><ol class="small" style="padding-left:20px"><li>Don’t panic — many students succeed on a second try.</li><li>Read the refusal letter: it lists the exact reasons.</li><li>Fix each reason with stronger evidence.</li><li>Tell your university — they may defer your place.</li><li>Always declare the refusal in future applications.</li></ol><a class="btn sm ghost" href="/book?topic=visa">' + icon('message') + 'Go through it with an adviser</a></div>' +
      '<div class="card"><h3 class="mt0">' + icon('alert') + ' Scam warnings</h3><ul class="reasons small">' + (C.scamWarnings || []).map((t) => '<li class="maybe">' + icon('shield') + '<span>' + esc(t) + '</span></li>').join('') + '</ul></div></div>' +
      ((C.site || {}).scopeNote ? '<div class="notice warn mt3">' + icon('shield') + '<p class="small">' + esc(C.site.scopeNote) + '</p></div>' : '') + '</div>';
  };
  document.addEventListener('click', (e) => { if (e.target.closest && e.target.closest('#hub-iv')) randomInterview((A().C.visaInterview || []).filter((q) => q.countries === 'all')); });

  /* ================= Plans (pricing can be switched off by the owner) ================= */
  V.plans = function () {
    const a = A(), C = a.C, s = C.site || {}, plans = C.plans || [];
    if (!s.showPricing) {
      const feats = [...new Set(plans.flatMap((p) => p.features || []))];
      return '<div class="container page" style="max-width:900px"><div class="section-head center"><span class="eyebrow">Everything is free</span><h1 style="font-size:clamp(1.9rem,4vw,2.6rem)">All UniPath features are free right now.</h1><p class="muted">' + esc(s.freeNote || 'No fees, no hidden charges. Use every tool and talk to an adviser at no cost until further notice.') + '</p></div>' +
        '<div class="card pad-lg"><h3 class="mt0">What you get, free</h3><ul class="reasons" style="columns:2;column-gap:28px">' + (feats.length ? feats : ['Programme matching', 'Application tracker', 'Document vault', 'Visa help']).map((f) => '<li class="yes" style="break-inside:avoid">' + icon('check') + '<span>' + esc(f) + '</span></li>').join('') + '</ul><div class="row mt2"><a class="btn" href="/book">' + icon('calendar') + 'Book a free consultation</a><a class="btn ghost" href="/discover">' + icon('target') + 'Get matched</a></div></div>' +
        (s.scopeNote ? '<div class="notice warn mt3">' + icon('shield') + '<p>' + esc(s.scopeNote) + '</p></div>' : '') + '</div>';
    }
    return '<div class="container page"><div class="section-head center"><span class="eyebrow">Plans</span><h1 style="font-size:clamp(1.9rem,4vw,2.6rem)">Free to use. Extra help when you want it.</h1><p class="muted">Every tool on UniPath is free. If you’d like a real adviser to check your work or guide you step by step, choose a support plan.</p><p class="small muted">These are optional UniPath adviser services only. University application fees, tuition and visa fees are separate and are always paid directly to the university or government.</p></div>' +
      '<div class="grid g3" style="align-items:stretch">' + plans.map((p) => '<div class="card" style="display:flex;flex-direction:column;' + (p.highlight ? 'border:2px solid var(--brand);box-shadow:var(--shadow)' : '') + '">' + (p.highlight ? '<span class="badge brand" style="align-self:flex-start">Most popular</span>' : '') +
        '<h3 class="mt1">' + esc(p.name) + '</h3><div class="big-num">' + esc(p.price) + '</div><p class="small muted">' + esc(p.period || '') + '</p><p>' + esc(p.tagline || '') + '</p>' +
        '<ul class="reasons" style="flex:1">' + (p.features || []).map((f) => '<li class="yes">' + icon('check') + '<span>' + esc(f) + '</span></li>').join('') + '</ul>' +
        '<a class="btn ' + (p.highlight ? '' : 'ghost') + ' block mt2" href="' + esc(U.safeUrl(p.link) || '/book') + '">' + esc(p.cta || 'Choose') + '</a></div>').join('') + '</div>' +
      (s.plansNote ? '<p class="small muted tc mt3">' + esc(s.plansNote) + '</p>' : '') +
      (s.scopeNote ? '<div class="notice warn mt3">' + icon('shield') + '<p>' + esc(s.scopeNote) + '</p></div>' : '') + '</div>';
  };

  /* ================= Book a consultation ================= */
  V.book = function () {
    const a = A(), C = a.C, s = C.site || {}, prof = a.S.profile || {}, user = U.API.user() || {};
    const q = qs(), topic = q.get('topic') || '', qc = q.get('country') || '';
    const wa = (s.whatsapp || '').replace(/[^\d]/g, '');
    const minDate = U.addDays(new Date().toISOString().slice(0, 10), 1);
    const TOPICS = [['general', 'Choosing a course or university'], ['apply', 'Help with my applications'], ['statement', 'Personal statement review'], ['scholarship', 'Scholarships & funding'], ['visa', 'Visa documents & interview practice'], ['other', 'Something else']];
    const html = '<div class="container page" style="max-width:980px"><div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;gap:26px" id="bk-grid"><div>' +
      '<span class="eyebrow">Free consultation</span><h1 style="font-size:clamp(1.8rem,4vw,2.4rem)">Talk to a UniPath adviser</h1><p class="muted">Tell us a little about yourself and choose a time. An adviser will confirm by WhatsApp or email.</p>' +
      '<form id="bk" class="card pad-lg form-grid mt2">' +
      '<label class="field full"><span>What do you need help with?</span><select name="topic">' + TOPICS.map(([k, l]) => '<option value="' + k + '"' + (k === topic ? ' selected' : '') + '>' + l + '</option>').join('') + '</select></label>' +
      '<label class="field"><span>Full name</span><input name="name" required autocomplete="name" value="' + esc(user.name || prof.name || '') + '"></label>' +
      '<label class="field"><span>I am a…</span><select name="who"><option>Student</option><option>Parent or guardian</option><option>Teacher or counsellor</option><option>Other</option></select></label>' +
      '<label class="field"><span>Email</span><input type="email" name="email" required autocomplete="email" value="' + esc(user.email || '') + '"></label>' +
      '<label class="field"><span>Phone / WhatsApp</span><input type="tel" name="phone" required autocomplete="tel" value="' + esc(user.phone || '') + '" placeholder="+256…"></label>' +
      '<label class="field"><span>Level</span><select name="level"><option ' + (prof.level !== 'Postgraduate' ? 'selected' : '') + '>Undergraduate</option><option ' + (prof.level === 'Postgraduate' ? 'selected' : '') + '>Postgraduate</option><option>Diploma</option><option>Not sure yet</option></select></label>' +
      '<label class="field"><span>Where would you like to study?</span><input name="destination" value="' + esc(qc || (prof.destinations || []).join(', ')) + '" placeholder="e.g. Uganda, Kenya, UK"></label>' +
      '<label class="field"><span>How should we talk?</span><select name="channel"><option>WhatsApp call</option><option>Phone call</option><option>Google Meet</option></select></label>' +
      '<label class="field"><span>Preferred day</span><input type="date" name="date" required min="' + minDate + '" value="' + minDate + '"></label>' +
      '<label class="field"><span>Preferred time</span><select name="slot"><option>Morning (9am–12pm)</option><option>Afternoon (12pm–3pm)</option><option>Late afternoon (3pm–6pm)</option></select></label>' +
      '<label class="field full"><span>Anything we should know?</span><textarea name="notes" placeholder="' + (topic === 'visa' ? 'e.g. I have my CAS — can you check my bank statements and practise the interview with me?' : 'e.g. Which universities fit my UACE points? How do I apply for scholarships?') + '"></textarea></label>' +
      '<div class="full"><button class="btn lg">' + icon('calendar') + 'Request my consultation</button></div></form></div>' +
      '<aside class="stack"><div class="card"><h4>What to expect</h4><ul class="reasons small"><li class="yes">' + icon('check') + '<span>20–30 minutes, free</span></li><li class="yes">' + icon('check') + '<span>Honest advice on courses, costs, scholarships and visas</span></li><li class="yes">' + icon('check') + '<span>A clear list of next steps afterwards</span></li></ul>' + (s.consultationHours ? '<p class="small muted mb0">' + esc(s.consultationHours) + '</p>' : '') + '</div>' +
      (wa ? '<a class="btn ghost block" href="https://wa.me/' + wa + '" target="_blank" rel="noopener">' + icon('phone') + 'Or message us on WhatsApp now</a>' : '') +
      (s.scopeNote ? '<div class="notice warn">' + icon('shield') + '<p class="small">' + esc(s.scopeNote) + '</p></div>' : '') + '</aside></div></div>';
    setTimeout(() => {
      const g = $('#bk-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#bk').onsubmit = async (e) => {
        e.preventDefault(); const f = e.target; if (!f.reportValidity()) return;
        const d = Object.fromEntries(new FormData(f));
        const tl = (TOPICS.find((t) => t[0] === d.topic) || TOPICS[0])[1];
        const data = { name: d.name, email: d.email, phone: d.phone, topic: 'Consultation: ' + tl, message: 'Consultation request — ' + tl + '\nWhen: ' + U.fmtDate(d.date) + ', ' + d.slot + ' by ' + d.channel + '\nI am: ' + d.who + ' · Level: ' + d.level + '\nDestination: ' + (d.destination || '—') + (d.notes ? '\n\n' + d.notes : ''), when: d.date + ' ' + d.slot, channel: d.channel, who: d.who, submittedAt: new Date().toISOString() };
        const btn = f.querySelector('button'); btn.disabled = true;
        const ok = await U.submitResponse('adviser', 'adviser-request', data);
        $('#app').innerHTML = '<div class="container page tc" style="max-width:620px"><div class="feature-icon" style="margin:0 auto 16px;width:64px;height:64px">' + icon('calendar') + '</div><h1>' + (ok ? 'Request received!' : 'Not sent yet') + '</h1><p class="muted">' + (ok ? 'An adviser will confirm your consultation for <b>' + esc(U.fmtDate(d.date)) + ', ' + esc(d.slot.toLowerCase()) + '</b> by ' + esc(d.channel.toLowerCase()) + '.' : 'We couldn’t send it right now — please message us on WhatsApp or try again.') + '</p><div class="row" style="justify-content:center">' + (ok ? '<a class="btn" href="/discover">Get matched while you wait</a>' : '<a class="btn" href="/book">Try again</a>') + '<a class="btn ghost" href="/">Home</a></div></div>';
        window.scrollTo(0, 0);
      };
    });
    return html;
  };

  /* ================= Search ================= */
  V.search = function () {
    const a = A(), C = a.C, q = (qs().get('q') || '').trim(), ql = q.toLowerCase();
    if (q) U.track('search', q);
    const terms = ql.split(/\s+/).filter(Boolean);
    const hit = (txt) => terms.length && terms.every((t) => String(txt || '').toLowerCase().includes(t));
    const R = !q ? null : {
      Countries: countries().filter((c) => hit(c.name + ' ' + c.highlights + ' ' + c.visaName)).map((c) => ['/country/' + slugOf(c), c.flag + ' ' + c.name, c.highlights]),
      Programmes: (C.programs || []).filter((p) => hit(p.program + ' ' + p.university + ' ' + p.country + ' ' + p.field + ' ' + p.level)).slice(0, 60).map((p) => ['/program/' + encodeURIComponent(p.id), p.program, p.university + ' · ' + p.country + ' · ' + p.level]),
      Scholarships: (C.scholarships || []).filter((x) => hit(x.name + ' ' + x.destinations + ' ' + x.coverage + ' ' + (x.eligibility || ''))).map((x) => ['/prepare/scholarships', x.name, (x.coverage || '') + ' · ' + (x.destinations || '')]),
      'Help & FAQs': (C.faqs || []).filter((f) => hit(f.q + ' ' + f.a)).map((f) => ['/help', f.q, f.a]),
      Glossary: (C.glossary || []).filter((g) => hit((g.term || '') + ' ' + (g.definition || g.def || ''))).map((g) => ['/prepare/glossary', g.term, g.definition || g.def || '']),
      Pages: [['/visa', 'Visa help', 'visa interview refused proof of money scam embassy'], ['/countries', 'Where to study', 'countries destinations compare abroad'], ['/prepare/statement', 'Statement Studio', 'personal statement essay motivation letter'], ['/prepare/costs', 'Cost Planner', 'budget cost fees money'], ['/prepare/vault', 'Document Vault', 'documents upload transcript passport'], ['/track', 'Application tracker', 'applications deadlines'], ['/book', 'Book a consultation', 'adviser help talk call whatsapp'], ['/summary', 'My printable plan', 'print summary pdf plan'], ['/plans', 'Plans', 'price free plans cost']].filter((p) => hit(p[1] + ' ' + p[2])).map((p) => [p[0], p[1], ''])
    };
    const total = R ? Object.values(R).reduce((n, x) => n + x.length, 0) : 0;
    const html = '<div class="container page" style="max-width:900px">' + a.pageHead('Search', 'Programmes, universities, countries, scholarships and help — all in one place.') +
      '<form id="sq" class="row" role="search"><input type="search" name="q" value="' + esc(q) + '" placeholder="Try “nursing Kenya”, “Chevening” or “UK visa”" style="flex:1;min-width:200px" aria-label="Search UniPath" autofocus><button class="btn">' + icon('search') + 'Search</button></form>' +
      (R ? '<p class="small muted mt2">' + total + ' result' + (total === 1 ? '' : 's') + ' for “' + esc(q) + '”</p>' + Object.entries(R).filter(([, v]) => v.length).map(([k, v]) => '<h3 class="mt3">' + esc(k) + ' <span class="badge">' + v.length + '</span></h3><div class="stack">' + v.map(([href, t, sub]) => '<a class="card hover" href="' + href + '" style="text-decoration:none;color:inherit;padding:12px 16px"><b>' + esc(t) + '</b>' + (sub ? '<div class="small muted">' + esc(String(sub).slice(0, 160)) + '</div>' : '') + '</a>').join('') + '</div>').join('') + (total ? '' : a.emptyState('search', 'Nothing found', 'Try fewer or different words, or ask an adviser.', '<a class="btn" href="/book">Ask an adviser</a>')) : '') + '</div>';
    setTimeout(() => { const f = $('#sq'); if (f) f.onsubmit = (e) => { e.preventDefault(); U.go('/search?q=' + encodeURIComponent(f.q.value.trim())); }; });
    return html;
  };

  /* ================= Printable summary ================= */
  V.summary = function () {
    const a = A(), S = a.S, prof = S.profile || {}, apps = S.applications || [];
    const visaRows = countries().map((c) => [c, visaProgress(c)]).filter((x) => x[1]);
    return '<div class="container page" style="max-width:900px"><div class="row between no-print"><a href="/passport" class="btn link">' + icon('left') + 'My Passport</a><span class="row"><button class="btn ghost" onclick="UP_FEATURES.openShare()">' + icon('users') + 'Share with family</button><button class="btn" onclick="print()">' + icon('printer') + 'Print / save as PDF</button></span></div>' +
      '<h1 class="mt2">' + esc(prof.name ? prof.name + '’s university plan' : 'My university plan') + '</h1><p class="muted">Made with UniPath Africa on ' + U.fmtDate(new Date().toISOString().slice(0, 10)) + '</p>' +
      (S.profile ? '<div class="card"><h3 class="mt0">About me</h3><p class="mb0">' + [prof.level, prof.field, prof.homeCountry && 'from ' + prof.homeCountry, (prof.destinations || []).length && 'interested in ' + prof.destinations.join(', '), prof.budgetAmount && 'budget ' + (prof.budgetCurrency || 'UGX') + ' ' + (+prof.budgetAmount).toLocaleString('en-US') + ' / year'].filter(Boolean).map(esc).join(' · ') + '</p></div>' : '<div class="notice">' + icon('info') + '<p>Complete <a href="/discover">Discover</a> to add your profile.</p></div>') +
      '<h3 class="mt3">My applications (' + apps.length + ')</h3>' + (apps.length ? '<div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Stage</th><th>Deadline</th><th>Ready</th><th>Next step</th></tr></thead><tbody>' + apps.map((x) => { const i = a.appInfo(x); return '<tr><td><b>' + esc(i.program || '') + '</b><div class="small muted">' + esc((i.university || '') + ' · ' + (i.country || '')) + '</div></td><td>' + esc(a.stageLabel ? a.stageLabel(x.stage) : x.stage) + '</td><td>' + U.fmtDate(i.deadline) + '</td><td>' + a.readiness(x) + '%</td><td class="small">' + esc((a.nextAction(x) || {}).text || '') + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">No applications yet.</p>') +
      '<h3 class="mt3">Saved programmes (' + (S.shortlist || []).length + ')</h3>' + ((S.shortlist || []).length ? '<ul>' + S.shortlist.map((id) => { const p = a.progById(id); return p ? '<li>' + esc(p.program + ' — ' + p.university + ', ' + p.country) + ' · ' + a.money(+p.tuitionUSD + +p.livingUSD, null, { compact: true }) + '/yr</li>' : ''; }).join('') + '</ul>' : '<p class="muted">None saved.</p>') +
      (visaRows.length ? '<h3 class="mt3">Visa preparation</h3><ul>' + visaRows.map(([c, p]) => '<li>' + esc(c.name + ' — ' + (c.visaName || 'visa')) + ': ' + p.done + ' of ' + p.total + ' steps/documents ready (' + p.pct + '%)</li>').join('') + '</ul>' : '') +
      '<p class="small muted mt4">Figures are estimates. Always confirm fees, deadlines and visa rules on official websites.</p></div>';
  };
})();
