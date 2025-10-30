(function () {
  // Require admin
  if (typeof guard === 'function') guard(['admin']);

  const tbody = document.getElementById('queue-tbody');
  if (!tbody) return;

  function rowTemplate(item) {
    const badgeClass = item.urgency?.class || 'bg-success';
    const badgeText  = item.urgency?.label || 'Low';
    const survLabel  = item.survivorLabel || 'Anonymous Survivor';
    const survSub    = item.survivorSub || '—';
    const caseId     = item.caseId || '—';
    const rowStatus  = item.rowStatus || 'Submitted';

    return `
      <tr>
        <td class="px-0">
          <div class="d-flex align-items-center">
            <img src="./profile/user-3.jpg" class="rounded-circle" width="40" alt="profile" />
            <div class="ms-3">
              <h6 class="mb-0 fw-bolder">${survLabel}</h6>
              <span class="text-muted">${survSub}</span>
            </div>
          </div>
        </td>
        <td class="px-0">${caseId}</td>
        <td class="px-0"><span class="badge ${badgeClass}">${badgeText}</span></td>
        <td class="px-0 text-dark fw-medium text-end">${rowStatus}</td>
      </tr>
    `;
  }

  async function loadQueue() {
    try {
      const res = await fetch('/api/admin/cases/queue?status=submitted,in review,assigned&limit=20', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to load queue');
      const data = await res.json();

      if (!data.items || data.items.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="4" class="text-muted small">No pending cases. Great job!</td>
          </tr>`;
        return;
      }

      tbody.innerHTML = data.items.map(rowTemplate).join('');
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-danger small">Unable to load assignment queue.</td>
        </tr>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadQueue);
  } else {
    loadQueue();
  }
})();
