# Somar Turno

Citas, fila virtual, pagos por transferencia y puntos para **barberías, salones de belleza, estilistas y uñas** en Honduras. Producto de Somar Labs.

## Páginas

| Ruta | Para quién | Qué hace |
| --- | --- | --- |
| `/` | Cliente | App instalable: buscar negocios, reservar, tomar turno, pagar por transferencia, puntos, calificar. Se puede usar sin cuenta. |
| `/nombre-del-negocio` | Cliente | Abre directo ese negocio (es la dirección del código QR). Con `?local=1` se puede tomar turno aunque el negocio no lo permita desde la casa (QR de la puerta). |
| `/panel` | Dueño y profesionales | Entrada con WhatsApp, alta del negocio, hoy, agenda, fila, cobros, comprobantes, caja, clientes, servicios, equipo, cuentas, horario, puntos y reseñas. |
| `/pantalla?n=slug` | Tele del local | Número que está pasando y los siguientes. Se actualiza sola. |
| `/admin` | Somar Labs | Aprobar negocios, planes, reseñas reportadas y datos de ejemplo. |
| `/demo` | Prospectos | Demo completa con datos de prueba y las cuatro vistas. |

## Cómo está hecho

- HTML, CSS y JavaScript sin frameworks ni compilación. Se despliega tal cual en Vercel.
- `assets/js/core.js`: utilidades e interfaz compartida. Los botones usan atributos `data-a` (no hay código en línea).
- `assets/js/data.js`: **capa de datos**. Hoy guarda todo en el navegador (localStorage) para poder probar sin servidor; cada colección es una tabla futura de Supabase y cada función de `api` será un insert/update o una función RPC. Las pantallas solo hablan con este archivo.
- `assets/js/config.js`: dirección pública, números de administradores, proveedor de WhatsApp, planes.

## Pendiente

- [ ] Base de datos en Supabase (tablas, RLS por negocio, tiempo real para fila y pagos) y cambiar `data.js`.
- [ ] Proveedor para mandar los códigos por WhatsApp (hoy el código se muestra en pantalla en modo de prueba).
- [ ] Notificaciones push reales con la app instalada.
- [ ] Guardar los comprobantes en Supabase Storage.
- [ ] Poner los números de Somar en `ADMIN_TELS`.

## Probar

1. Abrí `/admin`, entrá con cualquier número (en modo de prueba) y tocá **Cargar datos de ejemplo** en Ajustes.
2. En otra pestaña abrí `/` como cliente y en otra `/panel` entrando con `9944-1020` (dueño de El Patrón Barbería). Lo que hacés en una pestaña aparece en las otras.
