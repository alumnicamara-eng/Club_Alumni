/* ==========================================================
   Noticias — solo aparecen en Inicio. El artículo se abre en WordPress.
   ========================================================== */

const NEWS_TAGS = { club:'Vida del club', empleo:'Empleo', formacion:'Formación', eventos:'Eventos' };

function newsCard(n) {
  const tagLabel = NEWS_TAGS[n.tag] || n.tag;
  return `<a class="card clickable" href="${escapeHtml(n.wpUrl)}" target="_blank" rel="noopener">
    <div class="chip-row">
      <span class="chip chip-teal">${escapeHtml(tagLabel)}</span>
      <span class="chip"><i class="fab fa-wordpress"></i> WordPress</span>
    </div>
    <div class="card-title">${escapeHtml(n.title)}</div>
    <div class="card-meta"><span><i class="fas fa-calendar"></i>${fmtDate(n.date)}</span></div>
    <div class="card-desc">${escapeHtml(n.summary)}</div>
    <div class="card-actions"><span class="btn btn-outline btn-sm">Leer artículo <i class="fas fa-arrow-up-right-from-square"></i></span></div>
  </a>`;
}
