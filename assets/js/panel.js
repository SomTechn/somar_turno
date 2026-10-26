/* Somar Turno · panel del negocio (dueño) y del profesional */
const NEG_KEY = 'somar_turno_panel_neg';
const UI = { tab: null, mas: null, agDia: hoy(), agPro: 'todos', cliF: 'todos', cliQ: '' };
const LOGIN = { step: 1, tel: '', codigo: null, codeIn: '' };

const miTel = () => ses.tel();
const mems = () => miTel() ? q.membresias(miTel()) : [];
const memActual = () => { const m = mems(), id = localStorage.getItem(NEG_KEY); return m.find(x => x.neg === id) || m[0] || null; };
const N = () => q.neg(memActual().neg);
const esDueno = () => memActual()?.rol === 'dueno';
const yo = () => memActual()?.rol === 'pro' ? q.pro(memActual().pro) : DB.pros.find(p => p.neg === N().id && p.tel === miTel());

const TABS_D = [['hoy', 'Hoy', 'today'], ['agenda', 'Agenda', 'cal'], ['clientes', 'Clientes', 'people'], ['caja', 'Caja', 'cash'], ['mas', 'Más', 'more']];
const TABS_P = [['dia', 'Mi día', 'today'], ['ganancias', 'Ganancias', 'cash'], ['resenas', 'Reseñas', 'star'], ['cuenta', 'Cuenta', 'user']];

window.render = function () {
  const s = document.getElementById('screen'), t = document.getElementById('tabs'), sel = document.getElementById('negSel');
  if (!miTel()) { t.innerHTML = ''; t.hidden = true; sel.innerHTML = ''; s.innerHTML = vLogin(); return; }
  if (!memActual()) { t.innerHTML = ''; t.hidden = true; sel.innerHTML = ''; s.innerHTML = vRegistro(); return; }
  const tabs = esDueno() ? TABS_D : TABS_P;
  if (!tabs.some(x => x[0] === UI.tab)) UI.tab = tabs[0][0];
  t.hidden = false; t.style.gridTemplateColumns = `repeat(${tabs.length},1fr)`;
  t.innerHTML = tabs.map(([k, l, i]) => { const b = k === 'hoy' ? q.porConfirmar(N().id).length : 0; return `<button ${act('tab', k)} ${UI.tab === k ? 'aria-current="page"' : ''}>${svg(i)}${l}${b ? `<span class="dot num">${b}</span>` : ''}</button>`; }).join('');
  sel.innerHTML = mems().length > 1 ? `<select data-c="cambiarNeg" aria-label="Negocio" style="max-width:190px;border:1px solid var(--line);border-radius:10px;padding:6px 8px;background:var(--surface)">${mems().map(m => `<option value="${m.neg}" ${m.neg === N().id ? 'selected' : ''}>${esc(q.neg(m.neg).nombre)}</option>`).join('')}</select>` : '';
  const aviso = N().estado === 'pendiente' ? `<div class="panel warn"><b>Tu negocio está en revisión</b><span class="sm">Somar lo revisa en menos de un día. Mientras tanto, agregá tus servicios, horario y cuentas para que esté listo cuando se publique.</span></div>` : N().estado === 'rechazado' ? `<div class="panel bad"><b>Tu solicitud no fue aprobada</b><span class="sm">Escribinos por WhatsApp para revisar los datos.</span></div>` : '';
  if (esDueno() && UI.tab === 'mas' && UI.mas) { s.innerHTML = masSub(UI.mas); if (UI.mas === 'pagina') dibujarQR(); return; }
  s.innerHTML = aviso + ({ hoy: vHoy, agenda: vAgenda, clientes: vClientes, caja: vCaja, mas: vMas, dia: vDia, ganancias: vGanancias, resenas: vResenasPro, cuenta: vCuentaPro })[UI.tab]();
};
window.onDatos = () => { if (!SH) render(); };

/* ---------- Entrar ---------- */
function vLogin() {
  return `<div class="title" style="padding-top:12px"><h1>Panel para negocios</h1><p>Agenda, fila, cobros y clientes de tu barbería, salón o estudio.</p></div>
  <div class="panel">${LOGIN.step === 1 ? `<div class="f"><label for="lTel">Tu número de WhatsApp</label><input id="lTel" data-i="loginTel" inputmode="tel" placeholder="9999-9999" value="${esc(LOGIN.tel)}" autocomplete="tel"><span class="hint">Si sos dueño, profesional o vas a registrar tu negocio.</span></div><button class="btn ink full" ${act('loginCodigo')}>Mandarme el código</button>`
    : `<p class="sm muted">Te mandamos un código al ${telBonito(LOGIN.tel)}.</p>${codigoPrueba(LOGIN.codigo)}<div class="f"><label for="lCode">Código de 6 dígitos</label><input id="lCode" data-i="loginCode" inputmode="numeric" maxlength="6" class="num" autocomplete="one-time-code" value="${esc(LOGIN.codeIn)}"></div><button class="btn ink full" ${act('loginVerificar')}>Entrar</button><button class="link" style="align-self:center" ${act('loginOtro')}>Usar otro número</button>`}</div>
  <p class="sm muted">¿Sos cliente? <a class="link" href="/">Reservá aquí</a></p>`;
}
function vRegistro() {
  F.rg = F.rg || { nombre: '', cat: 'barberia', zona: '', direccion: '', dueno: '' }; const r = F.rg;
  return `<div class="title" style="padding-top:12px"><h1>Registrá tu negocio</h1><p>El número ${telBonito(miTel())} todavía no está en ningún negocio. Completá los datos y Somar lo revisa antes de publicarlo.</p></div>
  <div class="panel"><div class="f"><label for="rgN">Nombre del negocio</label><input id="rgN" data-i="rg" data-k="nombre" value="${esc(r.nombre)}" placeholder="Ej. Divas Salón"></div>
  <div class="f"><label>Tipo de negocio</label><div class="opts">${Object.entries(CAT).map(([k, l]) => `<button class="opt" aria-pressed="${r.cat === k}" ${act('rgCat', k)}><b>${l}</b></button>`).join('')}</div></div>
  <div class="two"><div class="f"><label for="rgZ">Ciudad</label><input id="rgZ" data-i="rg" data-k="zona" value="${esc(r.zona)}" placeholder="Ej. Choloma"></div><div class="f"><label for="rgD">Tu nombre</label><input id="rgD" data-i="rg" data-k="dueno" value="${esc(r.dueno)}" autocomplete="name"></div></div>
  <div class="f"><label for="rgA">Dirección</label><input id="rgA" data-i="rg" data-k="direccion" value="${esc(r.direccion)}" placeholder="Colonia, calle, referencia"></div>
  <button class="btn ink full" ${act('registrar')}>Enviar solicitud</button></div>
  <p class="sm muted">¿Trabajás en un negocio que ya usa Somar Turno? Pedile al dueño que te agregue con tu número en Equipo.</p>
  <button class="btn quiet" style="align-self:flex-start" ${act('salir')}>${svg('out')} Salir</button>`;
}

