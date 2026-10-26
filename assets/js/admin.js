/* Somar Turno · panel interno de Somar Labs */
const UI = { tab: 'resumen' };
const LOGIN = { step: 1, tel: '', codigo: null, codeIn: '' };
const TABS = [['resumen', 'Resumen', 'chart'], ['negocios', 'Negocios', 'store'], ['reportes', 'Reportes', 'flag'], ['ajustes', 'Ajustes', 'layers']];
const dentro = () => ses.tel() && q.esAdmin(ses.tel());

window.render = function () {
  const s = document.getElementById('screen'), t = document.getElementById('tabs');
  if (!dentro()) { t.hidden = true; s.innerHTML = vLogin(); return; }
  t.hidden = false; t.style.gridTemplateColumns = 'repeat(4,1fr)';
  t.innerHTML = TABS.map(([k, l, i]) => { const b = k === 'reportes' ? DB.cals.filter(x => x.reportada).length : k === 'negocios' ? DB.negocios.filter(n => n.estado === 'pendiente').length : 0; return `<button ${act('tab', k)} ${UI.tab === k ? 'aria-current="page"' : ''}>${svg(i)}${l}${b ? `<span class="dot num">${b}</span>` : ''}</button>`; }).join('');
  s.innerHTML = ({ resumen: vResumen, negocios: vNegocios, reportes: vReportes, ajustes: vAjustes })[UI.tab]();
};
window.onDatos = () => { if (!SH) render(); };

function vLogin() {
  const malo = ses.tel() && !q.esAdmin(ses.tel());
  return `<div class="title" style="padding-top:12px"><h1>Panel de Somar</h1><p>Solo para el equipo de Somar Labs.</p></div>
  ${malo ? `<div class="panel bad"><b>Este número no tiene acceso</b><span class="sm">Agregalo en ADMIN_TELS dentro de assets/js/config.js.</span><div><button class="btn s" ${act('salir')}>Usar otro número</button></div></div>` : `<div class="panel">${LOGIN.step === 1 ? `<div class="f"><label for="aTel">Tu WhatsApp</label><input id="aTel" data-i="tel" inputmode="tel" value="${esc(LOGIN.tel)}" placeholder="9999-9999"></div><button class="btn ink full" ${act('codigo')}>Mandarme el código</button>` : `${codigoPrueba(LOGIN.codigo)}<div class="f"><label for="aCode">Código</label><input id="aCode" data-i="code" inputmode="numeric" maxlength="6" class="num" value="${esc(LOGIN.codeIn)}"></div><button class="btn ink full" ${act('verificar')}>Entrar</button>`}</div>`}
  ${!CONFIG.ADMIN_TELS.length ? '<p class="sm muted">Aviso: ADMIN_TELS está vacío, así que cualquier número verificado entra. Configuralo antes de publicar.</p>' : ''}`;
}
function vResumen() {
  const T = hoy(), a = q.activos(), pe = DB.negocios.filter(n => n.estado === 'pendiente'), mrr = a.reduce((s, n) => s + (CONFIG.PLANES.find(p => p.k === n.plan)?.p || 0), 0), v30 = DB.visitas.filter(v => dBetween(v.fecha, T) <= 30);
  return `<div class="title"><h1>Resumen</h1><p>Somar Turno en números</p></div>
  <div class="stats"><div class="stat"><b>${a.length}</b><span>Negocios activos</span></div><div class="stat"><b>${DB.clientes.filter(c => c.cuenta).length}</b><span>Clientes con cuenta</span></div><div class="stat"><b>${L(mrr)}</b><span>Ingreso al mes</span></div></div>
  <div class="stats"><div class="stat"><b>${v30.length}</b><span>Visitas en 30 días</span></div><div class="stat"><b>${DB.citas.filter(c => c.fecha === T && c.estado !== 'cancelada').length}</b><span>Citas hoy</span></div><div class="stat"><b>${DB.fila.filter(f => f.fecha === T).length}</b><span>Turnos de fila hoy</span></div></div>
  ${pe.length ? `<div class="panel warn"><b>${pe.length} ${pe.length === 1 ? 'negocio espera' : 'negocios esperan'} aprobación</b><div><button class="btn s" ${act('tab', 'negocios')}>Revisar</button></div></div>` : ''}
  ${DB.cals.some(x => x.reportada) ? `<div class="panel bad"><b>Hay reseñas reportadas</b><div><button class="btn s" ${act('tab', 'reportes')}>Revisar</button></div></div>` : ''}
  ${a.length ? `<div class="panel"><div class="sec-h"><h2>Actividad por negocio</h2></div><div class="tbl"><table><thead><tr><th>Negocio</th><th>Tipo</th><th class="r">Visitas</th><th class="r">★</th></tr></thead><tbody>${a.map(n => ({ n, k: v30.filter(v => v.neg === n.id).length, r: q.negRt(n.id) })).sort((x, y) => y.k - x.k).map(x => `<tr><td>${esc(x.n.nombre)}</td><td>${CAT[x.n.cat]}</td><td class="r">${x.k}</td><td class="r">${x.r.n ? x.r.v.toFixed(1) : '—'}</td></tr>`).join('')}</tbody></table></div></div>` : empty('Todavía no hay negocios activos.')}`;
}
function vNegocios() {
  const st = { activo: ['g', 'Activo'], pendiente: ['w', 'Pendiente'], rechazado: ['', 'Rechazado'], pausado: ['r', 'Pausado'] };
  const ord = [...DB.negocios].sort((a, b) => (b.estado === 'pendiente') - (a.estado === 'pendiente'));
  return `<div class="title"><h1>Negocios</h1><p class="num">${DB.negocios.length} registrados</p></div>
  <div class="list">${ord.map(n => `<div class="item top-al">${mono(n, 's')}<div class="body" style="gap:8px"><div><div class="l1">${esc(n.nombre)} <span class="tag ${st[n.estado][0]}">${st[n.estado][1]}</span></div><div class="l2">${CAT[n.cat]}, ${esc(n.zona)}, ${q.pros(n.id).length} ${q.pros(n.id).length === 1 ? 'profesional' : 'profesionales'}, ${q.servs(n.id).length} servicios</div><div class="l2 num">Dueño +504 ${telBonito(n.duenoTel)}, registrado ${fLbl(n.creado || hoy()).toLowerCase()}</div></div>
  <div class="row-btns">${n.estado === 'pendiente' || n.estado === 'rechazado' || n.estado === 'pausado' ? `<button class="btn s good" ${act('estado', n.id, 'activo')}>${n.estado === 'pausado' ? 'Reactivar' : 'Aprobar'}</button>` : ''}${n.estado === 'pendiente' ? `<button class="btn s quiet" ${act('estado', n.id, 'rechazado')}>Rechazar</button>` : ''}${n.estado === 'activo' ? `<select data-c="plan" data-id="${n.id}" aria-label="Plan de ${esc(n.nombre)}" style="border:1px solid var(--line);border-radius:10px;padding:6px 8px;background:var(--surface)">${CONFIG.PLANES.map(p => `<option ${p.k === n.plan ? 'selected' : ''}>${p.k}</option>`).join('')}</select><button class="btn s quiet" ${act('estado', n.id, 'pausado')}>Pausar</button>` : ''}<a class="btn s wa" target="_blank" rel="noopener" href="${waLink(n.duenoTel, `Hola, te escribimos de Somar Turno por ${n.nombre}.`)}">WhatsApp</a></div></div></div>`).join('') || empty('Todavía no se ha registrado ningún negocio.')}</div>`;
}
function vReportes() {
  const qs = DB.cals.filter(x => x.reportada);
  return `<div class="title"><h1>Reseñas reportadas</h1><p>Se quitan solo si son ofensivas o falsas.</p></div>
  ${qs.map(x => `<div class="panel"><b>${esc(q.neg(x.neg)?.nombre)}</b><span class="sm muted">${esc(q.cli(x.cli)?.nombre)}, <span class="star">${stars(x.en)}</span>, ${fLbl(x.fecha).toLowerCase()}, visita registrada</span><div>“${esc(x.txt || 'Sin comentario')}”</div><div class="reply"><b>Motivo del negocio:</b> ${esc(x.motivo)}</div><div class="row-btns"><button class="btn s" ${act('moderar', x.id, '')}>Mantener</button><button class="btn s danger" ${act('moderar', x.id, '1')}>Eliminar</button></div></div>`).join('') || '<div class="panel"><p class="muted">No hay reseñas reportadas.</p></div>'}`;
}
function vAjustes() {
  const c = k => q.activos().filter(n => n.plan === k).length;
  return `<div class="title"><h1>Ajustes</h1></div>
  <div class="panel"><div class="sec-h"><h2>Planes</h2></div><div class="tbl"><table><thead><tr><th>Plan</th><th class="r">Precio</th><th class="r">Negocios</th><th class="r">Al mes</th></tr></thead><tbody>${CONFIG.PLANES.map(p => `<tr><td>${p.k}</td><td class="r">${L(p.p)}</td><td class="r">${c(p.k)}</td><td class="r">${L(p.p * c(p.k))}</td></tr>`).join('')}</tbody></table></div><p class="xs faint">Los precios se cambian en assets/js/config.js.</p></div>
  <div class="panel"><div class="sec-h"><h2>Datos</h2></div><p class="sm muted">Mientras no conectemos Supabase, todo se guarda en este navegador. Para probar podés cargar negocios de ejemplo.</p><div class="row-btns"><button class="btn" ${act('ejemplo')}>Cargar datos de ejemplo</button><button class="btn danger" ${act('borrar')}>Borrar todo</button></div></div>
  <button class="btn quiet" style="align-self:flex-start" ${act('salir')}>${svg('out')} Cerrar sesión</button>`;
}

