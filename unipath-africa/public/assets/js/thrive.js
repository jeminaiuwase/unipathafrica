/* UniPath Africa — Thrive: succeeding at university, not just getting in.
   The hidden curriculum: the support programmes inside universities, the opportunities outside
   them, and the habits that turn an admission letter into a degree, a career and a network. */
(function () {
  "use strict";
  const U = window.UP;
  const { icon, esc, $, $$ } = U;
  const A = () => window.APP;
  window.APP_VIEWS = window.APP_VIEWS || {};

  const TABS = [['start', 'compass', 'Overview'], ['first100', 'flag', 'First 100 days'], ['support', 'shield', 'Support at my uni'], ['opportunities', 'sparkle', 'Opportunities'], ['roadmap', 'list', 'Year-by-year plan'], ['grades', 'chart', 'Grades tracker'], ['money', 'wallet', 'Money at uni'], ['career', 'award', 'Career & internships']];
  const PILLARS = [
    ['cap', 'Learn well', 'Go to class, use office hours, join study groups and the writing centre. Most students who fail never asked for help.'],
    ['wallet', 'Stay funded', 'Fees and rent are the top reason students drop out. Budget monthly, know the hardship fund, keep scholarships renewed. Start with Money Skills.'],
    ['heart', 'Look after yourself', 'Sleep, food, exercise and someone to talk to. Every university has a counselling and health service — use it early.'],
    ['users', 'Belong', 'Join one or two clubs, find a mentor, make friends outside your course. Your network starts on day one.'],
    ['award', 'Build experience', 'Internships, volunteering, research and projects — employers ask “what have you done?”, not just “what did you study?”.'],
    ['star', 'Lead & grow', 'Leadership programmes, competitions and short courses add skills your degree may not teach.']
  ];
  const FIRST100 = [
    ['Before you arrive', ['Confirm accommodation and move-in date', 'Pay what’s due by the deadline and keep every receipt', 'Download the university app / student email instructions', 'Make copies of all documents (paper + your UniPath vault)', 'Plan your first month’s budget', 'Find the orientation (freshers’) week timetable']],
    ['Week 1', ['Register / enrol for your courses and get your student ID', 'Attend orientation — tours, library, IT and safety talks', 'Set up student email, the learning portal and Wi-Fi', 'Find your academic adviser / personal tutor and introduce yourself', 'Locate the health centre, counselling, library and finance office', 'Save emergency and campus security numbers in your phone']],
    ['Month 1', ['Get every course outline (syllabus) and put all deadlines in your calendar', 'Join 1–2 clubs or societies (one for fun, one for your career)', 'Visit the careers office once — ask what they offer first-years', 'Go to at least one lecturer’s office hours', 'Find or start a study group', 'Check your budget: are you spending what you planned?']],
    ['First semester', ['Use the writing centre / academic skills service before your first big essay', 'Learn how assessment works (coursework vs exams, resits, pass marks)', 'Ask about scholarships, bursaries and hardship funds for continuing students', 'Start a simple CV and update it each semester', 'Book a check-in with your adviser after your first results', 'Make one friend outside your course and country']]
  ];
  const SUPPORT = [
    ['Academic adviser / personal tutor', 'cap', 'A staff member who helps you choose courses, plan your degree and deal with problems.', 'Course choices, falling behind, changing programme', 'academic advising', 'Who is my academic adviser, and how do I book a meeting?'],
    ['Writing centre / academic skills', 'pen', 'Free help with essays, referencing, reports and avoiding plagiarism.', 'Before your first essay, and any time marks are low', 'writing centre academic skills', 'Can I book a session to review a draft essay?'],
    ['Tutoring & peer learning', 'users', 'Older students who passed the course run study sessions (often called PASS or peer tutoring).', 'Hard first-year modules like maths, statistics, anatomy, accounting', 'peer tutoring PASS', 'Which of my courses have peer-assisted study sessions?'],
    ['Library & research skills', 'book', 'Librarians teach you to find journal articles, use databases and manage references.', 'Research projects, dissertations', 'library research skills workshop', 'Do you run training on databases and reference managers?'],
    ['Counselling & wellbeing', 'heart', 'Free, confidential support for stress, homesickness, grief and mental health.', 'Any time you feel overwhelmed — don’t wait for a crisis', 'counselling wellbeing service', 'How do I book a confidential appointment?'],
    ['Health centre / clinic', 'shield', 'Medical care on campus, often free or cheap for students.', 'Illness, check-ups, medical letters for missed exams', 'student health centre clinic', 'What does my student health cover include?'],
    ['Disability & learning support', 'help', 'Extra exam time, materials and support if you have a disability or learning difficulty.', 'As soon as you arrive — support takes time to set up', 'disability support students', 'What evidence do I need to get exam arrangements?'],
    ['Financial aid & hardship funds', 'wallet', 'Bursaries, emergency grants, fee payment plans and work-study jobs.', 'When money is tight — before you fall behind on fees', 'financial aid bursary hardship fund', 'Is there an emergency fund or fee payment plan for continuing students?'],
    ['International student office', 'globe', 'Help with visas, permits, registering with authorities and settling in.', 'Visa renewals, travel letters, permit problems', 'international student office', 'What do I need to keep my student visa/permit valid?'],
    ['Careers service', 'award', 'CV checks, internship listings, career fairs, mock interviews, employer talks.', 'From year one — not just final year', 'careers service internships', 'What internship and career events are there for first-years?'],
    ['Entrepreneurship / innovation hub', 'sparkle', 'Incubators, business competitions, seed grants and mentors for student founders.', 'If you have an idea or want to build one', 'innovation hub incubator entrepreneurship', 'How do students join the incubator or business competitions?'],
    ['Research opportunities', 'chart', 'Paid or volunteer research with lecturers — great for postgraduate applications.', 'Year 2 onwards (sometimes year 1)', 'undergraduate research opportunities', 'Do lecturers take student research assistants?'],
    ['Exchange & study abroad', 'plane', 'A semester at a partner university abroad, sometimes funded (e.g. Erasmus+).', 'Apply in year 1–2 for year 2–3', 'student exchange study abroad Erasmus', 'Which partner universities can I study at, and is funding available?'],
    ['Mentorship programmes', 'users', 'Alumni or senior students matched with you for guidance.', 'Year one — especially if you’re the first in your family at uni', 'mentorship programme students alumni', 'Is there an alumni or peer mentoring programme I can join?'],
    ['Student union / guild & clubs', 'flag', 'Societies, sports, faith groups, student leadership and representation.', 'Orientation week and the clubs fair', 'student guild union clubs societies', 'Where is the list of student clubs and how do I join?'],
    ['IT & digital support', 'grid', 'Free software (Microsoft 365, statistics tools), laptop loans and Wi-Fi help.', 'Week one', 'IT services students software', 'What free software and laptop loans are available to students?']
  ];
  const ROADMAP = {
    Undergraduate: [
      ['Year 1 — Settle & build habits', ['Pass every course — use tutoring early', 'Join 1–2 clubs; try one leadership role', 'Learn a practical skill online (Excel, coding, design, writing)', 'Meet the careers service and start your CV', 'Get to know 2 lecturers well (future referees)']],
      ['Year 2 — Explore', ['Do a holiday internship, volunteer role or project', 'Apply for exchange, research or a competition (Hult Prize, Enactus)', 'Take a leadership role in a club', 'Build a LinkedIn profile and connect with alumni', 'Keep your grades up — many employers and master’s courses check them']],
      ['Year 3 — Get experience', ['Do a serious internship or placement in your field', 'Start a professional pathway if needed (bar course, CPA, licensing)', 'Ask lecturers for references while they know your work', 'Research jobs, graduate schemes and master’s options', 'Go to career fairs and practise interviews']],
      ['Final year — Launch', ['Apply for graduate jobs and schemes early (many close in the first semester)', 'Apply for master’s scholarships 9–12 months ahead (Chevening, Mastercard, DAAD…)', 'Finish your dissertation/project strongly — it’s your best portfolio piece', 'Line up professional registration or internship (medicine, law, engineering, accounting)', 'Keep in touch with your network after graduation']]
    ],
    Postgraduate: [
      ['First term', ['Meet your supervisor/programme lead and agree expectations', 'Plan your dissertation topic early', 'Join professional networks and student societies', 'Use the careers service for a CV/LinkedIn review']],
      ['Middle of the programme', ['Go to research seminars and conferences', 'Apply for internships, fellowships or research assistant roles', 'Publish or present if you can', 'Start job applications (they often close before you finish)']],
      ['Final months', ['Submit a strong dissertation — it’s your portfolio', 'Ask for references', 'Check post-study work options in your country', 'Plan how your network will help you after graduation']]
    ]
  };
  const PATHWAYS = [
    ['Law', 'Uganda: after an LLB you must pass the Bar Course at the Law Development Centre to practise. Kenya: the Advocates Training Programme at the Kenya School of Law.', [['Law Development Centre (Uganda)', 'https://www.ldc.ac.ug'], ['Kenya School of Law', 'https://www.ksl.ac.ke']]],
    ['Accounting & finance', 'A professional qualification (CPA, ACCA, CFA) matters as much as the degree. You can often start papers while still studying.', [['ICPAU — CPA Uganda', 'https://www.icpau.co.ug'], ['ICPAK — CPA Kenya', 'https://www.icpak.com'], ['ACCA', 'https://www.accaglobal.com']]],
    ['Medicine & health', 'Doctors, nurses and pharmacists complete an internship and register with a professional council before practising. Ask your faculty early how internship placement works.', [['Uganda Nurses & Midwives Council', 'https://unmc.ug']]],
    ['Engineering', 'Graduate engineers build supervised experience, then register with the national engineering body. Join the student chapter of the engineers’ institution.', [['Uganda Institution of Professional Engineers', 'https://uipe.co.ug'], ['IEEE student membership', 'https://www.ieee.org/membership/students/']]]
  ];

  const T = () => { const S = A().S; S.thrive = S.thrive || { checks: {}, uni: '', courses: [], scale: 'percent', budget: {}, opps: {}, road: {}, internships: [] }; ['checks', 'budget', 'opps', 'road'].forEach((k) => S.thrive[k] = S.thrive[k] || {}); ['courses', 'internships'].forEach((k) => S.thrive[k] = S.thrive[k] || []); return S.thrive; };
  const domainOf = (url) => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; } };
  const gsearch = (q, dom) => 'https://www.google.com/search?q=' + encodeURIComponent(q + (dom ? ' site:' + dom : ''));
  function myUnis() {
    const a = A(), S = a.S, progs = a.C.programs || [];
    const fromApps = S.applications.filter((x) => ['offer', 'enrolled'].includes(x.stage)).map((x) => a.appInfo(x)).map((i) => ({ name: i.university, url: i.p ? i.p.officialUrl : i.url }));
    const all = []; const seen = new Set();
    fromApps.concat(progs.map((p) => ({ name: p.university, url: p.officialUrl }))).forEach((u) => { if (u.name && !seen.has(u.name)) { seen.add(u.name); all.push(u); } });
    return { offers: fromApps, all };
  }

  function shell(tab, inner) {
    const a = A();
    return '<div class="container page">' + a.journeySteps('thrive') +
      a.pageHead('Thrive at university', 'Getting in is step one. This is how students actually succeed — the support inside universities, the opportunities outside them, and a plan for every year.') +
      '<nav class="subnav" aria-label="Thrive tools">' + TABS.map((t) => '<a href="/thrive' + (t[0] === 'start' ? '' : '/' + t[0]) + '" class="' + (t[0] === tab ? 'active' : '') + '">' + icon(t[1]) + t[2] + '</a>').join('') + '</nav>' + inner + '</div>';
  }
  const tick = (key, label, tip, done) => '<li class="' + (done ? 'done' : '') + '"><button class="tick" data-tk="' + esc(key) + '" aria-pressed="' + !!done + '" aria-label="Mark done">' + icon('check') + '</button><div><div class="lbl">' + esc(label) + '</div>' + (tip ? '<div class="tip">' + tip + '</div>' : '') + '</div></li>';
  function bindTicks(store) { $$('[data-tk]').forEach((b) => b.onclick = () => { const y = window.scrollY; store[b.dataset.tk] = !store[b.dataset.tk]; A().save(); A().render(); window.scrollTo(0, y); }); }

  /* ---------- Overview ---------- */
  function overview() {
    const t = T(), a = A();
    const f100 = FIRST100.flatMap((g, gi) => g[1].map((_, i) => 'f' + gi + '-' + i)); const fDone = f100.filter((k) => t.checks[k]).length;
    const roads = ROADMAP[(a.S.profile && a.S.profile.level) === 'Postgraduate' ? 'Postgraduate' : 'Undergraduate'];
    const rKeys = roads.flatMap((g, gi) => g[1].map((_, i) => 'r' + gi + '-' + i)); const rDone = rKeys.filter((k) => t.road[k]).length;
    const saved = Object.values(t.opps).filter(Boolean).length;
    return shell('start',
      '<div class="card tint pad-lg"><h2 class="mt0">University is more than a programme and an application.</h2><p>Students who succeed don’t just attend lectures. They use the support their university already pays for, join communities, gain experience every year, and manage money and wellbeing. Most of these programmes are free — but nobody tells you they exist. That’s what this section is for.</p>' +
      '<div class="grid g3 mt2"><a class="card hover" href="/thrive/first100" style="text-decoration:none;color:inherit"><div class="small muted">First 100 days</div><div class="big-num" style="font-size:1.6rem">' + fDone + '/' + f100.length + '</div><div class="progress mt1"><span style="width:' + (fDone / f100.length * 100) + '%"></span></div></a><a class="card hover" href="/thrive/roadmap" style="text-decoration:none;color:inherit"><div class="small muted">Year-by-year plan</div><div class="big-num" style="font-size:1.6rem">' + rDone + '/' + rKeys.length + '</div><div class="progress mt1"><span style="width:' + (rDone / rKeys.length * 100) + '%"></span></div></a><a class="card hover" href="/thrive/opportunities" style="text-decoration:none;color:inherit"><div class="small muted">Opportunities saved</div><div class="big-num" style="font-size:1.6rem">' + saved + '</div><div class="small muted">' + (a.C.opportunities || []).length + ' in the directory</div></a></div></div>' +
      '<h3 class="mt4">The six things successful students do</h3><div class="grid g3">' + PILLARS.map((p) => '<div class="card"><div class="feature-icon">' + icon(p[0]) + '</div><h4 class="mt1">' + p[1] + '</h4><p class="small muted mb0">' + p[2] + '</p></div>').join('') + '</div>' +
      '<div class="grid g2 mt3"><a class="card hover row between" href="/thrive/support" style="text-decoration:none;color:inherit"><div><h4 class="mt0 mb0">' + icon('shield') + ' Find the support at your university</h4><p class="small muted mb0">16 services most universities offer — with a direct search of your university’s website for each.</p></div>' + icon('right') + '</a>' +
      '<a class="card hover row between" href="/thrive/career" style="text-decoration:none;color:inherit"><div><h4 class="mt0 mb0">' + icon('award') + ' Plan your career from year one</h4><p class="small muted mb0">Professional pathways (law, accounting, medicine, engineering), internships and a tracker.</p></div>' + icon('right') + '</a></div>' +
      '<div class="card mt3 row between"><div><h3 class="mb0">Talk it through</h3><p class="small muted mb0">Not sure which programmes to join, or struggling in first year? Advisers can help — free.</p></div><a class="btn" href="/book?topic=other">' + icon('calendar') + 'Book a free session</a></div>');
  }

  /* ---------- First 100 days ---------- */
  function first100() {
    const t = T();
    const html = shell('first100', '<p class="muted">The first weeks decide a lot. Tick things off as you go — it saves to your Passport.</p><div class="grid g2">' + FIRST100.map((g, gi) => '<div class="card"><h3 class="mt0">' + esc(g[0]) + '</h3><ul class="checklist">' + g[1].map((x, i) => tick('f' + gi + '-' + i, x, '', t.checks['f' + gi + '-' + i])).join('') + '</ul></div>').join('') + '</div>' +
      '<div class="row mt3"><a class="btn ghost" href="/thrive/support">' + icon('shield') + 'Find these services at my university</a><a class="btn ghost" href="/thrive/money">' + icon('wallet') + 'Set my monthly budget</a><a class="btn ghost" href="/enroll">' + icon('cap') + 'Back to enrolment steps</a></div>');
    setTimeout(() => bindTicks(t.checks));
    return html;
  }

  /* ---------- Support at my uni ---------- */
  function support() {
    const t = T(), a = A(), u = myUnis();
    const chosen = u.all.find((x) => x.name === t.uni) || u.offers[0] || null;
    const dom = chosen ? domainOf(chosen.url) : '';
    const html = shell('support',
      '<div class="card"><div class="row between"><div><h3 class="mt0 mb0">Which university?</h3><p class="small muted mb0">We’ll link each service straight to a search of that university’s own website.</p></div><select id="th-uni" style="max-width:340px"><option value="">Choose your university…</option>' + (u.offers.length ? '<optgroup label="My offers">' + u.offers.map((x) => '<option' + (chosen && chosen.name === x.name ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</optgroup>' : '') + '<optgroup label="All universities">' + u.all.map((x) => '<option' + (chosen && chosen.name === x.name && !u.offers.some((o) => o.name === x.name) ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('') + '</optgroup></select></div>' +
      (chosen && U.safeUrl(chosen.url) ? '<p class="small mt2 mb0">Official website: <a href="' + esc(U.safeUrl(chosen.url)) + '" target="_blank" rel="noopener">' + esc(dom) + ' ↗</a></p>' : '') + '</div>' +
      '<div class="grid g2 mt3">' + SUPPORT.map((s, i) => '<div class="card"><div class="row" style="gap:10px;flex-wrap:nowrap;align-items:flex-start"><div class="feature-icon" style="margin:0;flex:none">' + icon(s[1]) + '</div><div style="flex:1"><h4 class="mt0 mb0">' + esc(s[0]) + '</h4><p class="small mb0 mt1">' + esc(s[2]) + '</p><p class="small muted mt1 mb0"><b>Use it for:</b> ' + esc(s[3]) + '</p><p class="small mt1 mb0"><b>Ask:</b> “' + esc(s[5]) + '”</p>' +
        '<div class="row mt2" style="gap:6px"><a class="btn sm ghost" href="' + esc(gsearch((chosen ? chosen.name + ' ' : '') + s[4], dom)) + '" target="_blank" rel="noopener">' + icon('search') + (chosen ? 'Find it at ' + esc(chosen.name.length > 26 ? chosen.name.slice(0, 24) + '…' : chosen.name) : 'Search') + '</a><button class="btn sm ' + (t.checks['s' + i] ? 'soft' : 'ghost') + '" data-tk="s' + i + '">' + icon('check') + (t.checks['s' + i] ? 'Found it' : 'Mark as found') + '</button></div></div></div></div>').join('') + '</div>' +
      '<div class="notice mt3">' + icon('info') + '<p>Names differ between universities (a “guild” in Uganda, a “student union” in the UK). If a search doesn’t find it, ask at the student affairs or dean of students office.</p></div>');
    setTimeout(() => { $('#th-uni').onchange = (e) => { t.uni = e.target.value; a.save(); a.render(); }; bindTicks(t.checks); });
    return html;
  }

  /* ---------- Opportunities ---------- */
  let of = { cat: '', q: '' };
  function opportunities() {
    const t = T(), a = A();
    const all = a.C.opportunities || [];
    const cats = [...new Set(all.map((o) => o.category))].filter(Boolean);
    const list = all.filter((o) => (!of.cat || (of.cat === 'saved' ? t.opps[o.id] : o.category === of.cat)) && (!of.q || (o.name + ' ' + o.what + ' ' + o.who).toLowerCase().includes(of.q.toLowerCase())));
    const html = shell('opportunities',
      '<p class="muted">Programmes outside your lectures that build skills, money, networks and experience. All free or low-cost unless stated. Always apply on the official website.</p>' +
      '<div class="row mb2" style="gap:8px"><div class="chips">' + [['', 'All'], ['saved', '★ Saved']].concat(cats.map((c) => [c, c])).map(([k, l]) => '<button class="chip ' + (of.cat === k ? 'on' : '') + '" data-oc="' + esc(k) + '">' + esc(l) + '</button>').join('') + '</div><input type="search" id="op-q" placeholder="Search…" value="' + esc(of.q) + '" style="max-width:220px"></div>' +
      '<div class="grid g2">' + list.map((o) => '<article class="card"><div class="row between" style="align-items:flex-start"><div><span class="badge brand">' + esc(o.category) + '</span>' + (o.cost ? ' <span class="badge">' + esc(o.cost) + '</span>' : '') + '<h3 class="mt1 mb0">' + esc(o.name) + '</h3></div><button class="icon-btn" data-os="' + esc(o.id) + '" aria-pressed="' + !!t.opps[o.id] + '" title="' + (t.opps[o.id] ? 'Saved' : 'Save') + '" style="color:' + (t.opps[o.id] ? 'var(--warn)' : 'var(--muted)') + '">' + icon('star') + '</button></div>' +
        '<p class="small mt1">' + esc(o.what) + '</p><p class="small mb0"><b>Who:</b> ' + esc(o.who || 'Students') + (o.when ? '<br><b>When:</b> ' + esc(o.when) : '') + '</p>' + (o.tip ? '<p class="small muted mt1 mb0">' + icon('help') + ' ' + esc(o.tip) + '</p>' : '') +
        '<div class="row mt2">' + (U.safeUrl(o.url) ? '<a class="btn sm" href="' + esc(U.safeUrl(o.url)) + '" target="_blank" rel="noopener">' + icon('external') + 'Official site</a>' : '') + '<button class="btn sm ghost" data-otrack="' + esc(o.id) + '">' + icon('plus') + 'Track my application</button></div></article>').join('') + (list.length ? '' : '<p class="muted">Nothing here yet.</p>') + '</div>' +
      '<div class="notice warn mt3">' + icon('alert') + '<p>Real programmes don’t charge you to apply. If someone asks for money to “guarantee” a place, it’s a scam.</p></div>');
    setTimeout(() => {
      $$('[data-oc]').forEach((b) => b.onclick = () => { of.cat = b.dataset.oc; a.render(); });
      const q = $('#op-q'); q.oninput = () => { clearTimeout(q._t); q._t = setTimeout(() => { of.q = q.value; a.render(); const n = $('#op-q'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 250); };
      $$('[data-os]').forEach((b) => b.onclick = () => { t.opps[b.dataset.os] = !t.opps[b.dataset.os]; a.save(); const y = scrollY; a.render(); scrollTo(0, y); });
      $$('[data-otrack]').forEach((b) => b.onclick = () => { const o = all.find((x) => x.id === b.dataset.otrack); t.internships.push({ id: U.uid('op'), org: o.name, role: o.category, url: o.url || '', deadline: '', status: 'Interested' }); a.save(); U.toast('Added to Career & internships', 'check'); U.go('/thrive/career'); });
    });
    return html;
  }

  /* ---------- Roadmap ---------- */
  function roadmap() {
    const t = T(), a = A(); const lvl = (a.S.profile && a.S.profile.level) === 'Postgraduate' ? 'Postgraduate' : 'Undergraduate';
    const html = shell('roadmap', '<p class="muted">What to do each year so you graduate with a degree <b>and</b> experience, referees and a network. ' + (lvl === 'Postgraduate' ? 'Showing the postgraduate plan.' : 'Showing the undergraduate plan.') + '</p><div class="grid g2">' + ROADMAP[lvl].map((g, gi) => '<div class="card"><h3 class="mt0">' + esc(g[0]) + '</h3><ul class="checklist">' + g[1].map((x, i) => tick('r' + gi + '-' + i, x, '', t.road['r' + gi + '-' + i])).join('') + '</ul></div>').join('') + '</div>' +
      '<h3 class="mt4">Professional pathways — check yours early</h3><div class="grid g2">' + PATHWAYS.map((p) => '<div class="card"><h4 class="mt0">' + esc(p[0]) + '</h4><p class="small">' + esc(p[1]) + '</p><div class="row" style="gap:6px">' + p[2].map(([l, u]) => '<a class="btn sm ghost" href="' + esc(u) + '" target="_blank" rel="noopener">' + icon('external') + esc(l) + '</a>').join('') + '</div></div>').join('') + '</div>');
    setTimeout(() => bindTicks(t.road));
    return html;
  }

  /* ---------- Grades tracker ---------- */
  const SCALES = {
    percent: { label: 'Percentage marks (most African & UK universities)', toLabel: (avg) => avg >= 70 ? 'First class / Distinction' : avg >= 60 ? 'Upper second (2:1)' : avg >= 50 ? 'Lower second (2:2)' : avg >= 40 ? 'Third / Pass' : 'At risk — talk to your adviser' },
    cgpa5: { label: 'CGPA out of 5 (Uganda)', fromPct: (p) => p >= 80 ? 5 : p >= 75 ? 4.5 : p >= 70 ? 4 : p >= 65 ? 3.5 : p >= 60 ? 3 : p >= 55 ? 2.5 : p >= 50 ? 2 : p >= 45 ? 1.5 : p >= 40 ? 1 : 0, toLabel: (g) => g >= 4.4 ? 'First class' : g >= 3.6 ? 'Second class upper' : g >= 2.8 ? 'Second class lower' : g >= 2 ? 'Pass' : 'At risk — talk to your adviser' },
    gpa4: { label: 'GPA out of 4 (US & others)', fromPct: (p) => p >= 93 ? 4 : p >= 90 ? 3.7 : p >= 87 ? 3.3 : p >= 83 ? 3 : p >= 80 ? 2.7 : p >= 77 ? 2.3 : p >= 73 ? 2 : p >= 70 ? 1.7 : p >= 67 ? 1.3 : p >= 60 ? 1 : 0, toLabel: (g) => g >= 3.5 ? 'Excellent (Dean’s list range)' : g >= 3 ? 'Good' : g >= 2 ? 'Satisfactory' : 'At risk — talk to your adviser' }
  };
  function grades() {
    const t = T(), a = A(); const sc = SCALES[t.scale] || SCALES.percent;
    const cs = t.courses; const credits = cs.reduce((s, c) => s + (+c.credits || 0), 0);
    const avgPct = credits ? cs.reduce((s, c) => s + (+c.mark || 0) * (+c.credits || 0), 0) / credits : 0;
    const value = t.scale === 'percent' ? avgPct : (credits ? cs.reduce((s, c) => s + sc.fromPct(+c.mark || 0) * (+c.credits || 0), 0) / credits : 0);
    const shown = t.scale === 'percent' ? avgPct.toFixed(1) + '%' : value.toFixed(2);
    const weak = cs.filter((c) => +c.mark < 50);
    const html = shell('grades',
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;gap:24px" id="gr-grid"><div class="card"><div class="row between"><h3 class="mb0">My courses</h3><select id="gr-scale" style="width:auto">' + Object.entries(SCALES).map(([k, v]) => '<option value="' + k + '"' + (t.scale === k ? ' selected' : '') + '>' + esc(v.label) + '</option>').join('') + '</select></div>' +
      '<div class="table-wrap mt2"><table class="tbl"><thead><tr><th>Course</th><th>Semester</th><th>Credits</th><th>Mark %</th><th></th></tr></thead><tbody>' + cs.map((c, i) => '<tr><td><input data-gc="' + i + '" data-f="name" value="' + esc(c.name) + '" aria-label="Course"></td><td><input data-gc="' + i + '" data-f="sem" value="' + esc(c.sem || '') + '" style="width:90px" aria-label="Semester"></td><td><input type="number" min="0" data-gc="' + i + '" data-f="credits" value="' + esc(c.credits) + '" style="width:80px" aria-label="Credits"></td><td><input type="number" min="0" max="100" data-gc="' + i + '" data-f="mark" value="' + esc(c.mark) + '" style="width:80px" aria-label="Mark"></td><td><button class="icon-btn" data-grm="' + i + '" aria-label="Remove" style="color:var(--bad)">' + icon('trash') + '</button></td></tr>').join('') + '</tbody></table></div>' +
      '<button class="btn sm ghost mt2" id="gr-add">' + icon('plus') + 'Add course</button><p class="small muted mt2 mb0">Your university’s own grading rules always apply — this is a guide. Find them in your student handbook.</p></div>' +
      '<aside class="stack"><div class="card" style="background:var(--ink);color:var(--bg);border:0"><span class="eyebrow" style="color:var(--sun)">Weighted average</span><div class="big-num" style="color:var(--bg)">' + (credits ? shown : '—') + '</div><p class="small mb0" style="opacity:.8">' + (credits ? esc(sc.toLabel(value)) : 'Add your courses to see your average.') + '</p></div>' +
      (weak.length ? '<div class="notice bad">' + icon('alert') + '<p class="small"><b>' + weak.length + ' course' + (weak.length > 1 ? 's' : '') + ' below 50%.</b> Book your academic adviser and the tutoring service now — resits and retakes cost money and time. <a href="/thrive/support">Find support →</a></p></div>' : '') +
      '<div class="card"><h4 class="mt0">Why grades matter after uni</h4><ul class="small" style="padding-left:18px;margin:0"><li>Many graduate jobs and schemes ask for a 2:1 / second class upper or above.</li><li>Master’s scholarships (Chevening, Commonwealth, Mastercard) compare grades.</li><li>Some scholarships require a minimum average to stay renewed.</li></ul></div></aside></div>');
    setTimeout(() => {
      const g = $('#gr-grid'); if (g && innerWidth < 920) g.style.gridTemplateColumns = '1fr';
      $('#gr-scale').onchange = (e) => { t.scale = e.target.value; a.save(); a.render(); };
      $('#gr-add').onclick = () => { t.courses.push({ name: '', sem: '', credits: 3, mark: '' }); a.save(); a.render(); };
      $$('[data-gc]').forEach((i) => i.onchange = () => { t.courses[+i.dataset.gc][i.dataset.f] = i.value; a.save(); a.render(); });
      $$('[data-grm]').forEach((b) => b.onclick = () => { t.courses.splice(+b.dataset.grm, 1); a.save(); a.render(); });
    });
    return html;
  }

  /* ---------- Money at uni ---------- */
  const SPEND = [['rent', 'Rent'], ['food', 'Food'], ['transport', 'Transport'], ['data', 'Phone & data'], ['study', 'Books & printing'], ['personal', 'Personal'], ['family', 'Sending money home'], ['fun', 'Going out'], ['other', 'Other']];
  function money() {
    const t = T(), a = A(), c = a.cur(); const b = t.budget;
    const cp = a.S.costPlan && a.S.costPlan.v === 2 ? a.S.costPlan : null;
    if (!b.init && cp) { const r = U.rateOf(c); b.rent = Math.round(cp.accommodation / 12 * r); b.food = Math.round(cp.food / 12 * r); b.transport = Math.round(cp.transport / 12 * r); b.data = Math.round(cp.phone / 12 * r); b.personal = Math.round(cp.personal / 12 * r); b.study = Math.round(cp.books / 12 * r); b.income = Math.round(((cp.family || 0) + (cp.work || 0) + (cp.loan || 0)) / 12 * r); b.init = true; b.cur = c; }
    const spend = SPEND.reduce((s, [k]) => s + (+b[k] || 0), 0), income = +b.income || 0, left = income - spend;
    const html = shell('money',
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 320px;gap:24px" id="mo-grid"><div class="card"><h3 class="mt0">My monthly budget (' + esc(b.cur || c) + ')</h3><p class="small muted">' + (cp ? 'Started from your Cost Planner. ' : '') + 'Update it each month with what you really spent.</p><div class="form-grid">' +
      '<label class="field full"><span><b>Money coming in each month</b> (family, allowance, loan, job)</span><input type="number" min="0" data-bd="income" value="' + esc(b.income || '') + '"></label>' + SPEND.map(([k, l]) => '<label class="field"><span>' + l + '</span><input type="number" min="0" data-bd="' + k + '" value="' + esc(b[k] || '') + '"></label>').join('') + '</div></div>' +
      '<aside class="stack"><div class="card" style="background:' + (left < 0 ? 'var(--coral-soft)' : 'var(--brand-soft)') + '"><div class="small muted">Left at the end of the month</div><div class="big-num" style="color:' + (left < 0 ? 'var(--bad)' : 'var(--ok)') + '">' + esc(b.cur || c) + ' ' + Math.round(left).toLocaleString('en-US') + '</div><p class="small mb0">' + (left < 0 ? 'You’re spending more than you have. Cut one category, and talk to the financial aid office before you fall behind on rent or fees.' : 'Good. Try to save 10% each month for emergencies and next semester’s costs.') + '</p></div>' +
      '<div class="card"><h4 class="mt0">Money tips</h4><ul class="small" style="padding-left:18px;margin:0;display:grid;gap:4px"><li>Pay rent and fees first, the day money arrives.</li><li>Ask about the university’s hardship fund <b>before</b> things get bad.</li><li>Cook with friends; buy in bulk at the market.</li><li>Student discounts on data bundles and transport are common — ask.</li><li>Keep fee receipts — you’ll need them for exams and graduation.</li></ul><a class="small" href="/prepare/costs">Open the True Cost Planner →</a><br><a class="small" href="/money">Learn Money Skills (9 short lessons) →</a></div></aside></div>');
    setTimeout(() => { const g = $('#mo-grid'); if (g && innerWidth < 920) g.style.gridTemplateColumns = '1fr'; $$('[data-bd]').forEach((i) => i.onchange = () => { b[i.dataset.bd] = +i.value || 0; b.init = true; b.cur = b.cur || c; a.save(); const y = scrollY; a.render(); scrollTo(0, y); }); });
    return html;
  }

  /* ---------- Career & internships ---------- */
  const ISTAT = ['Interested', 'Applied', 'Interview', 'Offer', 'Not this time'];
  function career() {
    const t = T(), a = A(); const L = t.internships;
    const html = shell('career',
      '<div class="grid g3"><div class="card"><div class="feature-icon">' + icon('list') + '</div><h4 class="mt1">CV & LinkedIn</h4><p class="small muted">Keep a one-page CV and update it every semester. Store it in your vault.</p><a class="btn sm ghost" href="/prepare/vault">' + icon('upload') + 'My CV in the vault</a></div>' +
      '<div class="card"><div class="feature-icon">' + icon('award') + '</div><h4 class="mt1">Experience every year</h4><p class="small muted">Internships, volunteering, research, club leadership or your own project all count.</p><a class="btn sm ghost" href="/thrive/opportunities">' + icon('sparkle') + 'Browse opportunities</a></div>' +
      '<div class="card"><div class="feature-icon">' + icon('mic') + '</div><h4 class="mt1">Interviews</h4><p class="small muted">Practise answers with the STAR method and a timer.</p><a class="btn sm ghost" href="/prepare/interview">' + icon('mic') + 'Practise now</a></div></div>' +
      '<div class="card mt3"><div class="row between"><div><h3 class="mt0 mb0">Internship & opportunity tracker</h3><p class="small muted mb0">Every internship, fellowship, competition and job you’re going for.</p></div><button class="btn sm" id="in-add">' + icon('plus') + 'Add</button></div>' +
      (L.length ? '<div class="table-wrap mt2"><table class="tbl"><thead><tr><th>Organisation</th><th>Role / type</th><th>Deadline</th><th>Status</th><th></th></tr></thead><tbody>' + L.map((x, i) => '<tr><td><input data-in="' + i + '" data-f="org" value="' + esc(x.org) + '" aria-label="Organisation">' + (U.safeUrl(x.url) ? '<a class="small" href="' + esc(U.safeUrl(x.url)) + '" target="_blank" rel="noopener">Open ↗</a>' : '') + '</td><td><input data-in="' + i + '" data-f="role" value="' + esc(x.role) + '" aria-label="Role"></td><td><input type="date" data-in="' + i + '" data-f="deadline" value="' + esc(x.deadline || '') + '" aria-label="Deadline">' + (x.deadline ? '<div class="small ' + (U.daysUntil(x.deadline) < 7 ? '' : 'muted') + '">' + U.countdownLabel(x.deadline).text + '</div>' : '') + '</td><td><select data-in="' + i + '" data-f="status" aria-label="Status">' + ISTAT.map((s) => '<option' + (x.status === s ? ' selected' : '') + '>' + s + '</option>').join('') + '</select></td><td><button class="icon-btn" data-inrm="' + i + '" aria-label="Remove" style="color:var(--bad)">' + icon('trash') + '</button></td></tr>').join('') + '</tbody></table></div><button class="btn sm ghost mt2" id="in-ics">' + icon('calendar') + 'Add deadlines to calendar</button>' : '<p class="muted small mt2">Nothing yet. Add one, or save from Opportunities.</p>') + '</div>' +
      '<h3 class="mt4">Professional pathways</h3><div class="grid g2">' + PATHWAYS.map((p) => '<div class="card"><h4 class="mt0">' + esc(p[0]) + '</h4><p class="small">' + esc(p[1]) + '</p><div class="row" style="gap:6px">' + p[2].map(([l, u]) => '<a class="btn sm ghost" href="' + esc(u) + '" target="_blank" rel="noopener">' + icon('external') + esc(l) + '</a>').join('') + '</div></div>').join('') + '</div>' +
      '<div class="card tint mt3 row between"><div><h3 class="mb0">Want a CV or career check?</h3><p class="small mb0">An adviser can review your CV and plan with you.</p></div><a class="btn" href="/book?topic=other">' + icon('calendar') + 'Book a free session</a></div>');
    setTimeout(() => {
      $('#in-add').onclick = () => { L.push({ id: U.uid('op'), org: '', role: 'Internship', url: '', deadline: '', status: 'Interested' }); a.save(); a.render(); };
      $$('[data-in]').forEach((i) => i.onchange = () => { L[+i.dataset.in][i.dataset.f] = i.value; a.save(); a.render(); });
      $$('[data-inrm]').forEach((b) => b.onclick = () => { L.splice(+b.dataset.inrm, 1); a.save(); a.render(); });
      const ic = $('#in-ics'); if (ic) ic.onclick = () => { const ev = L.filter((x) => x.deadline).map((x) => ({ date: x.deadline, title: 'Deadline: ' + (x.org || 'Opportunity') + ' — ' + (x.role || ''), desc: x.url || '' })); if (!ev.length) return U.toast('Add a deadline first', 'info'); U.download('unipath-opportunities.ics', U.ics(ev), 'text/calendar'); };
    });
    return html;
  }

  window.APP_VIEWS.thrive = function (tab) {
    U.track('feature', 'thrive:' + (tab || 'overview'));
    switch (tab) {
      case 'first100': return first100();
      case 'support': return support();
      case 'opportunities': return opportunities();
      case 'roadmap': return roadmap();
      case 'grades': return grades();
      case 'money': return money();
      case 'career': return career();
      default: return overview();
    }
  };
})();
