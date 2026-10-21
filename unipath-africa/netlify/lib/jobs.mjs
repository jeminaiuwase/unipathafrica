// Shared background jobs: deadline reminders, "applications open" alerts, the monthly data
// freshness report, analytics compaction and the email/WhatsApp outbox.
// Email is sent with Resend (https://resend.com) when RESEND_API_KEY and EMAIL_FROM are set.
// Without them every message is kept in the Outbox so the team can send it by email or WhatsApp.
import crypto from 'node:crypto';

export const now = () => new Date().toISOString();
export const today = () => new Date().toISOString().slice(0, 10);
const rid = (p) => p + '_' + crypto.randomBytes(8).toString('base64url');
export async function getJSON(st, key) { return (await st.get(key, { type: 'json' })) ?? null; }
export async function putJSON(st, key, val) { await st.setJSON(key, val); return val; }
export async function listKeys(st, prefix) { const { blobs } = await st.list({ prefix }); return blobs.map((b) => b.key); }
export async function listJSON(st, prefix) { const keys = await listKeys(st, prefix); const out = []; for (let i = 0; i < keys.length; i += 25) { const chunk = await Promise.all(keys.slice(i, i + 25).map((k) => getJSON(st, k))); chunk.forEach((x) => x && out.push(x)); } return out; }
const days = (d) => Math.round((Date.parse(d + 'T00:00:00Z') - Date.parse(today() + 'T00:00:00Z')) / 86400000);
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const emailConfigured = () => !!(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
export const siteUrl = () => (process.env.URL || process.env.SITE_URL || 'https://unipathafrica.netlify.app').replace(/\/$/, '');

export async function sendEmail({ to, subject, text, html }) {
  if (!emailConfigured()) return { ok: false, reason: 'not-configured' };
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'content-type': 'application/json' }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [to], subject, text, html }) });
    if (!r.ok) return { ok: false, reason: 'HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200) };
    return { ok: true };
  } catch (e) { return { ok: false, reason: String(e && e.message || e) }; }
}

/** Send now if email is configured, and always keep a copy in the Outbox (status shows what happened). */
export async function deliver(st, msg) {
  const rec = Object.assign({ id: rid('msg'), createdAt: now(), status: 'queued' }, msg);
  if (msg.to) { const r = await sendEmail(msg); rec.status = r.ok ? 'sent' : 'queued'; if (!r.ok && r.reason !== 'not-configured') rec.error = r.reason; if (r.ok) rec.sentAt = now(); }
  await putJSON(st, 'outbox/' + rec.createdAt.slice(0, 10) + '_' + rec.id, rec);
  return rec;
}

async function liveContent(st) {
  let c = await getJSON(st, 'content/live');
  if (!c) { try { const r = await fetch(siteUrl() + '/data/content.json'); if (r.ok) c = await r.json(); } catch (e) {} }
  return c || { programs: [], scholarships: [] };
}

function wrapHtml(title, items, footer) {
  return '<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#14211d"><h2 style="color:#0E5A4B">' + esc(title) + '</h2><ul style="padding-left:18px;line-height:1.6">' + items.map((i) => '<li>' + i + '</li>').join('') + '</ul><p style="color:#5b6b66;font-size:13px">' + footer + '</p></div>';
}

