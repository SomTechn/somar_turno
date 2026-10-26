/* Somar Turno · utilidades y piezas de interfaz compartidas por todas las páginas.
   Sin frameworks. Cada página define window.render() y agrega sus acciones a A. */

/* ---------- Fechas y formato ---------- */
const pad = n => String(n).padStart(2, '0');
const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const addDays = (s, n) => { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return iso(d); };
const hoy = () => iso(new Date());
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const h2m = h => { const [a, b] = h.split(':').map(Number); return a * 60 + b; };
const m2h = m => pad(Math.floor(m / 60)) + ':' + pad(m % 60);
const h12 = h => { const m = h2m(h); let H = Math.floor(m / 60); const M = m % 60, ap = H < 12 ? 'a.\u00a0m.' : 'p.\u00a0m.'; H = H % 12 || 12; return H + ':' + pad(M) + ' ' + ap; };
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fLbl = s => { const T = hoy(); if (s === T) return 'Hoy'; if (s === addDays(T, 1)) return 'Mañana'; if (s === addDays(T, -1)) return 'Ayer'; const d = new Date(s + 'T12:00:00'); return DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()]; };
const dBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const L = n => 'L ' + Number(n || 0).toLocaleString('es-HN', { maximumFractionDigits: 0 });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ini = n => String(n || '?').split(' ').filter(w => w && w[0] === w[0].toUpperCase()).slice(0, 2).map(w => w[0]).join('') || '?';
const first = n => { const p = String(n || '').split(' '); return (p[0] === 'Don' || p[0] === 'Doña') ? p.slice(0, 2).join(' ') : p[0]; };
const stars = v => '★★★★★'.slice(0, Math.round(v)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(v));
const soloDigitos = t => String(t || '').replace(/\D/g, '');
const telBonito = t => { const d = soloDigitos(t).slice(-8); return d.length === 8 ? d.slice(0, 4) + '-' + d.slice(4) : t; };
const waLink = (tel, msg) => 'https://wa.me/504' + soloDigitos(tel).slice(-8) + '?text=' + encodeURIComponent(msg);
const slugify = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ---------- Catálogos ---------- */
const CAT = { barberia: 'Barbería', salon: 'Salón de belleza', estilista: 'Estilista', unas: 'Uñas' };
const ROL_DEF = { barberia: 'Barbero', salon: 'Estilista', estilista: 'Estilista', unas: 'Manicurista' };
const ROLES = ['Barbero', 'Barbera', 'Estilista', 'Colorista', 'Manicurista', 'Maquillista'];
const BANK_COLOR = { 'BAC Credomatic': '#C8102E', 'Banco Atlántida': '#003A70', 'Ficohsa': '#0B5FA5', 'Banpaís': '#00843D', 'Banco de Occidente': '#1B3F8B', 'Davivienda': '#E1251B', 'Tigo Money': '#00377B' };
const bankAbbr = b => ({ 'BAC Credomatic': 'BAC', 'Banco Atlántida': 'ATL', 'Ficohsa': 'FIC', 'Banpaís': 'BPS', 'Banco de Occidente': 'OCC', 'Davivienda': 'DAV', 'Tigo Money': 'TIGO' })[b] || String(b).slice(0, 3).toUpperCase();
const PALETA = ['#22252D', '#8A3B5C', '#B4486E', '#5D4E8C', '#2F4B66', '#1F6B5C', '#7A4B2A', '#A0557A'];

