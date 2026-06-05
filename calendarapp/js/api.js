/* ==========================================================
   API client — Llama a los endpoints PHP del backend (Apache+MySQL).
   La URL base se configura en Admin > Configuración y se guarda
   en localStorage. Si no está configurada, la PWA usa los mocks
   de data.js como fallback.
   ========================================================== */

let API_BASE = localStorage.getItem('api_url') || '';

/* Helper genérico para llamar a un endpoint PHP */
async function apiFetch(endpoint, opts = {}) {
  if (!API_BASE) throw new Error('API no configurada');
  const url = API_BASE.replace(/\/$/, '') + '/' + endpoint.replace(/^\//, '');
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
    body: opts.body ? (typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body)) : undefined,
  });
  if (!res.ok) throw new Error(`API ${endpoint} → ${res.status}`);
  return res.json();
}

/* ---------- AUTH ---------- */
const API = {
  /* Auth */
  login:    creds => apiFetch('login.php',    { method: 'POST', body: creds }),
  registro: data  => apiFetch('registro.php', { method: 'POST', body: data  }),
  logout:   ()    => apiFetch('logout.php',   { method: 'POST' }),

  /* Usuarios */
  getUsuarios:   ()       => apiFetch('usuarios.php'),
  updatePerfil:  data     => apiFetch('perfil.php', { method: 'POST', body: data }),
  deleteUsuario: id       => apiFetch(`usuarios.php?id=${id}`, { method: 'DELETE' }),

  /* Noticias */
  getNoticias:   ()       => apiFetch('noticias.php'),
  createNoticia: data     => apiFetch('noticias.php',  { method: 'POST',   body: data }),
  deleteNoticia: id       => apiFetch(`noticias.php?id=${id}`, { method: 'DELETE' }),

  /* Eventos */
  getEventos:    ()       => apiFetch('eventos.php'),
  createEvento:  data     => apiFetch('eventos.php',   { method: 'POST',   body: data }),
  enroll:        eventoId => apiFetch('inscripcion.php', { method: 'POST',   body: { evento_id: eventoId } }),
  unenroll:      eventoId => apiFetch('inscripcion.php', { method: 'DELETE', body: { evento_id: eventoId } }),

  /* Conferencias */
  getConferencias:    ()    => apiFetch('conferencias.php'),
  createConferencia:  data  => apiFetch('conferencias.php', { method: 'POST', body: data }),
  proponerCharla:     data  => apiFetch('propuestas.php',   { method: 'POST', body: data }),
  getPropuestas:      ()    => apiFetch('propuestas.php'),
  reviewPropuesta:    (id,e)=> apiFetch('propuestas.php',   { method: 'PUT',  body: { id, estado: e } }),

  /* Mentoría */
  getMentores:     ()      => apiFetch('mentores.php'),
  becomeMentor:    data    => apiFetch('mentores.php', { method: 'POST', body: data }),
  requestMentor:   mentorId=> apiFetch('solicitudes.php', { method: 'POST', body: { mentor_id: mentorId } }),

  /* Comunidad */
  getPosts:    ()           => apiFetch('publicaciones.php'),
  createPost:  data         => apiFetch('publicaciones.php', { method: 'POST', body: data }),
  toggleLike:  postId       => apiFetch('likes.php', { method: 'POST', body: { publicacion_id: postId } }),
  addComment:  (postId,txt) => apiFetch('comentarios.php', { method: 'POST', body: { publicacion_id: postId, texto: txt } }),

  /* Push */
  registerPushSubscription: sub        => apiFetch('push_register.php', { method: 'POST', body: sub }),
  sendPush:                 (t, b, u)  => apiFetch('push_send.php',     { method: 'POST', body: { title: t, body: b, url: u || '/' } }),
  notifyEventEnrollees:     (eid, t, b)=> apiFetch('evento_notificar.php', { method: 'POST', body: { evento_id: eid, title: t, body: b } }),

  /* Solicitudes de registro (admin) */
  getPendingUsers:    ()           => apiFetch('usuarios_pendientes.php'),
  reviewPendingUser:  (id, accion) => apiFetch('usuarios_pendientes.php', { method: 'PUT', body: { id, accion } }),

  /* Inscritos a un evento (admin) */
  getEventEnrollees: (eventoId) => apiFetch(`evento_inscritos.php?id=${eventoId}`),
};

