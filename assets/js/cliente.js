/* Somar Turno · app del cliente */
const UI = { tab: 'inicio', q: '', cat: 'todos', neg: null, negTab: 'servicios' };
let R = null; // reserva en curso

const me = () => { const t = ses.tel(); if (t) { const c = q.cliTel(t); if (c && c.cuenta) return c; } const g = ses.invitado(); return g ? q.cli(g) : null; };
const conCuenta = () => !!(me() && me().cuenta);
const miTurno = () => { const c = me(); return c && DB.fila.find(f => f.cli === c.id && f.fecha === hoy() && ['esperando', 'llamado'].includes(f.estado)); };
const misCitas = () => { const c = me(); if (!c) return []; const T = hoy(); return DB.citas.filter(x => x.cli === c.id && ['reservada', 'confirmada'].includes(x.estado) && (x.fecha > T || (x.fecha === T && h2m(x.hora) + (q.serv(x.serv)?.dur || 30) > nowMin() - 60))).sort((a, b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)); };
const misPendientes = () => { const c = me(); return c ? DB.visitas.filter(v => v.cli === c.id && ['por_comprobante', 'rechazado'].includes(v.pago.estado)) : []; };
const porCalificar = () => conCuenta() ? DB.visitas.filter(v => v.cli === me().id && !v.calificada && v.pago.estado === 'pagado' && dBetween(v.fecha, hoy()) <= 7) : [];
const sinLeer = () => conCuenta() ? q.notifs(me().id).filter(n => !n.leida).length : 0;

/* ---------- Estructura ---------- */
const TABS = [['inicio', 'Inicio', 'home'], ['turnos', 'Mis turnos', 'ticket'], ['puntos', 'Puntos', 'gift'], ['perfil', 'Perfil', 'user']];
window.render = function () {
  document.getElementById('screen').innerHTML = UI.neg ? vNegocio(UI.neg) : ({ inicio: vInicio, turnos: vTurnos, puntos: vPuntos, perfil: vPerfil })[UI.tab]();
  const t = document.getElementById('tabs'); t.style.gridTemplateColumns = 'repeat(4,1fr)';
  t.innerHTML = TABS.map(([k, l, i]) => { const b = k === 'perfil' ? sinLeer() : 0; return `<button ${act('tab', k)} ${UI.tab === k && !UI.neg ? 'aria-current="page"' : ''}>${svg(i)}${l}${b ? `<span class="dot num">${b}</span>` : ''}</button>`; }).join('');
};
/* Avisos nuevos mientras la app está abierta */
const vistos = new Set();
function revisarAvisos(primera) {
  const c = me(); if (!c || !c.cuenta) return;
  q.notifs(c.id).filter(n => !n.leida && !vistos.has(n.id)).forEach(n => { vistos.add(n.id); if (!primera) banner(n.t, n.x, () => { UI.neg = null; UI.tab = misPendientes().length ? 'inicio' : 'turnos'; render(); }); });
}
window.onDatos = () => { revisarAvisos(false); if (!SH) render(); };