/* ---------- Íconos ---------- */
const ICON = {
  home: '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>',
  gift: '<rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M12 9v12M3 13h18M12 9c-2-4-6-4-6-1.5S10 9 12 9zm0 0c2-4 6-4 6-1.5S14 9 12 9z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4.5-6 8-6s7 2 8 6"/>',
  today: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15" r="2"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h4M7 17h7"/>',
  people: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.5 3.6 5.2"/>',
  cash: '<rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
  more: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
  star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5"/>',
  heart: '<path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  x: '<path d="M5 5l14 14M19 5L5 19"/>',
  up: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  bell: '<path d="M6 16V11a6 6 0 1 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  out: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
};
const svg = (k, fill) => `<svg viewBox="0 0 24 24" fill="${fill ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const MARK = `<span class="mark"><img src="/assets/img/icon.svg" alt="" width="26" height="26"></span>`;

/* ---------- Acciones por atributos (sin código en línea) ----------
   data-a="accion" data-p="arg1|arg2"  → A.accion(arg1, arg2) al tocar
   data-m="campo"                       → guarda el valor en F.campo
   data-num="1"                         → lo guarda como número
   data-redraw="1"                      → vuelve a dibujar la hoja al cambiar
   data-i="accion"                      → A.accion(valor) mientras se escribe
   data-c="accion"                      → A.accion(valor) al cambiar (selects)
   data-file="campo"                    → lee una imagen y la guarda en F.campo */
const A = {};
let F = {};
const act = (a, ...p) => `data-a="${a}"${p.length ? ` data-p="${p.map(x => esc(x)).join('|')}"` : ''}`;

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  if (el.dataset.a === 'scrim') { if (ev.target === el) closeSheet(); return; }
  const fn = A[el.dataset.a]; if (!fn || el.tagName === 'A') return;
  ev.preventDefault();
  const p = el.dataset.p !== undefined ? el.dataset.p.split('|') : [];
  Promise.resolve(fn(...p)).catch(e => { console.error(e); toast(e.message || 'Algo salió mal. Probá otra vez.'); });
});
document.addEventListener('keydown', ev => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-a]')) { ev.preventDefault(); ev.target.click(); }
  if (ev.key === 'Escape' && SH) closeSheet();
});
document.addEventListener('input', ev => {
  const el = ev.target, d = el.dataset;
  if (d.m !== undefined && el.tagName !== 'SELECT') F[d.m] = d.num ? (parseInt(el.value) || 0) : el.value;
  if (d.i && A[d.i]) A[d.i](el.value, el);
});
document.addEventListener('change', ev => {
  const el = ev.target, d = el.dataset;
  if (d.m !== undefined && el.tagName === 'SELECT') F[d.m] = d.num ? (parseInt(el.value) || 0) : el.value;
  if (d.c && A[d.c]) Promise.resolve(A[d.c](el.value, el)).catch(e => toast(e.message));
  if (d.file && el.files && el.files[0]) {
    const file = el.files[0];
    if (file.size > 6e6) { toast('La imagen es muy pesada. Usá una de menos de 6 MB.'); return; }
    reducirImagen(file).then(url => { F[d.file] = url; drawSheet(); });
    return;
  }
  if (d.redraw) drawSheet();
});
/* Achica la foto del comprobante para que no pese tanto */
function reducirImagen(file) {
  return new Promise(res => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const max = 1200, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.8));
        } catch (e) { res(r.result); }
      };
      img.onerror = () => res(r.result);
      img.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
/* Mantiene el foco en un buscador después de redibujar */
function keepFocus(id, fn) {
  const el = document.getElementById(id), pos = el ? el.selectionStart : 0; fn();
  const n = document.getElementById(id); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } }
}

/* ---------- Avisos ---------- */
function toast(m) {
  let h = document.getElementById('toastHost'); if (!h) { h = document.createElement('div'); h.id = 'toastHost'; document.body.appendChild(h); }
  h.innerHTML = `<div class="toast" role="status">${esc(m)}</div>`;
  clearTimeout(toast.t); toast.t = setTimeout(() => h.innerHTML = '', 2800);
}
let bannerT;
function banner(t, x, onTap) {
  let el = document.getElementById('push');
  if (!el) { el = document.createElement('div'); el.id = 'push'; el.className = 'push'; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); document.body.appendChild(el); }
  el.innerHTML = `${MARK}<div class="body"><div class="xs faint">Somar Turno, ahora</div><b>${esc(t)}</b><div class="sm muted">${esc(x)}</div></div>`;
  el.onclick = () => { el.classList.remove('show'); onTap && onTap(); };
  el.classList.add('show'); clearTimeout(bannerT); bannerT = setTimeout(() => el.classList.remove('show'), 5000);
}

/* ---------- Hoja inferior ---------- */
let SH = null;
function openSheet(fn) { SH = fn; drawSheet(); }
function drawSheet() {
  if (!SH) return;
  let host = document.getElementById('sheetHost'); if (!host) { host = document.createElement('div'); host.id = 'sheetHost'; document.body.appendChild(host); }
  const sc = host.querySelector('.sheet')?.scrollTop || 0;
  host.innerHTML = `<div class="wrap" data-a="scrim"><div class="sheet gut" role="dialog" aria-modal="true"><div class="grab"></div>${SH()}</div></div>`;
  const s = host.querySelector('.sheet'); if (s) s.scrollTop = sc;
}
function closeSheet() { SH = null; const h = document.getElementById('sheetHost'); if (h) h.innerHTML = ''; }
const head = t => `<div class="sh"><h2>${t}</h2><button class="x" ${act('closeSheet')} aria-label="Cerrar">${svg('x')}</button></div>`;
let CONF = null;
function ask(titulo, texto, btn, fn, cls) { CONF = fn; openSheet(() => `${head(esc(titulo))}<p class="muted">${esc(texto)}</p><div class="row-btns"><button class="btn ${cls || 'ink'}" ${act('confirmYes')}>${esc(btn)}</button><button class="btn" ${act('closeSheet')}>Volver</button></div>`); }
A.closeSheet = closeSheet;
A.confirmYes = async () => { const f = CONF; CONF = null; closeSheet(); if (f) await f(); };
A.copy = t => { try { navigator.clipboard.writeText(t).then(() => toast('Copiado: ' + t), () => toast(t)); } catch (e) { toast(t); } };

/* ---------- Piezas visuales ---------- */
const rtTxt = (r, min) => r.n < (min || 1) ? '<span class="tag">Nuevo</span>' : `<span><span class="star">★</span> <b class="num">${r.v.toFixed(1)}</b> <span class="faint num">(${r.n})</span></span>`;
const mono = (n, cls) => `<div class="mono ${cls || ''}" style="background:${n.color || '#22252D'}">${esc(ini(n.nombre))}</div>`;
const bankIc = b => `<span class="ic" style="background:${BANK_COLOR[b] || '#444'}">${bankAbbr(b)}</span>`;
const empty = t => `<div class="empty">${t}</div>`;

/* Ventana de código de verificación.
   Mientras no conectemos el proveedor de WhatsApp, el código se muestra en pantalla (modo de prueba). */
const codigoPrueba = c => c ? `<div class="panel warn" style="gap:6px"><b>Modo de prueba</b><span class="sm">Todavía no está conectado el envío por WhatsApp. Tu código es <b class="num">${c}</b>.</span></div>` : '';
