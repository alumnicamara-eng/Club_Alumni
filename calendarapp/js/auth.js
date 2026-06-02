/* ==========================================================
   Login / logout / sesión persistente.
   Si hay API_BASE configurado, autentica contra el backend PHP.
   Si no, usa los mocks de DATA.users.
   ========================================================== */

async function tryLogin() {
  const u = $('#authUser').value.trim();
  const p = $('#authPass').value;
  if (!u || !p) { toast('Rellena los dos campos'); return; }

  /* Backend PHP */
  if (API_BASE) {
    try {
      const row = await API.login({ user: u, pass: p });
      State.user = normaliseUsuario(row);
      localStorage.setItem('alumni-user', State.user.dni || u);
      bootApp();
      return;
    } catch (e) {
      const msg = (e.message || '').includes('401') ? 'Credenciales incorrectas' : 'No se ha podido conectar';
      toast(msg);
      return;
    }
  }

  /* Fallback a mocks */
  const user = DATA.users.find(x => (x.dni === u || x.email === u) && x.password === p);
  if (!user) { toast('Credenciales incorrectas'); return; }
  State.user = user;
  localStorage.setItem('alumni-user', user.dni);
  bootApp();
}

async function logout() {
  if (API_BASE) { try { await API.logout(); } catch (e) { /* ignore */ } }
  State.user = null;
  localStorage.removeItem('alumni-user');
  $('#appShell').classList.add('hidden');
  $('#authOverlay').style.display = 'flex';
}

function autoLogin() {
  const dni = localStorage.getItem('alumni-user');
  if (!dni) return false;
  const user = DATA.users.find(x => x.dni === dni);
  if (!user) return false;
  State.user = user;
  return true;
}
