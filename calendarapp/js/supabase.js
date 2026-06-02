/* ==========================================================
   Supabase — inicialización, carga de datos y configuración.
   Usa los datos mock de data.js como fallback cuando no hay conexión.
   ========================================================== */

let supabaseClient = null;

function initSupabase() {
  try {
    const url = localStorage.getItem('supabase_url');
    const key = localStorage.getItem('supabase_key');
    if (url && key && window.supabase) {
      supabaseClient = window.supabase.createClient(url, key);
      console.log('✅ Supabase conectado');
      return true;
    }
    return false;
  } catch (e) {
    console.warn('Supabase no disponible:', e);
    return false;
  }
}

async function loadDataFromSupabase() {
  if (!supabaseClient) return;
  try {
    const [newsRes, eventsRes, talksRes, mentorsRes, postsRes] = await Promise.all([
      supabaseClient.from('news').select('*').order('date', { ascending: false }),
      supabaseClient.from('events').select('*').order('date', { ascending: true }),
      supabaseClient.from('talks').select('*').order('date', { ascending: false }),
      supabaseClient.from('mentors').select('*'),
      supabaseClient.from('posts').select('*').order('created_at', { ascending: false }),
    ]);
    if (newsRes.data?.length)    DATA.news    = newsRes.data;
    if (eventsRes.data?.length)  DATA.events  = eventsRes.data;
    if (talksRes.data?.length)   DATA.talks   = talksRes.data;
    if (mentorsRes.data?.length) DATA.mentors = mentorsRes.data;
    if (postsRes.data?.length)   DATA.posts   = postsRes.data;

    /* Re-render la pantalla activa */
    if (ROUTES[State.current]) ROUTES[State.current]();
    toast('Datos sincronizados con Supabase');
  } catch (e) {
    console.error('Error cargando datos de Supabase:', e);
  }
}

function saveSupabaseConfig() {
  const url = ($('#cfgSupabaseUrl') || {}).value?.trim();
  const key = ($('#cfgSupabaseKey') || {}).value?.trim();
  if (!url || !key) { toast('Completa la URL y la clave anónima'); return; }
  localStorage.setItem('supabase_url', url);
  localStorage.setItem('supabase_key', key);
  if (initSupabase()) loadDataFromSupabase();
  toast('Supabase conectado — sincronizando datos…');
}
