/* Somar Turno · pantalla de la fila para la tele del local. Se actualiza sola. */
const slug = new URLSearchParams(location.search).get('n');
function pintar() {
  const n = slug && q.negSlug(slug), tv = document.getElementById('tv');
  if (!n) { tv.innerHTML = '<div style="font-size:22px">No encontramos este negocio.</div>'; return; }
  const c = q.llamados(n.id).sort((a, b) => b.num - a.num)[0], w = q.esperando(n.id).slice(0, 6);
  tv.innerHTML = `<div style="font-size:22px;opacity:.75">${esc(n.nombre)}</div><div style="font-size:19px;opacity:.6">${c ? 'Pasá, es tu turno' : 'Fila'}</div><div class="now num">${c ? c.num : '—'}</div>${c ? `<div style="font-size:24px">Con ${esc(first(q.pro(c.pro)?.nombre))}</div>` : ''}<div style="opacity:.6;margin-top:12px">Siguientes</div><div class="nx num">${w.map(f => `<span>${f.num}</span>`).join('') || '<span style="border:0">Nadie esperando</span>'}</div><div style="opacity:.55;font-size:16px;margin-top:14px">Tomá turno en ${CONFIG.URL.replace('https://', '')}/${esc(n.slug)}</div>`;
}
window.onDatos = pintar;
pintar(); setInterval(() => { DB = cargarDB(); pintar(); }, 5000);
try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }); } catch (e) { }
