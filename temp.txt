async function loadLawyerDashboard() {
  try {
    const res = await fetch("/api/lawyer/dashboard", {
      credentials: "include"
    });

    const data = await res.json();
    console.log("🔵 Dashboard Data:", data);

    document.getElementById("lawyerActiveCount").textContent = data.count || 0;
    document.getElementById("lawyerLastUpdated").textContent =
      data.lastUpdated ? new Date(data.lastUpdated).toLocaleString() : "—";

    const tbody = document.getElementById("lawyer-case-list");
    tbody.innerHTML = "";

    if (!data.items || data.items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted py-4">
            No assigned clients yet.
          </td>
        </tr>
      `;
      return;
    }

    data.items.forEach(c => {
      const priorityClass =
        c.urgency === "High"
          ? "bg-danger"
          : c.urgency === "Medium"
          ? "text-bg-primary"
          : "bg-success";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td class="px-0">
          <div class="d-flex align-items-center">
            <img src="./profile/user-3.jpg" class="rounded-circle" width="40" />
            <div class="ms-3">
              <h6 class="mb-0 fw-bolder">${c.preferredName || "Anonymous Client"}</h6>
              <span class="text-muted">${c.province || ""} • ${c.issueCategory || ""}</span>
            </div>
          </div>
        </td>

        <td class="px-0">${c.caseId}</td>

        <td class="px-0">
          <span class="badge ${priorityClass}">
            ${c.urgency || "Medium"}
          </span>
        </td>

        <td class="px-0 text-dark fw-medium text-end">
          ${c.status}
          <br>
          <button class="btn btn-sm btn-outline-primary mt-2 view-case-btn"
                  data-id="${c._id}">
            View
          </button>
        </td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// SAFE EVENT LISTENER (NO INLINE SCRIPT)
document.addEventListener("click", function (e) {
  if (e.target.classList.contains("view-case-btn")) {
    const caseId = e.target.getAttribute("data-id");
    console.log("➡ Redirecting to case:", caseId);
    window.location.href = `/lawyer-case.html?id=${caseId}`;
  }
});

// Load dashboard
loadLawyerDashboard();
