// UniPath Africa API — Netlify Function (v2) backed by Netlify Blobs.
// Routes live under /api/*. Data is stored in the site-wide "unipath" blob store.
import { getStore } from '@netlify/blobs';
import crypto from 'node:crypto';

export const config = { path: '/api/*' };

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
const publicUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, phone: u.phone || '', createdAt: u.createdAt, lastActive: u.lastActive, notes: u.notes || [], consent: u.consent || null });

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
    if (a === 'health') return json({ ok: true, time: now() });
    if (a === 'content' && m === 'GET') {
      const live = await getJSON(st, 'content/live');
      if (!live) return fail('No live content yet', 404);
      if (live.site) delete live.site.adminPassHash;
      return json(live);
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
        const { name, phone } = await readBody(req);
        if (name != null) user.name = String(name).slice(0, 80); if (phone != null) user.phone = String(phone).slice(0, 40);
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
      if (b === 'login' && m === 'POST') {
        const { email, password } = await readBody(req);
        const em = normEmail(email);
        let who = null;
        if (!em || em === 'owner') { if (sha256('unipath:' + String(password || '')) === cfg.masterHash) who = { email: 'owner', name: 'Owner', role: 'owner' }; }
        else { const ad = cfg.admins.find((x) => x.email === em); if (ad && checkPw(password, ad)) who = { email: ad.email, name: ad.name, role: ad.role || 'admin' }; }
        if (!who) { await wait(700); return fail('Those details aren’t right.', 401); }
        return json({ token: await signToken(st, { admin: true, email: who.email, role: who.role, exp: Date.now() + ADMIN_TTL }), admin: who });
      }
      const tok = await readToken(st, req);
      if (!tok || !tok.admin) return fail('Admin sign-in required.', 401);
      const isOwner = tok.role === 'owner';

      if (b === 'overview' && m === 'GET') {
        const users = await listJSON(st, 'users/');
        const resp = await listJSON(st, 'responses/');
        const week = Date.now() - 7 * 86400000;
        const agg = { students: users.length, newThisWeek: users.filter((u) => Date.parse(u.createdAt) > week).length, activeThisWeek: users.filter((u) => Date.parse(u.lastActive) > week).length, applications: 0, stages: {}, countries: {}, fields: {}, levels: {}, programmes: {}, docsReady: 0, responses: {}, openAdviser: 0 };
        users.forEach((u) => {
          const s = u.summary || {}; agg.applications += s.applications || 0; agg.docsReady += s.docsReady || 0;
          Object.entries(s.stages || {}).forEach(([k, v]) => agg.stages[k] = (agg.stages[k] || 0) + v);
          if (s.homeCountry) agg.countries[s.homeCountry] = (agg.countries[s.homeCountry] || 0) + 1;
          if (s.field) agg.fields[s.field] = (agg.fields[s.field] || 0) + 1;
          if (s.level) agg.levels[s.level] = (agg.levels[s.level] || 0) + 1;
          (s.programIds || []).concat(s.shortlist || []).forEach((p) => agg.programmes[p] = (agg.programmes[p] || 0) + 1);
        });
        resp.forEach((r) => { agg.responses[r.kind] = (agg.responses[r.kind] || 0) + 1; if (r.kind === 'adviser' && r.status !== 'closed') agg.openAdviser++; });
        agg.signups = users.map((u) => u.createdAt).sort();
        return json(agg);
      }
      if (b === 'users' && !c && m === 'GET') {
        const users = await listJSON(st, 'users/');
        return json(users.map((u) => Object.assign(publicUser(u), { summary: u.summary || {} })).sort((x, y) => String(y.lastActive).localeCompare(String(x.lastActive))));
      }
      if (b === 'users' && c) {
        const user = await getJSON(st, 'users/' + c); if (!user) return fail('Student not found', 404);
        if (!d && m === 'GET') {
          const sv = await getJSON(st, 'state/' + c);
          const { blobs } = await st.list({ prefix: 'docs/' + c + '/' });
          const docs = await Promise.all(blobs.map(async (x) => { const md = await st.getMetadata(x.key); return Object.assign({ key: x.key.split('/').pop() }, (md && md.metadata) || {}); }));
          const resp = (await listJSON(st, 'responses/')).filter((r) => r.userId === c);
          return json({ user: Object.assign(publicUser(user), { summary: user.summary || {} }), state: sv ? sv.state : null, updatedAt: sv ? sv.updatedAt : null, docs, responses: resp });
        }
        if (!d && m === 'DELETE') { await deleteUserData(st, c); return json({ ok: true }); }
        if (d === 'notes' && m === 'POST') {
          const { text } = await readBody(req); if (!text || !String(text).trim()) return fail('Write a note first.');
          user.notes = user.notes || []; user.notes.push({ id: rid('n'), text: String(text).slice(0, 4000), by: tok.email, at: now() });
          await putJSON(st, 'users/' + c, user); return json({ notes: user.notes });
        }
        if (d === 'notes' && e && m === 'DELETE') { user.notes = (user.notes || []).filter((n) => n.id !== e); await putJSON(st, 'users/' + c, user); return json({ notes: user.notes }); }
        if (d === 'reset' && m === 'POST') {
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
      if (b === 'responses' && !c && m === 'GET') return json((await listJSON(st, 'responses/')).sort((x, y) => y.at.localeCompare(x.at)));
      if (b === 'responses' && c) {
        const { blobs } = await st.list({ prefix: 'responses/' });
        const hit = blobs.find((x) => x.key.endsWith('_' + c)); if (!hit) return fail('Not found', 404);
        if (m === 'DELETE') { await st.delete(hit.key); return json({ ok: true }); }
        if (m === 'PATCH') { const rec = await getJSON(st, hit.key); const body = await readBody(req); if (body.status != null) rec.status = String(body.status); if (body.reply != null) rec.reply = String(body.reply).slice(0, 4000); rec.handledBy = tok.email; rec.updatedAt = now(); await putJSON(st, hit.key, rec); return json(rec); }
      }
      if (b === 'content' && m === 'PUT') {
        const body = await readBody(req);
        if (!body || !body.site || !Array.isArray(body.programs)) return fail('Invalid content');
        body.meta = Object.assign({}, body.meta, { updatedAt: now(), publishedBy: tok.email });
        if (body.site) delete body.site.adminPassHash;
        await putJSON(st, 'content/live', body);
        const hist = (await getJSON(st, 'content/history')) || []; hist.unshift({ at: body.meta.updatedAt, by: tok.email, programmes: body.programs.length });
        await putJSON(st, 'content/history', hist.slice(0, 30));
        await putJSON(st, 'content/backup-' + body.meta.updatedAt.replace(/[:.]/g, '-'), body);
        return json({ ok: true, updatedAt: body.meta.updatedAt });
      }
      if (b === 'content' && c === 'history' && m === 'GET') return json((await getJSON(st, 'content/history')) || []);
      if (b === 'team' && m === 'GET') return json({ admins: cfg.admins.map((x) => ({ email: x.email, name: x.name, role: x.role || 'admin', addedAt: x.addedAt })), you: { email: tok.email, role: tok.role } });
      if (b === 'team' && m === 'POST') {
        if (!isOwner) return fail('Only the owner can add admins.', 403);
        const { email, name, password } = await readBody(req); const em = normEmail(email);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return fail('Enter a valid email.'); if (!password || String(password).length < 8) return fail('Password must be at least 8 characters.');
        cfg.admins = cfg.admins.filter((x) => x.email !== em); cfg.admins.push(Object.assign({ email: em, name: String(name || em).slice(0, 80), role: 'admin', addedAt: now() }, hashPw(password)));
        await putJSON(st, 'config/admin', cfg); return json({ ok: true });
      }
      if (b === 'team' && c && m === 'DELETE') { if (!isOwner) return fail('Only the owner can remove admins.', 403); cfg.admins = cfg.admins.filter((x) => x.email !== normEmail(c)); await putJSON(st, 'config/admin', cfg); return json({ ok: true }); }
      if (b === 'password' && m === 'POST') {
        const { password } = await readBody(req); if (!password || String(password).length < 8) return fail('Use at least 8 characters.');
        if (isOwner) cfg.masterHash = sha256('unipath:' + password);
        else { const ad = cfg.admins.find((x) => x.email === tok.email); if (!ad) return fail('Admin not found', 404); Object.assign(ad, hashPw(password)); }
        await putJSON(st, 'config/admin', cfg); return json({ ok: true });
      }
      if (b === 'export' && m === 'GET') {
        const users = await listJSON(st, 'users/');
        const states = await Promise.all(users.map((u) => getJSON(st, 'state/' + u.id)));
        return json({ exportedAt: now(), students: users.map((u, i) => ({ user: Object.assign(publicUser(u), { summary: u.summary }), state: states[i] ? states[i].state : null })), responses: await listJSON(st, 'responses/') });
      }
    }
    return fail('Not found', 404);
  } catch (err) {
    console.error(err);
    return fail(err.status ? err.message : 'Server error — please try again.', err.status || 500);
  }
}
