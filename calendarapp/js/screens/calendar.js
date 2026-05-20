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
    <div class="card-actions">
      <button class="btn ${enrolled ? 'btn-outline' : 'btn-accent'} btn-sm" onclick="event.stopPropagation(); toggleEnroll(${e.id})">
        ${enrolled ? '<i class="fas fa-xmark"></i> Cancelar inscripción' : '<i class="fas fa-check"></i> Apuntarme'}
      </button>
    </div>
  </div>`;
}

function toggleEnroll(id) {
  const e = DATA.events.find(x => x.id === id);
  if (!e) return;
  const i = e.enrolled.indexOf(State.user.dni);
  if (i >= 0) {
    e.enrolled.splice(i, 1);
    toast('Inscripción cancelada');
  } else if (e.enrolled.length >= e.spots) {
    toast('No quedan plazas');
    return;
  } else {
    e.enrolled.push(State.user.dni);
    toast('Te has apuntado al evento');
    pushNotify({ title: 'Estás inscrito', body: e.title });
  }
  if (State.current === 'calendario') renderCalendar();
  if (State.current === 'inicio')     renderHome();
  closeModal();
}

function openEvent(id) {
  const e = DATA.events.find(x => x.id === id); if (!e) return;
  const enrolled  = State.user && e.enrolled.includes(State.user.dni);
  const spotsLeft = Math.max(0, e.spots - e.enrolled.length);
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
  `, [
    `<button class="btn btn-ghost" onclick="closeModal()">Cerrar</button>`,
    `<button class="btn ${enrolled ? 'btn-outline' : 'btn-accent'}" onclick="toggleEnroll(${e.id})">${enrolled ? 'Cancelar inscripción' : 'Apuntarme'}</button>`,
  ]);
}

function exportICS() {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//AlumniCamaraFP//EN'];
  DATA.events.forEach(e => {
    const dt = e.date.replace(/-/g, '') + 'T' + e.time.replace(':', '') + '00';
    lines.push('BEGIN:VEVENT', `UID:${e.id}@alumni-camarafp`, `DTSTART:${dt}`, `SUMMARY:${e.title}`, `LOCATION:${e.place}`, `DESCRIPTION:${e.desc}`, 'END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'alumni-camarafp.ics';
  a.click();
  URL.revokeObjectURL(a.href);
  toast('Calendario descargado');
}
