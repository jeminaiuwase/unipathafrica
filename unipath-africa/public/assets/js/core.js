/* UniPath Africa — shared core: icons, content store, state, utilities */
(function () {
  "use strict";

  /* ---------- Icons (stroke, 24x24) ---------- */
  const P = {
    cap: '<path d="M22 10 12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2.5 9 2.5 12 0v-5"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
    heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
    bookmark: '<path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>',
    board: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 7v7M12 7v4M16 7v9"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><path d="M4 22v-7"/>',
    pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    right: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
    left: '<path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>',
    external: '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>',
    home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16.2 7.8-2.1 6.3-6.3 2.1 2.1-6.3z"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.2z"/><path d="M19 17v4M17 19h4"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1M12 18v4"/>',
    book: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><path d="M20 17v5H6.5A2.5 2.5 0 0 1 4 19.5"/>',
    plane: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 12.9 17 22l-5-3-5 3 1.5-9.1"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    grid: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    refresh: '<path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16"/><path d="M3 21v-5h5"/><path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8"/><path d="M21 3v5h-5"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9M13 17V5M8 17v-3"/>',
    db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>',
    test: '<path d="M9 2v6L4 18a2 2 0 0 0 1.8 3h12.4A2 2 0 0 0 20 18L15 8V2"/><path d="M8 2h8M7 14h10"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>',
    dup: '<rect x="8" y="8" width="14" height="14" rx="2"/><path d="M4 16V4a2 2 0 0 1 2-2h12"/>',
    play: '<path d="m6 3 14 9-14 9z"/>',
    pause: '<rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8-6.2-3.2-6.2 3.2L7 14.2 2 9.3l6.9-1z"/>'
  };
  function icon(name, cls) {
    return '<svg class="' + (cls || '') + '" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || P.info) + '</svg>';
  }

  /* ---------- Utilities ---------- */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = (p) => (p || 'id') + '-' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);
  const $ = (s, el) => (el || document).querySelector(s);
  const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const safeUrl = (u) => { let s = String(u || '').trim(); if (s.startsWith('#/')) s = s.slice(1); return /^(https?:\/\/|mailto:|tel:|#|\/(?!\/))/i.test(s) ? s : ''; };

  function store(key, val) {
    try {
      if (val === undefined) { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
      if (val === null) { localStorage.removeItem(key); return null; }
      localStorage.setItem(key, JSON.stringify(val)); return val;
    } catch (e) { return null; }
  }

  function today() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseDate(s) { if (!s) return null; const d = new Date(s + (s.length === 10 ? 'T00:00:00' : '')); return isNaN(d) ? null : d; }
  function daysUntil(s) { const d = parseDate(s); if (!d) return null; return Math.round((d - today()) / 86400000); }
  function fmtDate(s, opts) { const d = parseDate(s); if (!d) return '—'; return d.toLocaleDateString('en-GB', opts || { day: 'numeric', month: 'short', year: 'numeric' }); }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(s, n) { const d = parseDate(s) || today(); d.setDate(d.getDate() + n); return ymd(d); }
  function countdownLabel(s) {
    const n = daysUntil(s);
    if (n == null) return { text: 'No deadline', cls: '' };
    if (n < 0) return { text: 'Closed ' + Math.abs(n) + 'd ago', cls: 'soon' };
    if (n === 0) return { text: 'Due today', cls: 'soon' };
    if (n <= 14) return { text: n + ' days left', cls: 'soon' };
    if (n <= 45) return { text: n + ' days left', cls: 'mid' };
    return { text: n + ' days left', cls: 'far' };
  }

  /* ---------- Toast & modal ---------- */
  function toast(msg, ic) {
    let wrap = $('.toasts');
    if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toasts'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
    const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = icon(ic || 'check') + '<span>' + esc(msg) + '</span>';
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, 2800);
  }
  function modal(opts) {
    const back = document.createElement('div'); back.className = 'modal-back';
    back.innerHTML = '<div class="modal ' + (opts.wide ? 'wide' : '') + '" role="dialog" aria-modal="true" aria-label="' + esc(opts.title || 'Dialog') + '">' +
      '<header><h3>' + esc(opts.title || '') + '</h3><button class="icon-btn" data-close aria-label="Close">' + icon('x') + '</button></header>' +
      '<div class="body">' + (opts.body || '') + '</div>' + (opts.footer ? '<footer>' + opts.footer + '</footer>' : '') + '</div>';
    const prev = document.activeElement;
    const close = () => { back.remove(); document.removeEventListener('keydown', onKey); if (prev && prev.focus) prev.focus(); opts.onClose && opts.onClose(); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    back.addEventListener('click', (e) => { if (e.target === back || e.target.closest('[data-close]')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(back);
    const first = back.querySelector('input, select, textarea, button:not([data-close])'); if (first) setTimeout(() => first.focus(), 30);
    opts.onOpen && opts.onOpen(back.querySelector('.modal'), close);
    return { el: back.querySelector('.modal'), close };
  }
  function confirmBox(title, text, okLabel) {
    return new Promise((res) => {
      let done = false;
      const m = modal({ title, body: '<p>' + esc(text) + '</p>', footer: '<button class="btn ghost" data-close>Cancel</button><button class="btn danger" data-ok>' + esc(okLabel || 'Delete') + '</button>', onClose: () => { if (!done) res(false); } });
      m.el.querySelector('[data-ok]').addEventListener('click', () => { done = true; res(true); m.close(); });
    });
  }

  /* ---------- Downloads ---------- */
  function download(name, content, type) {
    const blob = content instanceof Blob ? content : new Blob([content], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  function toCSV(rows, cols) {
    const q = (v) => { const s = Array.isArray(v) ? v.join(' | ') : (v == null ? '' : String(v)); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return [cols.join(',')].concat(rows.map((r) => cols.map((c) => q(r[c])).join(','))).join('\n');
  }
  function parseCSV(text) {
    const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
      else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); rows.push(row); row = []; cur = ''; }
      else cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    const head = rows.shift() || [];
    return rows.filter((r) => r.some((x) => x.trim())).map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] == null ? '' : r[i]])));
  }

  /* ---------- Calendar (.ics) ---------- */
  function ics(events) {
    const dt = (s) => s.replace(/-/g, '');
    const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//UniPath Africa//Admissions//EN', 'CALSCALE:GREGORIAN'];
    events.forEach((e) => {
      const end = addDays(e.date, 1);
      lines.push('BEGIN:VEVENT', 'UID:' + uid('evt') + '@unipath.africa', 'DTSTAMP:' + stamp, 'DTSTART;VALUE=DATE:' + dt(e.date), 'DTEND;VALUE=DATE:' + dt(end),
        'SUMMARY:' + String(e.title).replace(/[,;]/g, ' '), 'DESCRIPTION:' + String(e.desc || '').replace(/\n/g, '\\n').replace(/[,;]/g, ' '),
        'BEGIN:VALARM', 'TRIGGER:-P2D', 'ACTION:DISPLAY', 'DESCRIPTION:Reminder', 'END:VALARM', 'END:VEVENT');
    });
    lines.push('END:VCALENDAR');
    return lines.join('\r\n');
  }

  /* ---------- Netlify Forms ---------- */
  async function submitNetlify(formName, data) {
    const body = new URLSearchParams(Object.assign({ 'form-name': formName }, data)).toString();
    try {
      const r = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      return r.ok;
    } catch (e) { return false; }
  }

  /* ---------- Hashing ---------- */
  async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /* ---------- IndexedDB file vault (device-only) ---------- */
  const Vault = {
    db: null,
    open() {
      if (this.db) return Promise.resolve(this.db);
      return new Promise((res, rej) => {
        if (!('indexedDB' in window)) return rej(new Error('no idb'));
        const r = indexedDB.open('unipath-vault', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('files');
        r.onsuccess = () => { this.db = r.result; res(this.db); };
        r.onerror = () => rej(r.error);
      });
    },
    async put(key, file) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, key); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); },
    async get(key) { const db = await this.open(); return new Promise((res, rej) => { const tx = db.transaction('files', 'readonly'); const q = tx.objectStore('files').get(key); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); },
    async del(key) { const db = await this.open(); return new Promise((res) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').delete(key); tx.oncomplete = () => res(); tx.onerror = () => res(); }); },
    async clear() { const db = await this.open(); return new Promise((res) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').clear(); tx.oncomplete = () => res(); tx.onerror = () => res(); }); }
  };

  /* ---------- Server API (Netlify Functions + Blobs) ---------- */
  const API = {
    online: null, TOKEN: 'unipath.token', USER: 'unipath.user',
    token(kind) { try { return localStorage.getItem(kind === 'admin' ? 'unipath.admin.token' : this.TOKEN) || ''; } catch (e) { return ''; } },
    setToken(t, kind) { try { if (t) localStorage.setItem(kind === 'admin' ? 'unipath.admin.token' : this.TOKEN, t); else localStorage.removeItem(kind === 'admin' ? 'unipath.admin.token' : this.TOKEN); } catch (e) {} },
    user() { return store(this.USER); },
    setUser(u) { store(this.USER, u || null); },
    signedIn() { return !!(this.online && this.token()); },
    async check() {
      if (this.online !== null) return this.online;
      try { const r = await fetch('/api/health', { cache: 'no-store' }); this.online = r.ok && ((r.headers.get('content-type') || '').includes('json')) && (await r.json()).ok === true; } catch (e) { this.online = false; }
      return this.online;
    },
    async call(method, path, body, opts) {
      opts = opts || {};
      const h = Object.assign({}, opts.headers || {});
      const tk = opts.admin ? this.token('admin') : this.token();
      if (tk) h.authorization = 'Bearer ' + tk;
      let b;
      if (body instanceof Blob || body instanceof ArrayBuffer) { b = body; h['content-type'] = opts.type || (body.type) || 'application/octet-stream'; }
      else if (body !== undefined) { h['content-type'] = 'application/json'; b = JSON.stringify(body); }
      const r = await fetch('/api/' + path, { method, headers: h, body: b, cache: 'no-store', keepalive: !!opts.keepalive });
      if (opts.raw) { if (!r.ok) { const e = new Error('Request failed (' + r.status + ')'); e.status = r.status; throw e; } return r; }
      let d = null; try { d = await r.json(); } catch (e) {}
      if (!r.ok) { const e = new Error((d && d.error) || ('Request failed (' + r.status + ')')); e.status = r.status; throw e; }
      return d;
    }
  };
  async function submitResponse(kind, formName, data) {
    let ok = false;
    if (await API.check()) { try { await API.call('POST', 'submit', { kind, data }); ok = true; } catch (e) {} }
    const nf = await submitNetlify(formName, data);
    return ok || nf;
  }

  /* ---------- Content (published JSON + admin draft) ---------- */
  const DRAFT_KEY = 'unipath.admin.draft';
  const PREVIEW_KEY = 'unipath.admin.preview';
  const Content = {
    data: null, published: null, previewing: false,
    async load() {
      let pub = null;
      if (await API.check()) { try { const r = await fetch('/api/content', { cache: 'no-store' }); if (r.ok) pub = await r.json(); } catch (e) {} }
      if (!pub) { try { const r = await fetch('/data/content.json', { cache: 'no-cache' }); if (r.ok) pub = await r.json(); } catch (e) {} }
      // Fill any sections the live content doesn't have yet (e.g. new features shipped after the last publish)
      if (pub && pub.meta && pub.meta.publishedBy) { try { const r = await fetch('/data/content.json', { cache: 'no-cache' }); if (r.ok) { const st = await r.json(); Object.keys(st).forEach((k) => { if (pub[k] == null) pub[k] = st[k]; }); if (st.site) Object.keys(st.site).forEach((k) => { if (pub.site[k] == null) pub.site[k] = st.site[k]; }); if (st.currencies && pub.currencies) Object.keys(st.currencies).forEach((k) => { if (!pub.currencies[k]) pub.currencies[k] = st.currencies[k]; }); if ((+(st.meta || {}).catalogVersion || 0) > (+(pub.meta || {}).catalogVersion || 0) && Array.isArray(st.programs) && Array.isArray(pub.programs)) { const ids = new Set(pub.programs.map((x) => x.id)); const removed = new Set(((pub.meta || {}).removedPrograms) || []); st.programs.forEach((sp) => { if (!ids.has(sp.id) && !removed.has(sp.id)) pub.programs.push(sp); }); pub.programs.forEach((lp) => { const sp = st.programs.find((x) => x.id === lp.id); if (sp) ['applyUrl', 'admissionsUrl', 'intlUrl', 'feesUrl', 'programmeUrl', 'linksChecked', 'sourceNote', 'sourceUrl', 'listed'].forEach((k) => { if (lp[k] == null && sp[k] != null) lp[k] = sp[k]; }); if (sp && sp.verified && !lp.verified && lp.tuitionUSD === lp.tuitionUSD) { ['tuitionUSD', 'verified', 'lastVerified', 'notes'].forEach((k) => lp[k] = sp[k]); } }); pub.meta = Object.assign({}, pub.meta, { catalogVersion: st.meta.catalogVersion, catalogMerged: true }); }
        // Always fill new per-item fields (only where the live item lacks them), and make fee notes say who is paid
        if (Array.isArray(st.programs) && Array.isArray(pub.programs)) { const sm = new Map(st.programs.map((x) => [x.id, x])); pub.programs.forEach((lp) => { const sp = sm.get(lp.id); if (!sp) return; ['appFeeText', 'opensOn', 'appFeeUSD'].forEach((k) => { if (lp[k] == null && sp[k] != null) lp[k] = sp[k]; }); if (sp.notes && /not UniPath/.test(sp.notes) && !/UniPath/.test(lp.notes || '')) lp.notes = sp.notes; }); }
        if (Array.isArray(st.scholarships) && Array.isArray(pub.scholarships)) { const sm = new Map(st.scholarships.map((x) => [x.id, x])); pub.scholarships.forEach((ls) => { const ss = sm.get(ls.id); if (ss) ['usualMonths', 'opensOn'].forEach((k) => { if (ls[k] == null && ss[k] != null) ls[k] = ss[k]; }); }); }
        if (st.site && /sample data with indicative figures/.test(pub.site.dataNotice || '')) pub.site.dataNotice = st.site.dataNotice;
        if (Array.isArray(st.countries) && Array.isArray(pub.countries)) pub.countries.forEach((c) => { const s0 = st.countries.find((x) => x.name === c.name); if (s0) Object.keys(s0).forEach((k) => { if (c[k] == null) c[k] = s0[k]; }); }); } } catch (e) {} }
      if (!pub) pub = store('unipath.content.cache');
      if (pub) store('unipath.content.cache', pub);
      this.published = pub || { site: {}, programs: [], scholarships: [], checklistItems: [], glossary: [], faqs: [], enrollSteps: [], quotes: [], testerTasks: [], interviewQuestions: [], currencies: { USD: { rate: 1, label: 'US dollar' } } };
      const draft = store(DRAFT_KEY);
      this.previewing = !!(draft && store(PREVIEW_KEY));
      this.data = this.previewing ? draft : this.published;
      return this.data;
    },
    draft() { return store(DRAFT_KEY); },
    saveDraft(d) { d.meta = d.meta || {}; d.meta.draftSavedAt = new Date().toISOString(); store(DRAFT_KEY, d); },
    clearDraft() { store(DRAFT_KEY, null); store(PREVIEW_KEY, null); },
    setPreview(on) { store(PREVIEW_KEY, on ? true : null); }
  };

  /* ---------- Currency ---------- */
  function rateOf(cur) { const c = (Content.data && Content.data.currencies) || {}; return (c[cur] && +c[cur].rate) || 1; }
  function fromUSD(usd, cur) { return (+usd || 0) * rateOf(cur); }
  function toUSD(v, cur) { return (+v || 0) / rateOf(cur); }
  function money(usd, cur, opts) {
    cur = cur || 'USD';
    const v = fromUSD(usd, cur);
    const big = Math.abs(v) >= 1e6 && (opts && opts.compact);
    if (big) return cur + ' ' + (v / 1e6).toFixed(v >= 1e7 ? 0 : 1) + 'M';
    return cur + ' ' + Math.round(v).toLocaleString('en-US');
  }

    /* ---------- Clean-URL navigation ---------- */
  function go(path, opts) {
    path = String(path || '/');
    if (path.startsWith('#')) path = path.slice(1);
    if (!path.startsWith('/')) path = '/' + path;
    if (path !== location.pathname + location.search) { history[(opts && opts.replace) ? 'replaceState' : 'pushState'](null, '', path); if (!(opts && opts.replace)) window.__upDepth = (window.__upDepth || 0) + 1; }
    window.dispatchEvent(new Event('up:route'));
  }
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download') || !document.getElementById('app')) return;
    let h = a.getAttribute('href') || '';
    if (h.startsWith('#/')) h = h.slice(1);
    if (!h.startsWith('/') || h.startsWith('//') || /^\/(admin|api|assets|data)\b/.test(h) || /\.(html|xml|json|pdf|zip)$/.test(h)) return;
    e.preventDefault(); go(h);
  });

  /* ---------- Anonymous usage analytics (no names, emails or IDs) ---------- */
  const Track = { q: [], timer: null, newSession: false };
  function track(t, v, p) {
    try { if (navigator.doNotTrack === '1' || store('unipath.admin.preview') || /admin\.html/.test(location.pathname)) return; } catch (e) {}
    if (!sessionStorage.getItem('up.s')) { try { sessionStorage.setItem('up.s', '1'); } catch (e) {} Track.newSession = true; }
    Track.q.push({ t, v: v || '', p: p || '' }); clearTimeout(Track.timer); Track.timer = setTimeout(flushTrack, 8000);
  }
  function flushTrack(keepalive) {
    if (!Track.q.length && !Track.newSession) return; if (!API.online) { Track.q = []; return; }
    const body = JSON.stringify({ events: Track.q.splice(0, 60), newSession: Track.newSession, mobile: matchMedia('(max-width: 760px)').matches }); Track.newSession = false;
    try { fetch('/api/track', { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: !!keepalive }).catch(() => {}); } catch (e) {}
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushTrack(true); });

  /* ---------- Languages ---------- */
  const LANGS = { en: 'English', lg: 'Luganda (beta)', sw: 'Kiswahili', fr: 'Français' };
  function lang() { try { return (JSON.parse(localStorage.getItem('unipath.state') || '{}').settings || {}).lang || 'en'; } catch (e) { return 'en'; } }
  // Translates any on-screen text that has an entry in the dictionary (English phrase → translation).
  function translateDom(root) {
    if (!document.getElementById('app')) return;
    const l = lang(), dict = l === 'en' ? null : ((Content.data && Content.data.translations && Content.data.translations[l]) || {});
    document.documentElement.lang = l;
    const base = root && root.nodeType ? root : document.body; if (!base) return;
    if (base.nodeType === 3) return tNode(base, dict);
    const w = document.createTreeWalker(base, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) tNode(n, dict);
  }
  function tNode(n, dict) {
    const p = n.parentNode; if (!p || /^(SCRIPT|STYLE|TEXTAREA|OPTION)$/.test(p.nodeName) || (p.closest && p.closest('[contenteditable],.no-translate'))) return;
    const en = n.__en != null ? n.__en : n.nodeValue; const key = en.trim(); if (!key) return;
    if (dict && dict[key]) { if (n.__en == null) n.__en = en; const v = en.replace(key, dict[key]); if (n.nodeValue !== v) n.nodeValue = v; }
    else if (n.__en != null) { n.nodeValue = n.__en; n.__en = null; }
  }
  if (window.MutationObserver) new MutationObserver((ms) => { if (lang() === 'en') return; ms.forEach((m) => m.addedNodes.forEach((nd) => translateDom(nd))); }).observe(document.documentElement, { childList: true, subtree: true });
  function t(en) { const l = lang(); if (l === 'en') return en; const d = (Content.data && Content.data.translations && Content.data.translations[l]) || {}; return d[en] || en; }

  window.UP = { go, track, t, translateDom, LANGS, lang, icon, esc, uid, $, $$, clamp, safeUrl, store, today, parseDate, daysUntil, fmtDate, addDays, countdownLabel, toast, modal, confirmBox, download, toCSV, parseCSV, ics, submitNetlify, submitResponse, API, sha256, Vault, Content, rateOf, fromUSD, toUSD, money };
})();
