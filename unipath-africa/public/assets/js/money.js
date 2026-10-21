/* UniPath Africa — Money Skills: plain-language financial literacy with lessons, quizzes and
   calculators that explain the numbers, not just show them. */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;
  window.APP_VIEWS = window.APP_VIEWS || {};

  const M = () => { const S = A().S; S.money = S.money || { done: {}, quiz: {}, checkup: null, tools: {} }; ['done', 'quiz', 'tools'].forEach((k) => S.money[k] = S.money[k] || {}); return S.money; };
  const rich = (t) => esc(t).replace(/&lt;(\/?)b&gt;/g, '<$1b>').replace(/&lt;a href=&quot;(\/[^&"]*)&quot;&gt;/g, '<a href="$1">').replace(/&lt;\/a&gt;/g, '</a>');
  const lessons = () => A().C.moneyLessons || [];
  const parseQ = (line) => { const [q, opts, ans, why] = String(line).split('|').map((x) => (x || '').trim()); return { q, opts: (opts || '').split(';').map((x) => x.trim()).filter(Boolean), ans: (+ans || 1) - 1, why: why || '' }; };
  const cur = () => A().cur();
  const fmt = (n) => cur() + ' ' + Math.round(n || 0).toLocaleString('en-US');
  const toLocal = (usd) => Math.round(U.fromUSD(usd, cur()));

  const CHECKUP = [
    ['I write down a plan for my money each month', 'budget'], ['I save something every time I receive money', 'saving'], ['I have money set aside for emergencies', 'saving'],
    ['I know the fees I pay on mobile money and my bank', 'banking'], ['I know how much a loan really costs per year before I take it', 'loans'], ['I have never borrowed to repay another loan', 'debt'],
    ['I know how exchange rates could change my fees', 'fx'], ['My family/sponsor and I have agreed amounts and dates', 'sponsors'], ['I can spot a money scam', 'scams'], ['I know the difference between gross and net pay', 'income']
  ];

  function shell(inner, sub) {
    const a = A(), m = M(), ls = lessons(), done = ls.filter((l) => m.done[l.id]).length;
    return '<div class="container page">' + a.pageHead('Money Skills', 'Plain-language lessons, quick quizzes and calculators that explain what the numbers mean — budgeting, saving, loans, exchange rates and avoiding traps.', '<span class="badge brand" style="font-size:.9rem">' + done + ' of ' + ls.length + ' lessons done</span>') +
      (sub ? '<a href="/money" class="btn link">' + icon('left') + 'All lessons</a>' : '') + inner + '</div>';
  }

  /* ---------- Hub ---------- */
  function hub() {
    const a = A(), m = M(), ls = lessons();
    const weak = m.checkup ? [...new Set(CHECKUP.filter((_, i) => !m.checkup[i]).map((x) => x[1]))] : [];
    const html = shell(
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="mh-grid"><div>' +
      '<div class="card tint pad-lg"><h2 class="mt0">Why this matters</h2><p class="mb0">Most students who leave university early don’t fail exams — they run out of money. Knowing how to budget, save and borrow safely is as important as your grades. Each lesson takes about 5 minutes.</p></div>' +
      (weak.length ? '<div class="card mt3"><h3 class="mt0">Recommended for you</h3><p class="small muted">From your money check-up.</p><div class="row">' + weak.map((id) => { const l = ls.find((x) => x.id === id); return l ? '<a class="btn sm ' + (m.done[id] ? 'soft' : '') + '" href="/money/' + id + '">' + icon(l.icon || 'book') + esc(l.title) + '</a>' : ''; }).join('') + '</div></div>' : '') +
      '<div class="grid g2 mt3">' + ls.map((l, i) => '<a class="card hover" href="/money/' + esc(l.id) + '" style="text-decoration:none;color:inherit"><div class="row between"><div class="feature-icon" style="margin:0">' + icon(l.icon || 'book') + '</div>' + (m.done[l.id] ? '<span class="badge ok">' + icon('check') + 'Done' + (m.quiz[l.id] != null ? ' · ' + m.quiz[l.id] + '/3' : '') + '</span>' : '<span class="badge">' + (l.minutes || 5) + ' min</span>') + '</div><h3 class="mt2 mb0">' + (i + 1) + '. ' + esc(l.title) + '</h3><p class="small muted mb0 mt1">' + esc(l.summary) + '</p></a>').join('') + '</div></div>' +
      '<aside class="stack"><div class="card"><h3 class="mt0">Money check-up</h3><p class="small muted">10 quick yes/no questions. We’ll point you to the lessons that help most.</p>' + (m.checkup ? '<p><b>Your score: ' + Object.values(m.checkup).filter(Boolean).length + '/10</b></p>' : '') + '<button class="btn" id="mk-go">' + icon('test') + (m.checkup ? 'Retake check-up' : 'Start check-up') + '</button></div>' +
      '<div class="card"><h3 class="mt0">Tools</h3><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:5px"><li><a href="/money/budget">Budget builder</a></li><li><a href="/money/saving">Savings goal planner</a></li><li><a href="/money/loans">Loan cost calculator</a></li><li><a href="/money/debt">“Small loan” true cost checker</a></li><li><a href="/money/fx">Exchange-rate impact</a></li><li><a href="/money/income">Take-home pay</a></li><li><a href="/prepare/costs">True cost of university</a></li><li><a href="/thrive/money">Monthly budget at uni</a></li></ul></div>' +
      '<div class="card"><h3 class="mt0">Money words</h3><p class="small muted">APR, principal, net pay, SACCO… explained simply.</p><a class="btn sm ghost" href="/prepare/glossary">' + icon('book') + 'Open the glossary</a></div></aside></div>');
    setTimeout(() => { const g = $('#mh-grid'); if (g && innerWidth < 920) g.style.gridTemplateColumns = '1fr'; $('#mk-go').onclick = checkup; });
    return html;
  }
  function checkup() {
    const m = M(), a = A();
    const md = U.modal({ title: 'Money check-up', wide: true, body: '<p class="small muted mt0">Be honest — nobody else sees this.</p>' + CHECKUP.map((q, i) => '<div class="row between" style="border-bottom:1px dashed var(--line);padding:7px 0;gap:8px"><span class="small" style="flex:1;min-width:200px">' + esc(q[0]) + '</span><div class="seg" style="width:auto" data-ck="' + i + '"><button type="button" data-v="1" aria-pressed="false">Yes</button><button type="button" data-v="0" aria-pressed="false">Not yet</button></div></div>').join(''), footer: '<button class="btn" data-go>See my results</button>' });
    $$('[data-ck]', md.el).forEach((g) => $$('button', g).forEach((b) => b.onclick = () => $$('button', g).forEach((x) => x.setAttribute('aria-pressed', x === b))));
    md.el.querySelector('[data-go]').onclick = () => { const r = {}; $$('[data-ck]', md.el).forEach((g) => { const b = g.querySelector('[aria-pressed="true"]'); r[g.dataset.ck] = !!(b && b.dataset.v === '1'); }); m.checkup = r; a.save(); md.close(); a.render(); window.scrollTo(0, 0); U.toast('Check-up saved — see your recommended lessons', 'sparkle'); };
  }

  /* ---------- Lesson ---------- */
  function lesson(id) {
    const a = A(), m = M(), ls = lessons(), i = ls.findIndex((l) => l.id === id), l = ls[i];
    if (!l) return shell(a.emptyState('book', 'Lesson not found', 'Pick one from the list.', '<a class="btn" href="/money">All lessons</a>'), true);
    const qs = (l.quiz || []).map(parseQ); U.track('feature', 'money:' + l.id);
    const next = ls[i + 1];
    const html = shell(
      '<div class="grid mt2" style="grid-template-columns:minmax(0,1fr) 340px;gap:24px" id="ml-grid"><div class="stack">' +
      '<div class="card pad-lg"><span class="eyebrow">Lesson ' + (i + 1) + ' · ' + (l.minutes || 5) + ' min</span><h2 class="mt1">' + esc(l.title) + '</h2><p class="lead" style="font-size:1.05rem">' + esc(l.summary) + '</p>' + (l.body || []).map((p) => '<p>' + rich(p) + '</p>').join('') + '</div>' +
      (TOOLS[l.tool] ? '<div class="card" id="tool">' + TOOLS[l.tool].html() + '</div>' : '') +
      (qs.length ? '<div class="card"><h3 class="mt0">Quick quiz</h3><div id="mq">' + qs.map((q, qi) => '<div class="mt2"><p class="mb1"><b>' + (qi + 1) + '. ' + esc(q.q) + '</b></p><div class="stack" style="gap:6px">' + q.opts.map((o, oi) => '<button class="btn ghost block" style="justify-content:flex-start;text-align:left" data-q="' + qi + '" data-o="' + oi + '">' + esc(o) + '</button>').join('') + '</div><p class="small mt1 mb0" id="why' + qi + '"></p></div>').join('') + '</div><div id="mq-res" class="mt2"></div></div>' : '') +
      '</div><aside class="stack"><div class="card sun"><h4 class="mt0">Remember</h4><ul class="reasons small">' + (l.keyPoints || []).map((k) => '<li class="yes">' + icon('check') + '<span>' + esc(k) + '</span></li>').join('') + '</ul></div>' +
      '<div class="card"><button class="btn block ' + (m.done[l.id] ? 'soft' : '') + '" id="ml-done">' + icon('check') + (m.done[l.id] ? 'Completed' : 'Mark as done') + '</button>' + (next ? '<a class="btn ghost block mt1" href="/money/' + esc(next.id) + '">Next: ' + esc(next.title) + ' ' + icon('right') + '</a>' : '<a class="btn ghost block mt1" href="/money">Back to all lessons</a>') + '</div>' +
      '<div class="card tint"><h4 class="mt0">Put it into practice</h4><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:4px"><li><a href="/prepare/costs">Plan the true cost of uni</a></li><li><a href="/thrive/money">Set your monthly budget</a></li><li><a href="/book?topic=scholarship">Talk to an adviser about money</a></li></ul></div></aside></div>', true);
    setTimeout(() => {
      const g = $('#ml-grid'); if (g && innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      if (TOOLS[l.tool]) TOOLS[l.tool].bind();
      const answered = {};
      $$('[data-q]').forEach((b) => b.onclick = () => {
        const qi = +b.dataset.q, oi = +b.dataset.o, q = qs[qi]; if (answered[qi] != null) return; answered[qi] = oi === q.ans;
        $$('[data-q="' + qi + '"]').forEach((x) => { const o = +x.dataset.o; x.disabled = true; if (o === q.ans) { x.style.borderColor = 'var(--ok)'; x.style.background = 'color-mix(in srgb, var(--ok) 12%, transparent)'; } else if (o === oi) { x.style.borderColor = 'var(--bad)'; } });
        $('#why' + qi).innerHTML = (answered[qi] ? '<b style="color:var(--ok)">Correct.</b> ' : '<b style="color:var(--bad)">Not quite.</b> ') + esc(q.why);
        if (Object.keys(answered).length === qs.length) { const sc = Object.values(answered).filter(Boolean).length; m.quiz[l.id] = sc; m.done[l.id] = true; a.save(); $('#mq-res').innerHTML = '<div class="notice ' + (sc === qs.length ? 'ok' : '') + '">' + icon('award') + '<p class="mb0">You got <b>' + sc + ' of ' + qs.length + '</b>. ' + (sc === qs.length ? 'Lesson complete!' : 'Lesson marked done — reread the key points to lock it in.') + '</p></div>'; }
      });
      $('#ml-done').onclick = () => { m.done[l.id] = !m.done[l.id]; a.save(); const y = scrollY; a.render(); scrollTo(0, y); };
    });
    return html;
  }

  /* ---------- Tools (each explains its result in words) ---------- */
  const num = (id, label, val, hint) => '<label class="field"><span>' + label + '</span><input type="number" min="0" step="any" id="' + id + '" value="' + esc(val) + '">' + (hint ? '<span class="hint">' + esc(hint) + '</span>' : '') + '</label>';
  const T = (k, d) => { const t = M().tools; t[k] = t[k] || d; return t[k]; };
  const keep = (k, o) => { M().tools[k] = o; A().save(); };
  const TOOLS = {
    budget: {
      html: () => { const t = T('budget', { income: toLocal(135), rent: toLocal(45), food: toLocal(35), transport: toLocal(12), data: toLocal(6), study: toLocal(5), fun: toLocal(10), other: toLocal(5), save: toLocal(14) }); return '<h3 class="mt0">' + icon('wallet') + ' Budget builder (' + cur() + ' per month)</h3><div class="form-grid">' + num('b-income', 'Money coming in', t.income) + '<span></span>' + [['rent', 'Rent (need)'], ['food', 'Food (need)'], ['transport', 'Transport (need)'], ['data', 'Phone & data (need)'], ['study', 'Books & printing (need)'], ['save', 'Savings'], ['fun', 'Going out (want)'], ['other', 'Other wants']].map(([k, l]) => num('b-' + k, l, t[k])).join('') + '</div><div id="b-out" class="mt2"></div>'; },
      bind: () => { const ks = ['income', 'rent', 'food', 'transport', 'data', 'study', 'save', 'fun', 'other']; const draw = () => { const v = {}; ks.forEach((k) => v[k] = +($('#b-' + k).value) || 0); keep('budget', v); const needs = v.rent + v.food + v.transport + v.data + v.study, wants = v.fun + v.other, left = v.income - needs - wants - v.save; const p = (x) => v.income ? Math.round(x / v.income * 100) : 0;
        $('#b-out').innerHTML = '<div class="grid g4" style="gap:10px"><div class="card flat kpi"><div class="l">Needs</div><div class="v" style="font-size:1.2rem">' + p(needs) + '%</div></div><div class="card flat kpi"><div class="l">Savings</div><div class="v" style="font-size:1.2rem">' + p(v.save) + '%</div></div><div class="card flat kpi"><div class="l">Wants</div><div class="v" style="font-size:1.2rem">' + p(wants) + '%</div></div><div class="card flat kpi"><div class="l">Left over</div><div class="v" style="font-size:1.2rem;color:' + (left < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + fmt(left) + '</div></div></div>' +
          '<div class="notice ' + (left < 0 ? 'bad' : 'ok') + ' mt2">' + icon(left < 0 ? 'alert' : 'check') + '<p class="mb0"><b>What this means:</b> ' + (left < 0 ? 'you plan to spend ' + fmt(-left) + ' more than you have. Cut wants first, then look at rent or transport — or talk to your family or the financial aid office before the month starts.' : p(needs) > 80 ? 'needs take ' + p(needs) + '% of your money, leaving little room for surprises. Try to grow savings to at least 10% before adding wants.' : p(v.save) < 10 ? 'you’re in budget, but saving only ' + p(v.save) + '%. Moving even ' + fmt(v.income * 0.1 - v.save) + ' more into savings gets you to 10%.' : 'a healthy plan: needs covered, ' + p(v.save) + '% saved and ' + fmt(left) + ' spare. Put the spare into your emergency fund.') + '</p></div>'; }; $$('#tool input').forEach((i) => i.oninput = draw); draw(); }
    },
    save: {
      html: () => { const t = T('save', { goal: toLocal(300), have: 0, monthly: toLocal(25), rate: 8 }); return '<h3 class="mt0">' + icon('heart') + ' Savings goal planner</h3><div class="form-grid">' + num('s-goal', 'My goal (' + cur() + ')', t.goal, 'e.g. one month of living costs, or a laptop') + num('s-have', 'Already saved', t.have) + num('s-monthly', 'I can save each month', t.monthly) + num('s-rate', 'Interest per year (%)', t.rate, 'Savings account, SACCO or fixed deposit rate — 0 if kept on your phone') + '</div><div id="s-out" class="mt2"></div>'; },
      bind: () => { const draw = () => { const g = +$('#s-goal').value || 0, h = +$('#s-have').value || 0, mo = +$('#s-monthly').value || 0, r = (+$('#s-rate').value || 0) / 100 / 12; keep('save', { goal: g, have: h, monthly: mo, rate: +$('#s-rate').value || 0 });
        let bal = h, n = 0, interest = 0; while (bal < g && n < 600 && mo > 0) { const i = bal * r; interest += i; bal += i + mo; n++; }
        $('#s-out').innerHTML = mo <= 0 && h < g ? '<div class="notice warn">' + icon('alert') + '<p class="mb0">Add an amount you can save each month to see when you’ll reach your goal.</p></div>' : '<div class="notice ok">' + icon('calendar') + '<p class="mb0"><b>What this means:</b> saving ' + fmt(mo) + ' a month, you reach ' + fmt(g) + ' in about <b>' + n + ' month' + (n === 1 ? '' : 's') + '</b>' + (n ? ' (around ' + U.fmtDate(U.addDays(new Date().toISOString().slice(0, 10), n * 30)) + ')' : '') + '. ' + (interest > 1 ? 'Interest adds about ' + fmt(interest) + ' — money you earn just for saving.' : 'Keeping it somewhere that pays interest would get you there a little faster.') + ' Saving ' + fmt(mo * 1.25) + ' instead would take about ' + Math.max(1, Math.ceil(Math.max(0, g - h) / Math.max(1, mo * 1.25))) + ' months.</p></div>'; }; $$('#tool input').forEach((i) => i.oninput = draw); draw(); }
    },
    loan: {
      html: () => { const t = T('loan', { amount: toLocal(1000), rate: 18, months: 24 }); return '<h3 class="mt0">' + icon('chart') + ' Loan cost calculator</h3><div class="form-grid">' + num('l-amount', 'Amount borrowed (' + cur() + ')', t.amount) + num('l-rate', 'Interest per year (%)', t.rate, 'Ask the lender for the yearly rate (APR)') + num('l-months', 'Repay over (months)', t.months) + '</div><div id="l-out" class="mt2"></div>'; },
      bind: () => { const draw = () => { const P = +$('#l-amount').value || 0, y = +$('#l-rate').value || 0, n = Math.max(1, +$('#l-months').value || 1), r = y / 100 / 12; keep('loan', { amount: P, rate: y, months: n });
        const pay = r ? P * r / (1 - Math.pow(1 + r, -n)) : P / n, total = pay * n, cost = total - P;
        $('#l-out').innerHTML = '<div class="grid g3" style="gap:10px"><div class="card flat kpi"><div class="l">Monthly payment</div><div class="v" style="font-size:1.2rem">' + fmt(pay) + '</div></div><div class="card flat kpi"><div class="l">Total you repay</div><div class="v" style="font-size:1.2rem">' + fmt(total) + '</div></div><div class="card flat kpi"><div class="l">Cost of borrowing</div><div class="v" style="font-size:1.2rem;color:var(--bad)">' + fmt(cost) + '</div></div></div><div class="notice mt2">' + icon('info') + '<p class="mb0"><b>What this means:</b> for every ' + fmt(100) + ' you borrow, you pay back about ' + fmt(P ? total / P * 100 : 0) + '. ' + (P && cost / P > 0.5 ? 'That’s expensive — look for a cheaper option (government student loans, scholarships, family) first.' : 'Before signing, check for extra fees and what happens if you pay late.') + '</p></div>'; }; $$('#tool input').forEach((i) => i.oninput = draw); draw(); }
    },
    trap: {
      html: () => { const t = T('trap', { fee: 10, days: 30, amount: toLocal(30) }); return '<h3 class="mt0">' + icon('alert') + ' “Small loan” true cost checker</h3><p class="small muted">App loans advertise a fee for a short period. See what that means over a year.</p><div class="form-grid">' + num('t-amount', 'Amount (' + cur() + ')', t.amount) + num('t-fee', 'Fee or interest (%)', t.fee) + num('t-days', 'For how many days?', t.days) + '</div><div id="t-out" class="mt2"></div>'; },
      bind: () => { const draw = () => { const a = +$('#t-amount').value || 0, f = (+$('#t-fee').value || 0) / 100, d = Math.max(1, +$('#t-days').value || 30); keep('trap', { amount: a, fee: f * 100, days: d });
        const yearly = (Math.pow(1 + f, 365 / d) - 1) * 100, rolled = a * Math.pow(1 + f, Math.floor(180 / d));
        $('#t-out').innerHTML = '<div class="notice bad">' + icon('alert') + '<p class="mb0"><b>What this means:</b> a ' + Math.round(f * 100) + '% fee every ' + d + ' days is about <b>' + Math.round(yearly).toLocaleString('en-US') + '% a year</b>. If you keep rolling over ' + fmt(a) + ', after 6 months you would owe about <b>' + fmt(rolled) + '</b>. A bank or SACCO loan is usually 15–25% a year.</p></div>'; }; $$('#tool input').forEach((i) => i.oninput = draw); draw(); }
    },
    fx: {
      html: () => { const cs = Object.keys(A().C.currencies || {}); const t = T('fx', { fee: 15000, cc: 'GBP', drop: 10 }); return '<h3 class="mt0">' + icon('globe') + ' Exchange-rate impact</h3><div class="form-grid">' + num('f-fee', 'Fee in the university’s currency', t.fee) + '<label class="field"><span>Currency</span><select id="f-cc">' + cs.map((x) => '<option' + (x === t.cc ? ' selected' : '') + '>' + x + '</option>').join('') + '</select></label>' + num('f-drop', 'If my currency weakens by (%)', t.drop) + '</div><div id="f-out" class="mt2"></div>'; },
      bind: () => { const draw = () => { const fee = +$('#f-fee').value || 0, cc = $('#f-cc').value, d = (+$('#f-drop').value || 0) / 100; keep('fx', { fee, cc, drop: d * 100 });
        const now = U.fromUSD(U.toUSD(fee, cc), cur()), later = now / (1 - Math.min(d, 0.9));
        $('#f-out').innerHTML = '<div class="notice">' + icon('info') + '<p class="mb0"><b>What this means:</b> ' + cc + ' ' + fee.toLocaleString('en-US') + ' costs about <b>' + fmt(now) + '</b> today. If your currency weakens by ' + Math.round(d * 100) + '%, the same fee costs about <b>' + fmt(later) + '</b> — ' + fmt(later - now) + ' more, without the university changing anything. That’s why the True Cost Planner adds an exchange-rate buffer.</p></div>'; }; $$('#tool input, #tool select').forEach((i) => i.oninput = i.onchange = draw); draw(); }
    },
    pay: {
      html: () => { const t = T('pay', { gross: toLocal(400), tax: 15, pension: 5, other: 0 }); return '<h3 class="mt0">' + icon('file') + ' Take-home pay</h3><p class="small muted">Use the rates on your contract or payslip — tax bands differ by country and salary.</p><div class="form-grid">' + num('p-gross', 'Gross monthly salary (' + cur() + ')', t.gross) + num('p-tax', 'Income tax (PAYE) %', t.tax) + num('p-pension', 'Pension / social security % (e.g. NSSF)', t.pension) + num('p-other', 'Other deductions (' + cur() + ')', t.other, 'Loan repayments, health insurance…') + '</div><div id="p-out" class="mt2"></div>'; },
      bind: () => { const draw = () => { const g = +$('#p-gross').value || 0, tx = (+$('#p-tax').value || 0) / 100, pe = (+$('#p-pension').value || 0) / 100, o = +$('#p-other').value || 0; keep('pay', { gross: g, tax: tx * 100, pension: pe * 100, other: o });
        const net = g - g * tx - g * pe - o; $('#p-out').innerHTML = '<div class="notice ok">' + icon('wallet') + '<p class="mb0"><b>What this means:</b> of ' + fmt(g) + ' gross, about <b>' + fmt(net) + '</b> reaches your account (' + (g ? Math.round(net / g * 100) : 0) + '%). Tax ' + fmt(g * tx) + ', pension ' + fmt(g * pe) + (o ? ', other ' + fmt(o) : '') + '. Build your budget on ' + fmt(net) + ', not ' + fmt(g) + '.</p></div>'; }; $$('#tool input').forEach((i) => i.oninput = draw); draw(); }
    }
  };

  window.APP_VIEWS.money = function (id) { return id ? lesson(id) : hub(); };
})();
