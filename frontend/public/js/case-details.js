// frontend/public/js/case-details.js

// ===== Helpers =====
const qs = (k) => new URLSearchParams(location.search).get(k);
const fmtYN = (b) => (b ? "Yes" : "No");
const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString() : "—");
const priorityBadge = (p) => {
  const map = { High: "warning text-dark", Medium: "info text-dark", Low: "secondary" };
  const cls = map[p] || "secondary";
  return `<span class="badge bg-${cls}">${p}</span>`;
};

async function loadCase(caseId) {
  const url = `/api/admin/cases/${encodeURIComponent(caseId)}`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GET ${url} failed: ${res.status} ${res.statusText} — ${text}`);
  }
  return res.json();
}

(async function init() {
  try {
    const caseId = qs("caseId");
    const back = "admin.html";
    const backLink = document.getElementById("backLink");
    const backLink2 = document.getElementById("backLink2");
    if (backLink) backLink.href = back;
    if (backLink2) backLink2.href = back;

    if (!caseId) {
      document.querySelector("main").innerHTML =
        '<div class="alert alert-danger mt-4">Missing <code>caseId</code>.</div>';
      return;
    }

    const data = await loadCase(caseId);

    // Header
    document.getElementById("cd-caseId").textContent = `Case: ${data.caseId}`;
    document.getElementById("priorityPill").innerHTML = priorityBadge(data.urgency || data.priority || "—");
    document.getElementById("statusPill").textContent = data.status || "—";

    // Summary
    document.getElementById("cd-name").textContent = data.preferredName || "—";
    document.getElementById("cd-location").textContent =
      [data.province, data.city].filter(Boolean).join(" • ") || "—";
    document.getElementById("cd-category").textContent = data.issueCategory || "—";
    document.getElementById("cd-created").textContent = fmtDateTime(data.createdAt);
    document.getElementById("cd-desc").textContent = data.situation || data.description || "—";

    // Request Details — Contact
    document.getElementById("rd-contactMethod").textContent = data.contactMethod || "—";
    document.getElementById("rd-contactValue").textContent = data.contactValue || "—";
    document.getElementById("rd-safe").textContent = fmtYN(!!data.safeToContact);

    // Location & Language
    document.getElementById("rd-province").textContent = data.province || "—";
    document.getElementById("rd-city").textContent = data.city || "—";
    document.getElementById("rd-language").textContent = data.language || "—";

    // Issue
    document.getElementById("rd-issueCategory").textContent = data.issueCategory || "—";
    document.getElementById("rd-desiredOutcome").textContent = data.desiredOutcome || "—";
    document.getElementById("rd-situation").textContent = data.situation || "—";

    // Urgency & Safety
    document.getElementById("rd-urgency").textContent = data.urgency || data.priority || "—";
    document.getElementById("rd-safetyConcern").textContent = fmtYN(!!data.safetyConcern);

    // Preferences
    document.getElementById("rd-contactTimes").textContent = data.contactTimes || "—";
    document.getElementById("rd-accessNeeds").textContent = data.accessNeeds || "—";
    document.getElementById("rd-confidentialNotes").textContent = data.confidentialNotes || "—";

    // Attachments
    const list = document.getElementById("rd-attachments");
    list.innerHTML = "";
    if (Array.isArray(data.attachments) && data.attachments.length > 0) {
      data.attachments.forEach((f) => {
        const li = document.createElement("li");
        // assumes backend serves /uploads
        li.innerHTML = `<a href="/uploads/${encodeURIComponent(f.filename)}" class="link-primary mono" download>${f.originalName || f.filename}</a>`;
        list.appendChild(li);
      });
    } else {
      list.innerHTML = "<li>—</li>";
    }

    // Assign form defaults
    const asSelected = document.getElementById("as-selected");
    if (asSelected) {
      asSelected.value = `${data.caseId} — ${data.preferredName || "Survivor"} (${data.issueCategory || "Case"})`;
    }
    const prioritySel = document.getElementById("as-priority");
    if (prioritySel) prioritySel.value = data.urgency || "Medium";
    const statusSel = document.getElementById("as-status");
    if (statusSel) statusSel.value = data.status || "Submitted";

    // Assign submit
    const form = document.getElementById("assignForm");
    const ok = document.getElementById("assignSuccess");
    const err = document.getElementById("assignError");

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
          form.classList.add("was-validated");
          return;
        }
        err.classList.add("d-none");
        ok.classList.add("d-none");

        const payload = {
          lawyer: document.getElementById("as-lawyer").value,
          priority: document.getElementById("as-priority").value,
          status: document.getElementById("as-status").value,
          notes: document.getElementById("as-notes").value,
        };

        const res = await fetch(`/api/admin/cases/${encodeURIComponent(data.caseId)}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          err.textContent = "Unable to save assignment. Please try again.";
          err.classList.remove("d-none");
          return;
        }

        ok.classList.remove("d-none");
        setTimeout(() => {
          window.location.href = "admin.html?assigned=" + encodeURIComponent(data.caseId);
        }, 1200);
      });
    }
  } catch (e) {
    console.error(e);
    const main = document.querySelector("main");
    if (main) {
      main.innerHTML = `<div class="alert alert-danger mt-4">${e.message}</div>`;
    }
  }
})();
