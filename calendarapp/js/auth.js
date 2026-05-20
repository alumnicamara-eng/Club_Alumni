/* ==========================================================
   Login / logout / sesión persistente.
   En el backend real se sustituye por llamada a Supabase Auth.
   ========================================================== */

function tryLogin() {
  const u = $('#authUser').value.trim();
  const p = $('#authPass').value;
  const user = DATA.users.find(x => (x.dni === u || x.email === u) && x.password === p);
  if (!user) { toast('Credenciales incorrectas'); return; }
  State.user = user;
  localStorage.setItem('alumni-user', user.dni);
  bootApp();
}

function logout() {
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
