/* ==========================================================
   Comunidad — feed unificado con composer, likes y comentarios.
   ========================================================== */

const POST_CATS = { empleo:'Empleo', pregunta:'Pregunta', logro:'Logro', recurso:'Recurso' };

async function publishPost() {
  const txt = $('#composerText').value.trim();
  const cat = $('#composerCat').value || 'todas';
  if (!txt) { toast('Escribe algo para publicar'); return; }

  if (API_BASE) {
    try {
      await API.createPost({ texto: txt, categoria: cat });
      await loadDataFromApi();
    } catch (e) { toast('No se pudo publicar'); return; }
  } else {
    DATA.posts.unshift({
      id: Date.now(), authorDni: State.user.dni, cat,
      body: txt, date: Date.now(), likes: [], comments: [],
    });
  }
  $('#composerText').value = '';
  renderPosts();
  toast('Publicado');
}

function renderPosts() {
  const cat = State.filters.posts;
  const list = DATA.posts.filter(p => cat === 'todas' || p.cat === cat);
  $('#postsList').innerHTML = list.map(postCard).join('') || emptyMsg('No hay publicaciones', 'comments');
}

function postCard(p) {
  const u     = findUser(p.authorDni) || { name: 'Alumni' };
  const liked = p.likes.includes(State.user.dni);
  const catLabel = POST_CATS[p.cat] || '';
  const body = escapeHtml(p.body).replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
  return `<div class="post" id="post-${p.id}">
    <div class="post-head">
      <div class="mentor-avatar">${initials(u.name)}</div>
      <div>
        <div class="post-author">${escapeHtml(u.name)} ${u.ciclo ? `<span class="text-muted" style="font-weight:500;font-size:12px"> · ${escapeHtml(u.ciclo)} ${u.year || ''}</span>` : ''}</div>
        <div class="post-meta">${fmtRel(p.date)}${catLabel ? ' · ' + catLabel : ''}</div>
      </div>
    </div>
    <div class="post-body">${body}</div>
    <div class="post-actions">
      <span class="post-action ${liked ? 'active' : ''}" onclick="toggleLike(${p.id})"><i class="fa${liked ? 's' : 'r'} fa-heart"></i> ${p.likes.length || ''} Me gusta</span>
      <span class="post-action" onclick="toggleComments(${p.id})"><i class="far fa-comment"></i> ${p.comments.length || ''} Comentar</span>
      <span class="post-action" onclick="sharePost(${p.id})"><i class="fas fa-share-nodes"></i> Compartir</span>
    </div>
    <div class="comments" id="comments-${p.id}">
      ${p.comments.map(c => {
        const cu = findUser(c.a) || { name: 'Alumni' };
        return `<div class="comment">
          <div class="mentor-avatar">${initials(cu.name)}</div>
          <div class="comment-bubble"><strong>${escapeHtml(cu.name)}</strong>${escapeHtml(c.t)}<br><small class="text-muted">${fmtRel(c.d)}</small></div>
        </div>`;
      }).join('')}
      <div class="comment">
        <div class="mentor-avatar">${initials(State.user.name)}</div>
        <input class="field-input" placeholder="Escribe un comentario..." onkeypress="if(event.key==='Enter') addComment(${p.id}, this)">
      </div>
    </div>
  </div>`;
}

async function toggleLike(id) {
  const p = DATA.posts.find(x => x.id === id);
  const i = p.likes.indexOf(State.user.dni);
  if (i >= 0) p.likes.splice(i, 1); else p.likes.push(State.user.dni);
  renderPosts();
  if (API_BASE) {
    try { await API.toggleLike(id); } catch (e) { /* ya hemos pintado el estado optimista */ }
  }
}

function toggleComments(id) { $('#comments-' + id).classList.toggle('open'); }

async function addComment(id, input) {
  const t = input.value.trim();
  if (!t) return;
  const p = DATA.posts.find(x => x.id === id);
  p.comments.push({ a: State.user.dni, t, d: Date.now() });
  input.value = '';
  renderPosts();
  setTimeout(() => $('#comments-' + id).classList.add('open'), 50);
  if (API_BASE) {
    try { await API.addComment(id, t); } catch (e) { console.warn('Comentario no guardado:', e); }
  }
}

function sharePost(id) {
  const p = DATA.posts.find(x => x.id === id);
  if (navigator.share) navigator.share({ title: 'Alumni Cámara FP', text: p.body }).catch(() => {});
  else { navigator.clipboard?.writeText(p.body); toast('Texto copiado al portapapeles'); }
}
