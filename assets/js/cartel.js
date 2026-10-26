/* Somar Turno · cartel con el código QR para la puerta o el mostrador del negocio.
   /cartel?n=slug toma los datos del negocio. También acepta ?nombre=...&fila=1 */
const prm = new URLSearchParams(location.search);
const negocio = prm.get('n') ? q.negSlug(prm.get('n')) : null;
const DATOS = negocio ? { nombre: negocio.nombre, slug: negocio.slug, fila: !!negocio.fila } : prm.get('nombre') ? { nombre: prm.get('nombre'), slug: prm.get('slug') || slugify(prm.get('nombre')), fila: prm.get('fila') === '1' } : null;
let TAM = prm.get('tam') === 'media' ? 'media' : 'carta';

function poster(d, i) {
  const enlace = CONFIG.URL + '/' + d.slug + (d.fila ? '?local=1' : '');
  const visible = CONFIG.URL.replace(/^https?:\/\//, '') + '/' + d.slug;
  const pasos = d.fila ? ['Escaneá el código con la cámara', 'Elegí tu servicio', 'Te avisamos cuando te toque'] : ['Escaneá el código con la cámara', 'Elegí servicio y hora', 'Te recordamos tu cita'];
  return { html: `<div class="poster">
    <div class="brand"><img src="/assets/img/icon.svg" alt="">Somar Turno</div>
    <div class="neg">${esc(d.nombre)}</div>
    <div class="h">${d.fila ? 'Tomá tu turno aquí, sin hacer fila' : 'Reservá tu cita aquí'}</div>
    <div class="ticket"><div class="qrbox"><div class="qr" id="qr${i}" role="img" aria-label="Código QR para ${esc(d.nombre)}"></div><div class="center"><img src="/assets/img/icon.svg" alt=""></div></div></div>
    <div class="url">${esc(visible)}</div>
    <div class="steps">${pasos.map((p, k) => `<div class="step"><i>${k + 1}</i><span>${p}</span></div>`).join('')}</div>
    <div class="by">una app de <img src="/assets/img/somar-labs.png" alt=""> <b>Somar Labs</b></div>
  </div>`, enlace };
}
function pintar() {
  const w = document.getElementById('wrap');
  document.querySelectorAll('[data-tam]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tam === TAM));
  if (!DATOS) { w.innerHTML = `<div class="vacio"><b>No encontramos el negocio.</b><br>Abrí el cartel desde tu panel: Más → Mi página y código QR → Cartel para imprimir.</div>`; return; }
  const n = TAM === 'media' ? 2 : 1, ps = [...Array(n)].map((_, i) => poster(DATOS, i));
  w.innerHTML = `<div class="sheet ${TAM}">${ps.map(p => p.html).join('')}</div>`;
  ps.forEach((p, i) => {
    const el = document.getElementById('qr' + i);
    if (window.QRCode) new QRCode(el, { text: p.enlace, width: 1024, height: 1024, colorDark: '#16181D', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.H });
    else el.innerHTML = '<p style="padding:40px;font-size:16px">Conectate a internet para generar el código.</p>';
  });
}
document.querySelectorAll('[data-tam]').forEach(b => b.addEventListener('click', () => { TAM = b.dataset.tam; pintar(); }));
document.getElementById('imprimir').addEventListener('click', () => window.print());
pintar();
