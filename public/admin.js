const state = {
      assignments: [],
      assignmentsById: new Map(),
      assignmentsByWorkerId: new Map(),
      assignmentsByName: new Map(),
      timeEntries: [],
      summaries: null,
      attestationEvents: [],
      attestationStatusRows: [],
      statusMap: new Map(),
      packageId: ""
    };

    const ADMIN_PASSCODE = "admin1";

    const elements = {
      assignmentsStatus: document.getElementById("assignmentsStatus"),
      timeDetailStatus: document.getElementById("timeDetailStatus"),
      startDate: document.getElementById("startDate"),
      endDate: document.getElementById("endDate"),
      packageSummary: document.getElementById("packageSummary"),
      packageStatus: document.getElementById("packageStatus"),
      downloadPackageBtn: document.getElementById("downloadPackageBtn"),
      deletePackageBtn: document.getElementById("deletePackageBtn"),
      deletePackageStatus: document.getElementById("deletePackageStatus"),
      deleteAllPackagesBtn: document.getElementById("deleteAllPackagesBtn"),
      deleteAllPackagesStatus: document.getElementById("deleteAllPackagesStatus"),
      refreshAttestationsBtn: document.getElementById("refreshAttestationsBtn"),
      attestationStatus: document.getElementById("attestationStatus"),
      attestationSummary: document.getElementById("attestationSummary"),
      attestationTable: document.getElementById("attestationTable"),
      adminSummary: document.getElementById("adminSummary"),
      adminOutput: document.getElementById("adminOutput"),
      exportBtn: document.getElementById("exportBtn"),
      adminPasscode: document.getElementById("adminPasscode"),
      adminUnlockBtn: document.getElementById("adminUnlockBtn"),
      adminUnlockStatus: document.getElementById("adminUnlockStatus"),
      adminContent: document.getElementById("adminContent")
    };

    function normalizeHeader(value) {
      return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    const HEADER_ALIASES = {
      resourceName: ["resourcename", "resource", "employeename", "workername", "worker", "name"],
      serviceLine: ["serviceline", "service line", "service_line"].map(normalizeHeader),
      workerId: ["workerid", "resourceid", "employeeid", "worker id", "resource id", "employee id"].map(normalizeHeader),
      taskDesc: ["taskdesc", "tascdesc", "taskdescription", "tascdescription"].map(normalizeHeader),
      date: ["date", "workdate", "transactiondate", "timeentrydate"].map(normalizeHeader),
      memo: ["memo", "notes", "comment"].map(normalizeHeader),
      hours: ["hours", "hrs"].map(normalizeHeader),
      project: ["project", "projectname"].map(normalizeHeader)
    };

    function buildHeaderLookup() {
      const lookup = {};
      Object.entries(HEADER_ALIASES).forEach(([key, aliases]) => {
        aliases.forEach((alias) => {
          lookup[alias] = key;
        });
      });
      return lookup;
    }

    const HEADER_LOOKUP = buildHeaderLookup();

    function normalizeText(value) {
      return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
    }

    function normalizeWorkerId(value) {
      if (value === undefined || value === null) return "";
      const digits = String(value).replace(/\D/g, "");
      if (!digits) return "";
      return digits.replace(/^0+/, "") || digits;
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

    function parseDate(value) {
      if (!value) return null;
      if (value instanceof Date) {
        return new Date(value.getFullYear(), value.getMonth(), value.getDate());
      }
      if (typeof value === "number") {
        const parsed = XLSX.SSF.parse_date_code(value);
        if (parsed && parsed.y && parsed.m && parsed.d) {
          return new Date(parsed.y, parsed.m - 1, parsed.d);
        }
      }
      if (typeof value === "string") {
        const cleaned = value.trim();
        if (!cleaned) return null;
        const parsed = new Date(cleaned);
        if (!isNaN(parsed)) {
          return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
        }
      }
      return null;
    }

    function formatDate(value) {
      if (!value) return "";
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }

    function formatDisplayDate(value) {
      if (!value) return "";
      return value.toLocaleDateString("en-US");
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

    function readWorkbook(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const workbook = XLSX.read(e.target.result, { type: "array", cellDates: true });
            resolve(workbook);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(file);
      });
    }

    function sheetToRows(sheet) {
      return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });
    }

    function employeeKeyFor(assignment) {
      return assignment.workerIdKey ? `id:${assignment.workerIdKey}` : `name:${assignment.nameNorm}`;
    }

    function findAssignmentsSheet(workbook) {
      const sheetNames = workbook.SheetNames;
      for (const name of sheetNames) {
        const sheet = workbook.Sheets[name];
        const rows = sheetToRows(sheet).slice(0, 50);
        const headerResult = findHeaderRow(rows, ["resourceName", "serviceLine"]);
        if (headerResult) {
          return { sheet, sheetName: name, headerResult };
        }
      }
      return null;
    }

    function findHeaderRow(rows, requiredKeys) {
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const colIndexByKey = {};
        row.forEach((cell, c) => {
          const key = HEADER_LOOKUP[normalizeHeader(cell)];
          if (key && colIndexByKey[key] === undefined) {
            colIndexByKey[key] = c;
          }
        });
        const hasAll = requiredKeys.every((key) => colIndexByKey[key] !== undefined);
        if (hasAll) {
          return { rowIndex: r, colIndexByKey };
        }
      }
      return null;
    }

    function looksLikeName(value) {
      if (!value) return false;
      const text = String(value).trim();
      if (text.length < 3) return false;
      const words = text.split(/\s+/);
      if (text.includes(",")) return true;
      return words.length >= 2 && words.length <= 4;
    }

    function looksLikeServiceLine(value) {
      if (!value) return false;
      const text = String(value).toLowerCase();
      const keywords = ["aml", "audit", "testing", "compliance", "regulatory", "risk", "internal", "non-aml", "non aml"];
      return keywords.some((word) => text.includes(word));
    }

    function guessAssignmentColumns(rows) {
      const sample = rows.slice(0, 50);
      const colStats = {};
      sample.forEach((row) => {
        row.forEach((cell, idx) => {
          if (!colStats[idx]) colStats[idx] = { count: 0, nameScore: 0, serviceScore: 0 };
          if (cell !== "" && cell !== null && cell !== undefined) {
            colStats[idx].count += 1;
            if (looksLikeName(cell)) colStats[idx].nameScore += 1;
            if (looksLikeServiceLine(cell)) colStats[idx].serviceScore += 1;
          }
        });
      });
      const sorted = Object.entries(colStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 4);
      let best = null;
      sorted.forEach(([idxA, statsA]) => {
        sorted.forEach(([idxB, statsB]) => {
          if (idxA === idxB) return;
          const score = (statsA.nameScore + statsB.serviceScore);
          if (!best || score > best.score) {
            best = { nameIndex: Number(idxA), serviceIndex: Number(idxB), score };
          }
        });
      });
      if (best && best.score > 0) return best;
      return null;
    }

    async function handleAssignmentsFile(file) {
      try {
        setStatus(elements.assignmentsStatus, "Loading...", "warning");
        const workbook = await readWorkbook(file);
        let assignmentData = [];
        let headerRow = null;
        let headerMap = null;
        let usedSheet = null;
        const found = findAssignmentsSheet(workbook);
        if (found) {
          usedSheet = found.sheet;
          headerRow = found.headerResult.rowIndex;
          headerMap = found.headerResult.colIndexByKey;
        } else {
          const firstSheetName = workbook.SheetNames[0];
          usedSheet = workbook.Sheets[firstSheetName];
          const rows = sheetToRows(usedSheet);
          const guess = guessAssignmentColumns(rows);
          if (!guess) {
            throw new Error("Unable to detect Assignment headers or columns.");
          }
          headerRow = 0;
          headerMap = {
            resourceName: guess.nameIndex,
            serviceLine: guess.serviceIndex
          };
          setStatus(elements.assignmentsStatus, "Heuristic match used", "warning");
        }

        const rows = sheetToRows(usedSheet);
        for (let r = headerRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const name = row[headerMap.resourceName];
          const serviceLine = row[headerMap.serviceLine];
          if (!name && !serviceLine) continue;
          const workerIdRaw = headerMap.workerId !== undefined ? row[headerMap.workerId] : "";
          const assignment = {
            id: `A${assignmentData.length + 1}`,
            name: String(name || "").trim(),
            serviceLine: String(serviceLine || "").trim(),
            serviceLineNorm: normalizeText(serviceLine),
            workerIdRaw: String(workerIdRaw || "").trim(),
            workerIdKey: normalizeWorkerId(workerIdRaw),
            nameNorm: normalizeName(name)
          };
          if (!assignment.name || !assignment.serviceLine) continue;
          assignment.employeeKey = employeeKeyFor(assignment);
          assignmentData.push(assignment);
        }

        if (assignmentData.length === 0) {
          throw new Error("No assignment rows found.");
        }

        state.assignments = assignmentData;
        state.assignmentsById = new Map();
        state.assignmentsByWorkerId = new Map();
        state.assignmentsByName = new Map();

        assignmentData.forEach((assignment) => {
          state.assignmentsById.set(assignment.id, assignment);
          if (assignment.workerIdKey) {
            if (!state.assignmentsByWorkerId.has(assignment.workerIdKey)) {
              state.assignmentsByWorkerId.set(assignment.workerIdKey, []);
            }
            state.assignmentsByWorkerId.get(assignment.workerIdKey).push(assignment);
          }
          if (assignment.nameNorm) {
            if (!state.assignmentsByName.has(assignment.nameNorm)) {
              state.assignmentsByName.set(assignment.nameNorm, []);
            }
            state.assignmentsByName.get(assignment.nameNorm).push(assignment);
          }
        });

        markAmbiguousAssignments();
        setStatus(elements.assignmentsStatus, `Loaded ${assignmentData.length} assignments`, "success");
        recompute();
      } catch (err) {
        setStatus(elements.assignmentsStatus, err.message || "Failed to load", "warning");
      }
    }

    function markAmbiguousAssignments() {
      const duplicates = new Set();
      state.assignmentsByName.forEach((list, key) => {
        if (list.length > 1) duplicates.add(key);
      });
      state.assignments.forEach((assignment) => {
        assignment.ambiguousName = duplicates.has(assignment.nameNorm);
      });
    }

    function findTimeDetailSheet(workbook) {
      for (const name of workbook.SheetNames) {
        const sheet = workbook.Sheets[name];
        const rows = sheetToRows(sheet).slice(0, 50);
        for (let r = 0; r < rows.length; r++) {
          const row = rows[r];
          const colIndexByKey = {};
          row.forEach((cell, c) => {
            const key = HEADER_LOOKUP[normalizeHeader(cell)];
            if (key && colIndexByKey[key] === undefined) {
              colIndexByKey[key] = c;
            }
          });
          const hasTask = colIndexByKey.taskDesc !== undefined;
          const hasDate = colIndexByKey.date !== undefined;
          const hasWorker = colIndexByKey.workerId !== undefined || colIndexByKey.resourceName !== undefined;
          if (hasTask && hasDate && hasWorker) {
            return { sheet, sheetName: name, headerRow: r, colIndexByKey };
          }
        }
      }
      return null;
    }

    async function handleTimeDetailFile(file) {
      try {
        setStatus(elements.timeDetailStatus, "Loading...", "warning");
        const workbook = await readWorkbook(file);
        const found = findTimeDetailSheet(workbook);
        if (!found) {
          throw new Error("Unable to locate the Time Detail header row.");
        }
        const rows = sheetToRows(found.sheet);
        const header = found.colIndexByKey;
        const entries = [];

        for (let r = found.headerRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const taskDesc = row[header.taskDesc];
          const dateVal = row[header.date];
          const workerIdRaw = header.workerId !== undefined ? row[header.workerId] : "";
          const workerName = header.resourceName !== undefined ? row[header.resourceName] : "";
          if (!taskDesc && !workerIdRaw && !workerName) continue;
          const date = parseDate(dateVal);
          const entry = {
            rowIndex: r + 1,
            date,
            workerIdRaw: String(workerIdRaw || "").trim(),
            workerIdKey: normalizeWorkerId(workerIdRaw),
            workerName: String(workerName || "").trim(),
            workerNameNorm: normalizeName(workerName),
            taskDesc: String(taskDesc || "").trim(),
            taskDescNorm: normalizeText(taskDesc),
            memo: header.memo !== undefined ? String(row[header.memo] || "").trim() : "",
            hours: header.hours !== undefined ? row[header.hours] : "",
            project: header.project !== undefined ? String(row[header.project] || "").trim() : ""
          };
          if (!entry.taskDesc && !entry.workerName && !entry.workerIdRaw) continue;
          entries.push(entry);
        }

        if (entries.length === 0) {
          throw new Error("No time detail rows found.");
        }

        state.timeEntries = entries;
        setStatus(elements.timeDetailStatus, `Loaded ${entries.length} time rows`, "success");
        recompute();
      } catch (err) {
        setStatus(elements.timeDetailStatus, err.message || "Failed to load", "warning");
      }
    }

    function getDateRange() {
      const start = elements.startDate.value ? new Date(elements.startDate.value) : null;
      const end = elements.endDate.value ? new Date(elements.endDate.value) : null;
      return { start, end };
    }

    function inExclusiveRange(date, start, end) {
      if (!date || !start || !end) return false;
      return date > start && date < end;
    }

    function matchAssignmentForEntry(entry) {
      if (entry.workerIdKey && state.assignmentsByWorkerId.has(entry.workerIdKey)) {
        const matches = state.assignmentsByWorkerId.get(entry.workerIdKey);
        return { assignment: matches[0], ambiguous: matches.length > 1, reason: "Duplicate Worker ID" };
      }
      if (entry.workerNameNorm && state.assignmentsByName.has(entry.workerNameNorm)) {
        const matches = state.assignmentsByName.get(entry.workerNameNorm);
        return { assignment: matches[0], ambiguous: matches.length > 1, reason: "Ambiguous name match" };
      }
      return { assignment: null, ambiguous: false, reason: "" };
    }

    function computeSummaries() {
      const { start, end } = getDateRange();
      if (!start || !end) return null;
      const summariesById = new Map();
      const unmatched = [];
      const ambiguousEntries = [];
      const entriesInRange = state.timeEntries.filter((entry) => inExclusiveRange(entry.date, start, end));

      function getSummary(assignment) {
        if (!summariesById.has(assignment.id)) {
          summariesById.set(assignment.id, {
            assignment,
            entryCount: 0,
            incorrectEntries: [],
            missingMemos: [],
            ambiguous: false
          });
        }
        return summariesById.get(assignment.id);
      }

      entriesInRange.forEach((entry) => {
        const match = matchAssignmentForEntry(entry);
        if (!match.assignment) {
          unmatched.push(entry);
          return;
        }
        const summary = getSummary(match.assignment);
        summary.entryCount += 1;
        if (match.ambiguous) {
          summary.ambiguous = true;
          ambiguousEntries.push({ entry, reason: match.reason });
        }
        const expected = match.assignment.serviceLineNorm;
        const actual = entry.taskDescNorm;
        if (expected && actual && expected !== actual) {
          entry.mismatchReason = "Task Desc does not match Service Line";
          summary.incorrectEntries.push(entry);
        } else if (!expected || !actual) {
          entry.mismatchReason = "Missing Service Line or Task Desc";
          summary.incorrectEntries.push(entry);
        }
        if (!entry.memo || entry.memo.trim() === "") {
          summary.missingMemos.push(entry);
        }
      });

      return {
        summariesById,
        entriesInRange,
        unmatched,
        ambiguousEntries,
        start,
        end
      };
    }

    function recompute() {
      if (state.assignments.length === 0 || state.timeEntries.length === 0) {
        elements.packageSummary.innerHTML = "";
        setStatus(elements.packageStatus, "Not Ready", "");
        elements.adminSummary.innerHTML = "";
        elements.adminOutput.innerHTML = "";
        return;
      }
  state.summaries = computeSummaries();
  updatePackageSummary();
  updateAdminOutput();
  updateAttestationStatusFromEvents(state.attestationStatusRows);
}

    function updatePackageSummary() {
      if (!state.summaries) {
        elements.packageSummary.innerHTML = "";
        setStatus(elements.packageStatus, "Not Ready", "");
        return;
      }
      let incorrectTotal = 0;
      let memoTotal = 0;
      state.summaries.summariesById.forEach((summary) => {
        incorrectTotal += summary.incorrectEntries.length;
        memoTotal += summary.missingMemos.length;
      });
      elements.packageSummary.innerHTML = `
        <span class="pill"><strong>Employees:</strong> ${state.assignments.length}</span>
        <span class="pill"><strong>Entries in Range:</strong> ${state.summaries.entriesInRange.length}</span>
        <span class="pill"><strong>Incorrect Entries:</strong> ${incorrectTotal}</span>
        <span class="pill"><strong>Missing Memos:</strong> ${memoTotal}</span>
      `;
    setStatus(elements.packageStatus, "Ready to Publish", "success");
    }

    function buildEmployeePackage() {
      if (!state.summaries) return null;
      const { summariesById, start, end } = state.summaries;
      state.packageId = `CroweRecon_${Date.now()}`;
      const summaryMap = {};
      state.assignments.forEach((assignment) => {
        const summary = summariesById.get(assignment.id);
        summaryMap[assignment.id] = {
          entryCount: summary ? summary.entryCount : 0,
          incorrectEntries: summary ? summary.incorrectEntries.map(stripEntry) : [],
          missingMemos: summary ? summary.missingMemos.map(stripEntry) : [],
          ambiguous: summary ? summary.ambiguous : assignment.ambiguousName
        };
      });
      return {
        version: "1.0",
        packageId: state.packageId,
        generatedAt: new Date().toISOString(),
        period: {
          start: formatDate(start),
          end: formatDate(end)
        },
        assignments: state.assignments.map((assignment) => ({
          id: assignment.id,
          name: assignment.name,
          workerIdRaw: assignment.workerIdRaw,
          serviceLine: assignment.serviceLine,
          nameNorm: assignment.nameNorm,
          employeeKey: assignment.employeeKey,
          ambiguousName: assignment.ambiguousName
        })),
        summaries: summaryMap
      };
    }

    function stripEntry(entry) {
      return {
        date: entry.date ? entry.date.toISOString() : "",
        taskDesc: entry.taskDesc || "",
        project: entry.project || "",
        hours: entry.hours || "",
        memo: entry.memo || ""
      };
    }

  async function publishEmployeePackage() {
    const pkg = buildEmployeePackage();
    if (!pkg) return;
    setStatus(elements.packageStatus, "Publishing...", "warning");
    try {
      const data = await apiRequestJson("/api/packages", {
        method: "POST",
        body: JSON.stringify(pkg)
      });
      state.packageId = data && data.packageId ? data.packageId : pkg.packageId;
      setStatus(elements.packageStatus, "Published", "success");
      await refreshAttestationStatus();
    } catch (err) {
      setStatus(elements.packageStatus, err.message || "Publish failed", "warning");
    }
  }

  async function deleteLatestPackage() {
    if (!confirm("Delete the latest published package? This cannot be undone.")) return;
    elements.deletePackageStatus.textContent = "Deleting...";
    try {
      const data = await apiRequestJson("/api/packages/latest", { method: "DELETE" });
      elements.deletePackageStatus.textContent = `Deleted ${data.packageId}`;
      state.packageId = "";
    } catch (err) {
      elements.deletePackageStatus.textContent = err.message || "Delete failed";
    }
  }

  async function deleteAllPackages() {
    if (!confirm("Delete ALL published packages? This cannot be undone.")) return;
    elements.deleteAllPackagesStatus.textContent = "Deleting...";
    try {
      const data = await apiRequestJson("/api/packages", { method: "DELETE" });
      elements.deleteAllPackagesStatus.textContent = `Deleted ${data.count || 0} package(s)`;
      state.packageId = "";
    } catch (err) {
      elements.deleteAllPackagesStatus.textContent = err.message || "Delete failed";
    }
  }

    function updateAdminOutput() {
      if (!state.summaries) return;
      const { summariesById, entriesInRange, unmatched, ambiguousEntries } = state.summaries;
      const summaries = Array.from(summariesById.values());
      const incorrectSummaries = summaries
        .filter((summary) => summary.incorrectEntries.length > 0)
        .sort((a, b) => {
          const diff = b.incorrectEntries.length - a.incorrectEntries.length;
          if (diff !== 0) return diff;
          return a.assignment.name.localeCompare(b.assignment.name);
        });
      const missingMemoSummaries = summaries
        .filter((summary) => summary.missingMemos.length > 0)
        .sort((a, b) => {
          const diff = b.missingMemos.length - a.missingMemos.length;
          if (diff !== 0) return diff;
          return a.assignment.name.localeCompare(b.assignment.name);
        });

      elements.adminSummary.innerHTML = `
        <span class="pill"><strong>Total Entries:</strong> ${entriesInRange.length}</span>
        <span class="pill"><strong>Employees w/ Incorrect:</strong> ${incorrectSummaries.length}</span>
        <span class="pill"><strong>Unmatched Entries:</strong> ${unmatched.length}</span>
        <span class="pill"><strong>Ambiguous Matches:</strong> ${ambiguousEntries.length}</span>
      `;

      let html = "";
      if (incorrectSummaries.length === 0) {
        html += "<p class='success'>No incorrect entries detected for this range.</p>";
      } else {
        html += "<h3>Employees with Incorrect Entries</h3>";
        html += `
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Worker ID</th>
                <th>Expected Service Line</th>
                <th>Incorrect Entries</th>
              </tr>
            </thead>
            <tbody>
              ${incorrectSummaries.map((summary) => `
                <tr>
                  <td>${summary.assignment.name}</td>
                  <td>${summary.assignment.workerIdRaw || ""}</td>
                  <td>${summary.assignment.serviceLine}</td>
                  <td>${summary.incorrectEntries.length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      }

      if (missingMemoSummaries.length === 0) {
        html += "<p class='muted'>No missing memos detected for this range.</p>";
      } else {
        html += "<h3>Employees with Missing Memos</h3>";
        html += `
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Worker ID</th>
                <th>Expected Service Line</th>
                <th>Missing Memos</th>
              </tr>
            </thead>
            <tbody>
              ${missingMemoSummaries.map((summary) => `
                <tr>
                  <td>${summary.assignment.name}</td>
                  <td>${summary.assignment.workerIdRaw || ""}</td>
                  <td>${summary.assignment.serviceLine}</td>
                  <td>${summary.missingMemos.length}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        `;
      }

      if (unmatched.length > 0) {
        html += `<h3>Unmatched Time Entries</h3>${renderEntriesTable(unmatched)}`;
      }

      if (ambiguousEntries.length > 0) {
        html += `<h3>Ambiguous Matches</h3>${renderAmbiguousTable(ambiguousEntries)}`;
      }

      elements.adminOutput.innerHTML = html;
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

    function renderAmbiguousTable(entries) {
      const rows = entries.map(({ entry, reason }) => `
        <tr>
          <td>${formatDisplayDate(entry.date)}</td>
          <td>${entry.workerName || ""}</td>
          <td>${entry.workerIdRaw || ""}</td>
          <td>${entry.taskDesc || ""}</td>
          <td>${reason}</td>
        </tr>
      `).join("");
      return `
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Worker</th>
              <th>Worker ID</th>
              <th>Task Desc</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function updateAttestationStatusFromEvents(statusRows) {
      state.statusMap = new Map();
      const statusByKey = new Map();
      (statusRows || []).forEach((row) => {
        statusByKey.set(row.employeeKey, {
          lastViewed: row.lastViewed ? new Date(row.lastViewed) : null,
          lastAttested: row.lastAttested ? new Date(row.lastAttested) : null,
          employeeName: row.employeeName || "",
          workerId: row.workerId || "",
          attestationNotes: row.attestationNotes || ""
        });
      });

      state.assignments.forEach((assignment) => {
        const eventStatus = statusByKey.get(assignment.employeeKey);
        state.statusMap.set(assignment.employeeKey, {
          assignment,
          lastViewed: eventStatus ? eventStatus.lastViewed : null,
          lastAttested: eventStatus ? eventStatus.lastAttested : null,
          attestationNotes: eventStatus ? (eventStatus.attestationNotes || "") : "",
          status: "Not Started"
        });
      });

      let completed = 0;
      let inProgress = 0;
      let notStarted = 0;
      state.statusMap.forEach((status) => {
        if (status.lastAttested) {
          status.status = "Completed";
          completed += 1;
        } else if (status.lastViewed) {
          status.status = "In Progress";
          inProgress += 1;
        } else {
          status.status = "Not Started";
          notStarted += 1;
        }
      });

      elements.attestationSummary.innerHTML = `
        <span class="pill"><strong>Completed:</strong> ${completed}</span>
        <span class="pill"><strong>In Progress:</strong> ${inProgress}</span>
        <span class="pill"><strong>Not Started:</strong> ${notStarted}</span>
      `;

      elements.attestationTable.innerHTML = renderAttestationTable();
    }

    function renderAttestationTable() {
      const rows = Array.from(state.statusMap.values())
        .sort((a, b) => a.assignment.name.localeCompare(b.assignment.name))
        .map((status) => `
        <tr>
          <td>${status.assignment.name}${status.assignment.ambiguousName ? " <span class=\"badge\">Ambiguous</span>" : ""}</td>
          <td>${status.assignment.workerIdRaw || ""}</td>
          <td>${status.status}</td>
          <td>${status.lastViewed ? status.lastViewed.toLocaleString("en-US") : ""}</td>
          <td>${status.lastAttested ? status.lastAttested.toLocaleString("en-US") : ""}</td>
          <td>${status.attestationNotes || ""}</td>
        </tr>
      `).join("");
      return `
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Worker ID</th>
              <th>Status</th>
              <th>Last Viewed</th>
              <th>Last Attested</th>
              <th>Attestation Notes</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    async function refreshAttestationStatus() {
      if (!state.packageId) {
        elements.attestationStatus.textContent = "Publish a package first.";
        return;
      }
      elements.attestationStatus.textContent = "Refreshing...";
      try {
        const data = await apiRequestJson(`/api/attestations/status?packageId=${encodeURIComponent(state.packageId)}`);
        state.attestationEvents = data.events || [];
        state.attestationStatusRows = data.status || [];
        updateAttestationStatusFromEvents(state.attestationStatusRows);
        elements.attestationStatus.textContent = "Updated " + new Date().toLocaleString("en-US");
      } catch (err) {
        elements.attestationStatus.textContent = err.message || "Refresh failed";
      }
    }

    function exportAdminReport() {
      if (!state.summaries) return;
      const wb = XLSX.utils.book_new();
      const { summariesById, unmatched, start, end } = state.summaries;
      const dashboard = [[
        "Employee",
        "Worker ID",
        "Expected Service Line",
        "Incorrect Entries",
        "Missing Memos",
        "Attestation Status",
        "Last Viewed",
        "Last Attested"
      ]];

      state.assignments.forEach((assignment) => {
        const summary = summariesById.get(assignment.id);
        const incorrect = summary ? summary.incorrectEntries.length : 0;
        const missing = summary ? summary.missingMemos.length : 0;
        const status = state.statusMap.get(assignment.employeeKey) || {};
        dashboard.push([
          assignment.name,
          assignment.workerIdRaw,
          assignment.serviceLine,
          incorrect,
          missing,
          status.status || "Not Started",
          status.lastViewed ? status.lastViewed.toLocaleString("en-US") : "",
          status.lastAttested ? status.lastAttested.toLocaleString("en-US") : ""
        ]);
      });

      const dashSheet = XLSX.utils.aoa_to_sheet(dashboard);
      XLSX.utils.book_append_sheet(wb, dashSheet, "Dashboard");

      const incorrectSummaryRows = [[
        "Employee",
        "Worker ID",
        "Expected Service Line",
        "Incorrect Entries"
      ]];
      const missingMemoRows = [[
        "Employee",
        "Worker ID",
        "Expected Service Line",
        "Missing Memos"
      ]];

      const incorrectSummaryItems = [];
      const missingMemoItems = [];

      state.assignments.forEach((assignment) => {
        const summary = summariesById.get(assignment.id);
        const incorrect = summary ? summary.incorrectEntries.length : 0;
        const missing = summary ? summary.missingMemos.length : 0;
        if (incorrect > 0) {
          incorrectSummaryItems.push({
            name: assignment.name,
            workerIdRaw: assignment.workerIdRaw,
            serviceLine: assignment.serviceLine,
            count: incorrect
          });
        }
        if (missing > 0) {
          missingMemoItems.push({
            name: assignment.name,
            workerIdRaw: assignment.workerIdRaw,
            serviceLine: assignment.serviceLine,
            count: missing
          });
        }
      });

      incorrectSummaryItems
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .forEach((item) => {
          incorrectSummaryRows.push([
            item.name,
            item.workerIdRaw,
            item.serviceLine,
            item.count
          ]);
        });

      missingMemoItems
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
        .forEach((item) => {
          missingMemoRows.push([
            item.name,
            item.workerIdRaw,
            item.serviceLine,
            item.count
          ]);
        });

      if (incorrectSummaryRows.length > 1) {
        const incorrectSheet = XLSX.utils.aoa_to_sheet(incorrectSummaryRows);
        XLSX.utils.book_append_sheet(wb, incorrectSheet, "Incorrect Entries");
      }

      if (missingMemoRows.length > 1) {
        const missingSheet = XLSX.utils.aoa_to_sheet(missingMemoRows);
        XLSX.utils.book_append_sheet(wb, missingSheet, "Missing Memos");
      }

      if (unmatched.length > 0) {
        const unmatchedData = [["Date", "Worker", "Worker ID", "Task Desc", "Project", "Hours", "Memo"]];
        unmatched.forEach((entry) => {
          unmatchedData.push([
            formatDisplayDate(entry.date),
            entry.workerName,
            entry.workerIdRaw,
            entry.taskDesc,
            entry.project,
            entry.hours,
            entry.memo
          ]);
        });
        const unmatchedSheet = XLSX.utils.aoa_to_sheet(unmatchedData);
        XLSX.utils.book_append_sheet(wb, unmatchedSheet, "Unmatched");
      }

      if (state.attestationEvents && state.attestationEvents.length > 0) {
        const logRows = [["Employee", "Worker ID", "Event", "Timestamp", "Details"]];
        state.attestationEvents.forEach((event) => {
          logRows.push([
            event.employeeName || "",
            event.workerId || "",
            event.eventType || "",
            event.createdAt ? new Date(event.createdAt).toLocaleString("en-US") : "",
            event.details || ""
          ]);
        });
        const logSheet = XLSX.utils.aoa_to_sheet(logRows);
        XLSX.utils.book_append_sheet(wb, logSheet, "Attestation Log");
      }

      const usedNames = new Set(["Dashboard", "Incorrect Entries", "Missing Memos", "Unmatched", "Attestation Log"]);
      const employeeSheetItems = state.assignments.map((assignment) => {
        const summary = summariesById.get(assignment.id);
        const incorrect = summary ? summary.incorrectEntries.length : 0;
        const missing = summary ? summary.missingMemos.length : 0;
        return {
          assignment,
          incorrect,
          missing,
          total: incorrect + missing,
          hasBoth: incorrect > 0 && missing > 0
        };
      });

      const withErrors = employeeSheetItems
        .filter((item) => item.total > 0)
        .sort((a, b) => {
          if (b.total !== a.total) return b.total - a.total;
          if (a.hasBoth !== b.hasBoth) return a.hasBoth ? -1 : 1;
          if (b.incorrect !== a.incorrect) return b.incorrect - a.incorrect;
          if (b.missing !== a.missing) return b.missing - a.missing;
          return a.assignment.name.localeCompare(b.assignment.name);
        });

      const noErrors = employeeSheetItems
        .filter((item) => item.total === 0)
        .sort((a, b) => a.assignment.name.localeCompare(b.assignment.name));

      withErrors.concat(noErrors).forEach((item) => {
        const assignment = item.assignment;
        const summary = summariesById.get(assignment.id);
        const incorrect = summary ? summary.incorrectEntries : [];
        const missing = summary ? summary.missingMemos : [];
        const sheetName = makeSheetName(assignment.name, usedNames);
        const rows = [
          ["Employee", assignment.name],
          ["Worker ID", assignment.workerIdRaw],
          ["Expected Service Line", assignment.serviceLine],
          ["Date Range", `${formatDisplayDate(start)} to ${formatDisplayDate(end)} (exclusive)`],
          []
        ];

        if (incorrect.length === 0) {
          rows.push(["You are amazing, you don’t need any reconciliations"]);
        } else {
          rows.push(["Incorrect Entries"]);
          rows.push(["Date", "Task Desc", "Project", "Hours", "Memo"]);
          incorrect.forEach((entry) => {
            rows.push([
              formatDisplayDate(entry.date),
              entry.taskDesc,
              entry.project,
              entry.hours,
              entry.memo
            ]);
          });
        }

        if (missing.length > 0) {
          rows.push([]);
          rows.push(["Entries Missing Memos"]);
          rows.push(["Date", "Task Desc", "Project", "Hours", "Memo"]);
          missing.forEach((entry) => {
            rows.push([
              formatDisplayDate(entry.date),
              entry.taskDesc,
              entry.project,
              entry.hours,
              entry.memo
            ]);
          });
        }

        const sheet = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName);
      });

      const filename = `Crowe_Admin_Recon_${formatDate(start)}_${formatDate(end)}.xlsx`;
      XLSX.writeFile(wb, filename);
    }

    function makeSheetName(name, usedNames) {
      let cleaned = String(name || "Employee").replace(/[\[\]\*\?\/\\:]/g, "").trim();
      if (cleaned.length > 31) cleaned = cleaned.slice(0, 31);
      let finalName = cleaned || "Employee";
      let index = 1;
      while (usedNames.has(finalName)) {
        const suffix = `_${index}`;
        finalName = (cleaned.slice(0, 31 - suffix.length) + suffix);
        index += 1;
      }
      usedNames.add(finalName);
      return finalName;
    }

    function initDateDefaults() {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 1);
      elements.startDate.value = formatDate(start);
      elements.endDate.value = formatDate(end);
    }

    function bindDropZone(dropZoneId, handler) {
      const zone = document.getElementById(dropZoneId);
      zone.addEventListener("dragover", (e) => {
        e.preventDefault();
        zone.classList.add("dragover");
      });
      zone.addEventListener("dragleave", () => zone.classList.remove("dragover"));
      zone.addEventListener("drop", (e) => {
        e.preventDefault();
        zone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) handler(file);
      });
    }

    document.getElementById("themeToggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      const dark = document.body.classList.contains("dark");
      document.getElementById("themeToggle").textContent = dark ? "Enable Light Mode" : "Enable Dark Mode";
      localStorage.setItem("crowe_theme_admin", dark ? "dark" : "light");
    });

    document.getElementById("assignmentsFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleAssignmentsFile(file);
    });

    document.getElementById("timeDetailFile").addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) handleTimeDetailFile(file);
    });

    elements.startDate.addEventListener("change", () => recompute());
    elements.endDate.addEventListener("change", () => recompute());

  elements.downloadPackageBtn.addEventListener("click", publishEmployeePackage);
  elements.deletePackageBtn.addEventListener("click", deleteLatestPackage);
  elements.deleteAllPackagesBtn.addEventListener("click", deleteAllPackages);
    elements.refreshAttestationsBtn.addEventListener("click", refreshAttestationStatus);
    elements.exportBtn.addEventListener("click", exportAdminReport);

    elements.adminUnlockBtn.addEventListener("click", () => {
      if (elements.adminPasscode.value === ADMIN_PASSCODE) {
        elements.adminContent.classList.remove("hidden");
        elements.adminUnlockStatus.textContent = "Unlocked";
        elements.adminUnlockStatus.className = "success";
      } else {
        elements.adminUnlockStatus.textContent = "Incorrect passcode";
        elements.adminUnlockStatus.className = "alert";
      }
    });

    bindDropZone("assignmentsDrop", handleAssignmentsFile);
    bindDropZone("timeDetailDrop", handleTimeDetailFile);

    (function initTheme() {
      const stored = localStorage.getItem("crowe_theme_admin");
      if (stored === "dark") {
        document.body.classList.add("dark");
        document.getElementById("themeToggle").textContent = "Enable Light Mode";
      }
    })();

    initDateDefaults();
