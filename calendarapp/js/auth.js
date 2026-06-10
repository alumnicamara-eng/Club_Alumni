/* ==========================================================
   Login / logout / registro / sesión persistente.
   Siempre contra el backend PHP — sin mock fallback.
   ========================================================== */

async function tryLogin() {
  const u = $('#authUser').value.trim();
  const p = $('#authPass').value;
  if (!u || !p) { toast('Rellena los dos campos'); return; }

  try {
    const row = await API.login({ user: u, pass: p });
    State.user = normaliseUsuario(row);
    localStorage.setItem('alumni-user', State.user.dni || u);
    bootApp();
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('403')) {
      showModal('Cuenta pendiente de aprobación',
        'Tu solicitud aún no ha sido aprobada por el equipo Alumni Cámara FP. ' +
        'Recibirás un email cuando se active tu cuenta. Si han pasado más de 48h, ' +
        'escríbenos a <a href="mailto:alumni@camarafp.es">alumni@camarafp.es</a>.',
        [`<button class="btn btn-primary" onclick="closeModal()">Entendido</button>`]);
    } else if (msg.includes('401')) {
      toast('Credenciales incorrectas');
      const card = document.querySelector('.auth-card');
      if (card) { card.classList.add('shake'); setTimeout(() => card.classList.remove('shake'), 600); }
    } else if (msg.includes('429')) {
      toast('Demasiados intentos, vuelve a probar en unos minutos');
    } else {
      toast('No se ha podido conectar con el servidor. Revisa tu conexión.');
    }
  }
}

async function logout() {
  try { await API.logout(); } catch (e) { /* aunque falle, cerramos sesión local */ }
  State.user = null;
  localStorage.removeItem('alumni-user');
  $('#appShell').classList.add('hidden');
  $('#authOverlay').style.display = 'flex';
}

/* Autologin: comprueba la cookie de sesión contra el servidor.
   Si es válida, devuelve el usuario; si no, fuerza login. */
async function autoLogin() {
  try {
    const row = await API.me();
    State.user = normaliseUsuario(row);
    localStorage.setItem('alumni-user', State.user.dni || row.email);
    return true;
  } catch (e) {
    /* Sin sesión válida */
    State.user = null;
    localStorage.removeItem('alumni-user');
    return false;
  }
}

/* ---------- Alta de alumnis (claim de cuenta precargada) ---------- */
function toggleAuthView(view) {
  $('#authLoginView').classList.toggle('hidden',  view !== 'login');
  $('#authAltaStep1').classList.toggle('hidden',  view !== 'alta');
  $('#authAltaStep2').classList.toggle('hidden',  view !== 'alta2');
  /* El paso 2 (onboarding) necesita una tarjeta más ancha */
  document.querySelector('.auth-card')?.classList.toggle('auth-card-wide', view === 'alta2');
}

/* Guarda los datos de verificación entre paso 1 y paso 2 */
let _altaCreds = null;

async function altaVerificar() {
  const dni  = $('#altaDni').value.trim().toUpperCase();
  const fnac = $('#altaFnac').value;
  if (!dni || !fnac) { toast('Indica tu DNI y fecha de nacimiento'); return; }

  try {
    const res = await API.altaVerificar({ dni, fecha_nacimiento: fnac });
    _altaCreds = { dni, fecha_nacimiento: fnac };
    const d = res.datos || {};
    /* Prerellenar el paso 2 con los datos precargados por el centro */
    $('#altaHola').textContent    = (d.nombre || '').split(' ')[0] || 'alumni';
    $('#altaNombre').value         = d.nombre    || '';
    $('#altaApellidos').value      = d.apellidos || '';
    $('#altaEmail').value          = d.email     || '';
    $('#altaTelefono').value       = d.telefono  || '';
    $('#altaDireccion').value      = d.direccion || '';
    $('#altaYear').value           = d.promocion || '';
    if (d.ciclo) $('#altaCiclo').value = d.ciclo;
    toggleAuthView('alta2');
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('404')) toast('No encontramos tu registro. Contacta con el centro.');
    else if (msg.includes('409')) { toast('Ya tienes cuenta. Inicia sesión.'); toggleAuthView('login'); }
    else if (msg.includes('429')) toast('Demasiados intentos, espera unos minutos');
    else toast('No se ha podido verificar. Revisa los datos.');
  }
}

async function altaCompletar() {
  if (!_altaCreds) { toggleAuthView('alta'); return; }
  const pass1 = $('#altaPass1').value;
  const pass2 = $('#altaPass2').value;
  if (pass1.length < 8) { toast('La contraseña debe tener al menos 8 caracteres'); return; }
  if (pass1 !== pass2)  { toast('Las contraseñas no coinciden'); return; }

  const email = $('#altaEmail').value.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email inválido'); return; }

  const sitLab = document.querySelector('#altaSitLab input:checked')?.value || null;
  const sitAca = document.querySelector('#altaSitAca input:checked')?.value || null;
  const motivos = [...document.querySelectorAll('#altaMotivos input:checked')].map(c => c.value);

  const data = {
    ..._altaCreds,
    password:  pass1,
    nombre:    $('#altaNombre').value.trim(),
    apellidos: $('#altaApellidos').value.trim(),
    email,
    telefono:  $('#altaTelefono').value.trim(),
    direccion: $('#altaDireccion').value.trim(),
    ciclo:     $('#altaCiclo').value,
    promocion: $('#altaYear').value || null,
    situacion_laboral:   sitLab,
    situacion_academica: sitAca,
    motivos,
  };

  try {
    const res = await API.altaCompletar(data);
    State.user = normaliseUsuario(res.user);
    localStorage.setItem('alumni-user', State.user.dni || email);
    _altaCreds = null;
    bootApp();
    toast('¡Bienvenido/a al Club Alumni! 🎉');
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('409')) toast('Ese email ya está en uso o la cuenta ya estaba activa');
    else if (msg.includes('400')) toast('Revisa los datos del formulario');
    else toast('No se ha podido completar el alta');
  }
}
