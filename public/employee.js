const state = {
      pkg: null,
      assignments: [],
      assignmentsById: new Map(),
      summariesById: new Map(),
      currentEmployeeId: ""
    };

    const elements = {
      packageStatus: document.getElementById("packageStatus"),
      packageInfo: document.getElementById("packageInfo"),
      employeeSelect: document.getElementById("employeeSelect"),
      employeeStatus: document.getElementById("employeeStatus"),
      employeeSummary: document.getElementById("employeeSummary"),
      employeeOutput: document.getElementById("employeeOutput"),
      attestationPanel: document.getElementById("attestationPanel"),
      attestationMessage: document.getElementById("attestationMessage"),
      attestationNotes: document.getElementById("attestationNotes"),
      attestationCheck: document.getElementById("attestationCheck"),
      attestationStatus: document.getElementById("attestationStatus"),
      attestBtn: document.getElementById("attestBtn")
    };

    function normalizeText(value) {
      return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
    }

    function normalizeName(value) {
      if (!value) return "";
      let text = String(value).trim();
      if (text.includes(",")) {
        const parts = text.split(",");
        const last = parts[0].trim();
        const rest = parts.slice(1).join(" ").trim();
        if (rest) text = rest + " " + last;
      }
      text = text.replace(/[^a-zA-Z\s]/g, " ");
      return text.replace(/\s+/g, " ").trim().toLowerCase();
    }

    function formatDisplayDate(value) {
      if (!value) return "";
      const date = value instanceof Date ? value : new Date(value);
      if (isNaN(date)) return "";
      return date.toLocaleDateString("en-US");
    }

    function setStatus(el, text, status) {
      el.textContent = text;
      el.className = "status" + (status ? " " + status : "");
    }

    async function apiRequestJson(url, options) {
      const opts = options || {};
      const headers = Object.assign({ "Content-Type": "application/json" }, opts.headers || {});
      const res = await fetch(url, Object.assign({}, opts, { headers }));
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || `Request failed (${res.status})`);
      }
      if (res.status === 204) return null;
      return res.json();
    }

    async function loadLatestPackage() {
      try {
        setStatus(elements.packageStatus, "Loading latest package...", "warning");
        const pkg = await apiRequestJson("/api/packages/latest");
        if (!pkg || !pkg.assignments || !pkg.summaries) {
          throw new Error("No package available.");
        }
        state.pkg = pkg;
        state.assignments = pkg.assignments;
        state.assignmentsById = new Map();
        state.summariesById = new Map();
        state.assignments.forEach((assignment) => {
          state.assignmentsById.set(assignment.id, assignment);
        });
        Object.keys(pkg.summaries).forEach((id) => {
          state.summariesById.set(id, pkg.summaries[id]);
        });
        populateEmployeeDropdown();
        updatePackageInfo();
        setStatus(elements.packageStatus, "Package Loaded", "success");
        elements.employeeStatus.textContent = "Ready";
      } catch (err) {
        setStatus(elements.packageStatus, err.message || "Failed to load", "warning");
      }
    }

    function updatePackageInfo() {
      if (!state.pkg) return;
      elements.packageInfo.innerHTML = `
        <span class="pill"><strong>Period:</strong> ${state.pkg.period.start} to ${state.pkg.period.end}</span>
        <span class="pill"><strong>Employees:</strong> ${state.assignments.length}</span>
        <span class="pill"><strong>Generated:</strong> ${new Date(state.pkg.generatedAt).toLocaleString("en-US")}</span>
      `;
    }

    function populateEmployeeDropdown() {
      elements.employeeSelect.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select your name";
      elements.employeeSelect.appendChild(placeholder);

      const sorted = [...state.assignments].sort((a, b) => a.name.localeCompare(b.name));
      sorted.forEach((assignment) => {
        const option = document.createElement("option");
        option.value = assignment.id;
        const suffix = assignment.workerIdRaw ? ` (${assignment.workerIdRaw})` : "";
        const amb = assignment.ambiguousName ? " [Ambiguous]" : "";
        option.textContent = `${assignment.name}${suffix}${amb}`;
        elements.employeeSelect.appendChild(option);
      });
    }

    async function postAttestationEvent(eventType, details) {
      if (!state.pkg || !state.currentEmployeeId) return;
      const assignment = state.assignmentsById.get(state.currentEmployeeId);
      if (!assignment) return;
      try {
        await apiRequestJson("/api/attestations", {
          method: "POST",
          body: JSON.stringify({
            packageId: state.pkg.packageId,
            employeeKey: assignment.employeeKey,
            employeeName: assignment.name,
            workerId: assignment.workerIdRaw || "",
            eventType,
            details: details || ""
          })
        });
      } catch (err) {
        elements.attestationStatus.textContent = err.message || "Unable to save attestation.";
        elements.attestationStatus.className = "alert";
      }
    }

    function updateEmployeeView() {
      const selectedId = elements.employeeSelect.value;
      elements.employeeSummary.innerHTML = "";
      elements.employeeOutput.innerHTML = "";
      elements.attestationPanel.classList.add("hidden");
      elements.attestationStatus.textContent = "";
      elements.attestationStatus.className = "muted";
      elements.attestationCheck.checked = false;
      elements.attestationNotes.value = "";
      state.currentEmployeeId = selectedId;

      if (!selectedId || !state.pkg) return;
      const assignment = state.assignmentsById.get(selectedId);
      const summary = state.summariesById.get(selectedId) || {
        entryCount: 0,
        incorrectEntries: [],
        missingMemos: [],
        ambiguous: assignment ? assignment.ambiguousName : false
      };

      postAttestationEvent("Viewed", `Range ${state.pkg.period.start} to ${state.pkg.period.end}`);
      elements.attestationStatus.textContent = "View saved.";
      elements.attestationStatus.className = "muted";

      elements.employeeSummary.innerHTML = `
        <span class="pill"><strong>Expected Service Line:</strong> ${assignment.serviceLine || "Unknown"}</span>
        <span class="pill"><strong>Total Entries:</strong> ${summary.entryCount}</span>
        <span class="pill"><strong>Incorrect Entries:</strong> ${summary.incorrectEntries.length}</span>
        <span class="pill"><strong>Missing Memos:</strong> ${summary.missingMemos.length}</span>
        ${summary.ambiguous ? `<span class="pill" style="color: var(--warning);">Ambiguous name match detected</span>` : ""}
      `;

      if (summary.entryCount === 0) {
        elements.employeeOutput.innerHTML = "<p class='muted'>No time entries found for this date range.</p>";
      } else if (summary.incorrectEntries.length === 0) {
        elements.employeeOutput.innerHTML = "<p class='success'>You are amazing, you don’t need any reconciliations.</p>";
      } else {
        elements.employeeOutput.innerHTML = `
          <h3>Incorrect Entries</h3>
          ${renderEntriesTable(summary.incorrectEntries)}
        `;
      }

      if (summary.missingMemos.length > 0) {
        elements.employeeOutput.innerHTML += `
          <h3>Entries Missing Memos</h3>
          ${renderEntriesTable(summary.missingMemos)}
        `;
      }

      const attestationText = "Please attest that you have checked both systems (Crowe Workday and Client system) to update any incorrect hours and add missing memo entries.";
      elements.attestationMessage.textContent = attestationText;
      elements.attestationPanel.classList.remove("hidden");
    }

    function renderEntriesTable(entries) {
      if (!entries || entries.length === 0) {
        return "<p class='muted'>No entries.</p>";
      }
      const rows = entries.map((entry) => `
        <tr>
          <td>${formatDisplayDate(entry.date)}</td>
          <td>${entry.taskDesc || ""}</td>
          <td>${entry.project || ""}</td>
          <td>${entry.hours || ""}</td>
          <td>${entry.memo || ""}</td>
        </tr>
      `).join("");
      return `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Task Desc</th>
              <th>Project</th>
              <th>Hours</th>
              <th>Memo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    loadLatestPackage();

    elements.employeeSelect.addEventListener("change", () => updateEmployeeView());

    elements.attestBtn.addEventListener("click", async () => {
      if (!elements.attestationCheck.checked) {
        elements.attestationStatus.textContent = "Please check the confirmation box first.";
        elements.attestationStatus.className = "alert";
        return;
      }
      const notes = elements.attestationNotes.value.trim();
      if (!notes) {
        elements.attestationStatus.textContent = "Please enter notes before submitting.";
        elements.attestationStatus.className = "alert";
        return;
      }
      if (notes.length > 256) {
        elements.attestationStatus.textContent = "Notes must be 256 characters or fewer.";
        elements.attestationStatus.className = "alert";
        return;
      }
      await postAttestationEvent("Attested", notes);
      elements.attestationStatus.textContent = `Attested on ${new Date().toLocaleString("en-US")}`;
      elements.attestationStatus.className = "success";
    });

    document.getElementById("themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const dark = document.body.classList.contains("dark");
      document.getElementById("themeToggle").textContent = dark ? "Enable Light Mode" : "Enable Dark Mode";
      localStorage.setItem("crowe_theme_employee", dark ? "dark" : "light");
    });

    (function initTheme() {
      const stored = localStorage.getItem("crowe_theme_employee");
      if (stored === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeToggle").textContent = "Enable Light Mode";
      }
    })();