/* ---------- Inicialización y carga inicial ---------- */
async function loadDataFromApi() {
  if (!API_BASE) return false;
  try {
    const [noticias, eventos, conferencias, mentores, posts, usuarios] = await Promise.all([
      API.getNoticias().catch(() => null),
      API.getEventos().catch(() => null),
      API.getConferencias().catch(() => null),
      API.getMentores().catch(() => null),
      API.getPosts().catch(() => null),
      API.getUsuarios().catch(() => null),
    ]);
    if (noticias)     DATA.news    = noticias.map(normaliseNoticia);
    if (eventos)      DATA.events  = eventos.map(normaliseEvento);
    if (conferencias) DATA.talks   = conferencias.map(normaliseConferencia);
    if (mentores)     DATA.mentors = mentores.map(normaliseMentor);
    if (posts)        DATA.posts   = posts.map(normalisePost);
    if (usuarios)     DATA.users   = usuarios.map(normaliseUsuario);
    if (typeof ROUTES !== 'undefined' && ROUTES[State.current]) ROUTES[State.current]();
    toast('Datos sincronizados con el servidor');
    return true;
  } catch (e) {
    console.warn('No se pudieron cargar datos del servidor:', e);
    toast('No se ha podido conectar con el servidor — usando datos de prueba');
    return false;
  }
}

/* ---------- Normalizadores (PHP snake_case → JS camelCase) ---------- */
const normaliseUsuario = u => ({
  id: +u.id, dni: u.dni, email: u.email, phone: u.telefono || '',
  name: `${u.nombre} ${u.apellidos || ''}`.trim(),
  password: u.password, role: u.rol === 'admin' ? 'admin' : 'user',
  ciclo: u.ciclo, year: u.promocion ? parseInt(u.promocion) : null,
  company: u.empresa, position: u.puesto, sector: u.sector,
  bio: u.bio || '', linkedin: u.linkedin || '', github: u.github || '', web: u.web || '',
  photo: u.foto || null,
  push: { events: !!u.push_eventos, news: !!u.push_noticias, mentor: !!u.push_mentor },
});

const normaliseNoticia = n => ({
  id: +n.id, title: n.titulo, summary: n.resumen, tag: n.tag,
  date: n.fecha, wpUrl: n.wp_url,
});

const normaliseEvento = e => ({
  id: +e.id, title: e.titulo, desc: e.descripcion,
  date: e.fecha, time: (e.hora || '18:00:00').slice(0, 5),
  place: e.ubicacion, category: e.categoria,
  spots: +e.plazas, enrolled: e.inscritos || [],
});

const normaliseConferencia = c => ({
  id: +c.id, title: c.titulo, desc: c.descripcion,
  speaker: c.ponente, cat: c.categoria,
  url: c.youtube_url, date: c.fecha,
});

const normaliseMentor = m => ({
  id: +m.id, userDni: m.usuario_dni, ciclo: m.ciclo, bio: m.bio,
  max: +m.max_mentees, mentees: m.mentees || [],
});

const normalisePost = p => ({
  id: +p.id, authorDni: p.autor_dni, cat: p.categoria,
  body: p.texto, date: new Date(p.fecha_creacion).getTime(),
  likes: p.likes || [], comments: (p.comentarios || []).map(c => ({
    a: c.autor_dni, t: c.texto, d: new Date(c.fecha).getTime(),
  })),
});

/* ---------- Configuración desde panel admin ---------- */
function saveApiConfig() {
  const url = ($('#cfgApiUrl') || {}).value?.trim();
  if (!url) { toast('Indica la URL del backend'); return; }
  localStorage.setItem('api_url', url);
  API_BASE = url;
  $('#apiStatus').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Probando conexión…';
  loadDataFromApi().then(ok => {
    $('#apiStatus').innerHTML = ok
      ? '<i class="fas fa-check-circle" style="color:#16a34a"></i> Conectado correctamente'
      : '<i class="fas fa-triangle-exclamation" style="color:#dc2626"></i> No se ha podido conectar';
  });
}
