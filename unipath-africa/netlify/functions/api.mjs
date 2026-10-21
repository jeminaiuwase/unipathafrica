// UniPath Africa API — Netlify Function (v2) backed by Netlify Blobs.
// Routes live under /api/*. Data is stored in the site-wide "unipath" blob store.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';
import SOURCE from '../source-snapshot.mjs';
import { runReminders, runFreshness, compactAnalytics, analyticsRange, emailConfigured, deliver, listJSON as listAll, today as todayStr } from '../lib/jobs.mjs';

export const config = { path: ['/api/*', '/sitemap.xml'] };

const DEFAULT_MASTER_HASH = 'b76e621a7a128aa74db7c54249f0ab5174409cb3f693db9add56fe235c8887fc'; // sha256('unipath:UniPath2026!')
const MAX_DOC_BYTES = 4 * 1024 * 1024;
const MAX_JSON_BYTES = 900 * 1024;
const RESPONSE_KINDS = ['survey', 'usability', 'feedback', 'adviser'];
const USER_TTL = 60 * 86400 * 1000, ADMIN_TTL = 7 * 86400 * 1000;

const store = () => (globalThis.__UNIPATH_STORE__ || getStore({ name: 'unipath', consistency: 'strong' }));
const json = (d, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const fail = (m, s = 400) => json({ error: m }, s);
const sha256 = (t) => crypto.createHash('sha256').update(t).digest('hex');
const b64u = (b) => Buffer.from(b).toString('base64url');
const now = () => new Date().toISOString();
const rid = (p) => p + '_' + crypto.randomBytes(9).toString('base64url');
const normEmail = (e) => String(e || '').trim().toLowerCase();
const emailKey = (e) => 'emails/' + sha256(normEmail(e));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(st, key) { return (await st.get(key, { type: 'json' })) ?? null; }
async function putJSON(st, key, val) { await st.setJSON(key, val); return val; }

async function secret(st) {
  if (process.env.UNIPATH_SECRET) return process.env.UNIPATH_SECRET;
  let s = await st.get('config/secret');
  if (!s) { s = crypto.randomBytes(32).toString('hex'); await st.set('config/secret', s); }
  return s;
}
async function signToken(st, payload) {
  const body = b64u(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', await secret(st)).update(body).digest('base64url');
  return body + '.' + sig;
}
async function readToken(st, req) {
  const h = req.headers.get('authorization') || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!t.includes('.')) return null;
  const [body, sig] = t.split('.');
  const good = crypto.createHmac('sha256', await secret(st)).update(body).digest('base64url');
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  try { const p = JSON.parse(Buffer.from(body, 'base64url').toString()); return p.exp > Date.now() ? p : null; } catch { return null; }
}
function hashPw(pw, salt) { salt = salt || crypto.randomBytes(16).toString('hex'); return { salt, hash: crypto.scryptSync(String(pw), salt, 64).toString('hex') }; }
function checkPw(pw, rec) { if (!rec || !rec.salt) return false; const h = crypto.scryptSync(String(pw), rec.salt, 64); const g = Buffer.from(rec.hash, 'hex'); return g.length === h.length && crypto.timingSafeEqual(g, h); }
const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', createdAt: u.createdAt, lastActive: u.lastActive, notes: u.notes || [], consent: u.consent || null, prefs: Object.assign({ reminders: true, whatsapp: false }, u.prefs || {}) });

function summarise(state) {
  const s = state || {}; const p = s.profile || {}; const apps = s.applications || [];
  const stages = {}; apps.forEach((a) => { stages[a.stage] = (stages[a.stage] || 0) + 1; });
  const docs = s.docs || {};
  return {
    homeCountry: p.homeCountry || '', level: p.level || '', field: p.field || '', qualification: p.qual || '', grade: p.gradeLabel || '',
    budget: p.budgetAmount ? (p.budgetCurrency || '') + ' ' + p.budgetAmount : '', destinations: p.destinations || [], scholarship: !!p.scholarship,
    applications: apps.length, stages, programIds: apps.map((a) => a.programId).filter(Boolean), shortlist: (s.shortlist || []).slice(0, 50),
    docsReady: Object.values(docs).filter((d) => d && d.status === 'ready').length, statements: (s.statements || []).length, references: (s.references || []).length
  };
}

const PERMISSIONS = [
  { key: 'students.view', group: 'Students', label: 'See students, their applications and documents' },
  { key: 'students.edit', group: 'Students', label: 'Send notes to students and reset their passwords' },
  { key: 'students.delete', group: 'Students', label: 'Delete student accounts' },
  { key: 'students.export', group: 'Students', label: 'Export all student data' },
  { key: 'inbox.view', group: 'Adviser inbox', label: 'See adviser questions and consultation bookings' },
  { key: 'inbox.manage', group: 'Adviser inbox', label: 'Mark requests replied / closed and add notes' },
  { key: 'responses.view', group: 'Research', label: 'See questionnaires, website tests and feedback' },
  { key: 'responses.manage', group: 'Research', label: 'Delete or import research responses' },
  { key: 'content.edit', group: 'Website content', label: 'Edit programmes, scholarships, countries and pages (draft)' },
  { key: 'content.publish', group: 'Website content', label: 'Publish changes to the live website' },
  { key: 'pricing.manage', group: 'Website content', label: 'Turn paid plans and prices on or off' },
  { key: 'team.manage', group: 'Team', label: 'Add, remove and reassign team members' },
  { key: 'roles.manage', group: 'Team', label: 'Create roles and change what each role can do' },
  { key: 'analytics.view', group: 'Research', label: 'See anonymous usage analytics' },
  { key: 'code.download', group: 'Technical', label: 'Download the full website code' }
];
const ALL_PERMS = PERMISSIONS.map((p) => p.key);
const DEFAULT_ROLES = [
  { id: 'admin', name: 'Admin', description: 'Runs day-to-day operations.', perms: ALL_PERMS.filter((p) => !['roles.manage', 'code.download', 'pricing.manage'].includes(p)) },
  { id: 'adviser', name: 'Adviser', description: 'Helps students one-to-one.', perms: ['students.view', 'students.edit', 'inbox.view', 'inbox.manage'] },
  { id: 'content-editor', name: 'Content editor', description: 'Keeps programmes and pages up to date.', perms: ['content.edit', 'content.publish'] },
  { id: 'researcher', name: 'Researcher', description: 'Runs user research and testing.', perms: ['responses.view', 'responses.manage', 'analytics.view'] },
  { id: 'viewer', name: 'Viewer', description: 'Can look but not change anything.', perms: ['responses.view', 'inbox.view', 'analytics.view'] }
];
function mergeRoles(roles) { return Array.isArray(roles) && roles.length ? roles : DEFAULT_ROLES.map((r) => Object.assign({}, r, { perms: r.perms.slice() })); }
function permsFor(cfg, email) {
  if (email === 'owner') return ALL_PERMS.slice();
  const ad = (cfg.admins || []).find((x) => x.email === email); if (!ad) return [];
  const roles = mergeRoles(cfg.roles);
  const role = roles.find((r) => r.id === (ad.role || 'adviser')) || roles.find((r) => r.id === 'adviser');
  return role ? role.perms.slice() : [];
}

async function adminConfig(st) { return (await getJSON(st, 'config/admin')) || { masterHash: process.env.ADMIN_PASSCODE ? sha256('unipath:' + process.env.ADMIN_PASSCODE) : DEFAULT_MASTER_HASH, admins: [] }; }

async function listJSON(st, prefix) {
  const { blobs } = await st.list({ prefix });
  const out = [];
  for (let i = 0; i < blobs.length; i += 25) {
    const chunk = await Promise.all(blobs.slice(i, i + 25).map((b) => getJSON(st, b.key)));
    chunk.forEach((x) => x && out.push(x));
  }
  return out;
}
async function deleteUserData(st, id) {
  const u = await getJSON(st, 'users/' + id);
  if (u) await st.delete(emailKey(u.email));
  await st.delete('users/' + id); await st.delete('state/' + id);
  const { blobs } = await st.list({ prefix: 'docs/' + id + '/' });
  await Promise.all(blobs.map((b) => st.delete(b.key)));
}
async function readBody(req) {
  const t = await req.text();
  if (t.length > MAX_JSON_BYTES) throw Object.assign(new Error('Request too large'), { status: 413 });
  try { return t ? JSON.parse(t) : {}; } catch { throw Object.assign(new Error('Invalid JSON'), { status: 400 }); }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const m = req.method;
  const st = store();
  try {
    const [a, b, c, d, e] = parts;

    /* ---------- Public ---------- */
    if (url.pathname === '/sitemap.xml') {
      let content = await getJSON(st, 'content/live');
      if (!content) { try { const r = await fetch(new URL('/data/content.json', url.origin)); if (r.ok) content = await r.json(); } catch {} }
      const base = url.origin; const day = now().slice(0, 10);
      const slug = (x) => String(x).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const paths = ['/', '/discover', '/browse', '/countries', '/visa', '/prepare/costs', '/prepare/scholarships', '/thrive', '/thrive/first100', '/thrive/support', '/thrive/opportunities', '/thrive/roadmap', '/money', '/help', '/about', '/book', '/research', '/privacy'].concat((content && content.site && content.site.showPricing) ? ['/plans'] : []);
      ((content && content.countries) || []).forEach((c) => { paths.push('/country/' + slug(c.name)); paths.push('/country/' + slug(c.name) + '/visa'); });
      ((content && content.programs) || []).forEach((p) => paths.push('/program/' + encodeURIComponent(p.id)));
      const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + paths.map((p) => '  <url><loc>' + base + p + '</loc><lastmod>' + day + '</lastmod></url>').join('\n') + '\n</urlset>\n';
      return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8', 'cache-control': 'public, max-age=3600' } });
    }
    if (a === 'health') return json({ ok: true, time: now() });
    if (a === 'content' && m === 'GET') {
      const live = await getJSON(st, 'content/live');
      if (!live) return json(null); // nothing published yet — the site uses /data/content.json
      if (live.site) delete live.site.adminPassHash;
      return json(live);
    }
    if (a === 'track' && m === 'POST') {
      // Anonymous, aggregated usage counts. No names, emails, IPs or user IDs are stored.
      const body = await readBody(req).catch(() => ({}));
      const events = Array.isArray(body.events) ? body.events.slice(0, 60).map((e) => ({ t: String(e.t || '').slice(0, 12), p: String(e.p || '').slice(0, 100), v: String(e.v || '').slice(0, 100) })) : [];
      if (!events.length && !body.newSession) return json({ ok: true });
      await putJSON(st, 'ev/' + todayStr() + '/' + rid('e'), { newSession: !!body.newSession, mobile: !!body.mobile, events });
      return json({ ok: true });
    }
    if (a === 'submit' && m === 'POST') {
      const body = await readBody(req);
      if (!RESPONSE_KINDS.includes(body.kind)) return fail('Unknown kind');
      const tok = await readToken(st, req);
      const rec = { id: rid('r'), kind: body.kind, at: now(), status: body.kind === 'adviser' ? 'open' : '', userId: tok && tok.uid ? tok.uid : '', data: body.data || {} };
      await putJSON(st, 'responses/' + rec.at.replace(/[:.]/g, '-') + '_' + rec.id, rec);
      return json({ ok: true, id: rec.id });
    }

    /* ---------- Student auth ---------- */
    if (a === 'auth' && b === 'signup' && m === 'POST') {
      const { name, email, password, phone, consent, state } = await readBody(req);
      const em = normEmail(email);
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return fail('Please enter a valid email address.');
      if (!password || String(password).length < 8) return fail('Password must be at least 8 characters.');
      if (!consent) return fail('Please accept the privacy terms to create an account.');
      if (await st.get(emailKey(em))) return fail('An account with this email already exists — sign in instead.', 409);
      const id = rid('u');
      const user = Object.assign({ id, name: String(name || '').slice(0, 80), email: em, phone: String(phone || '').slice(0, 40), createdAt: now(), lastActive: now(), consent: { at: now(), version: 1 }, notes: [] }, hashPw(password));
      if (state) { user.summary = summarise(state); await putJSON(st, 'state/' + id, { state, updatedAt: now() }); }
      await putJSON(st, 'users/' + id, user); await st.set(emailKey(em), id);
      return json({ token: await signToken(st, { uid: id, exp: Date.now() + USER_TTL }), user: publicUser(user) });
    }
    if (a === 'auth' && b === 'login' && m === 'POST') {
      const { email, password } = await readBody(req);
      const id = await st.get(emailKey(email));
      const user = id ? await getJSON(st, 'users/' + id) : null;
      if (!user || !checkPw(password, user)) { await wait(600); return fail('Email or password is incorrect.', 401); }
      user.lastActive = now(); await putJSON(st, 'users/' + id, user);
      const sv = await getJSON(st, 'state/' + id);
      return json({ token: await signToken(st, { uid: id, exp: Date.now() + USER_TTL }), user: publicUser(user), state: sv ? sv.state : null, updatedAt: sv ? sv.updatedAt : null });
    }

    /* ---------- Student (authenticated) ---------- */
    if (a === 'me' || a === 'state' || a === 'docs') {
      const tok = await readToken(st, req);
      if (!tok || !tok.uid) return fail('Please sign in again.', 401);
      const uid = tok.uid; const user = await getJSON(st, 'users/' + uid);
      if (!user) return fail('Account not found.', 401);

      if (a === 'me' && !b && m === 'GET') {
        const sv = await getJSON(st, 'state/' + uid);
        user.lastActive = now(); await putJSON(st, 'users/' + uid, user);
        return json({ user: publicUser(user), state: sv ? sv.state : null, updatedAt: sv ? sv.updatedAt : null });
      }
      if (a === 'me' && !b && m === 'DELETE') { await deleteUserData(st, uid); return json({ ok: true }); }
      if (a === 'me' && b === 'password' && m === 'POST') {
        const { current, next } = await readBody(req);
        if (!checkPw(current, user)) return fail('Current password is incorrect.', 401);
        if (!next || String(next).length < 8) return fail('New password must be at least 8 characters.');
        Object.assign(user, hashPw(next)); await putJSON(st, 'users/' + uid, user); return json({ ok: true });
      }
      if (a === 'me' && b === 'profile' && m === 'PATCH') {
        const { name, phone, prefs } = await readBody(req);
        if (name != null) user.name = String(name).slice(0, 80); if (phone != null) user.phone = String(phone).slice(0, 40);
        if (prefs && typeof prefs === 'object') user.prefs = Object.assign({}, user.prefs, { reminders: prefs.reminders !== false, whatsapp: !!prefs.whatsapp });
        await putJSON(st, 'users/' + uid, user); return json({ user: publicUser(user) });
      }
      if (a === 'state' && m === 'PUT') {
        const { state } = await readBody(req);
        if (!state || typeof state !== 'object') return fail('Missing state');
        const updatedAt = now();
        await putJSON(st, 'state/' + uid, { state, updatedAt });
        user.summary = summarise(state); user.lastActive = updatedAt; await putJSON(st, 'users/' + uid, user);
        return json({ ok: true, updatedAt });
      }
      if (a === 'docs' && b) {
        const key = 'docs/' + uid + '/' + b.replace(/[^a-z0-9_-]/gi, '');
        if (m === 'PUT') {
          const buf = await req.arrayBuffer();
          if (buf.byteLength > MAX_DOC_BYTES) return fail('File is larger than 4 MB — please compress it.', 413);
          const meta = { name: decodeURIComponent(req.headers.get('x-file-name') || b).slice(0, 180), type: req.headers.get('content-type') || 'application/octet-stream', size: buf.byteLength, at: now() };
          await st.set(key, buf, { metadata: meta });
          return json({ ok: true, meta });
        }
        if (m === 'GET') {
          const r = await st.getWithMetadata(key, { type: 'arrayBuffer' });
          if (!r) return fail('Not found', 404);
          return new Response(r.data, { headers: { 'content-type': r.metadata.type || 'application/octet-stream', 'content-disposition': 'inline; filename="' + String(r.metadata.name || 'document').replace(/"/g, '') + '"', 'cache-control': 'private, no-store' } });
        }
        if (m === 'DELETE') { await st.delete(key); return json({ ok: true }); }
      }
      return fail('Not found', 404);
    }

    /* ---------- Admin ---------- */
    if (a === 'admin') {
      const cfg = await adminConfig(st);
      cfg.roles = mergeRoles(cfg.roles);
      if (b === 'login' && m === 'POST') {
        const { email, password } = await readBody(req);
        const em = normEmail(email);
        let who = null;
        if (!em || em === 'owner') { if (sha256('unipath:' + String(password || '')) === cfg.masterHash) who = { email: 'owner', name: 'Owner', role: 'owner' }; }
        else { const ad = cfg.admins.find((x) => x.email === em); if (ad && checkPw(password, ad)) who = { email: ad.email, name: ad.name, role: ad.role || 'adviser' }; }
        if (!who) { await wait(700); return fail('Those details aren’t right.', 401); }
        return json({ token: await signToken(st, { admin: true, email: who.email, exp: Date.now() + ADMIN_TTL }), admin: Object.assign(who, { perms: permsFor(cfg, who.email) }) });
      }
      const tok = await readToken(st, req);
      if (!tok || !tok.admin) return fail('Admin sign-in required.', 401);
      const isOwner = tok.email === 'owner';
      const me = isOwner ? { email: 'owner', name: 'Owner', role: 'owner' } : cfg.admins.find((x) => x.email === tok.email);
      if (!me) return fail('Your access has been removed.', 401);
      const perms = permsFor(cfg, tok.email);
      const can = (...p) => p.some((x) => perms.includes(x));
      const deny = () => fail('You don’t have permission to do that. Ask the owner to change your role.', 403);

      if (b === 'me' && m === 'GET') return json({ email: me.email, name: me.name, role: me.role || 'owner', perms, roles: cfg.roles.map((r) => ({ id: r.id, name: r.name })) });

      if (b === 'overview' && m === 'GET') {
        if (!can('students.view', 'responses.view', 'inbox.view')) return deny();
        const users = can('students.view') ? await listJSON(st, 'users/') : [];
        const resp = await listJSON(st, 'responses/');
        const week = Date.now() - 7 * 86400000;
        const agg = { students: users.length, newThisWeek: users.filter((u) => Date.parse(u.createdAt) > week).length, activeThisWeek: users.filter((u) => Date.parse(u.lastActive) > week).length, applications: 0, stages: {}, countries: {}, fields: {}, levels: {}, programmes: {}, docsReady: 0, responses: {}, openAdviser: 0, canStudents: can('students.view') };
        users.forEach((u) => {
          const s = u.summary || {}; agg.applications += s.applications || 0; agg.docsReady += s.docsReady || 0;
          Object.entries(s.stages || {}).forEach(([k, v]) => agg.stages[k] = (agg.stages[k] || 0) + v);
          if (s.homeCountry) agg.countries[s.homeCountry] = (agg.countries[s.homeCountry] || 0) + 1;
          if (s.field) agg.fields[s.field] = (agg.fields[s.field] || 0) + 1;
          if (s.level) agg.levels[s.level] = (agg.levels[s.level] || 0) + 1;
          (s.programIds || []).concat(s.shortlist || []).forEach((p) => agg.programmes[p] = (agg.programmes[p] || 0) + 1);
        });
        resp.forEach((r) => { agg.responses[r.kind] = (agg.responses[r.kind] || 0) + 1; if (r.kind === 'adviser' && r.status !== 'closed') agg.openAdviser++; });
        return json(agg);
      }
      if (b === 'users' && !c && m === 'GET') {
        if (!can('students.view')) return deny();
        const users = await listJSON(st, 'users/');
        return json(users.map((u) => Object.assign(publicUser(u), { summary: u.summary || {} })).sort((x, y) => String(y.lastActive).localeCompare(String(x.lastActive))));
      }
      if (b === 'users' && c) {
        if (!can('students.view')) return deny();
        const user = await getJSON(st, 'users/' + c); if (!user) return fail('Student not found', 404);
        if (!d && m === 'GET') {
          const sv = await getJSON(st, 'state/' + c);
          const { blobs } = await st.list({ prefix: 'docs/' + c + '/' });
          const docs = await Promise.all(blobs.map(async (x) => { const md = await st.getMetadata(x.key); return Object.assign({ key: x.key.split('/').pop() }, (md && md.metadata) || {}); }));
          const resp = (await listJSON(st, 'responses/')).filter((r) => r.userId === c);
          return json({ user: Object.assign(publicUser(user), { summary: user.summary || {} }), state: sv ? sv.state : null, updatedAt: sv ? sv.updatedAt : null, docs, responses: resp });
        }
        if (!d && m === 'DELETE') { if (!can('students.delete')) return deny(); await deleteUserData(st, c); return json({ ok: true }); }
        if (d === 'notes' && m === 'POST') {
          if (!can('students.edit')) return deny();
          const { text } = await readBody(req); if (!text || !String(text).trim()) return fail('Write a note first.');
          user.notes = user.notes || []; user.notes.push({ id: rid('n'), text: String(text).slice(0, 4000), by: me.name || tok.email, at: now() });
          await putJSON(st, 'users/' + c, user); return json({ notes: user.notes });
        }
        if (d === 'notes' && e && m === 'DELETE') { if (!can('students.edit')) return deny(); user.notes = (user.notes || []).filter((n) => n.id !== e); await putJSON(st, 'users/' + c, user); return json({ notes: user.notes }); }
        if (d === 'reset' && m === 'POST') {
          if (!can('students.edit')) return deny();
          const temp = crypto.randomBytes(5).toString('hex');
          Object.assign(user, hashPw(temp)); await putJSON(st, 'users/' + c, user);
          return json({ tempPassword: temp });
        }
        if (d === 'docs' && e && m === 'GET') {
          const r = await st.getWithMetadata('docs/' + c + '/' + e, { type: 'arrayBuffer' });
          if (!r) return fail('Not found', 404);
          return new Response(r.data, { headers: { 'content-type': r.metadata.type || 'application/octet-stream', 'content-disposition': 'attachment; filename="' + String(r.metadata.name || 'document').replace(/"/g, '') + '"', 'cache-control': 'private, no-store' } });
        }
      }
      if (b === 'responses' && !c && m === 'GET') {
        if (!can('responses.view', 'inbox.view')) return deny();
        let all = (await listJSON(st, 'responses/')).sort((x, y) => y.at.localeCompare(x.at));
        if (!can('responses.view')) all = all.filter((r) => r.kind === 'adviser');
        if (!can('inbox.view')) all = all.filter((r) => r.kind !== 'adviser');
        return json(all);
      }
      if (b === 'responses' && c) {
        const { blobs } = await st.list({ prefix: 'responses/' });
        const hit = blobs.find((x) => x.key.endsWith('_' + c)); if (!hit) return fail('Not found', 404);
        const rec = await getJSON(st, hit.key);
        const manage = rec.kind === 'adviser' ? can('inbox.manage', 'responses.manage') : can('responses.manage');
        if (!manage) return deny();
        if (m === 'DELETE') { await st.delete(hit.key); return json({ ok: true }); }
        if (m === 'PATCH') { const body = await readBody(req); if (body.status != null) rec.status = String(body.status); if (body.reply != null) rec.reply = String(body.reply).slice(0, 4000); rec.handledBy = me.name || tok.email; rec.updatedAt = now(); await putJSON(st, hit.key, rec); return json(rec); }
      }
      if (b === 'content' && m === 'PUT') {
        if (!can('content.publish')) return deny();
        const body = await readBody(req);
        if (!body || !body.site || !Array.isArray(body.programs)) return fail('Invalid content');
        const live = await getJSON(st, 'content/live');
        const wasOn = !!(live && live.site && live.site.showPricing), nowOn = !!body.site.showPricing;
        if (wasOn !== nowOn && !can('pricing.manage')) return fail('Only people allowed to manage pricing can turn prices on or off.', 403);
        body.meta = Object.assign({}, body.meta, { updatedAt: now(), publishedBy: me.name || tok.email });
        if (body.site) delete body.site.adminPassHash;
        await putJSON(st, 'content/live', body);
        const hist = (await getJSON(st, 'content/history')) || []; hist.unshift({ at: body.meta.updatedAt, by: me.name || tok.email, programmes: body.programs.length });
        await putJSON(st, 'content/history', hist.slice(0, 30));
        await putJSON(st, 'content/backup-' + body.meta.updatedAt.replace(/[:.]/g, '-'), body);
        return json({ ok: true, updatedAt: body.meta.updatedAt });
      }
      if (b === 'pricing' && m === 'POST') {
        if (!can('pricing.manage')) return deny();
        const body = await readBody(req);
        let live = await getJSON(st, 'content/live');
        if (!live) { if (!body.content || !body.content.site || !Array.isArray(body.content.programs)) return fail('Publish the site once first, then switch pricing.'); live = body.content; }
        live.site = live.site || {}; live.site.showPricing = !!body.showPricing; delete live.site.adminPassHash;
        live.meta = Object.assign({}, live.meta, { updatedAt: now(), publishedBy: me.name || tok.email });
        await putJSON(st, 'content/live', live);
        const hist = (await getJSON(st, 'content/history')) || []; hist.unshift({ at: live.meta.updatedAt, by: (me.name || tok.email) + ' — prices ' + (live.site.showPricing ? 'shown' : 'hidden'), programmes: (live.programs || []).length });
        await putJSON(st, 'content/history', hist.slice(0, 30));
        return json({ ok: true, showPricing: live.site.showPricing, updatedAt: live.meta.updatedAt });
      }
      if (b === 'content' && c === 'history' && m === 'GET') return json((await getJSON(st, 'content/history')) || []);

      /* Team & roles */
      if (b === 'roles' && m === 'GET') return json({ roles: cfg.roles, permissions: PERMISSIONS });
      if (b === 'roles' && m === 'PUT') {
        if (!can('roles.manage')) return deny();
        const { roles } = await readBody(req);
        if (!Array.isArray(roles)) return fail('Invalid roles');
        const clean = roles.filter((r) => r && r.id && r.id !== 'owner').map((r) => ({ id: String(r.id).toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 40), name: String(r.name || r.id).slice(0, 60), description: String(r.description || '').slice(0, 200), perms: (r.perms || []).filter((p) => PERMISSIONS.some((x) => x.key === p)) }));
        const used = new Set(cfg.admins.map((x) => x.role));
        for (const id of used) if (!clean.some((r) => r.id === id)) return fail('The role “' + id + '” is still assigned to someone. Reassign them first.');
        cfg.roles = clean; await putJSON(st, 'config/admin', cfg); return json({ roles: cfg.roles });
      }
      if (b === 'team' && m === 'GET') {
        if (!can('team.manage')) return json({ admins: [], you: { email: me.email, role: me.role || 'owner' } });
        return json({ admins: cfg.admins.map((x) => ({ email: x.email, name: x.name, role: x.role || 'adviser', addedAt: x.addedAt })), you: { email: me.email, role: me.role || 'owner' } });
      }
      if (b === 'team' && !c && m === 'POST') {
        if (!can('team.manage')) return deny();
        const { email, name, password, role } = await readBody(req); const em = normEmail(email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return fail('Enter a valid email.'); if (!password || String(password).length < 8) return fail('Password must be at least 8 characters.');
        if (!cfg.roles.some((r) => r.id === role)) return fail('Choose a role.');
        cfg.admins = cfg.admins.filter((x) => x.email !== em); cfg.admins.push(Object.assign({ email: em, name: String(name || em).slice(0, 80), role, addedAt: now() }, hashPw(password)));
        await putJSON(st, 'config/admin', cfg); return json({ ok: true });
      }
      if (b === 'team' && c && m === 'PATCH') {
        if (!can('team.manage')) return deny();
        const ad = cfg.admins.find((x) => x.email === normEmail(c)); if (!ad) return fail('Team member not found', 404);
        const { role, name } = await readBody(req);
        if (role != null) { if (!cfg.roles.some((r) => r.id === role)) return fail('Unknown role'); ad.role = role; }
        if (name != null) ad.name = String(name).slice(0, 80);
        await putJSON(st, 'config/admin', cfg); return json({ ok: true });
      }
      if (b === 'team' && c && d === 'reset' && m === 'POST') {
        if (!can('team.manage')) return deny();
        const ad = cfg.admins.find((x) => x.email === normEmail(c)); if (!ad) return fail('Team member not found', 404);
        const temp = crypto.randomBytes(5).toString('hex'); Object.assign(ad, hashPw(temp)); await putJSON(st, 'config/admin', cfg); return json({ tempPassword: temp });
      }
      if (b === 'team' && c && m === 'DELETE') { if (!can('team.manage')) return deny(); cfg.admins = cfg.admins.filter((x) => x.email !== normEmail(c)); await putJSON(st, 'config/admin', cfg); return json({ ok: true }); }
      if (b === 'password' && m === 'POST') {
        const { password } = await readBody(req); if (!password || String(password).length < 8) return fail('Use at least 8 characters.');
        if (isOwner) cfg.masterHash = sha256('unipath:' + password);
        else Object.assign(me, hashPw(password));
        await putJSON(st, 'config/admin', cfg); return json({ ok: true });
      }
      if (b === 'export' && m === 'GET') {
        if (!can('students.export')) return deny();
        const users = await listJSON(st, 'users/');
        const states = await Promise.all(users.map((u) => getJSON(st, 'state/' + u.id)));
        return json({ exportedAt: now(), students: users.map((u, i) => ({ user: Object.assign(publicUser(u), { summary: u.summary }), state: states[i] ? states[i].state : null })), responses: await listJSON(st, 'responses/') });
      }
      if (b === 'email-status' && m === 'GET') return json({ configured: emailConfigured(), from: process.env.EMAIL_FROM || '', owner: process.env.OWNER_EMAIL || '', lastDaily: await getJSON(st, 'jobs/last-daily') });
      if (b === 'outbox' && !c && m === 'GET') {
        if (!can('inbox.view')) return deny();
        return json((await listAll(st, 'outbox/')).sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt))).slice(0, 300));
      }
      if (b === 'outbox' && c && m === 'PATCH') {
        if (!can('inbox.manage')) return deny();
        const { blobs } = await st.list({ prefix: 'outbox/' }); const hit = blobs.find((x) => x.key.endsWith('_' + c)); if (!hit) return fail('Not found', 404);
        const rec = await getJSON(st, hit.key); const body = await readBody(req);
        if (body.status) { rec.status = String(body.status); rec.handledBy = me.name || tok.email; rec.updatedAt = now(); }
        await putJSON(st, hit.key, rec); return json(rec);
      }
      if (b === 'outbox' && c === 'clear-sent' && m === 'POST') {
        if (!can('inbox.manage')) return deny();
        const { blobs } = await st.list({ prefix: 'outbox/' }); let n = 0;
        for (const x of blobs) { const r = await getJSON(st, x.key); if (r && r.status !== 'queued') { await st.delete(x.key); n++; } }
        return json({ removed: n });
      }
      if (b === 'jobs' && c === 'run' && m === 'POST') {
        const { job, dryRun } = await readBody(req);
        if (job === 'reminders') { if (!can('inbox.manage')) return deny(); return json(await runReminders(st, { dryRun: !!dryRun })); }
        if (job === 'freshness') { if (!can('content.edit')) return deny(); return json(await runFreshness(st, { dryRun: !!dryRun })); }
        if (job === 'compact') { if (!can('analytics.view')) return deny(); return json(await compactAnalytics(st)); }
        return fail('Unknown job');
      }
      if (b === 'reports' && m === 'GET') { if (!can('content.edit')) return deny(); return json((await listAll(st, 'reports/')).sort((x, y) => String(y.month).localeCompare(String(x.month)))); }
      if (b === 'analytics' && m === 'GET') {
        if (!can('analytics.view')) return deny();
        const n = Math.min(90, Math.max(1, +(url.searchParams.get('days') || 30)));
        return json({ days: await analyticsRange(st, n) });
      }
      if (b === 'source' && m === 'GET') {
        if (!can('code.download')) return deny();
        return json({ files: SOURCE.files, publicFiles: SOURCE.publicFiles, snapshotAt: SOURCE.generatedAt });
      }
    }
    return fail('Not found', 404);
  } catch (err) {
    console.error(err);
    return fail(err.status ? err.message : 'Server error — please try again.', err.status || 500);
  }
}
