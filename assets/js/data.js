/* Somar Turno · capa de datos
   Hoy guarda todo en el navegador (localStorage) para poder usar y probar la app sin servidor.
   Cada colección corresponde a una tabla que luego crearemos en Supabase, y cada función de
   "Acciones" corresponde a un insert/update o a una función RPC. Las páginas solo usan este archivo,
   así que cambiar a Supabase no toca las pantallas. */

const DB_KEY = 'somar_turno_db_v1';
const SES_KEY = 'somar_turno_sesion';
const INV_KEY = 'somar_turno_invitado';

const vacio = () => ({ negocios: [], pros: [], servs: [], clientes: [], citas: [], fila: [], visitas: [], puntos: [], cals: [], notifs: [], notas: {}, codigos: [] });
function cargarDB() { try { const j = JSON.parse(localStorage.getItem(DB_KEY)); if (j && j.negocios) return Object.assign(vacio(), j); } catch (e) { } return vacio(); }
let DB = cargarDB();
function guardar() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
  catch (e) { throw new Error('No hay espacio para guardar en este navegador. Borrá comprobantes viejos o datos de prueba.'); }
}
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

/* Cambios hechos en otra pestaña (por ejemplo, el panel del negocio) llegan aquí al instante */
window.addEventListener('storage', e => { if (e.key === DB_KEY) { DB = cargarDB(); if (window.onDatos) window.onDatos(); } });

/* =================== Sesión =================== */
const ses = {
  tel() { try { return (JSON.parse(localStorage.getItem(SES_KEY)) || {}).tel || null; } catch (e) { return null; } },
  abrir(tel) { localStorage.setItem(SES_KEY, JSON.stringify({ tel: soloDigitos(tel).slice(-8) })); },
  cerrar() { localStorage.removeItem(SES_KEY); },
  invitado() { try { return localStorage.getItem(INV_KEY); } catch (e) { return null; } },
  setInvitado(id) { id ? localStorage.setItem(INV_KEY, id) : localStorage.removeItem(INV_KEY); },
};

/* =================== Consultas =================== */
const q = {
  neg: id => DB.negocios.find(n => n.id === id),
  negSlug: s => DB.negocios.find(n => n.slug === s),
  pro: id => DB.pros.find(p => p.id === id),
  serv: id => DB.servs.find(s => s.id === id),
  cli: id => DB.clientes.find(c => c.id === id),
  cliTel: t => DB.clientes.find(c => c.tel === soloDigitos(t).slice(-8)),
  activos: () => DB.negocios.filter(n => n.estado === 'activo'),
  pros: n => DB.pros.filter(p => p.neg === n && p.activo !== false),
  servs: n => DB.servs.filter(s => s.neg === n && s.activo !== false),
  negRt: n => { const r = DB.cals.filter(x => x.neg === n); return { v: avg(r.map(x => x.en)), n: r.length }; },
  proRt: p => { const r = DB.cals.filter(x => x.pro === p); return { v: avg(r.map(x => x.ep)), n: r.length }; },
  pts: (c, n) => DB.puntos.filter(m => m.cli === c && m.neg === n).reduce((a, m) => a + m.pts, 0),
  abierto: n => { const h = n.horario[new Date().getDay()]; if (!h) return false; const m = nowMin(); return m >= h[0] * 60 && m < h[1] * 60; },
  horaHoy: n => { const h = n.horario[new Date().getDay()]; return h ? `${h12(m2h(h[0] * 60))} a ${h12(m2h(h[1] * 60))}` : 'Cerrado hoy'; },
  esperando: n => DB.fila.filter(f => f.neg === n && f.fecha === hoy() && f.estado === 'esperando').sort((a, b) => a.num - b.num),
  llamados: n => DB.fila.filter(f => f.neg === n && f.fecha === hoy() && f.estado === 'llamado'),
  antes: f => DB.fila.filter(x => x.neg === f.neg && x.fecha === f.fecha && x.estado === 'esperando' && x.num < f.num).length,
  espera: (n, a) => Math.max(5, Math.round((a + 1) * 30 / Math.max(1, q.pros(n).length) / 5) * 5),
  filaNombre: f => f.cli ? (q.cli(f.cli)?.nombre || 'Cliente') : (f.nombre || 'Cliente'),
  porConfirmar: n => DB.visitas.filter(v => v.neg === n && v.pago.estado === 'por_confirmar'),
  clientesDe: n => { const s = new Set([...DB.visitas.filter(v => v.neg === n).map(v => v.cli), ...DB.citas.filter(c => c.neg === n).map(c => c.cli), ...DB.fila.filter(f => f.neg === n).map(f => f.cli)].filter(Boolean)); return [...s].map(q.cli).filter(Boolean); },
  nota: (c, n) => DB.notas[c + '_' + n] || '',
  notifs: c => DB.notifs.filter(x => x.cli === c),
  slots(n, fecha, dur, p, ignorar) {
    const h = q.neg(n).horario[new Date(fecha + 'T12:00:00').getDay()]; if (!h) return [];
    const out = [], lim = fecha === hoy() ? nowMin() + 10 : -1, ids = p ? [p] : q.pros(n).map(x => x.id);
    for (let t = h[0] * 60; t + dur <= h[1] * 60; t += 30) {
      if (t <= lim) continue;
      const libre = ids.find(id => !DB.citas.some(c => c.id !== ignorar && c.pro === id && c.fecha === fecha && ['reservada', 'confirmada'].includes(c.estado) && solapa(t, dur, h2m(c.hora), q.serv(c.serv)?.dur || 30)));
      if (libre) out.push({ t, pro: libre });
    }
    return out;
  },
  /* Negocios donde este teléfono es dueño o profesional */
  membresias(tel) {
    const t = soloDigitos(tel).slice(-8), out = [];
    DB.negocios.forEach(n => { if (n.duenoTel === t) out.push({ neg: n.id, rol: 'dueno' }); });
    DB.pros.forEach(p => { if (p.tel === t && p.activo !== false && !out.some(m => m.neg === p.neg)) out.push({ neg: p.neg, rol: 'pro', pro: p.id }); });
    return out;
  },
  esAdmin: tel => !CONFIG.ADMIN_TELS.length || CONFIG.ADMIN_TELS.includes(soloDigitos(tel).slice(-8)),
};
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const solapa = (a, da, b, db) => a < b + db && b < a + da;

