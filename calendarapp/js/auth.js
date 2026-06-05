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

/* ---------- Registro de nuevos alumnis ---------- */
function toggleAuthView(view) {
  $('#authLoginView').classList.toggle('hidden',    view !== 'login');
  $('#authRegisterView').classList.toggle('hidden', view !== 'register');
}

async function tryRegister() {
  const nombre   = $('#regNombre').value.trim();
  const email    = $('#regEmail').value.trim();
  const pass1    = $('#regPass1').value;
  const pass2    = $('#regPass2').value;
  const ciclo    = $('#regCiclo').value;
  const motivos  = $('#regMotivos').value.trim();

  if (!nombre || !email || !pass1 || !ciclo || !motivos) {
    toast('Rellena los campos marcados con *'); return;
  }
  if (pass1 !== pass2) { toast('Las contraseñas no coinciden'); return; }
  if (pass1.length < 8) { toast('La contraseña debe tener al menos 8 caracteres'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email inválido'); return; }

  const data = {
    nombre, email, password: pass1,
    apellidos: $('#regApellidos').value.trim(),
    dni:       $('#regDni').value.trim() || null,
    ciclo,
    promocion: $('#regYear').value || null,
    empresa:   $('#regEmpresa').value.trim(),
    puesto:    $('#regPuesto').value.trim(),
    motivos,
  };

  try {
    const res = await API.registro(data);
    showModal('Solicitud enviada ✓',
      res.message || 'Tu solicitud está pendiente de aprobación. El equipo Alumni la revisará en breve y recibirás un email cuando se active tu cuenta.',
      [`<button class="btn btn-primary" onclick="closeModal(); toggleAuthView('login')">Volver al login</button>`]);
    ['regNombre','regApellidos','regDni','regEmail','regPass1','regPass2','regYear','regEmpresa','regPuesto','regMotivos'].forEach(id => $('#'+id).value = '');
    $('#regCiclo').value = '';
  } catch (e) {
    const msg = e.message || '';
    if (msg.includes('409')) toast('Ese email ya está registrado');
    else if (msg.includes('400')) toast('Revisa los datos del formulario');
    else if (msg.includes('429')) toast('Demasiados intentos, espera unos minutos');
    else toast('No se ha podido enviar la solicitud');
  }
}
