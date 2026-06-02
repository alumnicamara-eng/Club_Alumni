/* ==========================================================
   Calendario — vista mensual + listado lateral.
   Las celdas con eventos se pintan con fondo teal; las inscritas en verde.
   ========================================================== */

function renderCalendar() {
  const d = State.calDate;
  const year  = d.getFullYear();
  const month = d.getMonth();
  const first = new Date(year, month, 1);
  const startDay    = (first.getDay() + 6) % 7; // 0 = lunes
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  $('#calMonth').textContent = d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const monthEvents = DATA.events.filter(e => e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));

  let html = '';
  for (let i = 0; i < startDay; i++) html += `<div class="cal-day muted"></div>`;
  for (let day = 1; day <= daysInMonth; day++) {
    const dt = new Date(year, month, day);
    const dStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const evs = monthEvents.filter(e => e.date === dStr);
    const isToday    = dt.getTime() === today.getTime();
    const isEnrolled = evs.some(e => e.enrolled.includes(State.user?.dni));
    const isSelected = State.calSelected === dStr;
    const cls = [
      'cal-day',
      isToday ? 'today' : '',
      evs.length ? 'has-event' : '',
      isEnrolled ? 'enrolled' : '',
      isSelected ? 'selected' : '',
    ].filter(Boolean).join(' ');
    const badge = evs.length > 1 ? `<span class="cal-day-count">${evs.length}</span>` : '';
    html += `<div class="${cls}" onclick="selectCalDay('${dStr}')">${day}${badge}</div>`;
  }
  $('#calDays').innerHTML = html;

  let listEvents = monthEvents;
  let title = `Eventos · ${d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`;
  if (State.calSelected) {
    listEvents = DATA.events.filter(e => e.date === State.calSelected);
    title = `Eventos · ${fmtDateLong(State.calSelected)}`;
  }
  $('#calEventsTitle').innerHTML = `${escapeHtml(title)} ${State.calSelected ? `<span class="section-link" onclick="clearCalSelection()">Ver todo el mes</span>` : ''}`;
  $('#calEvents').innerHTML = listEvents.length
    ? listEvents.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)).map(eventCard).join('')
    : emptyMsg('No hay eventos en esta fecha', 'calendar');
}

function selectCalDay(dStr) {
  State.calSelected = State.calSelected === dStr ? null : dStr;
  renderCalendar();
}

function clearCalSelection() {
  State.calSelected = null;
  renderCalendar();
}

function eventCard(e) {
  const enrolled  = State.user && e.enrolled.includes(State.user.dni);
  const spotsLeft = Math.max(0, e.spots - e.enrolled.length);
  const args = `'${escapeHtml(e.title)}','${e.date}','${e.time}','${escapeHtml(e.place)}','${escapeHtml((e.desc||'').replace(/'/g, "\\'"))}'`;
  return `<div class="card clickable" onclick="openEvent(${e.id})">
    <div class="chip-row">
      <span class="chip ${enrolled ? 'chip-success' : 'chip-teal'}">${enrolled ? 'Inscrito' : 'Disponible'}</span>
      <span class="chip">${escapeHtml(e.category || 'evento')}</span>
    </div>
    <div class="card-title">${escapeHtml(e.title)}</div>
    <div class="card-meta">
      <span><i class="fas fa-calendar"></i>${fmtDate(e.date)} · ${escapeHtml(e.time)}</span>
      <span><i class="fas fa-location-dot"></i>${escapeHtml(e.place)}</span>
      <span><i class="fas fa-users"></i>${spotsLeft}/${e.spots} plazas</span>
    </div>
    <div class="card-desc">${escapeHtml((e.desc || '').slice(0, 140))}${(e.desc || '').length > 140 ? '…' : ''}</div>
    <div class="card-actions" style="flex-wrap:wrap;gap:6px">
      <button class="btn ${enrolled ? 'btn-outline' : 'btn-accent'} btn-sm" onclick="event.stopPropagation(); toggleEnroll(${e.id})">
        ${enrolled ? '<i class="fas fa-xmark"></i> Cancelar' : '<i class="fas fa-check"></i> Apuntarme'}
      </button>
      <button class="btn btn-ghost btn-sm" title="Añadir a Google Calendar" onclick="event.stopPropagation(); addToGoogleCalendar(${args})"><i class="fab fa-google"></i></button>
      <button class="btn btn-ghost btn-sm" title="Añadir a Apple Calendar" onclick="event.stopPropagation(); addToAppleCalendar(${args})"><i class="fab fa-apple"></i></button>
    </div>
  </div>`;
}