/* ---------- Filas reutilizables ---------- */
function citaRow(c, p) {
  const st = { reservada: ['a', 'Reservada'], confirmada: ['g', 'Confirmada'], atendida: ['', 'Atendida'], novino: ['r', 'No vino'], cancelada: ['', 'Cancelada'] }[c.estado];
  const cl = q.cli(c.cli), s = q.serv(c.serv), nota = q.nota(c.cli, c.neg);
  const acts = ['reservada', 'confirmada'].includes(c.estado) ? `<div class="row-btns"><button class="btn s good" ${act('cobrar', 'cita', c.id, p || '')}>Atendido</button><button class="btn s" ${act('noVinoCita', c.id)}>No vino</button>${cl.tel ? `<a class="btn s wa" target="_blank" rel="noopener" href="${waLink(cl.tel, `Hola ${first(cl.nombre)}, te recordamos tu cita en ${N().nombre}: ${fLbl(c.fecha).toLowerCase()} a las ${h12(c.hora)} con ${first(q.pro(c.pro).nombre)}.`)}">WhatsApp</a>` : ''}</div>` : '';
  return `<div class="item top-al"><b class="num" style="min-width:66px;font-size:15px">${h12(c.hora)}</b><div class="body" style="gap:8px"><div><div class="l1">${esc(cl.nombre)} <span class="tag ${st[0]}">${st[1]}</span>${cl.cuenta ? '' : ' <span class="tag w">Sin cuenta</span>'}</div><div class="l2">${esc(s.nombre)}, ${p ? '' : esc(first(q.pro(c.pro).nombre)) + ', '}<span class="num">${L(s.precio)}</span></div>${nota ? `<div class="note">${esc(nota)}</div>` : ''}</div>${acts}</div></div>`;
}
function filaRow(f, p) {
  const c = f.cli ? q.cli(f.cli) : null, mins = Math.max(0, nowMin() - h2m(f.hora));
  const tg = !c ? '<span class="tag">En el local</span>' : !c.cuenta ? '<span class="tag w">Sin cuenta</span>' : f.casa ? '<span class="tag a">Desde su casa</span>' : '<span class="tag">En el local</span>';
  let a = '';
  if (f.estado === 'esperando') a = `<button class="btn s ink" ${p ? act('llamar', f.id, p) : act('elegirLlamar', f.id)}>Llamar</button>${p ? '' : `<button class="btn s quiet" ${act('noVinoFila', f.id)}>No vino</button>`}`;
  if (f.estado === 'llamado') a = `<button class="btn s good" ${act('cobrar', 'fila', f.id, p || '')}>Atendido</button><button class="btn s quiet" ${act('noVinoFila', f.id)}>No vino</button>${c && c.tel ? `<a class="btn s wa" target="_blank" rel="noopener" href="${waLink(c.tel, `Hola ${first(c.nombre)}, ya es tu turno ${f.num} en ${N().nombre}. Te esperamos.`)}">WhatsApp</a>` : ''}`;
  return `<div class="item top-al"><span class="tn ${f.estado === 'llamado' ? 'on' : ''}">${f.num}</span><div class="body" style="gap:8px"><div><div class="l1">${esc(q.filaNombre(f))} ${tg}</div><div class="l2">${esc(q.serv(f.serv)?.nombre)}${f.estado === 'llamado' ? `, con ${esc(first(q.pro(f.pro)?.nombre))}` : `${f.pro ? ', prefiere a ' + esc(first(q.pro(f.pro)?.nombre)) : ''}, espera ${mins} min`}</div></div><div class="row-btns">${a}</div></div></div>`;
}
const pagoRow = v => { const cu = N().cuentas.find(c => c.id === v.pago.cuenta); return `<button class="item" ${act('revisarPago', v.id)}><div class="av">${esc(ini(v.cli ? q.cli(v.cli).nombre : 'C'))}</div><div class="body"><div class="l1">${esc(v.cli ? q.cli(v.cli).nombre : 'Cliente')}</div><div class="l2">${cu ? esc(cu.banco) + ', ' : ''}${esc(q.serv(v.serv).nombre)}</div></div><b class="num">${L(v.monto)}</b><span class="chev">›</span></button>`; };

