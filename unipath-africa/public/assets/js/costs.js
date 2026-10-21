/* UniPath Africa — True Cost Planner (Prepare → Cost planner)
   University usually costs far more than the tuition figure. This planner shows the
   "sticker price" next to the true cost: every-year costs, one-off costs before you start,
   fee rises, exchange-rate swings, a safety buffer — and how the student will pay for it. */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;
  const D = () => window.UP_DEST || {};

  const COLD = ['United Kingdom', 'Canada', 'United States', 'Germany', 'Netherlands', 'Ireland', 'Sweden', 'Belgium', 'Switzerland', 'Austria', 'Japan', 'South Korea', 'China', 'Türkiye', 'New Zealand', 'Italy', 'France'];
  const EAST = ['Uganda', 'Kenya', 'Tanzania', 'Rwanda', 'Burundi', 'South Sudan', 'Ethiopia'];
  function flightUSD(country, region, home) {
    if (country === home) return 40;
    if (EAST.includes(country) && EAST.includes(home)) return 250;
    if (region === 'Africa') return 650;
    if (['United States', 'Canada'].includes(country)) return 1400;
    if (['Australia', 'New Zealand'].includes(country)) return 1600;
    if (['Japan', 'South Korea', 'China', 'Singapore', 'Thailand'].includes(country)) return 1100;
    return 950;
  }

  // Every input is stored in USD (rates convert to the student's currency).
  function defaultsFor(p) {
    const a = A(), S = a.S, home = (S.profile && S.profile.homeCountry) || 'Uganda';
    const intl = p ? p.country !== home : false;
    const tuition = p ? +p.tuitionUSD || 0 : 0, living = p ? +p.livingUSD || 0 : 3000;
    const c = p && D().findCountry ? D().findCountry(p.country) : null;
    const visa = intl && c && D().feesUSD ? Math.round(D().feesUSD(c, 1)) : (intl ? 400 : 0);
    const visaYearly = intl && c && D().parseFees ? D().parseFees(c).filter((f) => f.per === 'year' && f.amount != null).reduce((s, f) => s + U.toUSD(f.amount, f.currency), 0) : 0;
    const flight = p ? flightUSD(p.country, p.region, home) : 0;
    const apps = Math.max(1, (S.applications || []).filter((x) => x.kind !== 'scholarship').length || 3);
    return {
      v: 2, programId: p ? p.id : '', country: p ? p.country : '', years: +((p && p.durationYears) || 3), start: guessStart(p && p.intake),
      // every year
      tuition, accommodation: Math.round(living * 0.45), food: Math.round(living * 0.27), transport: Math.round(living * 0.09), phone: Math.round(living * 0.04), personal: Math.round(living * 0.08),
      books: Math.max(120, Math.round(tuition * 0.04)), studentFees: Math.max(40, Math.round(tuition * 0.03)), insurance: intl ? (['United States'].includes(p.country) ? 2500 : 600) : 60,
      visaYearly: Math.round(visaYearly), tripsHome: intl ? 1 : 2, flight,
      // before you start
      appFees: Math.round(((p && +p.appFeeUSD) || 20) * apps), tests: intl ? 250 : 0, documents: intl ? 150 : 40, passport: intl ? 60 : 0,
      visa: Math.max(0, visa - Math.round(visaYearly)), medical: intl ? 180 : 0, deposit: intl ? Math.round(tuition * 0.15) : 0, housingDeposit: Math.round(living * 0.45 / 12),
      setup: intl ? 400 : 150, laptop: 600, clothing: p && COLD.includes(p.country) ? 300 : 0,
      // hidden & rising costs
      feeRise: intl ? 5 : 8, inflation: intl ? 4 : 7, fxBuffer: intl ? 10 : 0, contingency: 10, extraYear: false, graduation: 150,
      // how you'll pay
      scholarshipPct: 0, scholarshipFixed: 0, family: 0, loan: 0, work: 0, saved: 0
    };
  }
  function guessStart(intake) { const m = /([A-Za-z]+)\s+(\d{4})/.exec(intake || ''); if (!m) return '2027-08-01'; const d = new Date(m[1] + ' 1, ' + m[2] + ' UTC'); return isNaN(d) ? '2027-08-01' : d.toISOString().slice(0, 10); }

  const YEARLY = [['tuition', 'Tuition — paid to the university', 'From the university’s fee page. Check if it is “per year” or “per semester”.'], ['accommodation', 'Accommodation (rent)', 'Hall or private room for the full year, including holidays if you stay.'], ['food', 'Food', ''], ['transport', 'Local transport', 'Boda / taxi / bus to campus and around town.'], ['phone', 'Phone & internet data', ''], ['personal', 'Personal & clothes', 'Toiletries, haircuts, clothes, small things — these add up.'], ['books', 'Books, printing & supplies', 'Lab coats, software, printing, field trips.'], ['studentFees', 'Student, exam & activity fees', 'Guild/union, exams, ID card, library, sports — often charged separately from tuition.'], ['insurance', 'Health insurance / medical', 'Required in many countries; in the US it can be $2,000+ a year.'], ['visaYearly', 'Yearly visa / health charges — paid to the government', 'e.g. UK health surcharge, Irish residence card. Taken from the country guide.']];
  const ONEOFF = [['appFees', 'Application fees — paid to each university', 'Most students apply to 3–6 places.'], ['tests', 'Tests (IELTS/TOEFL/SAT/GRE) — paid to the test provider', ''], ['documents', 'Documents (transcripts, certified copies, translations, courier)', ''], ['passport', 'Passport', ''], ['visa', 'Visa fees — paid to the government / official visa centre', 'From the country guide.'], ['medical', 'Medical exams / TB test / police clearance', ''], ['deposit', 'Tuition deposit — paid to the university to accept your offer', 'Often 10–50% of the first year — check if it counts towards tuition.'], ['housingDeposit', 'Accommodation deposit / first month’s rent', ''], ['flight', 'First flight / travel to campus', ''], ['setup', 'Setting up (bedding, kitchen things, SIM, first weeks)', ''], ['laptop', 'Laptop', 'Almost every course now needs one.'], ['clothing', 'Warm clothing (cold countries)', '']];
  const FORGOTTEN = ['Application fees for every university, not just one', 'Tuition deposit to accept an offer (paid months before you start)', 'Tuition going up every year (5–10% is common)', 'Exchange-rate changes — fees abroad are set in their currency', 'Exam, lab, library and student union fees charged on top of tuition', 'Accommodation during holidays', 'Flights home and back each year', 'Health insurance and medical costs', 'Graduation fees, gown and transcripts', 'A laptop, and replacing it if it breaks', 'An extra semester or year (resits, delays, strikes)', 'Money for emergencies'];

  function compute(cp) {
    const yearsN = cp.years + (cp.extraYear ? 1 : 0);
    const rows = []; const sum = (keys) => keys.reduce((s, k) => s + (+cp[k] || 0), 0);
    const oneOff = sum(ONEOFF.map((x) => x[0])); // includes the tuition deposit (taken off year-1 tuition below)
    const fx = 1 + (cp.fxBuffer || 0) / 100;
    let totalCost = 0, totalFund = 0;
    // Year 0 (before you start)
    const y0 = oneOff * fx; rows.push({ label: 'Before you start', cost: y0, fund: 0 });
    totalCost += y0;
    for (let i = 0; i < yearsN; i++) {
      const tf = Math.pow(1 + (cp.feeRise || 0) / 100, i), lf = Math.pow(1 + (cp.inflation || 0) / 100, i);
      const tuition = cp.tuition * tf, living = sum(['accommodation', 'food', 'transport', 'phone', 'personal']) * lf;
      const other = (sum(['books', 'studentFees', 'insurance', 'visaYearly']) + (cp.tripsHome || 0) * (cp.flight || 0)) * lf;
      let cost = (tuition + living + other) * fx;
      if (i === yearsN - 1) cost += (cp.graduation || 0);
      if (i === 0 && cp.deposit) cost -= Math.min(tuition, cp.deposit) * fx; // deposit already paid before you start
      const sch = Math.min(tuition * fx, tuition * fx * (cp.scholarshipPct || 0) / 100 + (cp.scholarshipFixed || 0));
      const fund = sch + (cp.family || 0) + (cp.loan || 0) + (cp.work || 0);
      rows.push({ label: 'Year ' + (i + 1) + (cp.extraYear && i === yearsN - 1 ? ' (extra)' : ''), cost, fund, tuition: tuition * fx, living: living * fx, other: other * fx, sch });
      totalCost += cost; totalFund += fund;
    }
    const contingency = totalCost * (cp.contingency || 0) / 100;
    totalCost += contingency;
    const sticker = cp.tuition * cp.years;
    const gap = Math.max(0, totalCost - totalFund - (cp.saved || 0));
    const months = Math.max(1, Math.round(((U.parseDate(cp.start) || new Date()) - U.today()) / (30.44 * 86400000)));
    const firstNeed = Math.max(0, rows[0].cost + (rows[1] ? rows[1].cost - rows[1].fund : 0) - (cp.saved || 0));
    const monthlyLiving = sum(['accommodation', 'food', 'transport', 'phone', 'personal']) / 12;
    return { rows, totalCost, totalFund, contingency, sticker, gap, months, firstNeed, monthlySave: firstNeed / months, monthlyLiving, yearsN };
  }

  function view(pid, shell) {
    const a = A(), S = a.S, C = a.C;
    const progs = C.programs || [];
    const preferred = [...new Set(S.applications.map((x) => x.programId).concat(S.shortlist).filter(Boolean))];
    let cp = S.costPlan && S.costPlan.v === 2 ? S.costPlan : null;
    if (pid) { const p = a.progById(decodeURIComponent(pid)); if (p && (!cp || cp.programId !== p.id)) cp = Object.assign(defaultsFor(p), cp ? { saved: cp.saved, family: cp.family, loan: cp.loan, work: cp.work } : {}); }
    if (!cp) { const p = a.progById(preferred[0]) || null; cp = defaultsFor(p); }
    S.costPlan = cp; U.track('feature', 'true-cost-planner');
    const c = a.cur(), r = U.rateOf(c);
    const k = compute(cp);
    const m = (usd, o) => U.money(usd, c, o);
    const v = (usd) => Math.round((+usd || 0) * r);
    const num = (key, label, hint) => '<label class="field"><span>' + label + '</span><input type="number" min="0" step="any" inputmode="decimal" data-cp="' + key + '" value="' + v(cp[key]) + '">' + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</label>';
    const pctF = (key, label, hint, max) => '<label class="field"><span>' + label + ' — <b>' + (cp[key] || 0) + '%</b></span><input type="range" min="0" max="' + (max || 25) + '" step="1" data-pct="' + key + '" value="' + (cp[key] || 0) + '">' + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</label>';
    const p = a.progById(cp.programId);
    const country = p && D().findCountry ? D().findCountry(p.country) : null;
    const overPct = k.sticker ? Math.round((k.totalCost / k.sticker - 1) * 100) : 0;
    const fundedPct = k.totalCost ? Math.min(100, Math.round((k.totalFund + (cp.saved || 0)) / k.totalCost * 100)) : 0;
    const checks = S.costChecks || {};
    const html = shell('costs',
      '<div class="card pad-lg" style="background:var(--ink);color:var(--bg);border:0"><div class="row between" style="align-items:flex-start"><div><span class="eyebrow" style="color:var(--sun)">True cost of university</span><h2 style="color:var(--bg);margin:.2em 0">' + (p ? esc(p.program) + ' <span style="opacity:.7;font-size:.7em">— ' + esc(p.university) + '</span>' : 'Your plan') + '</h2>' +
      '<p class="mb0" style="opacity:.8">Every cost here is paid to universities, governments, landlords or airlines — <b>never to UniPath</b>, which is free. Most students plan for the tuition figure only. Here is everything else. <a href="/money" style="color:var(--sun)">New to budgets? Learn Money Skills →</a></p></div>' +
      '<select id="cp-cur" style="width:auto" aria-label="Currency">' + Object.keys(C.currencies || {}).map((x) => '<option ' + (x === c ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
      '<div class="grid g4 mt3" style="gap:14px">' +
      '<div><div class="small" style="opacity:.7">Tuition only (“sticker price”)</div><div class="big-num" style="color:var(--bg);font-size:1.5rem">' + m(k.sticker, { compact: true }) + '</div></div>' +
      '<div><div class="small" style="opacity:.7">True cost, ' + k.yearsN + ' years</div><div class="big-num" style="color:var(--sun);font-size:1.9rem">' + m(k.totalCost, { compact: true }) + '</div>' + (k.sticker ? '<div class="small" style="color:var(--sun)">' + (overPct >= 0 ? '+' : '') + overPct + '% more than tuition</div>' : '') + '</div>' +
      '<div><div class="small" style="opacity:.7">Covered so far</div><div class="big-num" style="color:var(--bg);font-size:1.5rem">' + fundedPct + '%</div><div class="progress mt1" style="background:rgba(255,255,255,.15)"><span style="width:' + fundedPct + '%"></span></div></div>' +
      '<div><div class="small" style="opacity:.7">Still to find</div><div class="big-num" style="color:' + (k.gap ? '#ffb4a2' : 'var(--sun)') + ';font-size:1.5rem">' + (k.gap ? m(k.gap, { compact: true }) : 'Fully funded') + '</div></div></div></div>' +

      plainEnglish(cp, k, m) +
      '<div class="grid mt3" style="grid-template-columns:minmax(0,1fr) 360px;gap:24px" id="cp-grid"><div class="stack">' +
      '<div class="card"><div class="row between"><h3 class="mb0">1. Choose a programme</h3>' + (p ? '<a class="small" href="/program/' + encodeURIComponent(p.id) + '">Programme page →</a>' : '') + '</div>' +
      '<label class="field mt2"><span>Start from</span><select id="cp-prog"><option value="">My own figures</option>' + (preferred.length ? '<optgroup label="My shortlist & applications">' + preferred.map(a.progById).filter(Boolean).map((x) => '<option value="' + x.id + '"' + (cp.programId === x.id ? ' selected' : '') + '>' + esc(x.program + ' — ' + x.university) + '</option>').join('') + '</optgroup>' : '') + '<optgroup label="All programmes">' + progs.map((x) => '<option value="' + x.id + '"' + (cp.programId === x.id && !preferred.includes(x.id) ? ' selected' : '') + '>' + esc(x.program + ' — ' + x.university) + '</option>').join('') + '</optgroup></select></label>' +
      '<div class="form-grid mt2"><label class="field"><span>Programme length (years)</span><input type="number" min="1" max="7" data-raw="years" value="' + cp.years + '"></label><label class="field"><span>Course starts</span><input type="date" data-raw="start" value="' + esc(cp.start) + '"></label></div>' +
      (p ? '<p class="small muted mb0">Starting figures come from ' + (p.verified ? 'verified' : 'indicative') + ' data for this programme' + (country ? ' and the <a href="/country/' + (country.slug || '') + '/costs">' + esc(country.name) + ' guide</a>' : '') + '. ' + (U.safeUrl(p.feesUrl) ? '<a href="' + esc(U.safeUrl(p.feesUrl)) + '" target="_blank" rel="noopener">Official fees page ↗</a>' : U.safeUrl(p.officialUrl) ? '<a href="' + esc(U.safeUrl(p.officialUrl)) + '" target="_blank" rel="noopener">University website ↗</a>' : '') + '</p>' : '') + '</div>' +

      '<details class="card" open><summary><h3 class="mb0" style="display:inline">2. Every year</h3> <span class="badge">' + m(YEARLY.reduce((s, x) => s + (+cp[x[0]] || 0), 0), { compact: true }) + ' / yr</span></summary><div class="form-grid mt2">' + YEARLY.map(([kk, l, h]) => num(kk, l + ' (' + c + ')', h)).join('') +
      '<label class="field"><span>Trips home per year</span><input type="number" min="0" max="6" data-raw="tripsHome" value="' + cp.tripsHome + '"></label>' + num('flight', 'Cost of one return trip home (' + c + ')') + '</div></details>' +

      '<details class="card" open><summary><h3 class="mb0" style="display:inline">3. Before you start (one-off)</h3> <span class="badge">' + m(ONEOFF.reduce((s, x) => s + (+cp[x[0]] || 0), 0), { compact: true }) + '</span></summary><p class="small muted">Much of this must be paid <b>months before</b> the course starts — the most common reason students can’t take up an offer.</p><div class="form-grid">' + ONEOFF.map(([kk, l, h]) => num(kk, l + ' (' + c + ')', h)).join('') + '</div></details>' +

      '<details class="card" open><summary><h3 class="mb0" style="display:inline">4. Hidden & rising costs</h3></summary><p class="small muted mt1">Why these matter: <a href="/money/fx">exchange rates</a> · <a href="/money/saving">emergency funds</a>.</p><div class="form-grid mt2">' +
      pctF('feeRise', 'Tuition rises each year by', 'Many universities raise fees every year.', 20) + pctF('inflation', 'Living costs rise each year by', 'Rent and food prices go up too.', 20) +
      pctF('fxBuffer', 'Exchange-rate buffer', 'If fees are in another currency, a weaker shilling makes everything dearer. 10–15% is sensible.', 30) + pctF('contingency', 'Emergency buffer', 'For surprises: illness, a broken laptop, a family emergency.', 25) +
      num('graduation', 'Graduation, gown & transcripts (' + c + ')') +
      '<label class="check field" style="align-self:end"><input type="checkbox" data-bool="extraYear"' + (cp.extraYear ? ' checked' : '') + '><span><b>Plan for one extra year</b><br><small class="muted">Resits, strikes, placements or changing course are common.</small></span></label></div></details>' +

      '<details class="card" open><summary><h3 class="mb0" style="display:inline">5. How you’ll pay</h3></summary><p class="small muted mt1">Before borrowing, read <a href="/money/loans">how loans really cost</a> and <a href="/money/debt">avoiding debt traps</a>. Talking to family? <a href="/money/sponsors">Family money & sponsors</a>.</p><div class="form-grid mt2">' +
      '<label class="field"><span>Scholarship covers <b>' + (cp.scholarshipPct || 0) + '%</b> of tuition</span><input type="range" min="0" max="100" step="5" data-pct="scholarshipPct" value="' + (cp.scholarshipPct || 0) + '"></label>' + num('scholarshipFixed', 'Other scholarship / bursary per year (' + c + ')') +
      num('family', 'Family / sponsor support per year (' + c + ')', 'Be realistic — ask them for a written amount.') + num('loan', 'Student loan per year (' + c + ')', 'e.g. HESFB (Uganda), HELB (Kenya), HESLB (Tanzania).') +
      num('work', 'Part-time work per year (' + c + ')', 'Only if your visa allows it. Never count on it for tuition.') + num('saved', 'Already saved', 'Money set aside today.') + '</div>' +
      '<div class="row mt2"><a class="btn sm ghost" href="/prepare/scholarships">' + icon('award') + 'Find scholarships</a>' + (country ? '<a class="btn sm ghost" href="/country/' + (country.slug || '') + '/funding">' + icon('globe') + 'Funding in ' + esc(country.name) + '</a>' : '') + '<a class="btn sm ghost" href="/book?topic=scholarship">' + icon('message') + 'Talk to an adviser about funding</a></div></details>' +

      '<div class="card"><div class="row between"><h3 class="mb0">Year by year</h3><div class="row"><button class="btn sm ghost" id="cp-csv">' + icon('download') + 'Spreadsheet (CSV)</button><button class="btn sm ghost" onclick="print()">' + icon('printer') + 'Print</button></div></div>' +
      '<div class="table-wrap mt2"><table class="tbl"><thead><tr><th>When</th><th>Cost</th><th>Scholarship, family, loan, work</th><th>Gap</th></tr></thead><tbody>' + k.rows.map((x) => '<tr><td><b>' + esc(x.label) + '</b>' + (x.tuition != null ? '<div class="small muted">Tuition ' + m(x.tuition, { compact: true }) + ' · living ' + m(x.living, { compact: true }) + '</div>' : '<div class="small muted">Deposits, visa, flights, laptop…</div>') + '</td><td class="num">' + m(x.cost, { compact: true }) + '</td><td class="num">' + m(x.fund, { compact: true }) + '</td><td class="num"><b style="color:' + (x.cost - x.fund > 0 ? 'var(--bad)' : 'var(--ok)') + '">' + m(Math.max(0, x.cost - x.fund), { compact: true }) + '</b></td></tr>').join('') +
      '<tr><td>Emergency buffer (' + cp.contingency + '%)</td><td class="num">' + m(k.contingency, { compact: true }) + '</td><td></td><td></td></tr><tr><td><b>Total</b></td><td class="num"><b>' + m(k.totalCost, { compact: true }) + '</b></td><td class="num">' + m(k.totalFund, { compact: true }) + '</td><td class="num"><b>' + m(Math.max(0, k.totalCost - k.totalFund), { compact: true }) + '</b></td></tr></tbody></table></div><p class="small muted mt1 mb0">Exchange rate used: 1 USD ≈ ' + r.toLocaleString() + ' ' + c + ' (set by the UniPath team). All figures are estimates.</p></div>' +
      '</div>' +

      '<aside class="stack"><div class="card sun"><h4 class="mt0">Your savings target</h4>' + (k.firstNeed > 0 ? '<p class="mb0">To pay everything before you start <b>and</b> your first year, save about</p><div class="big-num mt1">' + m(k.monthlySave) + '<small style="font-size:1rem;font-family:var(--font-body)"> /month</small></div><p class="small muted mb0">for the next ' + k.months + ' months (' + m(k.firstNeed, { compact: true }) + ' needed by ' + U.fmtDate(cp.start) + ').</p>' : '<p class="mb0"><b>Your first year is covered.</b> Keep saving for later years — fees rise.</p>') + '</div>' +
      '<div class="card"><h4 class="mt0">Your monthly budget at uni</h4><div class="big-num" style="font-size:1.5rem">' + m(k.monthlyLiving) + '<small style="font-size:.9rem;font-family:var(--font-body)"> /month</small></div><p class="small muted">Rent, food, transport, data and personal costs in year one.</p><ul class="small" style="padding-left:18px;margin:0">' + [['Rent', 'accommodation'], ['Food', 'food'], ['Transport', 'transport'], ['Data', 'phone'], ['Personal', 'personal']].map(([l, kk]) => '<li>' + l + ': ' + m((cp[kk] || 0) / 12) + '</li>').join('') + '</ul><a class="small" href="/thrive/money">Track your spending at uni →</a> · <a class="small" href="/money/budget">How to budget →</a></div>' +
      '<div class="card"><h4 class="mt0">Easy to forget — tick when planned</h4><ul class="checklist">' + FORGOTTEN.map((t, i) => '<li class="' + (checks[i] ? 'done' : '') + '" style="padding:8px 2px"><button class="tick" data-fg="' + i + '" aria-pressed="' + !!checks[i] + '" aria-label="Planned">' + icon('check') + '</button><div class="lbl small">' + esc(t) + '</div></li>').join('') + '</ul></div>' +
      '<div class="card tint"><h4 class="mt0">Ways to cut the cost</h4><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:4px"><li>Apply for <a href="/prepare/scholarships">scholarships</a> and university bursaries early — 6–12 months ahead.</li><li>Ask the university about early-payment discounts and instalment plans.</li><li>Choose a cheaper city or shared accommodation.</li><li>Look at government loans: <a href="https://www.hesfb.go.ug" target="_blank" rel="noopener">HESFB Uganda ↗</a>, <a href="https://www.helb.co.ke" target="_blank" rel="noopener">HELB Kenya ↗</a>, <a href="https://www.heslb.go.tz" target="_blank" rel="noopener">HESLB Tanzania ↗</a>.</li><li>Buy second-hand books, use the library and free online resources.</li><li><a href="/countries/compare">Compare countries</a> — some excellent universities cost far less.</li></ul></div></aside></div>' +
      compareBlock(preferred, cp));
    setTimeout(() => bind(cp, r), 0);
    return html;
  }

  function plainEnglish(cp, k, m) {
    const before = k.rows[0].cost, y1 = k.rows[1] || { cost: 0, fund: 0 };
    const times = k.sticker ? (k.totalCost / k.sticker) : 0;
    const funded = k.totalFund + (cp.saved || 0);
    const parts = [
      'Studying this programme will cost about <b>' + m(k.totalCost, { compact: true }) + '</b> in total' + (times > 1.05 ? ' — about <b>' + times.toFixed(1) + ' times</b> the tuition figure most people plan for.' : '.'),
      'You need about <b>' + m(before, { compact: true }) + '</b> <i>before</i> the course starts (application fees, deposits, ' + (cp.visa ? 'visa, ' : '') + 'travel and a laptop), then about <b>' + m(y1.cost, { compact: true }) + '</b> in the first year.',
      funded > 0 ? 'Scholarships, family, loans, work and savings cover about <b>' + Math.min(100, Math.round(funded / Math.max(1, k.totalCost) * 100)) + '%</b>. ' + (k.gap > 0 ? 'The remaining <b>' + m(k.gap, { compact: true }) + '</b> still needs a plan.' : 'That covers everything — keep a buffer anyway.') : 'You haven’t added any funding yet. Fill in “How you’ll pay” to see your gap.',
      k.firstNeed > 0 ? 'To be ready for the start date, you’d need to set aside about <b>' + m(k.monthlySave) + ' every month</b> for ' + k.months + ' months.' + (k.monthlySave > k.monthlyLiving ? ' That’s more than a month of living costs — consider scholarships, a cheaper option or a later intake.' : '') : ''
    ].filter(Boolean);
    return '<div class="card mt3"><h3 class="mt0">' + icon('message') + ' In plain English</h3>' + parts.map((x) => '<p class="mb1">' + x + '</p>').join('') + '<p class="small muted mb0">Not sure what any of this means? <a href="/money">Money Skills</a> explains budgets, loans and exchange rates in 5-minute lessons.</p></div>';
  }
  function compareBlock(preferred, cp) {
    const a = A(), c = a.cur();
    const list = preferred.map(a.progById).filter(Boolean);
    if (list.length < 2) return '<div class="card mt3 row between"><div><h3 class="mb0">Compare true costs</h3><p class="small muted mb0">Save two or more programmes to your shortlist to compare their true cost side by side.</p></div><a class="btn ghost" href="/match">' + icon('target') + 'Find programmes</a></div>';
    const rows = list.map((p) => { const d = Object.assign(defaultsFor(p), { feeRise: cp.feeRise, inflation: cp.inflation, contingency: cp.contingency, scholarshipPct: 0, scholarshipFixed: 0, family: 0, loan: 0, work: 0, saved: 0 }); const k = compute(d); return { p, k }; }).sort((x, y) => x.k.totalCost - y.k.totalCost);
    return '<h3 class="mt4">True cost of your shortlist</h3><p class="small muted">Same assumptions for every programme, before any funding.</p><div class="table-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Tuition only</th><th>True cost</th><th>Difference</th><th></th></tr></thead><tbody>' +
      rows.map(({ p, k }) => '<tr><td><a href="/program/' + encodeURIComponent(p.id) + '"><b>' + esc(p.program) + '</b></a><div class="small muted">' + esc(p.university + ' · ' + p.country) + '</div></td><td class="num">' + U.money(k.sticker, c, { compact: true }) + '</td><td class="num"><b>' + U.money(k.totalCost, c, { compact: true }) + '</b></td><td class="num">+' + (k.sticker ? Math.round((k.totalCost / k.sticker - 1) * 100) + '%' : '—') + '</td><td><a class="btn sm ghost" href="/prepare/costs/' + encodeURIComponent(p.id) + '">Plan this</a></td></tr>').join('') + '</tbody></table></div>';
  }

  function bind(cp, r) {
    const a = A(), S = a.S;
    const g = $('#cp-grid'); if (g && window.innerWidth < 920) g.style.gridTemplateColumns = '1fr';
    const keep = (fn) => { const y = window.scrollY; fn(); a.save(); a.render(); window.scrollTo(0, y); };
    $('#cp-cur').onchange = (e) => keep(() => { S.settings.currency = e.target.value; });
    $('#cp-prog').onchange = (e) => { const p = a.progById(e.target.value); if (p) { const prev = S.costPlan; S.costPlan = Object.assign(defaultsFor(p), { saved: prev.saved, family: prev.family, loan: prev.loan, work: prev.work, feeRise: prev.feeRise, inflation: prev.inflation }); } else S.costPlan.programId = ''; a.save(); U.go('/prepare/costs'); };
    $$('[data-cp]').forEach((i) => i.onchange = () => keep(() => { cp[i.dataset.cp] = (+i.value || 0) / r; }));
    $$('[data-raw]').forEach((i) => i.onchange = () => keep(() => { cp[i.dataset.raw] = i.type === 'date' ? i.value : (+i.value || 0); }));
    $$('[data-pct]').forEach((i) => { i.oninput = () => { const lab = i.closest('label').querySelector('b'); if (lab) lab.textContent = i.value + '%'; }; i.onchange = () => keep(() => { cp[i.dataset.pct] = +i.value; }); });
    $$('[data-bool]').forEach((i) => i.onchange = () => keep(() => { cp[i.dataset.bool] = i.checked; }));
    $$('[data-fg]').forEach((b) => b.onclick = () => keep(() => { S.costChecks = S.costChecks || {}; S.costChecks[b.dataset.fg] = !S.costChecks[b.dataset.fg]; }));
    const csv = $('#cp-csv'); if (csv) csv.onclick = () => {
      const k = compute(cp), c = a.cur(), f = (x) => Math.round(U.fromUSD(x, c));
      const lines = [['When', 'Cost (' + c + ')', 'Funding (' + c + ')', 'Gap (' + c + ')']].concat(k.rows.map((x) => [x.label, f(x.cost), f(x.fund), f(Math.max(0, x.cost - x.fund))])).concat([['Emergency buffer', f(k.contingency), '', ''], ['Total', f(k.totalCost), f(k.totalFund), f(Math.max(0, k.totalCost - k.totalFund))]]);
      U.download('unipath-true-cost.csv', lines.map((l) => l.map((x) => '"' + String(x).replace(/"/g, '""') + '"').join(',')).join('\n'), 'text/csv');
    };
  }

  window.UP_COSTS = { view, compute, defaultsFor };
})();