Object.assign(A, {
  tab(k) { UI.tab = k; render(); scrollTo(0, 0); },
  tel(v) { LOGIN.tel = v; }, code(v) { LOGIN.codeIn = v; },
  async codigo() { LOGIN.codigo = await api.enviarCodigo(LOGIN.tel); LOGIN.step = 2; render(); },
  async verificar() { await api.verificarCodigo(LOGIN.tel, LOGIN.codeIn); LOGIN.step = 1; render(); },
  salir() { ses.cerrar(); LOGIN.step = 1; render(); },
  async estado(id, e) { await api.estadoNegocio(id, e); toast({ activo: 'Negocio activo. Ya aparece en la app.', rechazado: 'Solicitud rechazada', pausado: 'Negocio pausado. Ya no aparece en la app.' }[e]); render(); },
  async plan(v, el) { await api.planNegocio(el.dataset.id, v); toast('Plan cambiado'); render(); },
  async moderar(id, borrar) { await api.moderar(id, !!borrar); toast(borrar ? 'Reseña eliminada' : 'Reseña mantenida'); render(); },
  ejemplo() { ask('Cargar datos de ejemplo', 'Reemplaza lo que hay guardado en este navegador por negocios, clientes y citas de prueba.', 'Cargar ejemplo', async () => { await api.cargarEjemplo(); toast('Datos de ejemplo cargados'); render(); }); },
  borrar() { ask('Borrar todo', 'Se borran todos los negocios, clientes y citas guardados en este navegador.', 'Borrar todo', async () => { await api.borrarTodo(); toast('Datos borrados'); render(); }, 'danger'); },
});
render();