/* ---------- Hoy ---------- */
function vHoy() {
  const n = N(), w = q.esperando(n.id), cl = q.llamados(n.id), pc = q.porConfirmar(n.id), T = hoy();
  const cs = DB.citas.filter(c => c.neg === n.id && c.fecha === T && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const pend = cs.filter(c => ['reservada', 'confirmada'].includes(c.estado)).length;
  const cobrado = DB.visitas.filter(v => v.neg === n.id && v.fecha === T && v.pago.estado === 'pagado').reduce((a, v) => a + v.monto, 0);
  const bajas = DB.cals.filter(x => x.neg === n.id && x.nueva && (x.en <= 2 || x.ep <= 2));
  const falta = [];
  if (!q.servs(n.id).length) falta.push(['servicios', 'Agregá tus servicios y precios']);
  if (!n.cuentas.length) falta.push(['cuentas', 'Agregá una cuenta para recibir transferencias']);
  return `<div class="title"><h1>Hoy</h1><p>${esc(n.nombre)}, ${q.horaHoy(n)}</p></div>
  ${falta.length ? `<div class="panel soft"><b>Terminá de configurar</b>${falta.map(([k, t]) => `<button class="item" style="padding:6px 0;background:none" ${act('irMas', k)}><span class="body"><span class="l1">${t}</span></span><span class="chev">›</span></button>`).join('')}</div>` : ''}
  <div class="stats"><div class="stat"><b>${n.fila ? w.length : pend}</b><span>${n.fila ? 'En fila' : 'Citas pendientes'}</span></div><div class="stat"><b>${n.fila ? pend : pc.length}</b><span>${n.fila ? 'Citas pendientes' : 'Pagos por revisar'}</span></div><div class="stat"><b>${L(cobrado)}</b><span>Cobrado</span></div></div>
  ${bajas.map(x => `<div class="panel bad"><b>Calificación baja de ${esc(q.cli(x.cli)?.nombre)}</b><span class="sm">${x.en} estrellas al negocio y ${x.ep} a ${esc(first(q.pro(x.pro)?.nombre))}. ${esc(x.txt)}</span><div class="row-btns"><button class="btn s" ${act('irMas', 'resenas')}>Ver y responder</button><button class="btn s quiet" ${act('vistaResena', x.id)}>Entendido</button></div></div>`).join('')}
  ${pc.length ? `<div class="sec"><div class="sec-h"><h2>Transferencias por confirmar</h2><span class="tag w num">${pc.length}</span></div><div class="list">${pc.map(pagoRow).join('')}</div><p class="xs faint">Revisá en tu banco que el dinero entró antes de confirmar.</p></div>` : ''}
  ${n.fila ? `<div class="sec"><div class="sec-h"><h2>Fila</h2><div class="row-btns"><a class="btn s" href="/pantalla?n=${esc(n.slug)}" target="_blank" rel="noopener">Pantalla</a><button class="btn s" ${act('agregarFila')}>Agregar</button></div></div><div class="list">${[...cl, ...w].map(f => filaRow(f)).join('') || empty('No hay nadie en la fila.')}</div></div>` : ''}
  <div class="sec"><div class="sec-h"><h2>Citas de hoy</h2><button class="btn s" ${act('nuevaCita')}>Nueva cita</button></div><div class="list">${cs.map(c => citaRow(c)).join('') || empty('No hay citas hoy.')}</div></div>`;
}

/* ---------- Cobro ---------- */
const montoCobro = () => F.canje ? 0 : (F.monto !== null && F.monto !== undefined ? F.monto : q.serv(F.serv).precio);
function hojaCobro() {
  const n = q.neg(F.neg), c = F.cli ? q.cli(F.cli) : null, conC = c && c.cuenta, pts = conC ? q.pts(c.id, n.id) : 0, disp = n.recompensas.filter(r => r.pts <= pts), m = montoCobro();
  const gana = conC && !F.canje ? Math.floor(m / n.lpp) : 0, refB = conC && c.referidoPor && !c.refPagado, tr = F.metodo === 'transferencia';
  let btn = 'Cobrar ' + L(m); if (tr && F.via === 'cliente') btn = 'Pedir comprobante al cliente'; if (tr && F.via === 'negocio') btn = 'Confirmar transferencia de ' + L(m);
  return `${head('Cobrar')}<p class="muted">${c ? esc(c.nombre) + (conC ? `, ${pts} puntos aquí` : ', sin cuenta') : 'Cliente sin registro'}</p>
  <div class="f"><label for="kS">Servicio</label><select id="kS" data-c="cobroServ">${q.servs(n.id).map(s => `<option value="${s.id}" ${s.id === F.serv ? 'selected' : ''}>${esc(s.nombre)}, ${L(s.precio)}</option>`).join('')}</select></div>
  ${F.pfix ? '' : `<div class="f"><label for="kP">Lo atendió</label><select id="kP" data-m="pro">${q.pros(n.id).map(p => `<option value="${p.id}" ${p.id === F.pro ? 'selected' : ''}>${esc(p.nombre)}</option>`).join('')}</select></div>`}
  ${disp.length ? `<div class="f"><label for="kC">Canjear puntos</label><select id="kC" data-m="canje" data-redraw="1"><option value="">No canjear</option>${disp.map(r => `<option value="${r.id}" ${F.canje === r.id ? 'selected' : ''}>${esc(r.nombre)}, ${r.pts} puntos</option>`).join('')}</select></div>` : ''}
  <div class="f"><label for="kM">Monto (L)</label><input id="kM" data-m="monto" data-num="1" data-redraw="1" inputmode="numeric" class="num" value="${m}" ${F.canje ? 'disabled' : ''}></div>
  ${m > 0 ? `<div class="seg" role="group" aria-label="Forma de pago"><button aria-pressed="${!tr}" ${act('setF', 'metodo', 'efectivo')}>Efectivo</button><button aria-pressed="${tr}" ${act('setF', 'metodo', 'transferencia')}>Transferencia</button></div>` : ''}
  ${tr && m > 0 ? `${conC ? `<div class="seg" role="group" aria-label="Quién sube el comprobante"><button aria-pressed="${F.via === 'cliente'}" ${act('setF', 'via', 'cliente')}>Lo sube el cliente</button><button aria-pressed="${F.via === 'negocio'}" ${act('setF', 'via', 'negocio')}>Lo registro yo</button></div>` : ''}
    ${F.via === 'cliente' ? `<p class="sm muted">${esc(first(c.nombre))} recibe un aviso en su app con tus cuentas para subir el comprobante. El cobro queda pendiente hasta que lo confirmés.</p>` :
      n.cuentas.length ? `<div class="f"><label for="kB">Cuenta donde entró</label><select id="kB" data-m="cuenta">${n.cuentas.map(b => `<option value="${b.id}" ${b.id === F.cuenta ? 'selected' : ''}>${esc(b.banco)}, ${esc(b.numero)}</option>`).join('')}</select></div>
      <div class="f"><label for="kR">Referencia</label><input id="kR" data-m="ref" inputmode="numeric" value="${esc(F.ref || '')}" placeholder="Número de la transferencia"></div>
      <label class="upload" for="kF">${F.comp ? `<img class="proof" src="${F.comp}" alt="Comprobante">` : `<b>Foto del comprobante</b><span class="sm muted">Opcional</span>`}<input id="kF" type="file" accept="image/*" data-file="comp"></label>
      <p class="sm muted">Confirmá solo si ya viste el dinero en tu cuenta.</p>` : `<div class="panel warn"><span class="sm">Todavía no agregaste cuentas bancarias.</span>${esDueno() ? `<div><button class="btn s" ${act('irMas', 'cuentas')}>Agregar cuenta</button></div>` : ''}</div>`}` : ''}
  ${conC && !(tr && F.via === 'cliente') ? `<div class="panel soft" style="padding:12px"><span class="sm">Gana <b class="num">${gana}</b> puntos.${refB ? ` Es su primera visita con código de amigo: ${esc(first(c.nombre))} y ${esc(first(q.cli(c.referidoPor)?.nombre))} ganan ${n.ptsRef} puntos extra cada uno.` : ''}</span></div>` : ''}
  <button class="btn good full" ${tr && F.via === 'negocio' && !n.cuentas.length ? 'disabled' : ''} ${act('hacerCobro')}>${btn}</button>`;
}
function hojaPago() {
  const v = DB.visitas.find(x => x.id === F.vid), n = q.neg(v.neg), cu = n.cuentas.find(c => c.id === v.pago.cuenta), c = v.cli ? q.cli(v.cli) : null;
  return `${head('Confirmar transferencia')}
  <div class="panel" style="gap:8px"><div class="sec-h"><b>${esc(c ? c.nombre : 'Cliente')}</b><b class="num" style="font-size:22px">${L(v.monto)}</b></div><span class="sm muted">${esc(q.serv(v.serv).nombre)} con ${esc(first(q.pro(v.pro).nombre))}, ${fLbl(v.fecha).toLowerCase()}</span>${cu ? `<div class="bank">${bankIc(cu.banco)}<div style="min-width:0"><div class="l1">${esc(cu.banco)}</div><div class="acct sm">${esc(cu.numero)}</div></div></div>` : ''}${v.pago.ref ? `<span class="sm">Referencia <b class="num">${esc(v.pago.ref)}</b></span>` : ''}</div>
  ${v.pago.comp ? `<img class="proof" src="${v.pago.comp}" alt="Comprobante enviado por el cliente">` : empty('Sin imagen del comprobante.')}
  ${F.rech ? `<div class="f"><label for="rM">¿Por qué lo rechazás?</label><textarea id="rM" data-m="motivo" placeholder="Ej. El dinero no aparece en la cuenta">${esc(F.motivo || '')}</textarea></div><div class="row-btns"><button class="btn danger" ${act('rechazarPago')}>Rechazar y avisar al cliente</button><button class="btn quiet" ${act('setF', 'rech', '')}>Volver</button></div>`
    : `<p class="sm muted">Revisá en tu banco que el dinero entró. Al confirmar, se suma a la caja y el cliente gana sus puntos.</p><button class="btn good full" ${act('confirmarPago')}>Sí, el dinero entró</button><button class="btn full danger" ${act('setF', 'rech', '1')}>No lo encuentro</button>`}`;
}

/* ---------- Agenda ---------- */
function vAgenda() {
  const n = N(), days = [...Array(14)].map((_, i) => addDays(hoy(), i));
  let cs = DB.citas.filter(c => c.neg === n.id && c.fecha === UI.agDia && c.estado !== 'cancelada'); if (UI.agPro !== 'todos') cs = cs.filter(c => c.pro === UI.agPro); cs.sort((a, b) => a.hora.localeCompare(b.hora));
  const ch = (k, l) => `<button class="chip" aria-pressed="${UI.agPro === k}" ${act('agPro', k)}>${l}</button>`, h = n.horario[new Date(UI.agDia + 'T12:00:00').getDay()];
  return `<div class="sec-h"><h1 style="font-size:28px;font-weight:800">Agenda</h1><button class="btn s ink" ${act('nuevaCita')}>Nueva cita</button></div>
  <div class="days">${days.map(f => { const d = new Date(f + 'T12:00:00'), k = DB.citas.filter(c => c.neg === n.id && c.fecha === f && ['reservada', 'confirmada'].includes(c.estado)).length; return `<button class="day" aria-pressed="${UI.agDia === f}" ${act('agDia', f)}>${f === hoy() ? 'Hoy' : DIAS[d.getDay()]}<b class="num">${d.getDate()}</b><span class="xs num">${k} ${k === 1 ? 'cita' : 'citas'}</span></button>`; }).join('')}</div>
  <div class="chips">${ch('todos', 'Todo el equipo')}${q.pros(n.id).map(p => ch(p.id, esc(first(p.nombre)))).join('')}</div>
  <p class="sm muted">${h ? `Abierto de ${h12(m2h(h[0] * 60))} a ${h12(m2h(h[1] * 60))}.` : 'Cerrado este día.'}</p>
  <div class="list">${cs.map(c => citaRow(c)).join('') || empty('Sin citas este día.')}</div>`;
}
function hojaNuevaCita() {
  const n = N(), cs = q.clientesDe(n.id), sl = q.slots(n.id, F.fecha, q.serv(F.serv).dur, F.pro), days = [...Array(14)].map((_, i) => addDays(hoy(), i));
  return `${head('Nueva cita')}<p class="muted">Para alguien que llamó o escribió.</p>
  <div class="f"><label for="ncC">Cliente</label><select id="ncC" data-m="cli" data-redraw="1"><option value="">Cliente nuevo</option>${cs.map(c => `<option value="${c.id}" ${F.cli === c.id ? 'selected' : ''}>${esc(c.nombre)}</option>`).join('')}</select></div>
  ${F.cli ? '' : `<div class="two"><div class="f"><label for="ncN">Nombre</label><input id="ncN" data-m="nombre" value="${esc(F.nombre || '')}"></div><div class="f"><label for="ncT">WhatsApp</label><input id="ncT" data-m="tel" inputmode="tel" value="${esc(F.tel || '')}"></div></div>`}
  <div class="two"><div class="f"><label for="ncS">Servicio</label><select id="ncS" data-c="ncCambio" data-k="serv">${q.servs(n.id).map(s => `<option value="${s.id}" ${s.id === F.serv ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></div><div class="f"><label for="ncP">Con</label><select id="ncP" data-c="ncCambio" data-k="pro">${q.pros(n.id).map(p => `<option value="${p.id}" ${p.id === F.pro ? 'selected' : ''}>${esc(first(p.nombre))}</option>`).join('')}</select></div></div>
  <div class="days">${days.map(f => { const d = new Date(f + 'T12:00:00'); return `<button class="day" ${n.horario[d.getDay()] ? '' : 'disabled'} aria-pressed="${F.fecha === f}" ${act('ncDia', f)}>${f === hoy() ? 'Hoy' : DIAS[d.getDay()]}<b class="num">${d.getDate()}</b></button>`; }).join('')}</div>
  ${sl.length ? `<div class="slots">${sl.map(x => `<button class="slot" aria-pressed="${F.t === x.t}" ${act('setF', 't', x.t)}>${h12(m2h(x.t))}</button>`).join('')}</div>` : empty('Sin horas libres ese día.')}
  <button class="btn ink full" ${F.t !== null ? '' : 'disabled'} ${act('guardarCita')}>Guardar cita</button>`;
}

/* ---------- Clientes ---------- */
function vClientes() {
  const n = N(), T = hoy();
  let cs = q.clientesDe(n.id).map(c => { const vs = DB.visitas.filter(v => v.cli === c.id && v.neg === n.id).sort((a, b) => b.fecha.localeCompare(a.fecha)); return { c, vs, lv: vs[0], pts: q.pts(c.id, n.id) }; });
  if (UI.cliF === 'extranar') cs = cs.filter(x => x.lv && dBetween(x.lv.fecha, T) >= 30);
  if (UI.cliF === 'sincuenta') cs = cs.filter(x => !x.c.cuenta);
  if (UI.cliQ) cs = cs.filter(x => x.c.nombre.toLowerCase().includes(UI.cliQ.toLowerCase()) || x.c.tel.includes(soloDigitos(UI.cliQ) || '¬'));
  cs.sort((a, b) => (b.lv?.fecha || '').localeCompare(a.lv?.fecha || ''));
  const ch = (k, l) => `<button class="chip" aria-pressed="${UI.cliF === k}" ${act('cliF', k)}>${l}</button>`;
  return `<div class="title"><h1>Clientes</h1><p class="num">${q.clientesDe(n.id).length} clientes</p></div>
  <label class="search">${svg('search')}<input id="cq" data-i="cliBuscar" placeholder="Buscar por nombre o número" value="${esc(UI.cliQ)}" autocomplete="off" aria-label="Buscar cliente"></label>
  <div class="chips">${ch('todos', 'Todos')}${ch('extranar', 'Sin venir hace 30 días')}${ch('sincuenta', 'Sin cuenta')}</div>
  <div class="list">${cs.map(x => `<button class="item" ${act('verCliente', x.c.id)}><div class="av">${esc(ini(x.c.nombre))}</div><div class="body"><div class="l1">${esc(x.c.nombre)}${x.c.cuenta ? '' : ' <span class="tag w">Sin cuenta</span>'}</div><div class="l2 num">${x.vs.length} ${x.vs.length === 1 ? 'visita' : 'visitas'}${x.lv ? `, la última hace ${dBetween(x.lv.fecha, T)} días` : ''}${x.c.cuenta ? `, ${x.pts} puntos` : ''}</div></div><span class="chev">›</span></button>`).join('') || empty(UI.cliQ || UI.cliF !== 'todos' ? 'Nadie con ese filtro.' : 'Tus clientes aparecen aquí cuando reservan, toman turno o los atendés.')}</div>`;
}
function hojaCliente() {
  const n = N(), c = q.cli(F.cid), vs = DB.visitas.filter(v => v.cli === c.id && v.neg === n.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const msg = `Hola ${first(c.nombre)}, hace rato no te vemos por ${n.nombre}. Reservá tu próxima cita aquí: ${CONFIG.URL}/${n.slug}`;
  return `${head(esc(c.nombre))}<div class="stats"><div class="stat"><b>${vs.length}</b><span>Visitas</span></div><div class="stat"><b>${L(vs.filter(v => v.pago.estado === 'pagado').reduce((a, v) => a + v.monto, 0))}</b><span>Gastado</span></div><div class="stat"><b>${c.cuenta ? q.pts(c.id, n.id) : '—'}</b><span>Puntos</span></div></div>
  <div class="sm muted num">+504 ${telBonito(c.tel)}${c.cuenta ? '' : ', no tiene cuenta en la app'}</div>
  <div class="f"><label for="cn">Notas para el equipo</label><textarea id="cn" data-i="notaCliente" placeholder="Ej. fade bajo, tinte 6.1, uñas almendradas">${esc(q.nota(c.id, n.id))}</textarea></div>
  ${c.tel ? `<div class="row-btns"><a class="btn wa" target="_blank" rel="noopener" href="${waLink(c.tel, msg)}">Invitar a volver</a></div><p class="xs faint">Se abre WhatsApp con el mensaje escrito. Vos lo enviás.</p>` : ''}
  <div class="list">${vs.map(v => `<div class="item"><div class="body"><div class="l1">${esc(q.serv(v.serv).nombre)}</div><div class="l2">${fLbl(v.fecha)}, ${esc(first(q.pro(v.pro).nombre))}, ${v.pago.metodo}</div></div><b class="num">${L(v.monto)}</b></div>`).join('') || empty('Sin visitas todavía.')}</div>`;
}

/* ---------- Caja ---------- */
function vCaja() {
  const n = N(), T = hoy(), all = DB.visitas.filter(v => v.neg === n.id && v.fecha === T).sort((a, b) => b.hora.localeCompare(a.hora)), vs = all.filter(v => v.pago.estado === 'pagado');
  const tot = vs.reduce((a, v) => a + v.monto, 0), ef = vs.filter(v => v.pago.metodo === 'efectivo').reduce((a, v) => a + v.monto, 0);
  const pend = all.filter(v => v.pago.estado !== 'pagado'), pendT = pend.reduce((a, v) => a + v.monto, 0);
  const rows = q.pros(n.id).map(p => { const m = vs.filter(v => v.pro === p.id), s = m.reduce((a, v) => a + v.monto, 0); return { p, k: m.length, s, c: Math.round(s * p.com / 100) }; }), com = rows.reduce((a, r) => a + r.c, 0);
  const est = v => ({ pagado: '', por_comprobante: ' <span class="tag w">Falta comprobante</span>', por_confirmar: ' <span class="tag a">Por confirmar</span>', rechazado: ' <span class="tag r">Rechazado</span>' })[v.pago.estado];
  return `<div class="title"><h1>Caja de hoy</h1><p class="num">${vs.length} cobros confirmados</p></div>
  <div class="stats"><div class="stat"><b>${L(tot)}</b><span>Total</span></div><div class="stat"><b>${L(ef)}</b><span>Efectivo</span></div><div class="stat"><b>${L(tot - ef)}</b><span>Transferencias</span></div></div>
  ${pend.length ? `<div class="panel warn"><span class="sm"><b class="num">${L(pendT)}</b> en ${pend.length} ${pend.length === 1 ? 'transferencia pendiente' : 'transferencias pendientes'}. No se suman hasta que las confirmés.</span></div>` : ''}
  <div class="panel"><div class="sec-h"><h2>Por profesional</h2></div><div class="tbl"><table><thead><tr><th>Nombre</th><th class="r">Servicios</th><th class="r">Cobrado</th><th class="r">Comisión</th></tr></thead><tbody>${rows.map(r => `<tr><td>${esc(first(r.p.nombre))} <span class="faint xs">${r.p.com}%</span></td><td class="r">${r.k}</td><td class="r">${L(r.s)}</td><td class="r">${L(r.c)}</td></tr>`).join('')}<tr><td><b>Para el negocio</b></td><td></td><td></td><td class="r"><b>${L(tot - com)}</b></td></tr></tbody></table></div></div>
  <div class="sec"><div class="sec-h"><h2>Movimientos</h2></div><div class="list">${all.map(v => `<div class="item"><div class="body"><div class="l1">${esc(q.serv(v.serv).nombre)}, ${esc(v.cli ? q.cli(v.cli).nombre : 'Cliente en el local')}</div><div class="l2">${h12(v.hora)}, ${esc(first(q.pro(v.pro).nombre))}, ${v.pago.metodo}${v.canje ? ', canje' : ''}${est(v)}</div></div><b class="num">${L(v.monto)}</b></div>`).join('') || empty('Todavía no hay cobros hoy.')}</div></div>
  ${n.cajaCerrada === T ? '<div class="panel soft"><b>Caja cerrada</b><span class="sm">Los cobros nuevos de hoy se suman al cierre.</span></div>' : `<button class="btn ink full" ${act('cerrarCaja')}>Cerrar caja de hoy</button>`}`;
}

/* ---------- Más ---------- */
function vMas() {
  const n = N(), r = q.negRt(n.id);
  const it = (k, t, s) => `<button class="item" ${act('irMas', k)}><div class="body"><div class="l1">${t}</div><div class="l2">${s}</div></div><span class="chev">›</span></button>`;
  return `<div class="title"><h1>Más</h1></div>
  <div class="list">${it('pagina', 'Mi página y código QR', CONFIG.URL.replace('https://', '') + '/' + n.slug)}${it('horario', 'Horario', [1, 2, 3, 4, 5, 6, 0].filter(d => n.horario[d]).length + ' días a la semana')}${it('cuentas', 'Cuentas para transferencias', n.cuentas.length ? n.cuentas.map(c => c.banco).join(', ') : 'Sin cuentas')}${it('fila', 'Fila', n.fila ? 'Activa' + (n.filaCasa ? ', también desde la casa' : ', solo en el local') : 'Apagada')}${it('servicios', 'Servicios y precios', q.servs(n.id).length + ' servicios')}${it('equipo', 'Equipo y comisiones', q.pros(n.id).length + ' profesionales')}${it('puntos', 'Puntos y recompensas', `1 punto por cada ${L(n.lpp)}, ${n.ptsRef} por amigo`)}${it('resenas', 'Reseñas', r.n ? `${r.v.toFixed(1)} estrellas, ${r.n} calificaciones` : 'Sin calificaciones')}${it('plan', 'Mi plan', 'Plan ' + n.plan)}</div>
  <div class="list">${it('registro', 'Registrar otro negocio', 'Con este mismo número')}</div>
  <button class="btn quiet" style="align-self:flex-start" ${act('salir')}>${svg('out')} Cerrar sesión</button>`;
}
function masSub(k) {
  const n = N(), back = `<button class="link" style="align-self:flex-start" ${act('cerrarMas')}>‹ Más</button>`, h1 = (t, b) => `<div class="sec-h"><h1 style="font-size:28px;font-weight:800">${t}</h1>${b || ''}</div>`;
  if (k === 'pagina') return `${back}<div class="title"><h1>Mi página y código QR</h1><p>Imprimí el código y pegalo en la puerta y en el espejo.</p></div>
  <div class="panel" style="align-items:center;text-align:center"><div class="qr" id="qrBox" role="img" aria-label="Código QR de ${esc(n.nombre)}"></div><b>${esc(n.nombre)}</b><span class="sm muted">Escaneá para reservar${n.fila ? ' o tomar turno' : ''}</span><span class="sm acct">${CONFIG.URL.replace('https://', '')}/${esc(n.slug)}</span><div class="row-btns"><button class="btn s" ${act('copy', CONFIG.URL + '/' + n.slug)}>Copiar enlace</button><a class="btn s" href="/${esc(n.slug)}" target="_blank" rel="noopener">Ver como cliente</a></div></div>
  <div class="f"><label for="pNom">Nombre</label><input id="pNom" data-c="negCampo" data-k="nombre" value="${esc(n.nombre)}"></div>
  <div class="f"><label for="pDir">Dirección</label><input id="pDir" data-c="negCampo" data-k="direccion" value="${esc(n.direccion)}"></div>
  <div class="two"><div class="f"><label for="pZon">Ciudad</label><input id="pZon" data-c="negCampo" data-k="zona" value="${esc(n.zona)}"></div><div class="f"><label for="pTel">WhatsApp</label><input id="pTel" data-c="negCampo" data-k="tel" inputmode="tel" value="${esc(telBonito(n.tel))}"></div></div>`;
  if (k === 'horario') { const hrs = [...Array(17)].map((_, i) => i + 6), sel = (d, i, v) => `<select data-c="hora" data-d="${d}" data-i2="${i}" aria-label="${i ? 'Cierra' : 'Abre'} ${DIAS_L[d]}" style="border:1px solid var(--line);border-radius:10px;padding:6px;background:var(--surface)">${hrs.map(x => `<option value="${x}" ${x === v ? 'selected' : ''}>${h12(m2h(x * 60))}</option>`).join('')}</select>`;
    return `${back}<div class="title"><h1>Horario</h1><p>Los clientes solo pueden reservar dentro de este horario.</p></div><div class="panel">${[1, 2, 3, 4, 5, 6, 0].map(d => { const h = n.horario[d]; return `<div class="sw" style="flex-wrap:wrap"><div style="display:flex;align-items:center;gap:10px;min-width:130px"><button class="switch" role="switch" aria-checked="${!!h}" aria-label="Abre el ${DIAS_L[d]}" ${act('diaAbierto', d)}></button><b class="sm">${DIAS_L[d]}</b></div>${h ? `<div style="display:flex;gap:6px;align-items:center" class="sm">${sel(d, 0, h[0])}<span>a</span>${sel(d, 1, h[1])}</div>` : '<span class="sm muted">Cerrado</span>'}</div>`; }).join('<div class="hr"></div>')}</div>`; }
  if (k === 'cuentas') return `${back}${h1('Cuentas', `<button class="btn s ink" ${act('editCuenta')}>Agregar</button>`)}<p class="muted">Tus clientes las ven al pagar por transferencia desde la app. Cada pago queda pendiente hasta que confirmés que el dinero entró.</p>
  <div class="list">${n.cuentas.map(c => `<button class="item" ${act('editCuenta', c.id)}><div class="bank" style="flex:1;min-width:0">${bankIc(c.banco)}<div style="min-width:0"><div class="l1">${esc(c.banco)}, ${esc(c.tipo.toLowerCase())}</div><div class="acct sm">${esc(c.numero)}</div><div class="xs muted">${esc(c.titular)}</div></div></div><span class="chev">›</span></button>`).join('') || empty('Agregá tu primera cuenta para recibir transferencias.')}</div>`;
  if (k === 'fila') return `${back}<div class="title"><h1>Fila</h1><p>Turnos por orden de llegada. Útil en barberías; los salones suelen trabajar solo con cita.</p></div>
  <div class="panel"><div class="sw"><div><b>Usar fila</b><div class="sm muted">Los clientes pueden tomar turno.</div></div><button class="switch" role="switch" aria-checked="${n.fila}" aria-label="Usar fila" ${act('toggleNeg', 'fila')}></button></div>
  ${n.fila ? `<div class="hr"></div><div class="sw"><div><b>Tomar turno desde la casa</b><div class="sm muted">Si está apagado, solo se puede escaneando el código en el local.</div></div><button class="switch" role="switch" aria-checked="${n.filaCasa}" aria-label="Turno desde la casa" ${act('toggleNeg', 'filaCasa')}></button></div>` : ''}</div>
  ${n.fila ? `<a class="btn full" href="/pantalla?n=${esc(n.slug)}" target="_blank" rel="noopener">Abrir la pantalla para la tele del local</a><p class="sm muted">El código QR de la puerta para la fila es ${CONFIG.URL.replace('https://', '')}/${esc(n.slug)}?local=1</p>` : ''}`;
  if (k === 'servicios') return `${back}${h1('Servicios', `<button class="btn s ink" ${act('editServ')}>Agregar</button>`)}<div class="list">${q.servs(n.id).map(s => `<button class="item" ${act('editServ', s.id)}><div class="body"><div class="l1">${esc(s.nombre)}</div><div class="l2 num">${s.dur} min</div></div><b class="num">${L(s.precio)}</b><span class="chev">›</span></button>`).join('') || empty('Agregá lo que ofrecés, con precio y duración.')}</div>`;
  if (k === 'equipo') return `${back}${h1('Equipo', `<button class="btn s ink" ${act('editPro')}>Agregar</button>`)}<p class="muted">Cada profesional entra a su propio panel con su número de WhatsApp.</p>
  <div class="list">${q.pros(n.id).map(p => `<button class="item" ${act('editPro', p.id)}><div class="av">${esc(ini(p.nombre))}</div><div class="body"><div class="l1">${esc(p.nombre)}</div><div class="l2">${esc(p.rol)}, comisión ${p.com}%${p.tel ? ', ' + telBonito(p.tel) : ''}</div><div class="l2">${rtTxt(q.proRt(p.id), 5)}</div></div><span class="chev">›</span></button>`).join('')}</div>`;
  if (k === 'puntos') return `${back}<div class="title"><h1>Puntos y recompensas</h1><p>Tus clientes con cuenta los ven en su app.</p></div>
  <div class="panel"><div class="two"><div class="f"><label for="bL">1 punto por cada (L)</label><input id="bL" data-c="negNum" data-k="lpp" inputmode="numeric" class="num" value="${n.lpp}"></div><div class="f"><label for="bR">Puntos por amigo</label><input id="bR" data-c="negNum" data-k="ptsRef" inputmode="numeric" class="num" value="${n.ptsRef}"></div></div>${q.servs(n.id)[0] ? `<p class="sm muted num">Así, ${esc(q.servs(n.id)[0].nombre.toLowerCase())} de ${L(q.servs(n.id)[0].precio)} da ${Math.floor(q.servs(n.id)[0].precio / n.lpp)} puntos.</p>` : ''}</div>
  <div class="sec"><div class="sec-h"><h2>Recompensas</h2><button class="btn s ink" ${act('editRec')}>Agregar</button></div><div class="list">${n.recompensas.map(r => `<div class="item"><div class="body"><div class="l1">${esc(r.nombre)}</div><div class="l2 num">${r.pts} puntos</div></div><button class="btn s quiet" ${act('quitarRec', r.id)}>Quitar</button></div>`).join('') || empty('Sin recompensas. Agregá por ejemplo: corte gratis por 100 puntos.')}</div></div>`;
  if (k === 'resenas') { const qs = DB.cals.filter(x => x.neg === n.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), r = q.negRt(n.id);
    return `${back}<div class="title"><h1>Reseñas</h1><p class="num">${r.n ? `${r.v.toFixed(1)} estrellas en promedio, ${r.n} calificaciones` : 'Todavía no hay calificaciones'}</p></div>
    <div class="list">${qs.map(x => `<div class="item top-al"><div class="av">${esc(ini(q.cli(x.cli)?.nombre))}</div><div class="body" style="gap:6px"><div class="l1">${esc(q.cli(x.cli)?.nombre)} ${x.nueva ? '<span class="tag r">Nueva</span>' : ''}</div><div class="l2">Negocio <span class="star">${stars(x.en)}</span>, ${esc(first(q.pro(x.pro)?.nombre))} <span class="star">${stars(x.ep)}</span>, ${fLbl(x.fecha).toLowerCase()}</div>${x.txt ? `<div>${esc(x.txt)}</div>` : ''}${x.resp ? `<div class="reply"><b>Tu respuesta:</b> ${esc(x.resp)}</div>` : `<div class="row-btns"><button class="btn s" ${act('responder', x.id)}>Responder</button>${x.reportada ? '<span class="tag w">Reportada a Somar</span>' : `<button class="btn s quiet" ${act('reportar', x.id)}>Reportar</button>`}</div>`}</div></div>`).join('') || empty('Cuando tus clientes califiquen, aparecen aquí.')}</div>`; }
  if (k === 'plan') return `${back}<div class="title"><h1>Mi plan</h1><p>Estás en el plan ${n.plan}. Para cambiarlo, escribinos por WhatsApp.</p></div>${CONFIG.PLANES.map(p => `<div class="panel" style="${p.k === n.plan ? 'border:2px solid var(--accent)' : ''}"><div class="sec-h"><h2>${p.k}</h2><b class="num" style="font-size:20px">${L(p.p)}<span class="sm muted" style="font-weight:500"> al mes</span></b></div><ul style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:3px" class="sm">${p.f.map(x => `<li>${x}</li>`).join('')}</ul></div>`).join('')}`;
  if (k === 'registro') return `${back}${vRegistro().replace(/<button class="btn quiet"[^]*$/, '')}`;
}
function dibujarQR() { const b = document.getElementById('qrBox'); if (!b) return; b.innerHTML = ''; try { if (window.QRCode) new QRCode(b, { text: CONFIG.URL + '/' + N().slug, width: 164, height: 164, colorDark: '#16181D', colorLight: '#ffffff' }); else b.innerHTML = '<span class="sm" style="color:#16181D">Código no disponible sin conexión</span>'; } catch (e) { } }

/* ---------- Profesional ---------- */
function vDia() {
  const p = yo(), n = N(), T = hoy();
  const vs = DB.visitas.filter(v => v.pro === p.id && v.fecha === T && v.pago.estado === 'pagado'), s = vs.reduce((a, v) => a + v.monto, 0);
  const cs = DB.citas.filter(c => c.pro === p.id && c.fecha === T && c.estado !== 'cancelada').sort((a, b) => a.hora.localeCompare(b.hora));
  const cur = q.llamados(n.id).filter(f => f.pro === p.id), w = q.esperando(n.id).filter(f => !f.pro || f.pro === p.id), nx = w[0], r = q.proRt(p.id);
  return `<div class="title"><h1>Hola, ${esc(first(p.nombre))}</h1><p>${esc(p.rol)} en ${esc(n.nombre)}${p.com ? `, comisión ${p.com}%` : ''}</p></div>
  <div class="stats"><div class="stat"><b>${vs.length}</b><span>Atendidos hoy</span></div><div class="stat"><b>${L(p.com ? Math.round(s * p.com / 100) : s)}</b><span>${p.com ? 'Tu comisión' : 'Cobrado'}</span></div><div class="stat"><b>${r.n ? r.v.toFixed(1) : '—'}</b><span>Tu calificación</span></div></div>
  ${n.fila ? `${cur.length ? `<div class="sec"><div class="sec-h"><h2>Atendiendo ahora</h2></div><div class="list">${cur.map(f => filaRow(f, p.id)).join('')}</div></div>` : ''}
  <div class="sec"><div class="sec-h"><h2>Fila para vos</h2><span class="sm muted num">${w.length} esperando</span></div>${nx && !cur.length ? `<button class="btn ink full" ${act('llamar', nx.id, p.id)}>Llamar al siguiente: ${nx.num}, ${esc(q.filaNombre(nx))}</button>` : ''}
  <div class="list">${w.map(f => filaRow(f, p.id)).join('') || empty('Nadie esperando por vos.')}</div><p class="xs faint">Ves a quienes te eligieron y a quienes aceptan al primero libre.</p></div>` : ''}
  <div class="sec"><div class="sec-h"><h2>Mis citas de hoy</h2></div><div class="list">${cs.map(c => citaRow(c, p.id)).join('') || empty('No tenés citas hoy.')}</div></div>`;
}
function vGanancias() {
  const p = yo(), pc = p.com || 100, days = [...Array(7)].map((_, i) => addDays(hoy(), -i));
  const rows = days.map(f => { const vs = DB.visitas.filter(v => v.pro === p.id && v.fecha === f && v.pago.estado === 'pagado'), s = vs.reduce((a, v) => a + v.monto, 0); return { f, c: Math.round(s * pc / 100) }; });
  const tot = rows.reduce((a, r) => a + r.c, 0), mx = Math.max(1, ...rows.map(r => r.c));
  return `<div class="title"><h1>Ganancias</h1><p>${p.com ? `Tu comisión es el ${p.com}% de lo cobrado` : 'Todo lo cobrado por tus servicios'}</p></div>
  <div class="stats" style="grid-template-columns:1fr 1fr"><div class="stat"><b>${L(rows[0].c)}</b><span>Hoy</span></div><div class="stat"><b>${L(tot)}</b><span>Últimos 7 días</span></div></div>
  <div class="panel"><div class="sec-h"><h2>Por día</h2></div>${rows.map(r => `<div style="display:grid;grid-template-columns:74px 1fr 76px;gap:10px;align-items:center" class="sm"><span>${fLbl(r.f)}</span><div class="bar" style="height:10px"><i style="width:${r.c / mx * 100}%"></i></div><span class="num r">${L(r.c)}</span></div>`).join('')}</div>
  <div class="sec"><div class="sec-h"><h2>Servicios de hoy</h2></div><div class="list">${DB.visitas.filter(v => v.pro === p.id && v.fecha === hoy()).map(v => `<div class="item"><div class="body"><div class="l1">${esc(q.serv(v.serv).nombre)}</div><div class="l2">${esc(v.cli ? q.cli(v.cli).nombre : 'Cliente en el local')}, ${h12(v.hora)}${v.pago.estado !== 'pagado' ? ', pago pendiente' : ''}</div></div><b class="num">${L(Math.round(v.monto * pc / 100))}</b></div>`).join('') || empty('Sin servicios hoy.')}</div></div>`;
}
function vResenasPro() {
  const p = yo(), qs = DB.cals.filter(x => x.pro === p.id).sort((a, b) => b.fecha.localeCompare(a.fecha)), r = q.proRt(p.id), dist = [5, 4, 3, 2, 1].map(s => ({ s, k: qs.filter(x => x.ep === s).length }));
  return `<div class="title"><h1>Mis reseñas</h1></div>
  <div class="panel"><div style="display:flex;gap:18px;align-items:center"><div style="text-align:center;min-width:86px"><b class="num" style="font-size:40px;line-height:1;letter-spacing:-.03em">${r.n ? r.v.toFixed(1) : '—'}</b><div class="star">${stars(r.v)}</div><div class="xs muted num">${r.n} calificaciones</div></div>
  <div style="flex:1;display:flex;flex-direction:column;gap:5px">${dist.map(d => `<div style="display:grid;grid-template-columns:12px 1fr 20px;gap:8px;align-items:center" class="xs num"><span>${d.s}</span><div class="bar" style="height:7px"><i style="width:${r.n ? d.k / r.n * 100 : 0}%;background:#E0A100"></i></div><span class="r">${d.k}</span></div>`).join('')}</div></div>${r.n < 5 ? '<p class="sm muted">Tu promedio se muestra a los clientes desde 5 calificaciones.</p>' : ''}</div>
  <div class="list">${qs.map(x => `<div class="item top-al"><div class="body"><div class="l1"><span class="star">${stars(x.ep)}</span> ${esc(first(q.cli(x.cli)?.nombre))}</div><div class="l2">${fLbl(x.fecha)}</div>${x.txt ? `<div class="sm">${esc(x.txt)}</div>` : ''}</div></div>`).join('') || empty('Todavía no tenés calificaciones.')}</div>`;
}
const vCuentaPro = () => `<div class="title"><h1>${esc(yo().nombre)}</h1><p>${esc(yo().rol)} en ${esc(N().nombre)}, +504 ${telBonito(miTel())}</p></div><button class="btn" style="align-self:flex-start" ${act('salir')}>${svg('out')} Cerrar sesión</button>`;

/* ---------- Hojas de edición ---------- */
const hojaServ = () => `${head(F.id ? 'Editar servicio' : 'Nuevo servicio')}<div class="f"><label for="esN">Nombre</label><input id="esN" data-m="nombre" value="${esc(F.nombre)}" placeholder="Ej. Corte clásico"></div><div class="two"><div class="f"><label for="esP">Precio (L)</label><input id="esP" data-m="precio" data-num="1" inputmode="numeric" class="num" value="${F.precio}"></div><div class="f"><label for="esD">Duración</label><select id="esD" data-m="dur" data-num="1">${[15, 20, 30, 40, 45, 60, 75, 90, 120, 150, 180].map(m => `<option value="${m}" ${m === F.dur ? 'selected' : ''}>${m} min</option>`).join('')}</select></div></div><div class="row-btns"><button class="btn ink" ${act('guardarServ')}>Guardar</button>${F.id ? `<button class="btn danger" ${act('quitarServ')}>Quitar servicio</button>` : ''}</div>`;
const hojaPro = () => `${head(F.id ? 'Editar profesional' : 'Nuevo profesional')}<div class="f"><label for="epN">Nombre</label><input id="epN" data-m="nombre" value="${esc(F.nombre)}"></div><div class="two"><div class="f"><label for="epR">Puesto</label><select id="epR" data-m="rol">${ROLES.map(r => `<option ${r === F.rol ? 'selected' : ''}>${r}</option>`).join('')}</select></div><div class="f"><label for="epC">Comisión (%)</label><input id="epC" data-m="com" data-num="1" inputmode="numeric" class="num" value="${F.com}"></div></div><div class="f"><label for="epT">WhatsApp</label><input id="epT" data-m="tel" inputmode="tel" value="${esc(F.tel)}" placeholder="9999-9999"><span class="hint">Con este número entra a su panel para ver su agenda y comisiones.</span></div><div class="row-btns"><button class="btn ink" ${act('guardarPro')}>Guardar</button>${F.id && F.tel !== N().duenoTel ? `<button class="btn danger" ${act('quitarPro')}>Quitar del equipo</button>` : ''}</div>`;
const hojaCuenta = () => `${head(F.id ? 'Editar cuenta' : 'Nueva cuenta')}<div class="f"><label for="ecB">Banco o billetera</label><select id="ecB" data-m="banco">${Object.keys(BANK_COLOR).map(b => `<option ${b === F.banco ? 'selected' : ''}>${b}</option>`).join('')}</select></div><div class="two"><div class="f"><label for="ecT">Tipo</label><select id="ecT" data-m="tipo">${['Ahorro', 'Cheques', 'Billetera'].map(t => `<option ${t === F.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></div><div class="f"><label for="ecN">Número</label><input id="ecN" data-m="numero" inputmode="numeric" class="num" value="${esc(F.numero)}"></div></div><div class="f"><label for="ecH">A nombre de</label><input id="ecH" data-m="titular" value="${esc(F.titular)}"></div><div class="row-btns"><button class="btn ink" ${act('guardarCuenta')}>Guardar</button>${F.id ? `<button class="btn danger" ${act('quitarCuenta')}>Quitar cuenta</button>` : ''}</div>`;

/* ---------- Acciones ---------- */
Object.assign(A, {
  tab(k) { UI.tab = k; UI.mas = null; render(); scrollTo(0, 0); },
  loginTel(v) { LOGIN.tel = v; }, loginCode(v) { LOGIN.codeIn = v; },
  async loginCodigo() { LOGIN.codigo = await api.enviarCodigo(LOGIN.tel); LOGIN.step = 2; LOGIN.codeIn = ''; render(); },
  loginOtro() { LOGIN.step = 1; render(); },
  async loginVerificar() { await api.verificarCodigo(LOGIN.tel, LOGIN.codeIn); LOGIN.step = 1; LOGIN.codeIn = ''; UI.tab = null; render(); scrollTo(0, 0); },
  salir() { ask('Cerrar sesión', 'Para volver a entrar te pedimos un código por WhatsApp.', 'Cerrar sesión', () => { ses.cerrar(); localStorage.removeItem(NEG_KEY); render(); }); },
  cambiarNeg(id) { localStorage.setItem(NEG_KEY, id); UI.tab = null; UI.mas = null; render(); },
  rg(v, el) { F.rg = F.rg || {}; F.rg[el.dataset.k] = v; },
  rgCat(k) { F.rg.cat = k; render(); },
  async registrar() {
    const n = await api.registrarNegocio(Object.assign({}, F.rg, { tel: miTel(), duenoTel: miTel() }));
    F.rg = null; localStorage.setItem(NEG_KEY, n.id); UI.tab = 'mas'; UI.mas = 'servicios'; render(); scrollTo(0, 0);
    toast('Solicitud enviada. Mientras tanto, agregá tus servicios.');
  },
  irMas(k) { closeSheet(); UI.tab = 'mas'; UI.mas = k; render(); scrollTo(0, 0); },
  cerrarMas() { UI.mas = null; render(); },
  async vistaResena(id) { await api.vistaResena(id); render(); },
  elegirLlamar(fid) {
    const f = DB.fila.find(x => x.id === fid);
    openSheet(() => `${head('Llamar el turno ' + f.num)}<p class="muted">${esc(q.filaNombre(f))}, ${esc(q.serv(f.serv)?.nombre)}${f.pro ? ', prefiere a ' + esc(first(q.pro(f.pro)?.nombre)) : ''}</p><div class="opts">${q.pros(f.neg).map(p => { const ocupado = q.llamados(f.neg).some(x => x.pro === p.id); return `<button class="opt" aria-pressed="${f.pro === p.id}" ${act('llamar', f.id, p.id)}><b>${esc(first(p.nombre))}</b><span class="sm muted">${ocupado ? 'Atendiendo' : 'Libre'}</span></button>`; }).join('')}</div>`);
  },
  async llamar(fid, pid) { const f = await api.llamar(fid, pid); closeSheet(); toast(`Turno ${f.num} llamado`); render(); },
  async noVinoFila(id) { const f = await api.noVinoFila(id); toast(`Turno ${f.num} marcado como no vino`); render(); },
  async noVinoCita(id) { await api.noVinoCita(id); toast('Cita marcada como no vino'); render(); },
  agregarFila() { F = { nombre: '', serv: q.servs(N().id)[0]?.id }; if (!F.serv) return A.irMas('servicios'); openSheet(() => `${head('Agregar a la fila')}<p class="muted">Para quien llegó al local sin la app.</p><div class="f"><label for="afN">Nombre</label><input id="afN" data-m="nombre" placeholder="Ej. Don Rigo" value="${esc(F.nombre)}"></div><div class="f"><label for="afS">Servicio</label><select id="afS" data-m="serv">${q.servs(N().id).map(s => `<option value="${s.id}" ${s.id === F.serv ? 'selected' : ''}>${esc(s.nombre)}</option>`).join('')}</select></div><button class="btn ink full" ${act('confirmarFila')}>Darle turno</button>`); },
  async confirmarFila() { const f = await api.tomarTurno({ neg: N().id, nombre: F.nombre.trim() || 'Cliente en el local', serv: F.serv }); closeSheet(); toast('Turno ' + f.num + ' agregado'); render(); },
  cobrar(kind, id, pfix) {
    const o = kind === 'cita' ? DB.citas.find(x => x.id === id) : DB.fila.find(x => x.id === id), c = o.cli ? q.cli(o.cli) : null;
    F = { kind, id, neg: o.neg, cli: o.cli, pro: pfix || o.pro || q.pros(o.neg)[0].id, serv: o.serv, monto: null, metodo: 'efectivo', via: c && c.cuenta ? 'cliente' : 'negocio', canje: '', cuenta: q.neg(o.neg).cuentas[0]?.id || '', ref: '', comp: null, pfix: !!pfix };
    openSheet(hojaCobro);
  },
  cobroServ(v) { F.serv = v; F.monto = null; drawSheet(); },
  setF(k, v) { F[k] = k === 't' ? +v : k === 'rech' ? !!v : v; drawSheet(); },
  async hacerCobro() {
    const m = montoCobro(), tr = F.metodo === 'transferencia' && m > 0;
    await api.cobrar({ kind: F.kind, id: F.id, pro: F.pro, serv: F.serv, monto: m, metodo: F.metodo, via: F.via, canje: F.canje, cuenta: F.cuenta, ref: F.ref, comp: F.comp });
    closeSheet(); toast(tr && F.via === 'cliente' ? 'Esperando el comprobante del cliente' : 'Cobrado ' + L(m) + (tr ? ' por transferencia' : m ? ' en efectivo' : '')); render();
  },
  revisarPago(vid) { F = { vid, motivo: '', rech: false }; openSheet(hojaPago); },
  async confirmarPago() { await api.confirmarPago(F.vid); closeSheet(); toast('Transferencia confirmada'); render(); },
  async rechazarPago() { await api.rechazarPago(F.vid, F.motivo); closeSheet(); toast('Comprobante rechazado. Le avisamos al cliente.'); render(); },
  nuevaCita() { const n = N(); if (!q.servs(n.id).length) return A.irMas('servicios'); F = { cli: '', nombre: '', tel: '', serv: q.servs(n.id)[0].id, pro: q.pros(n.id)[0].id, fecha: hoy(), t: null }; openSheet(hojaNuevaCita); },
  ncCambio(v, el) { F[el.dataset.k] = v; F.t = null; drawSheet(); },
  ncDia(f) { F.fecha = f; F.t = null; drawSheet(); },
  async guardarCita() { await api.citaManual({ neg: N().id, cliId: F.cli, nombre: F.nombre, tel: F.tel, pro: F.pro, serv: F.serv, fecha: F.fecha, t: F.t }); closeSheet(); toast('Cita guardada'); render(); },
  agDia(f) { UI.agDia = f; render(); }, agPro(p) { UI.agPro = p; render(); }, cliF(k) { UI.cliF = k; render(); },
  cliBuscar(v) { UI.cliQ = v; keepFocus('cq', render); },
  verCliente(id) { F = { cid: id }; openSheet(hojaCliente); },
  notaCliente(v) { clearTimeout(A._nt); A._nt = setTimeout(() => api.nota(F.cid, N().id, v), 400); },
  cerrarCaja() { const n = N(), vs = DB.visitas.filter(v => v.neg === n.id && v.fecha === hoy() && v.pago.estado === 'pagado'), t = vs.reduce((a, v) => a + v.monto, 0); ask('Cerrar caja de hoy', `Total confirmado ${L(t)}. Las transferencias pendientes se suman cuando las confirmés.`, 'Cerrar caja', async () => { await api.cerrarCaja(n.id); toast('Caja cerrada'); render(); }); },
  async negCampo(v, el) { const k = el.dataset.k; if (k === 'nombre' && v.trim().length < 3) return toast('El nombre es muy corto'); await api.actualizarNegocio(N().id, { [k]: k === 'tel' ? soloDigitos(v).slice(-8) : v.trim() }); toast('Guardado'); },
  async negNum(v, el) { const k = el.dataset.k; await api.actualizarNegocio(N().id, { [k]: Math.max(k === 'lpp' ? 1 : 0, parseInt(v) || 0) }); render(); },
  async toggleNeg(k) { await api.actualizarNegocio(N().id, { [k]: !N()[k] }); render(); },
  async diaAbierto(d) { await api.horario(N().id, d, N().horario[d] ? null : [9, 18]); render(); },
  async hora(v, el) { const d = el.dataset.d, i = +el.dataset.i2, h = N().horario[d].slice(); h[i] = +v; if (h[1] <= h[0]) return toast('La hora de cierre debe ser después de la de apertura'), render(); await api.horario(N().id, d, h); render(); },
  editServ(id) { const s = id ? q.serv(id) : null; F = { id: id || '', nombre: s ? s.nombre : '', precio: s ? s.precio : 150, dur: s ? s.dur : 30 }; openSheet(hojaServ); },
  async guardarServ() { await api.guardarServicio(N().id, F); closeSheet(); toast('Servicio guardado'); render(); },
  async quitarServ() { await api.quitarServicio(F.id); closeSheet(); toast('Servicio quitado'); render(); },
  editPro(id) { const p = id ? q.pro(id) : null; F = { id: id || '', nombre: p ? p.nombre : '', rol: p ? p.rol : ROL_DEF[N().cat], com: p ? p.com : 40, tel: p && p.tel ? telBonito(p.tel) : '' }; openSheet(hojaPro); },
  async guardarPro() { await api.guardarPro(N().id, F); closeSheet(); toast('Guardado'); render(); },
  async quitarPro() { await api.quitarPro(F.id); closeSheet(); toast('Quitado del equipo'); render(); },
  editCuenta(id) { const c = id ? N().cuentas.find(x => x.id === id) : null; F = { id: id || '', banco: c ? c.banco : 'BAC Credomatic', tipo: c ? c.tipo : 'Ahorro', numero: c ? c.numero : '', titular: c ? c.titular : '' }; openSheet(hojaCuenta); },
  async guardarCuenta() { await api.guardarCuenta(N().id, F); closeSheet(); toast('Cuenta guardada'); render(); },
  async quitarCuenta() { await api.quitarCuenta(N().id, F.id); closeSheet(); toast('Cuenta quitada'); render(); },
  editRec() { F = { nombre: '', pts: 100 }; openSheet(() => `${head('Nueva recompensa')}<div class="f"><label for="erN">Qué se lleva el cliente</label><input id="erN" data-m="nombre" placeholder="Ej. Corte gratis"></div><div class="f"><label for="erP">Puntos necesarios</label><input id="erP" data-m="pts" data-num="1" inputmode="numeric" class="num" value="100"></div><button class="btn ink" ${act('guardarRec')}>Agregar</button>`); },
  async guardarRec() { await api.guardarRecompensa(N().id, F); closeSheet(); toast('Recompensa agregada'); render(); },
  async quitarRec(id) { await api.quitarRecompensa(N().id, id); render(); },
  responder(id) { F = { qid: id, txt: '' }; const x = DB.cals.find(r => r.id === id); openSheet(() => `${head('Responder')}<p class="muted">“${esc(x.txt || 'Sin comentario')}”</p><div class="f"><label for="rpT">Tu respuesta pública</label><textarea id="rpT" data-m="txt" placeholder="Gracias por venir..."></textarea></div><p class="xs faint">Todos la van a ver. Las reseñas no se pueden borrar.</p><button class="btn ink" ${act('guardarResp')}>Publicar respuesta</button>`); },
  async guardarResp() { await api.responder(F.qid, F.txt); closeSheet(); toast('Respuesta publicada'); render(); },
  reportar(id) { F = { qid: id, txt: '' }; openSheet(() => `${head('Reportar reseña')}<p class="muted">Somar la revisa. Solo se quita si es ofensiva o falsa.</p><div class="f"><label for="rrT">¿Por qué la reportás?</label><textarea id="rrT" data-m="txt"></textarea></div><button class="btn danger" ${act('enviarReporte')}>Enviar reporte</button>`); },
  async enviarReporte() { await api.reportar(F.qid, F.txt); closeSheet(); toast('Reporte enviado a Somar'); render(); },
});

render();
setInterval(() => { if (!SH && !document.activeElement?.matches('input,textarea,select')) render(); }, 30000);