/* =================== Acciones =================== */
function notificar(cli, t, x) { if (!cli) return; DB.notifs.push({ id: uid('x'), cli, t, x, fecha: hoy(), ts: Date.now(), leida: false }); }
function avisarFila(n) {
  q.esperando(n).forEach(f => { const a = q.antes(f); if (a <= 2 && !f.av && f.cli) { f.av = true; notificar(f.cli, 'Ya casi es tu turno', `Te faltan ${a} en ${q.neg(n).nombre}. Andate acercando.`); } });
}
const exigir = (cond, msg) => { if (!cond) throw new Error(msg); };
const telOk = t => soloDigitos(t).length >= 8;

const api = {
  /* ---- Verificación por WhatsApp ---- */
  async enviarCodigo(tel) {
    exigir(telOk(tel), 'Escribí un número de 8 dígitos.');
    const t = soloDigitos(tel).slice(-8), code = String(100000 + Math.floor(Math.random() * 899999));
    DB.codigos = DB.codigos.filter(c => c.tel !== t && c.exp > Date.now());
    DB.codigos.push({ tel: t, code, exp: Date.now() + 10 * 60e3 });
    guardar();
    // Con proveedor conectado, aquí se manda el mensaje y NO se devuelve el código.
    return CONFIG.WHATSAPP_PROVIDER ? null : code;
  },
  async verificarCodigo(tel, code) {
    const t = soloDigitos(tel).slice(-8), c = DB.codigos.find(x => x.tel === t && x.exp > Date.now());
    exigir(c && c.code === String(code).trim(), 'El código no coincide. Revisalo en WhatsApp.');
    DB.codigos = DB.codigos.filter(x => x !== c); guardar(); ses.abrir(t); return t;
  },

  /* ---- Clientes ---- */
  async crearCuenta({ tel, nombre, ref }) {
    exigir(String(nombre || '').trim().length >= 3, 'Escribí tu nombre y apellido.');
    const t = soloDigitos(tel).slice(-8), code = String(ref || '').trim().toUpperCase();
    const amigo = code ? DB.clientes.find(c => c.ref === code && c.cuenta) : null;
    exigir(!code || amigo, 'Ese código de amigo no existe.');
    const base = String(nombre).trim().split(' ')[0].toUpperCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Z]/g, '').slice(0, 6) || 'AMIGO';
    let miRef; do { miRef = base + Math.floor(Math.random() * 90 + 10); } while (DB.clientes.some(c => c.ref === miRef));
    let c = q.cliTel(t) || (ses.invitado() && q.cli(ses.invitado()));
    if (c) Object.assign(c, { nombre: String(nombre).trim(), tel: t, cuenta: true, ref: c.ref || miRef, referidoPor: c.cuenta ? c.referidoPor : (amigo && amigo.id !== c.id ? amigo.id : null), refPagado: c.refPagado || false });
    else { c = { id: uid('c'), nombre: String(nombre).trim(), tel: t, cuenta: true, ref: miRef, referidoPor: amigo ? amigo.id : null, refPagado: false, favs: [], creado: hoy() }; DB.clientes.push(c); }
    notificar(c.id, 'Bienvenido a Somar Turno', amigo ? `Usaste el código de ${first(amigo.nombre)}. En tu primera visita pagada ganan puntos los dos.` : 'Ya sumás puntos en cada visita.');
    ses.setInvitado(null); guardar(); return c;
  },
  /* Cliente sin cuenta: solo nombre y WhatsApp */
  async invitado({ nombre, tel }) {
    exigir(String(nombre || '').trim().length >= 3, 'Escribí tu nombre.');
    exigir(telOk(tel), 'Escribí tu WhatsApp de 8 dígitos.');
    const t = soloDigitos(tel).slice(-8);
    let c = q.cliTel(t);
    if (!c) { c = { id: uid('c'), nombre: String(nombre).trim(), tel: t, cuenta: false, ref: '', favs: [], creado: hoy() }; DB.clientes.push(c); }
    if (!c.cuenta) ses.setInvitado(c.id);
    guardar(); return c;
  },
  async favorito(cli, neg) { const c = q.cli(cli), i = c.favs.indexOf(neg); i >= 0 ? c.favs.splice(i, 1) : c.favs.push(neg); guardar(); return i < 0; },
  async leerNotifs(cli) { DB.notifs.filter(x => x.cli === cli).forEach(x => x.leida = true); guardar(); },

  /* ---- Citas ---- */
  async reservar({ neg, cli, pro, serv, fecha, t, cambiar }) {
    const libres = q.slots(neg, fecha, q.serv(serv).dur, pro, cambiar);
    exigir(libres.some(s => s.t === t), 'Esa hora ya no está libre. Elegí otra.');
    if (cambiar) { const v = DB.citas.find(c => c.id === cambiar); if (v) v.estado = 'cancelada'; }
    const c = { id: uid('ci'), neg, cli, pro, serv, fecha, hora: m2h(t), estado: 'confirmada', creada: Date.now() };
    DB.citas.push(c);
    notificar(cli, cambiar ? 'Cita cambiada' : 'Cita confirmada', `${q.serv(serv).nombre} con ${first(q.pro(pro).nombre)}, ${fLbl(fecha).toLowerCase()} a las ${h12(c.hora)}.`);
    guardar(); return c;
  },
  async cancelarCita(id) { DB.citas.find(c => c.id === id).estado = 'cancelada'; guardar(); },
  async noVinoCita(id) { DB.citas.find(c => c.id === id).estado = 'novino'; guardar(); },

  /* ---- Fila ---- */
  async tomarTurno({ neg, cli, nombre, pro, serv, casa }) {
    const n = q.neg(neg), T = hoy();
    exigir(n.fila, 'Este negocio no está usando fila.');
    if (n.contadorFecha !== T) { n.contador = 1; n.contadorFecha = T; }
    if (cli) exigir(!DB.fila.some(f => f.cli === cli && f.fecha === T && ['esperando', 'llamado'].includes(f.estado)), 'Ya tenés un turno activo.');
    const f = { id: uid('f'), neg, fecha: T, num: n.contador++, cli: cli || null, nombre: nombre || '', pro: pro || null, serv, estado: 'esperando', hora: m2h(nowMin()), casa: !!casa, av: false };
    DB.fila.push(f); f.av = q.antes(f) <= 2;
    if (cli) notificar(cli, `Turno ${f.num} en ${n.nombre}`, `Hay ${q.antes(f)} antes que vos.`);
    guardar(); return f;
  },
  async llamar(fid, pro) {
    const f = DB.fila.find(x => x.id === fid); f.estado = 'llamado'; f.pro = pro; f.av = true;
    notificar(f.cli, `Es tu turno, número ${f.num}`, `Pasá con ${first(q.pro(pro).nombre)} en ${q.neg(f.neg).nombre}.`);
    avisarFila(f.neg); guardar(); return f;
  },
  async salirFila(fid) { const f = DB.fila.find(x => x.id === fid); f.estado = 'salio'; avisarFila(f.neg); guardar(); },
  async noVinoFila(fid) { const f = DB.fila.find(x => x.id === fid); f.estado = 'novino'; avisarFila(f.neg); guardar(); return f; },

  /* ---- Cobro y pagos ----
     metodo: efectivo | transferencia. via: 'cliente' (sube el comprobante en su app) | 'negocio' (lo registra el dueño) */
  async cobrar({ kind, id, pro, serv, monto, metodo, via, canje, cuenta, ref, comp }) {
    const o = kind === 'cita' ? DB.citas.find(x => x.id === id) : DB.fila.find(x => x.id === id), n = q.neg(o.neg);
    const tr = metodo === 'transferencia' && monto > 0;
    if (tr && via === 'negocio') exigir(cuenta, 'Elegí la cuenta donde entró el dinero.');
    const v = { id: uid('v'), neg: n.id, cli: o.cli || null, pro, serv, monto, fecha: hoy(), hora: m2h(nowMin()), calificada: false, canje: canje || null,
      pago: { metodo: tr ? 'transferencia' : 'efectivo', estado: 'pagado', cuenta: null, ref: '', comp: null, subido: null, motivo: '' } };
    DB.visitas.push(v);
    if (kind === 'cita') o.estado = 'atendida'; else { o.estado = 'atendido'; o.pro = pro; avisarFila(n.id); }
    if (canje) { const r = n.recompensas.find(x => x.id === canje); DB.puntos.push({ id: uid('m'), cli: v.cli, neg: n.id, pts: -r.pts, motivo: 'Canje: ' + r.nombre, fecha: hoy() }); }
    if (tr && via === 'cliente') { v.pago.estado = 'por_comprobante'; notificar(v.cli, 'Subí tu comprobante de pago', `${L(monto)} en ${n.nombre}. Tocá para ver las cuentas.`); }
    else { if (tr) Object.assign(v.pago, { cuenta, ref: ref || '', comp: comp || null, subido: 'negocio' }); aplicarPago(v); }
    guardar(); return v;
  },
  async subirComprobante(vid, { cuenta, comp, ref }) {
    exigir(comp, 'Subí la foto del comprobante.');
    const v = DB.visitas.find(x => x.id === vid);
    Object.assign(v.pago, { estado: 'por_confirmar', cuenta, comp, ref: ref || '', subido: 'cliente', motivo: '' });
    guardar(); return v;
  },
  async confirmarPago(vid) { const v = DB.visitas.find(x => x.id === vid); aplicarPago(v); guardar(); return v; },
  async rechazarPago(vid, motivo) {
    const v = DB.visitas.find(x => x.id === vid); v.pago.estado = 'rechazado'; v.pago.motivo = String(motivo || '').trim() || 'El dinero no aparece en la cuenta.';
    notificar(v.cli, 'Revisá tu comprobante', `${q.neg(v.neg).nombre} no encontró tu transferencia de ${L(v.monto)}. Subila otra vez.`);
    guardar(); return v;
  },

  /* ---- Calificaciones ---- */
  async calificar(vid, { en, ep, txt }) {
    exigir(en && ep, 'Elegí las estrellas para el negocio y para quien te atendió.');
    const v = DB.visitas.find(x => x.id === vid); exigir(!v.calificada, 'Esta visita ya fue calificada.');
    v.calificada = true;
    DB.cals.push({ id: uid('q'), visita: v.id, neg: v.neg, pro: v.pro, cli: v.cli, en, ep, txt: String(txt || '').trim(), fecha: hoy(), resp: '', reportada: false, nueva: true });
    DB.notifs.filter(x => x.cli === v.cli && x.t.startsWith('Gracias por tu visita')).forEach(x => x.leida = true);
    guardar();
  },
  async responder(qid, txt) { exigir(String(txt || '').trim(), 'Escribí tu respuesta.'); const r = DB.cals.find(x => x.id === qid); r.resp = txt.trim(); r.nueva = false; guardar(); },
  async reportar(qid, motivo) { const r = DB.cals.find(x => x.id === qid); r.reportada = true; r.motivo = String(motivo || '').trim() || 'Sin motivo'; guardar(); },
  async moderar(qid, borrar) { if (borrar) DB.cals = DB.cals.filter(x => x.id !== qid); else DB.cals.find(x => x.id === qid).reportada = false; guardar(); },
  async vistaResena(qid) { const r = DB.cals.find(x => x.id === qid); if (r) { r.nueva = false; guardar(); } },

  /* ---- Negocio ---- */
  async registrarNegocio({ nombre, cat, zona, direccion, tel, dueno, duenoTel }) {
    exigir(String(nombre || '').trim().length >= 3, 'Escribí el nombre del negocio.');
    exigir(String(zona || '').trim().length >= 2, 'Escribí la ciudad o colonia.');
    exigir(String(dueno || '').trim().length >= 3, 'Escribí tu nombre.');
    let slug = slugify(nombre), i = 2; while (DB.negocios.some(n => n.slug === slug)) slug = slugify(nombre) + '-' + i++;
    const H = {}; for (let d = 1; d <= 6; d++) H[d] = [9, 18];
    const n = { id: uid('n'), slug, nombre: nombre.trim(), cat, zona: zona.trim(), direccion: (direccion || '').trim(), tel: soloDigitos(tel || duenoTel).slice(-8), color: PALETA[DB.negocios.length % PALETA.length],
      horario: H, fila: cat === 'barberia', filaCasa: false, plan: 'Gratis', estado: 'pendiente', lpp: 10, ptsRef: 50, recompensas: [], contador: 1, contadorFecha: '', cuentas: [], duenoTel: soloDigitos(duenoTel).slice(-8), creado: hoy() };
    DB.negocios.push(n);
    DB.pros.push({ id: uid('p'), neg: n.id, nombre: dueno.trim(), rol: ROL_DEF[cat], com: 0, tel: n.duenoTel, activo: true });
    guardar(); return n;
  },
  async actualizarNegocio(id, cambios) { Object.assign(q.neg(id), cambios); guardar(); },
  async horario(id, dia, rango) { const n = q.neg(id); if (rango) n.horario[dia] = rango; else delete n.horario[dia]; guardar(); },
  async guardarServicio(neg, s) {
    exigir(String(s.nombre || '').trim().length >= 2, 'Escribí el nombre del servicio.'); exigir(s.precio >= 0 && s.dur > 0, 'Revisá el precio y la duración.');
    if (s.id) Object.assign(q.serv(s.id), { nombre: s.nombre.trim(), precio: s.precio, dur: s.dur });
    else DB.servs.push({ id: uid('s'), neg, nombre: s.nombre.trim(), precio: s.precio, dur: s.dur, activo: true });
    guardar();
  },
  async quitarServicio(id) { q.serv(id).activo = false; guardar(); },
  async guardarPro(neg, p) {
    exigir(String(p.nombre || '').trim().length >= 3, 'Escribí el nombre.');
    exigir(!p.tel || telOk(p.tel), 'El WhatsApp debe tener 8 dígitos.');
    const datos = { nombre: p.nombre.trim(), rol: p.rol, com: Math.max(0, Math.min(100, p.com || 0)), tel: p.tel ? soloDigitos(p.tel).slice(-8) : '' };
    if (p.id) Object.assign(q.pro(p.id), datos); else DB.pros.push(Object.assign({ id: uid('p'), neg, activo: true }, datos));
    guardar();
  },
  async quitarPro(id) { q.pro(id).activo = false; guardar(); },
  async guardarCuenta(neg, c) {
    exigir(soloDigitos(c.numero).length >= 6, 'Escribí el número de cuenta.'); exigir(String(c.titular || '').trim().length >= 3, 'Escribí a nombre de quién está.');
    const n = q.neg(neg), datos = { banco: c.banco, tipo: c.tipo, numero: c.numero.trim(), titular: c.titular.trim() };
    if (c.id) Object.assign(n.cuentas.find(x => x.id === c.id), datos); else n.cuentas.push(Object.assign({ id: uid('b') }, datos));
    guardar();
  },
  async quitarCuenta(neg, id) { const n = q.neg(neg); n.cuentas = n.cuentas.filter(x => x.id !== id); guardar(); },
  async guardarRecompensa(neg, r) {
    exigir(String(r.nombre || '').trim(), 'Escribí la recompensa.'); exigir(r.pts > 0, 'Poné cuántos puntos se necesitan.');
    const n = q.neg(neg); n.recompensas.push({ id: uid('r'), nombre: r.nombre.trim(), pts: r.pts }); n.recompensas.sort((a, b) => a.pts - b.pts); guardar();
  },
  async quitarRecompensa(neg, id) { const n = q.neg(neg); n.recompensas = n.recompensas.filter(x => x.id !== id); guardar(); },
  async nota(cli, neg, texto) { DB.notas[cli + '_' + neg] = texto; guardar(); },
  async citaManual({ neg, cliId, nombre, tel, pro, serv, fecha, t }) {
    let id = cliId;
    if (!id) {
      exigir(String(nombre || '').trim().length >= 3, 'Escribí el nombre del cliente.');
      const ex = tel && q.cliTel(tel);
      if (ex) id = ex.id; else { const c = { id: uid('c'), nombre: nombre.trim(), tel: soloDigitos(tel).slice(-8), cuenta: false, ref: '', favs: [], creado: hoy() }; DB.clientes.push(c); id = c.id; }
    }
    exigir(q.slots(neg, fecha, q.serv(serv).dur, pro).some(s => s.t === t), 'Esa hora ya no está libre.');
    DB.citas.push({ id: uid('ci'), neg, cli: id, pro, serv, fecha, hora: m2h(t), estado: 'reservada', creada: Date.now() });
    notificar(id, 'Cita agendada', `${q.serv(serv).nombre} en ${q.neg(neg).nombre}, ${fLbl(fecha).toLowerCase()} a las ${h12(m2h(t))}.`);
    guardar();
  },
  async cerrarCaja(neg) { q.neg(neg).cajaCerrada = hoy(); guardar(); },

  /* ---- Somar ---- */
  async estadoNegocio(id, estado) { q.neg(id).estado = estado; guardar(); },
  async planNegocio(id, plan) { q.neg(id).plan = plan; guardar(); },
  async borrarTodo() { DB = vacio(); guardar(); },
  async cargarEjemplo() { DB = datosEjemplo(); guardar(); },
};