/* ---------- Inicio ---------- */
function tarjeta(n) {
  const r = q.negRt(n.id), w = q.esperando(n.id).length, fav = conCuenta() && me().favs.includes(n.id);
  return `<div class="item biz" role="button" tabindex="0" ${act('abrirNeg', n.id)}>${mono(n)}
    <div class="body"><div class="name">${esc(n.nombre)}</div><div class="meta">${rtTxt(r)}<span>${CAT[n.cat]}</span><span>${esc(n.zona)}</span></div>
    <div class="meta">${q.abierto(n) ? '<span class="tag g">Abierto</span>' : '<span class="tag">Cerrado</span>'}${n.fila ? `<span class="num">${w} en fila, unos ${q.espera(n.id, w)} min</span>` : '<span>Con cita</span>'}</div></div>
    ${conCuenta() ? `<button class="fav" ${act('fav', n.id)} aria-pressed="${fav}" aria-label="${fav ? 'Quitar de favoritos' : 'Guardar en favoritos'}">${svg('heart', fav)}</button>` : ''}</div>`;
}
function ticket(f) {
  const n = q.neg(f.neg), a = q.antes(f);
  if (f.estado === 'llamado') return `<div class="ticket called" ${act('tab', 'turnos')}><div class="n num">${f.num}</div><div class="k">${esc(n.nombre)}</div><div class="big">Es tu turno</div><div class="sm">Pasá con ${esc(first(q.pro(f.pro)?.nombre))}</div></div>`;
  return `<div class="ticket" ${act('tab', 'turnos')}><div class="n num">${f.num}</div><div class="k">Tu turno en ${esc(n.nombre)}</div><div class="big">${a === 0 ? 'Sos el siguiente' : a === 1 ? 'Hay 1 persona antes' : `Hay ${a} personas antes`}</div><div class="sm">Espera aproximada ${q.espera(n.id, a)} min</div></div>`;
}
function vInicio() {
  const c = me(), t = miTurno(), ci = misCitas()[0], pr = porCalificar()[0], pg = misPendientes();
  let ns = q.activos();
  if (UI.cat === 'abierto') ns = ns.filter(q.abierto); else if (UI.cat !== 'todos') ns = ns.filter(n => n.cat === UI.cat);
  if (UI.q) { const s = UI.q.toLowerCase(); ns = ns.filter(n => (n.nombre + ' ' + n.zona + ' ' + CAT[n.cat] + ' ' + q.servs(n.id).map(x => x.nombre).join(' ')).toLowerCase().includes(s)); }
  const fv = n => conCuenta() && c.favs.includes(n.id) ? 1 : 0;
  ns.sort((a, b) => (fv(b) - fv(a)) || (q.negRt(b.id).v - q.negRt(a.id).v));
  const ch = (k, l) => `<button class="chip" aria-pressed="${UI.cat === k}" ${act('cat', k)}>${l}</button>`;
  return `<div class="title"><h1>${c ? 'Hola, ' + esc(first(c.nombre)) : 'Reservá sin hacer fila'}</h1><p>Barberías, salones, estilistas y uñas cerca de vos.</p></div>
  ${pg.map(v => `<div class="panel ${v.pago.estado === 'rechazado' ? 'bad' : 'warn'}"><b>${v.pago.estado === 'rechazado' ? 'Tu comprobante fue rechazado' : 'Falta tu comprobante de pago'}</b><span class="sm">${esc(q.serv(v.serv).nombre)} en ${esc(q.neg(v.neg).nombre)}, <span class="num">${L(v.monto)}</span>.${v.pago.estado === 'rechazado' && v.pago.motivo ? ' Motivo: ' + esc(v.pago.motivo) : ''}</span><div><button class="btn ink s" ${act('subir', v.id)}>Subir comprobante</button></div></div>`).join('')}
  ${t ? ticket(t) : ''}
  ${ci && !t ? `<div class="panel"><div class="sec-h"><h2>Tu próxima cita</h2><span class="tag a">${fLbl(ci.fecha)}</span></div><div class="item" style="padding:0">${mono(q.neg(ci.neg), 's')}<div class="body"><div class="l1">${h12(ci.hora)}, ${esc(q.serv(ci.serv).nombre)}</div><div class="l2">Con ${esc(q.pro(ci.pro).nombre)} en ${esc(q.neg(ci.neg).nombre)}</div></div></div></div>` : ''}
  ${pr ? `<div class="panel soft"><b>¿Qué tal te fue en ${esc(q.neg(pr.neg).nombre)}?</b><span class="sm">${esc(q.serv(pr.serv).nombre)} con ${esc(q.pro(pr.pro).nombre)}, ${fLbl(pr.fecha).toLowerCase()}.</span><div><button class="btn ink s" ${act('calificar', pr.id)}>Calificar</button></div></div>` : ''}
  <label class="search">${svg('search')}<input id="q" data-i="buscar" placeholder="Buscar negocio o servicio" value="${esc(UI.q)}" autocomplete="off" aria-label="Buscar"></label>
  <div class="chips">${ch('todos', 'Todos')}${ch('barberia', 'Barberías')}${ch('salon', 'Salones')}${ch('estilista', 'Estilistas')}${ch('unas', 'Uñas')}${ch('abierto', 'Abierto ahora')}</div>
  <div class="list">${ns.map(tarjeta).join('') || empty(q.activos().length ? 'No encontramos negocios con esa búsqueda.' : 'Todavía no hay negocios publicados. ¿Tenés un negocio? Registralo en turno.somarlabs.online/panel')}</div>`;
}