/* ---------------- Deadline reminders + "applications open" alerts ---------------- */
const STEPS = [14, 7, 2, 0];
export async function runReminders(st, opts) {
  opts = opts || {};
  const content = await liveContent(st);
  const P = new Map((content.programs || []).map((p) => [p.id, p]));
  const SCH = new Map((content.scholarships || []).map((s) => [s.id, s]));
  const users = await listJSON(st, 'users/');
  let messages = 0, items = 0;
  for (const u of users) {
    if (u.prefs && u.prefs.reminders === false) continue;
    const sv = await getJSON(st, 'state/' + u.id); const S = (sv && sv.state) || {};
    const found = [];
    const due = (key, date, label, link, steps) => { if (!date) return; const d = days(date); for (const s of (steps || STEPS)) { if (d === s) found.push({ key: key + ':' + s, text: label + ' — ' + (d === 0 ? '<b>today</b>' : 'in <b>' + d + ' day' + (d > 1 ? 's' : '') + '</b>') + ' (' + date + ')', plain: label + ' — ' + (d === 0 ? 'today' : 'in ' + d + ' days') + ' (' + date + ')', link }); } };
    (S.applications || []).forEach((a) => {
      if (['enrolled', 'closed', 'submitted', 'decision'].includes(a.stage)) return;
      const p = a.programId ? P.get(a.programId) : null; const c = a.custom || {};
      const name = p ? p.program + ' at ' + p.university : (c.program || 'Application') + (c.university ? ' at ' + c.university : '');
      due('app:' + a.id, a.deadlineOverride || (p ? p.deadline : c.deadline), 'Application deadline: ' + name, siteUrl() + '/prepare/checklist/' + a.id);
      if (a.acceptBy) due('accept:' + a.id, a.acceptBy, 'Accept your offer by: ' + name, siteUrl() + '/enroll/' + a.id, [7, 2, 0]);
    });
    ((S.thrive || {}).internships || []).forEach((x) => { if (x.status === 'Interested' || x.status === 'Applied') due('opp:' + x.id, x.deadline, 'Deadline: ' + (x.org || 'Opportunity') + (x.role ? ' (' + x.role + ')' : ''), siteUrl() + '/thrive/career', [7, 2]); });
    Object.entries(S.visa || {}).forEach(([slug, v]) => { const ap = (v && v.app) || {}; due('bio:' + slug, ap.biometrics, 'Visa biometrics appointment (' + slug.replace(/-/g, ' ') + ')', siteUrl() + '/country/' + slug + '/visa', [2, 0]); due('int:' + slug, ap.interview, 'Visa interview (' + slug.replace(/-/g, ' ') + ')', siteUrl() + '/country/' + slug + '/visa', [7, 2, 0]); });
    (S.watch || []).forEach((w) => {
      const it = w.type === 'scholarship' ? SCH.get(w.id) : P.get(w.id); if (!it) return;
      const title = w.type === 'scholarship' ? it.name : it.program + ' at ' + it.university;
      const link = w.type === 'scholarship' ? siteUrl() + '/prepare/scholarships/calendar' : siteUrl() + '/program/' + encodeURIComponent(it.id);
      if (it.opensOn && days(it.opensOn) <= 0 && days(it.opensOn) > -30) found.push({ key: 'open:' + w.type + ':' + w.id + ':' + it.opensOn, text: '<b>Applications are open</b>: ' + esc(title), plain: 'Applications are open: ' + title, link });
      if (it.opensOn && days(it.opensOn) === 7) found.push({ key: 'opensoon:' + w.type + ':' + w.id + ':' + it.opensOn, text: 'Applications open in 7 days: ' + esc(title), plain: 'Applications open in 7 days: ' + title, link });
      due('watchdl:' + w.type + ':' + w.id, it.deadline, 'Deadline: ' + title, link, [30, 14, 7, 2]);
    });
    u.reminded = u.reminded || {};
    const fresh = found.filter((f) => !u.reminded[f.key]);
    if (!fresh.length) continue;
    items += fresh.length; messages++;
    if (opts.dryRun) continue;
    const subject = fresh.length === 1 ? 'UniPath reminder: ' + fresh[0].plain.split(' — ')[0] : 'UniPath: ' + fresh.length + ' things coming up';
    const footer = 'You get these because you saved deadlines on UniPath Africa. Turn reminders off any time in My Passport: ' + siteUrl() + '/passport';
    const text = 'Hi ' + (u.name || '') + ',\n\n' + fresh.map((f) => '• ' + f.plain + '\n  ' + f.link).join('\n') + '\n\n' + footer;
    await deliver(st, { kind: 'reminder', userId: u.id, to: u.email, phone: u.phone || '', name: u.name || '', subject, text, html: wrapHtml('Hi ' + (u.name || 'there') + ' — coming up', fresh.map((f) => f.text + ' — <a href="' + f.link + '">open</a>'), esc(footer)) });
    fresh.forEach((f) => { u.reminded[f.key] = now(); });
    // keep the record small
    const ks = Object.keys(u.reminded); if (ks.length > 400) ks.sort((a, b) => u.reminded[a].localeCompare(u.reminded[b])).slice(0, ks.length - 400).forEach((k) => delete u.reminded[k]);
    await putJSON(st, 'users/' + u.id, u);
  }
  return { users: users.length, messages, items, emailConfigured: emailConfigured() };
}

