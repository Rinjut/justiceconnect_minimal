// frontend/public/js/survivor-cases.js
(function () {
  // ---------- Helpers ----------
  function fmtDate(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"'`=\/]/g, function (c) {
      return ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','/':'&#47;','`':'&#96;','=':'&#61;'
      })[c];
    });
  }

  function statusBadge(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'submitted')
      return '<span class="badge bg-primary-subtle text-primary">Submitted</span>';
    if (s === 'review' || s === 'in review')
      return '<span class="badge bg-warning text-dark">In Review</span>';
    if (s === 'assigned')
      return '<span class="badge bg-success-subtle text-success">Assigned</span>';
    if (s === 'closed')
      return '<span class="badge bg-secondary-subtle text-secondary">Closed</span>';
    return `<span class="badge bg-secondary">${escapeHtml(status || '—')}</span>`;
  }

  function truncate(s, n) {
    const t = (s || '').replace(/\s+/g, ' ').trim();
    return t.length > n ? t.slice(0, n) + '…' : t;
  }

  async function apiJson(path) {
    const res = await fetch(path, { credentials: 'include' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
  }

  // ---------- Single-row summary (your current table) ----------
  async function renderLatestCaseRow() {
    const elId   = document.getElementById('cd-caseId');
    const elSt   = document.getElementById('cd-status');
    const elLaw  = document.getElementById('cd-lawyer');
    const elNext = document.getElementById('cd-next');
    const elDesc = document.getElementById('cd-desc');
    const elUpd  = document.getElementById('cd-updated');

    if (!elId || !elSt || !elLaw || !elNext || !elDesc || !elUpd) return; // not on this page

    try {
      const data = await apiJson('/api/cases/latest');
      const c = data.case;

      if (!c) {
        elId.textContent   = '—';
        elSt.innerHTML     = statusBadge('Submitted');
        elLaw.textContent  = '—';
        elNext.textContent = '—';
        elDesc.textContent = 'No requests submitted yet.';
        elUpd.textContent  = '—';
        return;
      }

      elId.textContent   = c.caseId || '—';
      elSt.innerHTML     = statusBadge(c.status);
      elLaw.textContent  = c.assignedLawyerName || '—';
      // if you don't have nextStep in DB yet, fall back to desiredOutcome
      elNext.textContent = c.nextStep || c.desiredOutcome || '—';
      elDesc.textContent = c.situation ? truncate(c.situation, 160) : '—';
      elUpd.textContent  = fmtDate(c.updatedAt);
    } catch (e) {
      // Graceful fallback if API fails
      elId.textContent   = '—';
      elSt.innerHTML     = statusBadge('Submitted');
      elLaw.textContent  = '—';
      elNext.textContent = '—';
      elDesc.textContent = 'Unable to load case right now.';
      elUpd.textContent  = '—';
      console.error('Load latest case failed:', e);
    }
  }

  // ---------- Optional: full list renderer if <tbody id="cases-tbody"> exists ----------
  async function renderMyCasesList() {
    const tbody = document.getElementById('cases-tbody');
    if (!tbody) return; // no list table present; skip

    try {
      const { items } = await apiJson('/api/cases/mine?limit=20');
      if (!Array.isArray(items) || items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" class="text-muted small">No cases yet. Submit a request to see it here.</td>
          </tr>`;
        return;
      }

      tbody.innerHTML = items.map(c => {
        const next = c.nextStep || c.desiredOutcome || '—';
        const desc = c.situation ? truncate(c.situation, 160) : '—';
        return `
          <tr>
            <td class="fw-semibold text-dark">${escapeHtml(c.caseId || '—')}</td>
            <td>${statusBadge(c.status)}</td>
            <td>${escapeHtml(c.assignedLawyerName || '—')}</td>
            <td>${escapeHtml(next)}</td>
            <td class="small text-muted">${escapeHtml(desc)}</td>
            <td class="text-dark">${fmtDate(c.updatedAt)}</td>
          </tr>`;
      }).join('');
    } catch (e) {
      console.error('Load cases list failed:', e);
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="text-danger small">Unable to load your cases right now.</td>
        </tr>`;
    }
  }

  // ---------- Boot ----------
  function boot() {
    // If you keep your single summary row:
    renderLatestCaseRow();
    // If you add <tbody id="cases-tbody"> for a full list:
    renderMyCasesList();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