/* ---------- Negocio ---------- */
function vNegocio(id) {
  const n = q.neg(id);
  if (!n || n.estado !== 'activo') return `<button class="link" style="align-self:flex-start" ${act('cerrarNeg')}>‹ Volver</button>${empty('Este negocio no está disponible.')}`;
  const r = q.negRt(id), w = q.esperando(id).length, t = miTurno();
  const tb = (k, l) => `<button class="chip" aria-pressed="${UI.negTab === k}" ${act('negTab', k)}>${l}</button>`;
  let body = '';
  if (UI.negTab === 'servicios') body = `<div class="list">${q.servs(id).map(s => `<div class="item"><div class="body"><div class="l1">${esc(s.nombre)}</div><div class="l2 num">${s.dur} min</div></div><b class="num">${L(s.precio)}</b><button class="btn s" ${act('reservar', id, s.id)}>Reservar</button></div>`).join('') || empty('Este negocio todavía no publicó sus servicios.')}</div>`;
  if (UI.negTab === 'equipo') body = `<div class="list">${q.pros(id).map(p => `<div class="item"><div class="av">${esc(ini(p.nombre))}</div><div class="body"><div class="l1">${esc(p.nombre)}</div><div class="l2">${esc(p.rol)}, ${rtTxt(q.proRt(p.id), 5)}</div></div><button class="btn s" ${act('reservar', id, '', p.id)}>Reservar</button></div>`).join('')}</div><p class="xs faint">El promedio de cada profesional aparece desde 5 calificaciones.</p>`;
  if (UI.negTab === 'resenas') { const qs = DB.cals.filter(x => x.neg === id && x.txt).sort((a, b) => b.fecha.localeCompare(a.fecha)); body = `<div class="list">${qs.map(resena).join('') || empty('Todavía no hay comentarios.')}</div>`; }
  if (UI.negTab === 'puntos') {
    if (!conCuenta()) body = `<div class="panel soft"><b>Ganá puntos en cada visita</b><span class="sm">Con una cuenta sumás 1 punto por cada ${L(n.lpp)} y los canjeás por servicios gratis.</span><div><button class="btn ink s" ${act('entrar')}>Crear mi cuenta</button></div></div>`;
    else { const pts = q.pts(me().id, id), nx = n.recompensas.find(x => x.pts > pts); body = `<div class="panel"><div class="sec-h"><h2>Tus puntos aquí</h2><b class="num" style="font-size:24px">${pts}</b></div>${nx ? `<div class="bar"><i style="width:${Math.min(100, pts / nx.pts * 100)}%"></i></div><p class="sm muted num">Te faltan ${nx.pts - pts} para ${esc(nx.nombre.toLowerCase())}.</p>` : ''}<p class="sm">1 punto por cada ${L(n.lpp)}. Si un amigo viene con tu código, ganan ${n.ptsRef} puntos cada uno.</p></div>`; }
    body += `<div class="list">${n.recompensas.map(x => `<div class="item"><div class="body"><div class="l1">${esc(x.nombre)}</div><div class="l2 num">${x.pts} puntos</div></div></div>`).join('') || empty('Este negocio aún no tiene recompensas.')}</div>`;
  }
  let fb = '';
  if (n.fila) {
    if (t && t.neg === id) fb = `<button class="btn full" ${act('tab', 'turnos')}>Ver mi turno, número ${t.num}</button>`;
    else if (t) fb = `<button class="btn full" disabled>Ya tenés turno en ${esc(q.neg(t.neg).nombre)}</button>`;
    else if (n.filaCasa || LOCAL === id) fb = `<button class="btn full" ${act('turno', id)}>Tomar turno${n.filaCasa ? ' desde aquí' : ''}</button>`;
    else fb = `<div class="panel" style="padding:12px"><span class="sm muted">Aquí el turno se toma en el local, escaneando el código de la puerta.</span></div>`;
  }
  return `<button class="link" style="align-self:flex-start" ${act('cerrarNeg')}>‹ Volver</button>
  <div class="sec"><div style="display:flex;gap:14px;align-items:center">${mono(n)}<div style="min-width:0;display:flex;flex-direction:column;gap:3px"><h1 style="font-size:23px;font-weight:800">${esc(n.nombre)}</h1><div class="meta">${rtTxt(r)}<span>${CAT[n.cat]}</span></div></div></div>
  <div class="sm muted">${esc(n.direccion)}${n.direccion ? ', ' : ''}${esc(n.zona)}<br>Hoy ${q.horaHoy(n)} ${q.abierto(n) ? '<span class="tag g">Abierto</span>' : '<span class="tag">Cerrado</span>'}${n.fila ? `<br><span class="num">${w} en fila, espera de unos ${q.espera(id, w)} min</span>` : ''}</div>
  <div style="display:flex;flex-direction:column;gap:8px"><button class="btn ink full" ${act('reservar', id)}>Reservar cita</button>${fb}</div></div>
  <div class="chips">${tb('servicios', 'Servicios')}${tb('equipo', 'Equipo')}${tb('resenas', 'Reseñas')}${tb('puntos', 'Puntos')}</div>${body}`;
}
const resena = x => `<div class="item top-al"><div class="av">${esc(ini(q.cli(x.cli)?.nombre))}</div><div class="body" style="gap:4px"><div class="l1">${esc(first(q.cli(x.cli)?.nombre || 'Cliente'))} <span class="star sm">${stars(x.en)}</span></div><div class="l2">Atendida por ${esc(q.pro(x.pro)?.nombre)}, ${fLbl(x.fecha).toLowerCase()}</div><div>${esc(x.txt)}</div>${x.resp ? `<div class="reply"><b>Respuesta del negocio:</b> ${esc(x.resp)}</div>` : ''}</div></div>`;

/* Datos de quien no tiene cuenta */
const camposInvitado = () => me() ? '' : `<div class="panel"><b>Tus datos</b><span class="sm muted">Para avisarte por WhatsApp. No necesitás cuenta.</span><div class="two"><div class="f"><label for="gN">Nombre</label><input id="gN" data-m="gNombre" value="${esc(F.gNombre || '')}" autocomplete="name"></div><div class="f"><label for="gT">WhatsApp</label><input id="gT" data-m="gTel" inputmode="tel" value="${esc(F.gTel || '')}" placeholder="9999-9999"></div></div></div>`;
async function asegurarCliente() { if (me()) return me(); return api.invitado({ nombre: F.gNombre, tel: F.gTel }); }