/* ---------------- Monthly data freshness report ---------------- */
export async function runFreshness(st, opts) {
  opts = opts || {};
  const c = await liveContent(st); const ps = c.programs || [];
  const t = today(), old = (d) => d && days(d) < -180;
  const r = {
    month: t.slice(0, 7), createdAt: now(), programmes: ps.length,
    verified: ps.filter((p) => p.verified).length, listed: ps.filter((p) => p.listed && !p.verified).length,
    passedDeadlines: ps.filter((p) => p.deadline && days(p.deadline) < 0).map((p) => ({ id: p.id, name: p.program + ' — ' + p.university, deadline: p.deadline })),
    staleVerified: ps.filter((p) => p.verified && old(p.lastVerified)).map((p) => ({ id: p.id, name: p.program + ' — ' + p.university, lastVerified: p.lastVerified })),
    linksOld: ps.filter((p) => !p.linksChecked || old(p.linksChecked)).length,
    countriesOld: (c.countries || []).filter((x) => !x.lastChecked || old(x.lastChecked)).map((x) => x.name),
    scholarshipsNoDates: (c.scholarships || []).filter((s) => !s.deadline && !s.usualMonth).length
  };
  await putJSON(st, 'reports/freshness-' + r.month, r);
  if (opts.dryRun) return r;
  const cfg = (await getJSON(st, 'config/admin')) || { admins: [], roles: [] };
  const roles = cfg.roles || [];
  const recipients = new Set((process.env.OWNER_EMAIL || '').split(',').map((x) => x.trim()).filter(Boolean));
  (cfg.admins || []).forEach((a) => { const role = roles.find((x) => x.id === a.role); if (!role || role.perms.includes('content.edit')) recipients.add(a.email); });
  const lines = [r.passedDeadlines.length + ' programme deadline(s) have passed — update them to the next intake.', r.staleVerified.length + ' verified programme(s) were last checked more than 6 months ago.', r.linksOld + ' programme(s) need their links checked.', r.countriesOld.length ? 'Country guides to re-check: ' + r.countriesOld.join(', ') + '.' : 'All country guides were checked in the last 6 months.', r.verified + ' of ' + r.programmes + ' programmes are verified; ' + r.listed + ' more are on official lists.'];
  const subject = 'UniPath data check — ' + r.month;
  const link = siteUrl() + '/admin.html';
  const text = 'Monthly data check for UniPath Africa:\n\n' + lines.map((l) => '• ' + l).join('\n') + '\n\nFix them in the admin console: ' + link;
  if (!recipients.size) await deliver(st, { kind: 'freshness', subject, text, html: wrapHtml(subject, lines.map(esc), '<a href="' + link + '">Open the admin console</a>') });
  for (const to of recipients) await deliver(st, { kind: 'freshness', to, subject, text, html: wrapHtml(subject, lines.map(esc), '<a href="' + link + '">Open the admin console</a>') });
  return r;
}

/* ---------------- Analytics (anonymous, aggregated) ---------------- */
export function emptyDay(day) { return { day, views: 0, sessions: 0, mobile: 0, desktop: 0, paths: {}, programs: {}, countries: {}, searches: {}, features: {} }; }
export function addEvents(agg, batch) {
  agg.sessions += batch.newSession ? 1 : 0;
  if (batch.newSession) agg[batch.mobile ? 'mobile' : 'desktop']++;
  (batch.events || []).forEach((e) => {
    const inc = (o, k) => { if (!k) return; k = String(k).slice(0, 120); o[k] = (o[k] || 0) + 1; };
    if (e.t === 'view') { agg.views++; inc(agg.paths, e.p); }
    if (e.t === 'program') inc(agg.programs, e.v);
    if (e.t === 'country') inc(agg.countries, e.v);
    if (e.t === 'search') inc(agg.searches, String(e.v || '').toLowerCase().trim());
    if (e.t === 'feature') inc(agg.features, e.v);
  });
  return agg;
}
export async function compactAnalytics(st) {
  const keys = await listKeys(st, 'ev/'); const byDay = {};
  keys.forEach((k) => { const d = k.split('/')[1]; if (d < today()) (byDay[d] = byDay[d] || []).push(k); });
  for (const [d, ks] of Object.entries(byDay)) {
    const agg = (await getJSON(st, 'analytics/' + d)) || emptyDay(d);
    for (const k of ks) { const b = await getJSON(st, k); if (b) addEvents(agg, b); await st.delete(k); }
    await putJSON(st, 'analytics/' + d, agg);
  }
  return { compactedDays: Object.keys(byDay).length };
}
export async function analyticsRange(st, n) {
  const out = []; const dt = new Date();
  for (let i = 0; i < n; i++) { const d = new Date(dt.getTime() - i * 86400000).toISOString().slice(0, 10); out.push(d); }
  const daysAgg = [];
  for (const d of out.reverse()) {
    let agg = await getJSON(st, 'analytics/' + d);
    if (d === today() || !agg) { const live = await listKeys(st, 'ev/' + d + '/'); if (live.length) { agg = agg || emptyDay(d); for (const k of live.slice(0, 500)) { const b = await getJSON(st, k); if (b) addEvents(agg, b); } } }
    daysAgg.push(agg || emptyDay(d));
  }
  return daysAgg;
}
