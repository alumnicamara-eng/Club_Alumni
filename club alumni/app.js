/* ═══════════════════════════
   CAMPUS APP — JavaScript
═══════════════════════════ */

// ── Navigation ──────────────────────────
const navBtns = document.querySelectorAll('.nav-btn');
const screens = document.querySelectorAll('.screen');

function goTo(id) {
  screens.forEach(s => s.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  const scr = document.getElementById('s-' + id);
  const btn = document.querySelector(`.nav-btn[data-s="${id}"]`);
  if (scr) scr.classList.add('active');
  if (btn) btn.classList.add('active');
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => goTo(btn.dataset.s));
});

// ── Tabs ────────────────────────────────
document.querySelectorAll('.tabs-bar').forEach(bar => {
  bar.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      bar.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
});

// ── Calendar ────────────────────────────
let calDate = new Date(2025, 3, 1); // April 2025
const eventDays = new Set([2, 8, 15, 18, 22, 25, 30]);
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

function renderCal() {
  const y = calDate.getFullYear(), m = calDate.getMonth();
  document.getElementById('month-lbl').textContent = `${MONTHS[m]} ${y}`;

  const firstDay = new Date(y, m, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const body = document.getElementById('cal-body');
  body.innerHTML = '';

  for (let i = 0; i < offset; i++) {
    const el = document.createElement('div');
    el.className = 'cal-cell empty';
    body.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    el.className = 'cal-cell';
    el.textContent = d;
    if (d === today.getDate() && m === today.getMonth() && y === today.getFullYear()) {
      el.classList.add('today');
    }
    if (eventDays.has(d)) el.classList.add('has-ev');
    el.addEventListener('click', () => {
      body.querySelectorAll('.cal-cell').forEach(c => { if (!c.classList.contains('today')) c.style.background = ''; });
      if (!el.classList.contains('today')) el.style.background = 'var(--teal-light)';
    });
    body.appendChild(el);
  }
}

document.getElementById('prev-m').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCal();
});
document.getElementById('next-m').addEventListener('click', () => {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCal();
});
renderCal();

// ── Áreas toggle ────────────────────────
document.querySelectorAll('.area-row').forEach(row => {
  const btn = row.querySelector('.area-btn');
  btn.addEventListener('click', () => {
    const isSel = row.classList.contains('selected');
    if (isSel) {
      row.classList.remove('selected');
      btn.textContent = 'Añadir';
      btn.className = 'area-btn add';
    } else {
      row.classList.add('selected');
      btn.textContent = 'Eliminar';
      btn.className = 'area-btn del';
    }
  });
});

// ── Evento buttons ──────────────────────
document.querySelectorAll('.ev-btn-del, .ev-btn-add').forEach(btn => {
  btn.addEventListener('click', () => {
    const isAdd = btn.classList.contains('ev-btn-add');
    if (isAdd) {
      btn.textContent = 'Eliminar';
      btn.className = 'ev-btn-del';
    } else {
      btn.textContent = 'Añadir';
      btn.className = 'ev-btn-add';
    }
  });
});

// ── Touch feedback ───────────────────────
document.querySelectorAll('.news-row, .forum-entry, .ev-item, .ev-list-row, .conf-menu-item, .conf-video-card').forEach(el => {
  el.addEventListener('touchstart', () => el.style.opacity = '.75', { passive: true });
  ['touchend', 'touchcancel'].forEach(ev => el.addEventListener(ev, () => el.style.opacity = '1', { passive: true }));
});