/* ---------- Turno ---------- */
function hojaTurno(n) {
  const nn = q.neg(n);
  return `${head('Tomar turno')}<p class="muted">${esc(nn.nombre)}, ${q.esperando(n).length} personas en fila</p>
  <div class="f"><label for="ttS">Servicio</label><select id="ttS" data-m="serv">${q.servs(n).map(x => `<option value="${x.id}" ${x.id === F.serv ? 'selected' : ''}>${esc(x.nombre)}, ${L(x.precio)}</option>`).join('')}</select></div>
  <div class="f"><label for="ttP">Con quién</label><select id="ttP" data-m="pro"><option value="">El primero que esté libre</option>${q.pros(n).map(p => `<option value="${p.id}" ${p.id === F.pro ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>
  ${camposInvitado()}<p class="sm muted">${conCuenta() ? 'Te avisamos cuando te falten 2 y cuando sea tu turno.' : 'Te avisamos por WhatsApp cuando sea tu turno.'}</p>
  <button class="btn ink full" ${act('confirmarTurno')}>Tomar turno</button>`;
}

/* ---------- Reservar ---------- */
function primerDia() { for (let i = 0; i < 21; i++) { const f = addDays(hoy(), i); if (q.slots(R.neg, f, q.serv(R.serv).dur, R.pro || null, R.cambiar).length) return f; } return hoy(); }
function hojaReserva() {
  const n = q.neg(R.neg), st = R.step;
  const steps = `<div class="steps">${[1, 2, 3, 4].map(i => `<i class="${i <= st ? 'on' : ''}"></i>`).join('')}</div>`;
  const back = st > 1 ? `<button class="link" style="align-self:flex-start" ${act('rAtras')}>‹ Atrás</button>` : '';
  if (st === 1) return `${head(R.cambiar ? 'Cambiar cita' : 'Reservar cita')}${steps}<p class="muted">${esc(n.nombre)}. ¿Qué te vas a hacer?</p><div class="opts">${q.servs(n.id).map(s => `<button class="opt" aria-pressed="${R.serv === s.id}" ${act('rServ', s.id)}><b>${esc(s.nombre)}</b><span class="sm muted num">${L(s.precio)}, ${s.dur} min</span></button>`).join('')}</div>`;
  if (st === 2) return `${head('¿Con quién?')}${steps}${back}<div class="opts"><button class="opt" aria-pressed="${R.pro === null}" ${act('rPro', '')}><b>Cualquiera</b><span class="sm muted">El primero libre</span></button>${q.pros(n.id).map(p => `<button class="opt" aria-pressed="${R.pro === p.id}" ${act('rPro', p.id)}><b>${esc(first(p.nombre))}</b><span class="sm muted">${esc(p.rol)}</span><span class="sm">${rtTxt(q.proRt(p.id), 5)}</span></button>`).join('')}</div>`;
  if (st === 3) {
    const s = q.serv(R.serv), days = [...Array(14)].map((_, i) => addDays(hoy(), i)), sl = q.slots(n.id, R.fecha, s.dur, R.pro || null, R.cambiar);
    return `${head('¿Cuándo?')}${steps}${back}<div class="days">${days.map(f => { const d = new Date(f + 'T12:00:00'); return `<button class="day" ${n.horario[d.getDay()] ? '' : 'disabled'} aria-pressed="${R.fecha === f}" ${act('rDia', f)}>${f === hoy() ? 'Hoy' : DIAS[d.getDay()]}<b class="num">${d.getDate()}</b></button>`; }).join('')}</div>
    ${sl.length ? `<div class="slots">${sl.map(x => `<button class="slot" ${act('rHora', x.t, x.pro)}>${h12(m2h(x.t))}</button>`).join('')}</div>` : empty('No quedan horas libres este día. Probá otro.')}`;
  }
  const s = q.serv(R.serv), p = q.pro(R.slot.pro), pts = Math.floor(s.precio / n.lpp);
  return `${head('Confirmá tu cita')}${steps}${back}
  <div class="panel"><div class="item" style="padding:0">${mono(n, 's')}<div class="body"><div class="l1">${esc(n.nombre)}</div><div class="l2">${esc(n.direccion || n.zona)}</div></div></div><div class="hr"></div>
  <div class="two"><div><div class="xs faint">Servicio</div><b>${esc(s.nombre)}</b></div><div><div class="xs faint">Con</div><b>${esc(p.nombre)}</b></div><div><div class="xs faint">Cuándo</div><b>${fLbl(R.fecha)}, ${h12(m2h(R.slot.t))}</b></div><div><div class="xs faint">Precio</div><b class="num">${L(s.precio)}</b></div></div>
  ${conCuenta() ? `<span class="tag a" style="align-self:flex-start">Ganás ${pts} puntos al pagar</span>` : ''}</div>
  ${camposInvitado()}${!me() ? `<p class="sm muted">¿Querés ganar ${pts} puntos con esta cita? <button class="link" ${act('entrar')}>Creá tu cuenta</button></p>` : ''}
  <p class="sm muted">Pagás en el local, en efectivo o por transferencia.</p>
  <button class="btn ink full" ${act('rConfirmar')}>${R.cambiar ? 'Cambiar mi cita' : 'Confirmar cita'}</button>`;
}

/* ---------- Mis turnos ---------- */
function vTurnos() {
  const c = me(), t = miTurno(), cs = misCitas();
  const hist = c ? DB.visitas.filter(v => v.cli === c.id).sort((a, b) => (b.fecha + b.hora).localeCompare(a.fecha + a.hora)) : [];
  const tagPago = v => ({ pagado: '', por_comprobante: '<span class="tag w">Falta comprobante</span>', por_confirmar: '<span class="tag a">Pago en revisión</span>', rechazado: '<span class="tag r">Comprobante rechazado</span>' })[v.pago.estado];
  return `<div class="title"><h1>Mis turnos</h1></div>
  ${t ? `${ticket(t)}<div class="row-btns"><button class="btn" ${act('salir', t.id)}>Salir de la fila</button></div>` : ''}
  <div class="sec"><div class="sec-h"><h2>Próximas citas</h2></div>
  ${cs.length ? `<div class="list">${cs.map(x => `<div class="item top-al">${mono(q.neg(x.neg), 's')}<div class="body" style="gap:8px"><div><div class="l1">${fLbl(x.fecha)}, ${h12(x.hora)}</div><div class="l2">${esc(q.serv(x.serv).nombre)} con ${esc(q.pro(x.pro).nombre)}, ${esc(q.neg(x.neg).nombre)}</div></div><div class="row-btns"><button class="btn s" ${act('cambiar', x.id)}>Cambiar</button><button class="btn s quiet" ${act('cancelar', x.id)}>Cancelar</button></div></div></div>`).join('')}</div>` : `<div class="panel"><p class="muted">No tenés citas pendientes.</p><div><button class="btn ink" ${act('tab', 'inicio')}>Buscar dónde reservar</button></div></div>`}</div>
  <div class="sec"><div class="sec-h"><h2>Historial</h2></div><div class="list">${hist.map(v => `<div class="item"><div class="body"><div class="l1">${esc(q.serv(v.serv).nombre)}, ${esc(q.neg(v.neg).nombre)}</div><div class="l2">${fLbl(v.fecha)} con ${esc(first(q.pro(v.pro).nombre))}, <span class="num">${L(v.monto)}</span>${v.canje ? ', canje de puntos' : ''}</div>${tagPago(v) ? `<div>${tagPago(v)}</div>` : ''}</div>${['por_comprobante', 'rechazado'].includes(v.pago.estado) ? `<button class="btn s ink" ${act('subir', v.id)}>Subir</button>` : (conCuenta() && !v.calificada && v.pago.estado === 'pagado' && dBetween(v.fecha, hoy()) <= 7) ? `<button class="btn s ink" ${act('calificar', v.id)}>Calificar</button>` : `<button class="btn s" ${act('repetir', v.id)}>Repetir</button>`}</div>`).join('') || empty('Aquí vas a ver tus visitas.')}</div></div>`;
}

/* ---------- Comprobante ---------- */
function hojaComprobante() {
  const v = DB.visitas.find(x => x.id === F.vid), n = q.neg(v.neg); if (!F.cuenta) F.cuenta = v.pago.cuenta || n.cuentas[0]?.id;
  if (!n.cuentas.length) return `${head('Pagar por transferencia')}<p class="muted">${esc(n.nombre)} todavía no publicó sus cuentas. Pagá en el local o escribiles por WhatsApp.</p><a class="btn wa" target="_blank" rel="noopener" href="${waLink(n.tel, `Hola, quiero pagar por transferencia mi ${q.serv(v.serv).nombre} de ${L(v.monto)}.`)}">Escribir por WhatsApp</a>`;
  return `${head('Pagar por transferencia')}<p class="muted">${esc(q.serv(v.serv).nombre)} en ${esc(n.nombre)}</p>
  <div class="panel" style="align-items:center;text-align:center;gap:2px"><span class="sm muted">Monto a transferir</span><b class="num" style="font-size:32px;letter-spacing:-.02em">${L(v.monto)}</b></div>
  <div class="sec"><div class="sec-h"><h2>¿A qué cuenta transferiste?</h2></div><div class="list">${n.cuentas.map(c => `<button class="item" ${act('cuenta', c.id)} aria-pressed="${F.cuenta === c.id}" style="${F.cuenta === c.id ? 'background:var(--accent-soft)' : ''}"><div class="bank" style="flex:1;min-width:0">${bankIc(c.banco)}<div style="display:flex;flex-direction:column;min-width:0"><span class="l1">${esc(c.banco)}, ${esc(c.tipo.toLowerCase())}</span><span class="acct">${esc(c.numero)}</span><span class="xs muted">${esc(c.titular)}</span></div></div><span class="btn s" ${act('copy', c.numero)}>Copiar</span></button>`).join('')}</div></div>
  <label class="upload" for="upf">${F.comp ? `<img class="proof" src="${F.comp}" alt="Comprobante subido">` : `<span style="width:28px;height:28px;color:var(--ink-2)">${svg('up')}</span><b>Subir foto del comprobante</b><span class="sm muted">Captura de tu app del banco</span>`}<input id="upf" type="file" accept="image/*" data-file="comp"></label>
  <div class="f"><label for="upR">Referencia (opcional)</label><input id="upR" data-m="ref" inputmode="numeric" value="${esc(F.ref || '')}"></div>
  <p class="sm muted">El negocio revisa que el dinero haya entrado. Tus puntos se suman cuando lo confirma.</p>
  <button class="btn ink full" ${F.comp ? '' : 'disabled'} ${act('enviarComprobante')}>Enviar comprobante</button>`;
}

/* ---------- Calificar ---------- */
function hojaCalificar() {
  const v = DB.visitas.find(x => x.id === F.vid), n = q.neg(v.neg), p = q.pro(v.pro);
  const st = k => `<div class="stars-in" role="group" aria-label="Estrellas">${[1, 2, 3, 4, 5].map(i => `<button class="${F[k] >= i ? 'on' : ''}" aria-label="${i} de 5" ${act('estrella', k, i)}>★</button>`).join('')}</div>`;
  return `${head('Calificá tu visita')}<p class="muted">${esc(q.serv(v.serv).nombre)}, ${fLbl(v.fecha).toLowerCase()}</p>
  <div class="panel"><b>${esc(n.nombre)}</b><span class="sm muted">Limpieza, puntualidad y trato</span>${st('en')}</div>
  <div class="panel"><b>${esc(p.nombre)}</b><span class="sm muted">Cómo quedó tu ${esc(q.serv(v.serv).nombre.toLowerCase())}</span>${st('ep')}</div>
  <div class="f"><label for="rt">Comentario, si querés</label><textarea id="rt" data-m="txt" placeholder="Contale a otros cómo te fue">${esc(F.txt || '')}</textarea></div>
  <button class="btn ink full" ${F.en && F.ep ? '' : 'disabled'} ${act('publicar')}>Publicar calificación</button>`;
}

/* ---------- Puntos ---------- */
function vPuntos() {
  if (!conCuenta()) return `<div class="title"><h1>Puntos</h1><p>Ganá puntos en cada visita y canjealos por servicios gratis.</p></div><div class="panel soft"><b>Necesitás una cuenta para sumar puntos</b><span class="sm">Solo tu número de WhatsApp. Si un amigo te invita, los dos ganan puntos en tu primera visita.</span><div><button class="btn ink" ${act('entrar')}>Crear mi cuenta</button></div></div>`;
  const c = me(), ids = [...new Set(DB.puntos.filter(m => m.cli === c.id).map(m => m.neg))], movs = DB.puntos.filter(m => m.cli === c.id).slice().reverse().slice(0, 10);
  return `<div class="title"><h1>Mis puntos</h1><p>Los canjeás al pagar, en cada negocio.</p></div>
  ${ids.map(id => { const n = q.neg(id), pts = q.pts(c.id, id), nx = n.recompensas.find(x => x.pts > pts), ok = n.recompensas.filter(x => x.pts <= pts);
    return `<div class="panel"><div class="item" style="padding:0">${mono(n, 's')}<div class="body"><div class="l1">${esc(n.nombre)}</div><div class="l2">1 punto por cada ${L(n.lpp)}</div></div><b class="num" style="font-size:24px">${pts}</b></div>${nx ? `<div class="bar"><i style="width:${Math.min(100, pts / nx.pts * 100)}%"></i></div><p class="sm muted num">Te faltan ${nx.pts - pts} para ${esc(nx.nombre.toLowerCase())}.</p>` : ''}${ok.length ? `<div class="meta">${ok.map(x => `<span class="tag g">${esc(x.nombre)}</span>`).join('')}</div><p class="xs faint">Pedilo al pagar y se descuenta de tus puntos.</p>` : ''}</div>`; }).join('') || '<div class="panel"><p class="muted">Todavía no tenés puntos. Los ganás cada vez que pagás una visita.</p></div>'}
  <div class="panel soft"><div class="sec-h"><h2>Invitá a un amigo</h2></div><p class="sm">Cuando tu amigo pague su primera visita con tu código, los dos ganan puntos en ese negocio.</p>
  <div style="display:flex;gap:8px;align-items:center"><span class="tn" style="flex:1;font-size:21px;letter-spacing:.06em;border-color:var(--accent);color:var(--accent)">${esc(c.ref)}</span><button class="btn s" ${act('copy', c.ref)}>Copiar</button></div>
  <a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent('Reservá en Somar Turno con mi código ' + c.ref + ' y ganamos puntos los dos: ' + CONFIG.URL)}">Compartir por WhatsApp</a></div>
  <div class="sec"><div class="sec-h"><h2>Movimientos</h2></div><div class="list">${movs.map(m => `<div class="item"><div class="body"><div class="l1">${esc(m.motivo)}</div><div class="l2">${esc(q.neg(m.neg)?.nombre)}, ${fLbl(m.fecha).toLowerCase()}</div></div><b class="num" style="color:${m.pts < 0 ? 'var(--bad)' : 'var(--good)'}">${m.pts > 0 ? '+' : ''}${m.pts}</b></div>`).join('') || empty('Sin movimientos.')}</div></div>`;
}

/* ---------- Perfil ---------- */
function vPerfil() {
  const c = me();
  if (!conCuenta()) return `<div class="title"><h1>${c ? esc(c.nombre) : 'Tu perfil'}</h1><p>${c ? 'Estás usando la app sin cuenta.' : 'Podés reservar y tomar turno sin crear cuenta.'}</p></div>
  <div class="panel soft"><b>Con una cuenta ganás más</b><div class="sm">Puntos en cada visita, historial, avisos cuando se acerca tu turno y calificar a quien te atendió.</div><div class="row-btns"><button class="btn ink" ${act('entrar')}>Crear cuenta o entrar</button></div></div>
  ${instalar()}${c ? `<button class="btn quiet" style="align-self:flex-start" ${act('olvidarInvitado')}>Borrar mis datos de este celular</button>` : ''}`;
  const ns = q.notifs(c.id).slice().reverse();
  if (ns.some(n => !n.leida)) setTimeout(() => api.leerNotifs(c.id).then(render), 1500);
  return `<div class="panel"><div class="item" style="padding:0"><div class="av" style="width:52px;height:52px;font-size:18px">${esc(ini(c.nombre))}</div><div class="body"><div class="l1" style="font-size:19px">${esc(c.nombre)}</div><div class="l2 num">+504 ${telBonito(c.tel)}</div></div></div></div>
  ${instalar()}
  <div class="sec"><div class="sec-h"><h2>Notificaciones</h2></div><div class="list">${ns.slice(0, 15).map(n => `<div class="item top-al"><div class="body"><div class="l1">${esc(n.t)} ${n.leida ? '' : '<span class="tag r">Nueva</span>'}</div><div class="l2">${esc(n.x)}</div></div></div>`).join('') || empty('Sin notificaciones.')}</div></div>
  <button class="btn" style="align-self:flex-start" ${act('salirCuenta')}>${svg('out')} Cerrar sesión</button>`;
}
let promptInstalar = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptInstalar = e; if (UI.tab === 'perfil') render(); });
const instalar = () => window.matchMedia('(display-mode: standalone)').matches ? '' : `<div class="panel"><b>Instalá la app</b><span class="sm muted">${promptInstalar ? 'Queda en tu pantalla de inicio y te llegan los avisos de tu turno.' : 'En Android tocá Instalar cuando el navegador te lo ofrezca. En iPhone: Compartir y luego Agregar a inicio.'}</span>${promptInstalar ? `<div><button class="btn ink s" ${act('instalar')}>Instalar</button></div>` : ''}</div>`;

/* ---------- Entrar / crear cuenta ---------- */
function hojaEntrar() {
  if (F.step === 1) return `${head('Entrar o crear cuenta')}<p class="muted">Solo tu número de WhatsApp. Sin contraseñas.</p><div class="f"><label for="sTel">Tu WhatsApp</label><input id="sTel" data-m="tel" inputmode="tel" placeholder="9999-9999" value="${esc(F.tel || '')}" autocomplete="tel"></div><button class="btn ink full" ${act('enviarCodigo')}>Mandarme el código</button>`;
  if (F.step === 2) return `${head('Revisá tu WhatsApp')}<p class="muted">Te mandamos un código de 6 dígitos al ${telBonito(F.tel)}.</p>${codigoPrueba(F.codigo)}<div class="f"><label for="sCode">Código</label><input id="sCode" data-m="codeIn" inputmode="numeric" maxlength="6" class="num" autocomplete="one-time-code" value="${esc(F.codeIn || '')}"></div><button class="btn ink full" ${act('verificar')}>Verificar</button><button class="link" style="align-self:center" ${act('enviarCodigo')}>Mandar otro código</button>`;
  return `${head('Tus datos')}<div class="f"><label for="sNom">Nombre y apellido</label><input id="sNom" data-m="nombre" value="${esc(F.nombre || '')}" autocomplete="name"></div><div class="f"><label for="sRef">Código de un amigo</label><input id="sRef" data-m="ref" placeholder="Ej. CARLOS7" value="${esc(F.ref || '')}"><span class="hint">Opcional. Si lo ponés, ganan puntos los dos en tu primera visita.</span></div><button class="btn ink full" ${act('crearCuenta')}>Crear mi cuenta</button>`;
}

/* ---------- Acciones ---------- */
Object.assign(A, {
  tab(k) { UI.tab = k; UI.neg = null; render(); scrollTo(0, 0); },
  cat(k) { UI.cat = k; render(); },
  buscar(v) { UI.q = v; keepFocus('q', render); },
  abrirNeg(id) { UI.neg = id; UI.negTab = 'servicios'; render(); scrollTo(0, 0); },
  cerrarNeg() { UI.neg = null; history.replaceState(null, '', '/'); render(); },
  negTab(k) { UI.negTab = k; render(); },
  async fav(id) { const on = await api.favorito(me().id, id); toast(on ? 'Guardado en favoritos' : 'Quitado de favoritos'); render(); },
  turno(n) { F = { neg: n, serv: q.servs(n)[0]?.id, pro: '' }; if (!F.serv) return toast('Este negocio todavía no tiene servicios.'); openSheet(() => hojaTurno(n)); },
  async confirmarTurno() {
    const c = await asegurarCliente(), n = q.neg(F.neg);
    const f = await api.tomarTurno({ neg: F.neg, cli: c.id, pro: F.pro, serv: F.serv, casa: n.filaCasa && LOCAL !== F.neg });
    closeSheet(); toast('Tenés el turno ' + f.num); UI.neg = null; UI.tab = 'turnos'; render(); scrollTo(0, 0);
  },
  async salir(id) { ask('Salir de la fila', 'Perdés tu número. Si volvés, tomás uno nuevo.', 'Salir de la fila', async () => { await api.salirFila(id); toast('Saliste de la fila'); render(); }); },
  reservar(n, s, p) {
    if (!q.servs(n).length) return toast('Este negocio todavía no tiene servicios.');
    R = { neg: n, serv: s || null, pro: p ? p : undefined, fecha: null, slot: null, cambiar: null };
    R.step = !R.serv ? 1 : R.pro === undefined ? 2 : 3; if (R.step === 3) R.fecha = primerDia();
    F = {}; openSheet(hojaReserva);
  },
  cambiar(id) { const c = DB.citas.find(x => x.id === id); R = { neg: c.neg, serv: c.serv, pro: c.pro, cambiar: id, step: 3 }; R.fecha = primerDia(); F = {}; openSheet(hojaReserva); },
  repetir(vid) { const v = DB.visitas.find(x => x.id === vid); A.reservar(v.neg, v.serv, q.pro(v.pro)?.activo !== false ? v.pro : ''); },
  cancelar(id) { ask('Cancelar cita', 'Tu espacio queda libre para otra persona.', 'Cancelar cita', async () => { await api.cancelarCita(id); toast('Cita cancelada'); render(); }); },
  rAtras() { R.step--; drawSheet(); },
  rServ(s) { R.serv = s; if (R.pro !== undefined) { R.step = 3; R.fecha = primerDia(); } else R.step = 2; drawSheet(); },
  rPro(p) { R.pro = p || null; R.step = 3; R.fecha = primerDia(); drawSheet(); },
  rDia(f) { R.fecha = f; drawSheet(); },
  rHora(t, p) { R.slot = { t: +t, pro: p }; R.step = 4; drawSheet(); },
  async rConfirmar() {
    const c = await asegurarCliente();
    await api.reservar({ neg: R.neg, cli: c.id, pro: R.slot.pro, serv: R.serv, fecha: R.fecha, t: R.slot.t, cambiar: R.cambiar });
    closeSheet(); toast(R.cambiar ? 'Cita cambiada' : 'Cita confirmada'); R = null; UI.neg = null; UI.tab = 'turnos'; render(); scrollTo(0, 0);
  },
  subir(vid) { F = { vid, comp: null, cuenta: null, ref: '' }; openSheet(hojaComprobante); },
  cuenta(id) { F.cuenta = id; drawSheet(); },
  async enviarComprobante() { await api.subirComprobante(F.vid, { cuenta: F.cuenta, comp: F.comp, ref: F.ref }); closeSheet(); toast('Comprobante enviado. El negocio lo va a revisar.'); render(); },
  calificar(vid) { F = { vid, en: 0, ep: 0, txt: '' }; openSheet(hojaCalificar); },
  estrella(k, i) { F[k] = +i; drawSheet(); },
  async publicar() { await api.calificar(F.vid, F); closeSheet(); toast('Gracias, tu calificación ya está publicada'); render(); },
  entrar() { const c = me(); F = { step: 1, tel: c ? telBonito(c.tel) : '', nombre: c ? c.nombre : '' }; openSheet(hojaEntrar); },
  async enviarCodigo() { F.codigo = await api.enviarCodigo(F.tel); F.step = 2; F.codeIn = ''; drawSheet(); },
  async verificar() {
    const t = await api.verificarCodigo(F.tel, F.codeIn), c = q.cliTel(t);
    if (c && c.cuenta) { closeSheet(); ses.setInvitado(null); toast('Hola de nuevo, ' + first(c.nombre)); revisarAvisos(true); render(); return; }
    F.step = 3; drawSheet();
  },
  async crearCuenta() { const c = await api.crearCuenta({ tel: F.tel, nombre: F.nombre, ref: F.ref }); closeSheet(); toast('Cuenta creada'); revisarAvisos(true); UI.tab = 'inicio'; render(); },
  salirCuenta() { ask('Cerrar sesión', 'Para volver a entrar te pedimos un código por WhatsApp.', 'Cerrar sesión', () => { ses.cerrar(); UI.tab = 'inicio'; render(); }); },
  olvidarInvitado() { ses.setInvitado(null); render(); toast('Listo'); },
  async instalar() { if (!promptInstalar) return; promptInstalar.prompt(); await promptInstalar.userChoice; promptInstalar = null; render(); },
});

/* ---------- Inicio de la app ----------
   turno.somarlabs.online/nombre-negocio abre ese negocio.
   ?local=1 (el QR de la puerta) permite tomar turno aunque el negocio no lo permita desde la casa. */
let LOCAL = null;
(function iniciar() {
  const slug = decodeURIComponent(location.pathname.replace(/^\/+|\/+$/g, '')) || new URLSearchParams(location.search).get('n');
  if (slug && !slug.includes('.')) { const n = q.negSlug(slug); if (n) { UI.neg = n.id; if (new URLSearchParams(location.search).get('local')) LOCAL = n.id; } }
  revisarAvisos(true); render();
  setInterval(() => { if (!SH && !document.activeElement?.matches('input,textarea,select')) render(); }, 60000);
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => { });
})();
