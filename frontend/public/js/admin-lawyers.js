// Load lawyer directory list
async function loadLawyerDirectory() {
    try {
        const res = await fetch("/api/admin/lawyers", { credentials: "include" });
        if (!res.ok) throw new Error(`Failed to load lawyers: ${res.status}`);

        const json = await res.json();
        const lawyers = json.data || json.items || [];

        if (!Array.isArray(lawyers)) throw new Error("Unexpected response shape");

        const tbody = document.getElementById("lawyerTableBody");
        tbody.innerHTML = "";

        if (lawyers.length === 0) {
            tbody.innerHTML = `
              <tr>
                <td colspan="9" class="text-muted small">No lawyers found.</td>
              </tr>`;
            return;
        }

        lawyers.forEach(lawyer => {
            tbody.innerHTML += `
<tr>
    <td>${lawyer.fullName}</td>
    <td>${lawyer.specialization}</td>
    <td>${lawyer.licenseProvince || "-"}</td>
    <td>${lawyer.licenseNumber || "-"}</td>
    <td>${lawyer.yearsExperience || 0} years</td>

    <td>${lawyer.acceptingCases ? "Available" : "Unavailable"}</td>

    <td>
        <div>${lawyer.email}</div>
        <div>${lawyer.phone || "-"}</div>
    </td>

    <td>
        <span class="badge ${lawyer.isActive ? "bg-success" : "bg-secondary"}">
            ${lawyer.status}
        </span>
    </td>

    <td>
        <button class="btn btn-primary btn-sm btn-assign-case"
          data-lawyer-id="${lawyer._id}"
          data-lawyer-name="${(lawyer.fullName || "").replace(/"/g, '&quot;')}">
            Assign Case
        </button>
    </td>
</tr>
`;

        });
    } catch (err) {
        console.error("Error fetching lawyers:", err);
        const tbody = document.getElementById("lawyerTableBody");
        if (tbody) {
            tbody.innerHTML = `
              <tr>
                <td colspan="9" class="text-danger small">Unable to load lawyer directory.</td>
              </tr>`;
        }
    }
}
function assignCase(lawyerId, lawyerName) {
    // Remember the selection and jump to the assignment queue section
    try {
        sessionStorage.setItem("jc_assign_lawyer", lawyerId);
        sessionStorage.setItem("jc_assign_lawyer_name", lawyerName || "");
    } catch (_) { /* storage may be unavailable; fail soft */ }
    window.location.href = "admin.html#assign-case";
}

document.addEventListener("DOMContentLoaded", loadLawyerDirectory);

// Event delegation for Assign Case (avoids inline handlers blocked by CSP)
document.addEventListener("click", (evt) => {
    const btn = evt.target.closest(".btn-assign-case");
    if (!btn) return;
    const id = btn.dataset.lawyerId;
    const name = btn.dataset.lawyerName || "Selected Lawyer";
    assignCase(id, name);
});