async function toggleEnroll(id) {
  const e = DATA.events.find(x => x.id === id);
  if (!e) return;
  const wasEnrolled = e.enrolled.includes(State.user.dni);

  if (wasEnrolled) {
    /* Cancelar inscripción */
    if (API_BASE) {
      try { await API.unenroll(id); } catch (err) { toast('Error cancelando'); return; }
    }
    e.enrolled = e.enrolled.filter(d => d !== State.user.dni);
    toast('Inscripción cancelada');
    if (State.current === 'calendario') renderCalendar();
    if (State.current === 'inicio')     renderHome();
    closeModal();
    return;
  }

  if (e.enrolled.length >= e.spots) { toast('No quedan plazas'); return; }

  /* Apuntarse */
  if (API_BASE) {
    try { await API.enroll(id); } catch (err) {
      const msg = (err.message || '').includes('409') ? 'No quedan plazas o ya estás inscrito' : 'Error apuntándote';
      toast(msg); return;
    }
  }
  e.enrolled.push(State.user.dni);
  toast('Te has apuntado al evento');
  pushNotify({ title: 'Estás inscrito', body: e.title });
  if (State.current === 'calendario') renderCalendar();
  if (State.current === 'inicio')     renderHome();
  promptAddToCalendar(e);
}

/* Modal que aparece tras apuntarse: "¿Lo añades a tu calendario?" */
function promptAddToCalendar(e) {
  const args = `'${escapeHtml(e.title)}','${e.date}','${e.time}','${escapeHtml(e.place)}','${escapeHtml((e.desc||'').replace(/'/g, "\\'"))}'`;
  showModal('¡Estás inscrito! 🎉',
    `<p style="margin-bottom:6px">Te has apuntado a <strong>${escapeHtml(e.title)}</strong>.</p>
     <p style="color:var(--ink-600);margin-bottom:16px">${fmtDateLong(e.date)} · ${escapeHtml(e.time)}h · ${escapeHtml(e.place)}</p>
     <div style="padding:14px;background:var(--teal-50);border:1px solid var(--teal-100);border-radius:12px">
       <div style="font-weight:600;margin-bottom:10px;color:var(--navy-800)"><i class="fas fa-calendar-plus"></i> Añade este evento a tu calendario para no olvidarlo</div>
       <div style="display:flex;gap:8px;flex-wrap:wrap">
         <button class="btn btn-primary btn-sm" onclick="addToGoogleCalendar(${args}); closeModal()"><i class="fab fa-google"></i> Google Calendar</button>
         <button class="btn btn-primary btn-sm" onclick="addToAppleCalendar(${args}); closeModal()"><i class="fab fa-apple"></i> Apple Calendar</button>
         <button class="btn btn-primary btn-sm" onclick="addToOutlookCalendar(${args}); closeModal()"><i class="fab fa-microsoft"></i> Outlook</button>
       </div>
     </div>`,
    [`<button class="btn btn-ghost" onclick="closeModal()">Más tarde</button>`]
  );
}

