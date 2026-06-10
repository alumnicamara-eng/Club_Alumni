/* ==========================================================
   Embajadores Cámara FP — alumnos/as que se ofrecen a colaborar
   con el centro en distintas acciones. Sustituye a la mentoría.
   ========================================================== */

const ACCIONES_EMBAJADOR = [
  { tipo: 'charla_clase',     icon: 'fa-chalkboard-user', titulo: 'Charla en clase',
    desc: 'Ven al centro y comparte tu experiencia como antiguo/a alumno/a: cuenta tu recorrido, da consejos y resuelve dudas a los alumnos/as actuales.' },
  { tipo: 'video_testimonio', icon: 'fa-video',           titulo: 'Vídeo testimonio',
    desc: 'Graba un breve testimonio sobre tu paso por Cámara FP y tu trayectoria. Lo usaremos en redes y web.' },
  { tipo: 'video_promo',      icon: 'fa-clapperboard',    titulo: 'Vídeo promocional',
    desc: 'Participa en vídeos promocionales del centro como imagen del Club Alumni.' },
  { tipo: 'shooting_fotos',   icon: 'fa-camera',          titulo: 'Shooting de fotos',
    desc: 'Participa en una sesión de fotos para materiales del centro y campañas.' },
];

/* Inscripciones del usuario actual (set de tipos) */
let _misAcciones = new Set();

async function renderMentors() {
  /* Cargar las acciones a las que ya está apuntado el usuario */
  if (API_BASE) {
    try {
      const mias = await API.getEmbajadores();
      _misAcciones = new Set((mias || []).map(m => m.tipo));
    } catch (e) { _misAcciones = new Set(); }
  }

  $('#mentorsList').innerHTML = ACCIONES_EMBAJADOR.map(accionCard).join('');
}

function accionCard(a) {
  const apuntado = _misAcciones.has(a.tipo);
  return `<div class="card">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:46px;height:46px;border-radius:12px;background:var(--teal-50);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fas ${a.icon}" style="font-size:20px;color:var(--teal-700)"></i>
      </div>
      <div class="card-title" style="margin:0">${escapeHtml(a.titulo)}</div>
    </div>
    <div class="card-desc">${escapeHtml(a.desc)}</div>
    <div class="card-actions mt-12">
      ${apuntado
        ? `<span class="chip chip-success"><i class="fas fa-check"></i> Te has ofrecido</span>
           <button class="btn btn-ghost btn-sm" onclick="bajaAccion('${a.tipo}')">Cancelar</button>`
        : `<button class="btn btn-accent btn-sm" onclick="apuntarAccion('${a.tipo}','${escapeHtml(a.titulo)}')"><i class="fas fa-hand-holding-heart"></i> Quiero participar</button>`}
    </div>
  </div>`;
}

async function apuntarAccion(tipo, titulo) {
  if (!API_BASE) { toast('Necesitas conexión con el servidor'); return; }
  try {
    await API.apuntarEmbajador(tipo, '');
    _misAcciones.add(tipo);
    renderMentors();
    toast('¡Gracias! El centro se pondrá en contacto contigo');
    pushNotify({ title: 'Te has ofrecido como embajador/a', body: titulo });
  } catch (e) {
    if ((e.message || '').includes('409')) { _misAcciones.add(tipo); renderMentors(); }
    else toast('No se pudo guardar');
  }
}

async function bajaAccion(tipo) {
  if (!API_BASE) return;
  try {
    await API.bajaEmbajador(tipo);
    _misAcciones.delete(tipo);
    renderMentors();
    toast('Te has dado de baja de esta acción');
  } catch (e) { toast('No se pudo cancelar'); }
}
