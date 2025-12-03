// Extract case ID from URL
const urlParams = new URLSearchParams(window.location.search);
const caseId = urlParams.get("id");

// Load case details when page opens
loadCaseDetails();

async function loadCaseDetails() {
  try {
    const res = await fetch(`/api/lawyer/case/${caseId}`, {
      credentials: "include"
    });

    const data = await res.json();
    console.log("Loaded case:", data);

    if (!res.ok) {
      document.getElementById("case-details").innerHTML =
        `<p class="text-danger">${data.message}</p>`;
      return;
    }

    document.getElementById("case-details").innerHTML = `
      <h5>${data.preferredName || "Anonymous"}</h5>
      <p><strong>Case ID:</strong> ${data.caseId}</p>
      <p><strong>Status:</strong> ${data.status}</p>
      <p><strong>Urgency:</strong> ${data.urgency}</p>
      <p><strong>Situation:</strong><br>${data.situation}</p>
      <p><strong>Province:</strong> ${data.province}</p>
      <p><strong>Assigned Lawyer:</strong> ${data.assignedLawyerName || "—"}</p>
    `;
  } catch (err) {
    console.error("Load case error:", err);
    document.getElementById("case-details").innerHTML =
      `<p class="text-danger">Failed to load case.</p>`;
  }
}


// Complete case
document.getElementById("btnCompleteCase")
  .addEventListener("click", async () => {

    if (!confirm("Are you sure you want to complete this case?")) return;

    try {
      const res = await fetch(`/api/lawyer/case/${caseId}/complete`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
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
  });
