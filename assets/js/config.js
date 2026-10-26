/* Somar Turno · configuración
   Cambiá estos valores antes de publicar. */
const CONFIG = {
  // Dirección pública de la app (para enlaces y códigos QR)
  URL: 'https://turno.somarlabs.online',

  // Números (8 dígitos) que pueden entrar al panel de Somar.
  // Si la lista está vacía, cualquier número verificado entra (solo para pruebas).
  ADMIN_TELS: [],

  // Proveedor para mandar los códigos por WhatsApp. Mientras sea null,
  // el código se muestra en pantalla (modo de prueba).
  WHATSAPP_PROVIDER: null,

  // Base de datos. 'local' guarda todo en este navegador mientras conectamos Supabase.
  DATA: 'local',
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',

  PLANES: [
    { k: 'Gratis', p: 0, f: ['1 profesional', 'Citas y fila', 'Perfil en la app y código QR'] },
    { k: 'Pro', p: 399, f: ['Hasta 5 profesionales', 'Puntos y referidos', 'Pagos por transferencia con comprobante', 'Caja y comisiones', 'Responder reseñas'] },
    { k: 'Plus', p: 699, f: ['Profesionales sin límite', 'Pantalla de fila para la tele', 'Clientes que no han vuelto', 'Reportes del mes'] },
  ],
};