function openEvent(id) {
  const e = DATA.events.find(x => x.id === id); if (!e) return;
  const enrolled  = State.user && e.enrolled.includes(State.user.dni);
  const spotsLeft = Math.max(0, e.spots - e.enrolled.length);
  const args = `'${escapeHtml(e.title)}','${e.date}','${e.time}','${escapeHtml(e.place)}','${escapeHtml((e.desc||'').replace(/'/g, "\\'"))}'`;
  showModal(e.title, `
    <div class="chip-row">
      <span class="chip ${enrolled ? 'chip-success' : 'chip-teal'}">${enrolled ? 'Inscrito' : 'Disponible'}</span>
      <span class="chip">${escapeHtml(e.category)}</span>
    </div>
    <p style="margin:10px 0">${escapeHtml(e.desc)}</p>
    <div class="card-meta">
      <span><i class="fas fa-calendar"></i>${fmtDateLong(e.date)} · ${escapeHtml(e.time)}h</span>
      <span><i class="fas fa-location-dot"></i>${escapeHtml(e.place)}</span>
      <span><i class="fas fa-users"></i>${spotsLeft}/${e.spots} plazas</span>
    </div>

    <div style="margin-top:16px;padding:12px;background:var(--surface-2);border-radius:10px">
      <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:var(--ink-700)">Añadir a mi calendario</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-outline btn-sm" onclick="addToGoogleCalendar(${args})"><i class="fab fa-google"></i> Google Calendar</button>
        <button class="btn btn-outline btn-sm" onclick="addToAppleCalendar(${args})"><i class="fab fa-apple"></i> Apple Calendar</button>
        <button class="btn btn-outline btn-sm" onclick="addToOutlookCalendar(${args})"><i class="fab fa-microsoft"></i> Outlook</button>
      </div>
    </div>
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`,
    `<button class="btn ${enrolled ? 'btn-outline' : 'btn-accent'}" onclick="toggleEnroll(${e.id})">${enrolled ? 'Cancelar inscripción' : 'Apuntarme'}</button>`,
  ]);
}

/* === Helpers de exportación a calendarios externos === */
function addOneHour(time) {
  const [h, m] = time.split(':').map(Number);
  return `${String((h + 1) % 24).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function triggerICSDownload(content, filename) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/* === GOOGLE CALENDAR === Abre Google con el evento prerellenado */
function addToGoogleCalendar(title, date, time, place, desc) {
  const startDT = new Date(`${date}T${time}:00`);
  const endDT   = new Date(startDT.getTime() + 3600000);
  const fmt     = d => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const url     = `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(title)}` +
    `&dates=${fmt(startDT)}/${fmt(endDT)}` +
    `&details=${encodeURIComponent(desc || '')}` +
    `&location=${encodeURIComponent(place || '')}`;
  window.open(url, '_blank');
  toast('Abriendo Google Calendar…');
}

/* === APPLE CALENDAR === Genera .ics que iOS/macOS abre directamente en Calendario */
function addToAppleCalendar(title, date, time, place, desc) {
  const dt    = date.replace(/-/g, '') + 'T' + time.replace(':', '') + '00';
  const dtEnd = date.replace(/-/g, '') + 'T' + addOneHour(time).replace(':', '') + '00';
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//AlumniCamaraFP//EN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@alumni-camarafp`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]|\.\d+/g, '')}`,
    `DTSTART:${dt}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `LOCATION:${place}`,
    `DESCRIPTION:${(desc || '').replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
  triggerICSDownload(ics, `${title.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}.ics`);
  toast('Abre el archivo para añadirlo a tu Calendario');
}

/* === OUTLOOK / OUTLOOK.COM === Abre Outlook Web con el evento prerellenado */
function addToOutlookCalendar(title, date, time, place, desc) {
  const startDT = new Date(`${date}T${time}:00`);
  const endDT   = new Date(startDT.getTime() + 3600000);
  const url     = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent` +
    `&subject=${encodeURIComponent(title)}` +
    `&startdt=${encodeURIComponent(startDT.toISOString())}` +
    `&enddt=${encodeURIComponent(endDT.toISOString())}` +
    `&body=${encodeURIComponent(desc || '')}` +
    `&location=${encodeURIComponent(place || '')}`;
  window.open(url, '_blank');
  toast('Abriendo Outlook…');
}
