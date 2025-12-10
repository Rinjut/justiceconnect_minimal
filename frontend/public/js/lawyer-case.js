const urlParams = new URLSearchParams(window.location.search);
const caseId = urlParams.get("id");

const noteBox = document.getElementById("lawyerNote");
const noteStatus = document.getElementById("noteStatus");

loadCaseDetails();

async function loadCaseDetails() {
  try {
    const res = await fetch(`/api/lawyer/case/${caseId}`, {
      credentials: "include",
    });

    const data = await res.json();
    console.log("Loaded case:", data);

    if (!res.ok) {
      document.getElementById("case-details").innerHTML = `<p class="text-danger">${data.message}</p>`;
      return;
    }

    const attachments = Array.isArray(data.attachments) ? data.attachments : [];
    const filesHtml = attachments.length
      ? `<ul>${attachments
          .map(
            (f) =>
              `<li><a href="/uploads/${encodeURIComponent(f.filename)}" download>${f.originalName || f.filename}</a></li>`
          )
          .join("")}</ul>`
      : "<div class=\"text-muted\">No attachments</div>";

    document.getElementById("case-details").innerHTML = `
      <h5>${data.preferredName || "Anonymous"}</h5>
      <p class="text-muted">Case ID: ${data.caseId || "—"}</p>

      <div class="mb-3">
        <span class="badge bg-secondary me-2">${data.status || "—"}</span>
        <span class="badge bg-info text-dark">Urgency: ${data.urgency || "—"}</span>
      </div>

      <h6>Contact</h6>
      <p>
        <strong>Method:</strong> ${data.contactMethod || "—"}<br>
        <strong>Value:</strong> ${data.contactValue || "—"}<br>
        <strong>Safe to contact:</strong> ${data.safeToContact ? "Yes" : "No"}
      </p>

      <h6>Location</h6>
      <p>
        <strong>Province:</strong> ${data.province || "—"}<br>
        <strong>City:</strong> ${data.city || "—"}<br>
        <strong>Language:</strong> ${data.language || "—"}
      </p>

      <h6>Issue</h6>
      <p>
        <strong>Category:</strong> ${data.issueCategory || "—"}<br>
        <strong>Desired outcome:</strong> ${data.desiredOutcome || "—"}<br>
        <strong>Situation:</strong><br>${data.situation || "—"}
      </p>

      <h6>Preferences</h6>
      <p>
        <strong>Best time to contact:</strong> ${data.contactTimes || "—"}<br>
        <strong>Accessibility needs:</strong> ${data.accessNeeds || "—"}<br>
        <strong>Confidential notes:</strong> ${data.confidentialNotes || "—"}
      </p>

      <h6>Attachments</h6>
      ${filesHtml}
    `;

    if (noteBox) {
      noteBox.value = data.internalNotes || "";
    }

    const completeBtn = document.getElementById("btnCompleteCase");
    if (completeBtn && (data.status === "Closed" || data.status === "Completed")) {
      completeBtn.textContent = "Case already closed";
      completeBtn.disabled = true;
      completeBtn.classList.add("btn-outline-secondary");
    }
  } catch (err) {
    console.error("Load case error:", err);
    document.getElementById("case-details").innerHTML = `<p class="text-danger">Failed to load case.</p>`;
  }
}

async function saveNote() {
  if (!noteBox) return;
  noteStatus.textContent = "Saving...";
  noteStatus.classList.remove("text-danger");
  try {
    const res = await fetch(`/api/lawyer/case/${caseId}/note`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: noteBox.value }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Error saving note");
    noteStatus.textContent = "Saved";
  } catch (err) {
    console.error("Note save error:", err);
    noteStatus.textContent = "Save failed";
    noteStatus.classList.add("text-danger");
    alert(err.message || "Unable to save note");
  } finally {
    setTimeout(() => (noteStatus.textContent = ""), 2000);
  }
}

async function completeCase() {
  if (!confirm("Are you sure you want to complete this case?")) return;

  try {
    const res = await fetch(`/api/lawyer/case/${caseId}/complete`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (res.ok) {
      alert("Case marked as completed!");
      window.location.href = "/lawyer.html";
    } else {
      alert(data.message || "Error completing case");
    }
  } catch (err) {
    console.error("Error completing case:", err);
    alert("Server error");
  }
}

document.getElementById("btnSaveNote")?.addEventListener("click", (e) => {
  e.preventDefault();
  saveNote();
});

document.getElementById("btnCompleteCase")?.addEventListener("click", (e) => {
  e.preventDefault();
  completeCase();
});