/* Suma la visita a la caja y da los puntos (y el bono por referido) */
function aplicarPago(v) {
  const n = q.neg(v.neg), c = v.cli ? q.cli(v.cli) : null; v.pago.estado = 'pagado';
  if (!c || !c.cuenta) return;
  const pts = v.canje ? 0 : Math.floor(v.monto / n.lpp);
  if (pts) DB.puntos.push({ id: uid('m'), cli: c.id, neg: n.id, pts, motivo: 'Visita: ' + q.serv(v.serv).nombre, fecha: hoy() });
  if (c.referidoPor && !c.refPagado) {
    c.refPagado = true; const a = q.cli(c.referidoPor);
    DB.puntos.push({ id: uid('m'), cli: c.id, neg: n.id, pts: n.ptsRef, motivo: 'Bono por código de amigo', fecha: hoy() });
    DB.puntos.push({ id: uid('m'), cli: a.id, neg: n.id, pts: n.ptsRef, motivo: `${first(c.nombre)} usó tu código`, fecha: hoy() });
    notificar(a.id, `Ganaste ${n.ptsRef} puntos`, `${first(c.nombre)} pagó su primera visita en ${n.nombre} con tu código.`);
  }
  notificar(c.id, `Gracias por tu visita a ${n.nombre}`, (pts ? `Ganaste ${pts} puntos. ` : '') + '¿Nos calificás? Tenés 7 días.');
}

/* =================== Datos de ejemplo (para probar) ===================
   Se cargan desde el panel de Somar. No se usan en producción. */
function datosEjemplo() {
  const T = hoy(), d = vacio(), H = (a, b, dom) => { const h = {}; for (let i = 1; i <= 6; i++) h[i] = [a, b]; if (dom) h[0] = dom; return h; };
  d.negocios = [
    { id: 'n1', slug: 'el-patron', nombre: 'El Patrón Barbería', cat: 'barberia', zona: 'Choloma', direccion: 'Col. López Arellano, frente al parque', tel: '99441020', color: '#22252D', horario: H(8, 19, [8, 14]), fila: true, filaCasa: true, plan: 'Pro', estado: 'activo', lpp: 10, ptsRef: 50, contador: 1, contadorFecha: '', duenoTel: '99441020', creado: addDays(T, -60),
      recompensas: [{ id: 'r1', nombre: 'Barba gratis', pts: 60 }, { id: 'r2', nombre: 'Corte clásico gratis', pts: 100 }, { id: 'r3', nombre: 'Corte y barba gratis', pts: 150 }],
      cuentas: [{ id: 'b1', banco: 'BAC Credomatic', tipo: 'Ahorro', numero: '730 412 559', titular: 'Luis Alberto Martínez' }, { id: 'b2', banco: 'Banco Atlántida', tipo: 'Cheques', numero: '1020 3349 8812', titular: 'El Patrón Barbería' }, { id: 'b3', banco: 'Tigo Money', tipo: 'Billetera', numero: '9944-1020', titular: 'Luis Martínez' }] },
    { id: 'n2', slug: 'studio-bella', nombre: 'Studio Bella Salón', cat: 'salon', zona: 'San Pedro Sula', direccion: 'Barrio Guamilito, 6 calle', tel: '98773311', color: '#8A3B5C', horario: H(9, 18), fila: false, filaCasa: false, plan: 'Plus', estado: 'activo', lpp: 10, ptsRef: 80, contador: 1, contadorFecha: '', duenoTel: '98773311', creado: addDays(T, -40),
      recompensas: [{ id: 'r4', nombre: 'Lavado y secado gratis', pts: 80 }, { id: 'r5', nombre: 'Peinado gratis', pts: 150 }], cuentas: [{ id: 'b4', banco: 'Ficohsa', tipo: 'Ahorro', numero: '200 015 778 431', titular: 'Sofía Aguilar' }] },
    { id: 'n3', slug: 'nails-by-dany', nombre: 'Nails by Dany', cat: 'unas', zona: 'San Pedro Sula', direccion: 'Col. Jardines del Valle, casa 14', tel: '96552040', color: '#B4486E', horario: H(9, 19), fila: false, filaCasa: false, plan: 'Pro', estado: 'activo', lpp: 10, ptsRef: 50, contador: 1, contadorFecha: '', duenoTel: '96552040', creado: addDays(T, -30),
      recompensas: [{ id: 'r6', nombre: 'Gelish gratis', pts: 120 }, { id: 'r7', nombre: 'Pedicure spa gratis', pts: 180 }], cuentas: [{ id: 'b5', banco: 'Banpaís', tipo: 'Ahorro', numero: '2160 004 3321', titular: 'Daniela Flores' }, { id: 'b6', banco: 'Tigo Money', tipo: 'Billetera', numero: '9655-2040', titular: 'Daniela Flores' }] },
    { id: 'n4', slug: 'karla-reyes', nombre: 'Karla Reyes Estilista', cat: 'estilista', zona: 'Choloma', direccion: 'Res. Las Colinas, bloque B', tel: '98116070', color: '#5D4E8C', horario: H(9, 17), fila: false, filaCasa: false, plan: 'Gratis', estado: 'activo', lpp: 10, ptsRef: 50, contador: 1, contadorFecha: '', duenoTel: '98116070', creado: addDays(T, -20),
      recompensas: [{ id: 'r8', nombre: 'Planchado gratis', pts: 100 }], cuentas: [{ id: 'b7', banco: 'BAC Credomatic', tipo: 'Ahorro', numero: '741 220 018', titular: 'Karla Reyes' }] },
    { id: 'n6', slug: 'glamour-unas', nombre: 'Glamour Uñas y Spa', cat: 'unas', zona: 'Villanueva', direccion: 'Barrio El Centro', tel: '95124400', color: '#A0557A', horario: H(9, 18), fila: false, filaCasa: false, plan: 'Gratis', estado: 'pendiente', lpp: 10, ptsRef: 50, contador: 1, contadorFecha: '', duenoTel: '95124400', recompensas: [], cuentas: [], creado: T },
  ];
  d.pros = [
    { id: 'p1', neg: 'n1', nombre: 'Luis Martínez', rol: 'Barbero', com: 0, tel: '99441020' }, { id: 'p2', neg: 'n1', nombre: 'Jorge Rápalo', rol: 'Barbero', com: 40, tel: '99440001' }, { id: 'p3', neg: 'n1', nombre: 'Brayan Mejía', rol: 'Barbero', com: 35, tel: '99440002' },
    { id: 'p4', neg: 'n2', nombre: 'Sofía Aguilar', rol: 'Estilista', com: 0, tel: '98773311' }, { id: 'p5', neg: 'n2', nombre: 'Paola Mejía', rol: 'Colorista', com: 45, tel: '98770001' },
    { id: 'p6', neg: 'n3', nombre: 'Daniela Flores', rol: 'Manicurista', com: 0, tel: '96552040' }, { id: 'p7', neg: 'n3', nombre: 'Wendy Paz', rol: 'Manicurista', com: 40, tel: '96550001' },
    { id: 'p8', neg: 'n4', nombre: 'Karla Reyes', rol: 'Estilista', com: 0, tel: '98116070' }, { id: 'p10', neg: 'n6', nombre: 'Ingrid Castro', rol: 'Manicurista', com: 0, tel: '95124400' },
  ].map(p => Object.assign(p, { activo: true }));
  d.servs = [
    ['s1', 'n1', 'Corte clásico', 150, 30], ['s2', 'n1', 'Corte y barba', 220, 45], ['s3', 'n1', 'Barba', 100, 20], ['s4', 'n1', 'Corte de niño', 120, 30], ['s5', 'n1', 'Diseño o líneas', 80, 15],
    ['s6', 'n2', 'Corte de dama', 300, 45], ['s7', 'n2', 'Tinte completo', 900, 120], ['s8', 'n2', 'Peinado', 350, 45], ['s9', 'n2', 'Lavado y secado', 200, 40], ['s10', 'n2', 'Keratina', 1500, 150],
    ['s11', 'n3', 'Manicure clásico', 200, 40], ['s12', 'n3', 'Uñas acrílicas', 550, 90], ['s13', 'n3', 'Gelish en manos', 350, 60], ['s14', 'n3', 'Pedicure spa', 400, 60],
    ['s15', 'n4', 'Corte y secado', 280, 50], ['s16', 'n4', 'Mechas', 1200, 150], ['s17', 'n4', 'Planchado', 250, 40], ['s20', 'n6', 'Manicure', 180, 40],
  ].map(([id, neg, nombre, precio, dur]) => ({ id, neg, nombre, precio, dur, activo: true }));
  d.clientes = [
    ['c1', 'Carlos Mejía', '98123344', 'CARLOS7'], ['c2', 'José Ramírez', '97012233', 'JOSE21'], ['c3', 'Kevin Paz', '33445566', 'KEVIN4'], ['c4', 'Daniel Rivera', '94558811', 'DANI88'],
    ['c5', 'Marlon Euceda', '88991212', 'MARLON3'], ['c6', 'Fernando Banegas', '96220909', 'FER55'], ['c7', 'Andrea Castillo', '99884545', 'ANDRE9'], ['c8', 'Don Mario Hernández', '95337070', ''],
    ['c11', 'Gabriela Turcios', '94203131', 'GABY12'], ['c12', 'Lesly Romero', '97075858', 'LESLY5'], ['c13', 'Nicole Bonilla', '31502626', 'NICOLE3'],
  ].map(([id, nombre, tel, ref]) => ({ id, nombre, tel, ref, cuenta: !!ref, referidoPor: null, refPagado: true, favs: id === 'c1' ? ['n1'] : [], creado: addDays(T, -50) }));
  d.notas = { c1_n1: 'Fade bajo, 2 a los lados. Barba con navaja.', c8_n1: 'No usa la app. Avisarle por WhatsApp.', c11_n3: 'Uñas almendradas, largo medio.' };
  const sv = id => d.servs.find(s => s.id === id);
  const visita = (n, c, p, s, ago, extra) => {
    const v = Object.assign({ id: uid('v'), neg: n, cli: c, pro: p, serv: s, monto: sv(s).precio, fecha: addDays(T, -ago), hora: '10:00', calificada: false, canje: null, pago: { metodo: 'efectivo', estado: 'pagado', cuenta: null, ref: '', comp: null } }, extra || {});
    d.visitas.push(v);
    if (c && d.clientes.find(x => x.id === c).cuenta && v.pago.estado === 'pagado') d.puntos.push({ id: uid('m'), cli: c, neg: n, pts: Math.floor(v.monto / 10), motivo: 'Visita: ' + sv(s).nombre, fecha: v.fecha });
    return v;
  };
  [['n1', 'c1', 'p1', 's2', 41, 5, 5, 'Luis es el único que me corta como me gusta.'], ['n1', 'c3', 'p1', 's1', 3, 5, 5, 'Siempre deja el fade parejo. Puntual con la cita.'], ['n1', 'c4', 'p2', 's1', 5, 5, 4, 'Buen corte. La fila en el celular ayudó.'],
    ['n1', 'c5', 'p3', 's2', 6, 4, 5, 'Brayan bien detallista con la barba.'], ['n1', 'c2', 'p1', 's2', 8, 5, 5, ''], ['n1', 'c6', 'p2', 's1', 9, 3, 3, 'Esperé casi una hora aunque tenía cita.'], ['n1', 'c3', 'p2', 's3', 13, 4, 4, ''],
    ['n1', 'c4', 'p3', 's1', 15, 5, 5, ''], ['n1', 'c5', 'p2', 's2', 17, 5, 5, 'Jorge tiene buena mano.'], ['n1', 'c6', 'p1', 's1', 19, 5, 5, ''], ['n1', 'c2', 'p3', 's3', 22, 4, 4, ''], ['n1', 'c4', 'p2', 's1', 24, 5, 4, ''], ['n1', 'c5', 'p3', 's2', 26, 5, 5, ''], ['n1', 'c6', 'p1', 's1', 28, 5, 5, ''],
    ['n2', 'c7', 'p5', 's7', 4, 5, 5, 'Paola me dejó el tinte justo del tono que pedí.'], ['n2', 'c12', 'p4', 's6', 9, 5, 4, 'Muy buen corte, el lugar bien limpio.'], ['n2', 'c13', 'p4', 's8', 12, 4, 5, 'Peinado lindo para la boda.'], ['n2', 'c7', 'p4', 's9', 20, 5, 5, ''], ['n2', 'c11', 'p5', 's7', 26, 5, 5, ''], ['n2', 'c12', 'p5', 's10', 31, 4, 4, ''], ['n2', 'c13', 'p4', 's6', 33, 5, 5, ''], ['n2', 'c11', 'p5', 's9', 36, 5, 5, ''], ['n2', 'c7', 'p5', 's7', 38, 5, 4, ''],
    ['n3', 'c11', 'p6', 's12', 6, 5, 5, 'Dany es una artista, las acrílicas me duraron un montón.'], ['n3', 'c12', 'p7', 's13', 10, 5, 4, 'Wendy muy amable.'], ['n3', 'c13', 'p6', 's14', 14, 4, 5, ''], ['n3', 'c7', 'p6', 's11', 18, 5, 5, ''], ['n3', 'c11', 'p7', 's13', 23, 5, 5, ''], ['n3', 'c13', 'p6', 's12', 27, 5, 5, ''], ['n3', 'c12', 'p7', 's11', 30, 4, 4, ''], ['n3', 'c7', 'p7', 's14', 33, 5, 5, ''],
    ['n4', 'c12', 'p8', 's15', 8, 5, 5, 'Karla me atendió puntual y el corte quedó como en la foto.'], ['n4', 'c13', 'p8', 's17', 16, 5, 5, ''], ['n4', 'c7', 'p8', 's16', 25, 4, 5, ''],
  ].forEach(([n, c, p, s, ago, en, ep, txt]) => { const v = visita(n, c, p, s, ago); v.calificada = true; d.cals.push({ id: uid('q'), visita: v.id, neg: n, pro: p, cli: c, en, ep, txt, fecha: v.fecha, resp: '', reportada: false }); });
  visita('n1', 'c1', 'p1', 's1', 20).calificada = true;
  visita('n1', 'c1', 'p1', 's2', 2);
  visita('n1', 'c5', 'p3', 's2', 0, { hora: '08:30' });
  visita('n1', null, 'p2', 's3', 0, { hora: '09:15' });
  const prueba = (banco, monto, cuenta, nombre, ref) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400"><rect width="320" height="400" fill="#fff"/><rect width="320" height="70" fill="${BANK_COLOR[banco]}"/><text x="20" y="44" font-family="Arial" font-size="21" font-weight="700" fill="#fff">${banco}</text><text x="160" y="130" text-anchor="middle" font-family="Arial" font-size="16" fill="#1E8E3E">Transferencia exitosa</text><text x="160" y="180" text-anchor="middle" font-family="Arial" font-size="34" font-weight="700" fill="#111">L ${monto}.00</text><g font-family="Arial" font-size="14" fill="#555"><text x="24" y="250">Desde</text><text x="296" y="250" text-anchor="end" fill="#111">${nombre}</text><text x="24" y="280">Cuenta destino</text><text x="296" y="280" text-anchor="end" fill="#111">${cuenta}</text><text x="24" y="310">Referencia</text><text x="296" y="310" text-anchor="end" fill="#111">${ref}</text></g></svg>`);
  visita('n1', 'c3', 'p1', 's1', 0, { hora: '10:00', pago: { metodo: 'transferencia', estado: 'por_confirmar', cuenta: 'b1', ref: '884512', comp: prueba('BAC Credomatic', 150, '730 412 559', 'Kevin Paz', '884512'), subido: 'cliente' } });
  visita('n3', 'c11', 'p6', 's13', 0, { hora: '10:30', pago: { metodo: 'transferencia', estado: 'por_confirmar', cuenta: 'b6', ref: 'TM-55120', comp: prueba('Tigo Money', 350, '9655-2040', 'Gabriela Turcios', 'TM-55120'), subido: 'cliente' } });
  let b = Math.ceil((nowMin() + 15) / 30) * 30; if (b > 22 * 60) b = 22 * 60;
  const cita = (n, c, p, s, f, h, e) => d.citas.push({ id: uid('ci'), neg: n, cli: c, pro: p, serv: s, fecha: f, hora: h, estado: e || 'confirmada', creada: Date.now() });
  cita('n1', 'c4', 'p2', 's1', T, m2h(b)); cita('n1', 'c1', 'p1', 's2', T, m2h(b + 60)); cita('n1', 'c5', 'p3', 's2', T, m2h(b + 90), 'reservada');
  cita('n1', 'c2', 'p1', 's1', addDays(T, 1), '09:30', 'reservada'); cita('n2', 'c7', 'p5', 's7', T, m2h(b)); cita('n2', 'c12', 'p4', 's6', addDays(T, 1), '10:00', 'reservada'); cita('n3', 'c12', 'p6', 's12', T, m2h(b + 30)); cita('n4', 'c13', 'p8', 's15', addDays(T, 1), '10:00', 'reservada');
  const hm = o => m2h(Math.max(0, nowMin() - o));
  d.fila.push({ id: 'f1', neg: 'n1', fecha: T, num: 1, cli: 'c2', nombre: '', pro: null, serv: 's1', estado: 'esperando', hora: hm(32), casa: false, av: true });
  d.fila.push({ id: 'f2', neg: 'n1', fecha: T, num: 2, cli: 'c6', nombre: '', pro: 'p1', serv: 's2', estado: 'esperando', hora: hm(20), casa: true, av: true });
  d.fila.push({ id: 'f3', neg: 'n1', fecha: T, num: 3, cli: 'c8', nombre: '', pro: null, serv: 's1', estado: 'esperando', hora: hm(8), casa: false, av: true });
  d.negocios[0].contador = 4; d.negocios[0].contadorFecha = T;
  return d;
}
