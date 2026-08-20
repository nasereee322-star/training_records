/* App — routing, rendering, forms, import/export. */
(function () {
  "use strict";

  /* ---------- helpers ---------- */
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const EXPIRING_WINDOW_DAYS = 60;

  function daysUntil(iso) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(iso + "T00:00:00");
    return Math.round((target - today) / 86400000);
  }

  function statusOf(rec) {
    if (!rec.expiresOn) return "permanent";
    const d = daysUntil(rec.expiresOn);
    if (d < 0) return "expired";
    if (d <= EXPIRING_WINDOW_DAYS) return "expiring";
    return "valid";
  }

  const STATUS_META = {
    valid: { label: "Valid", cls: "stamp-valid" },
    expiring: { label: "Expiring", cls: "stamp-expiring" },
    expired: { label: "Expired", cls: "stamp-expired" },
    permanent: { label: "No Expiry", cls: "stamp-permanent" }
  };

  const CATEGORIES = ["Safety", "Compliance", "Technical", "Equipment", "First Aid", "Quality", "Leadership", "HR"];

  const empById = (id) => Store.employees.find((e) => e.id === id);

  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- router ---------- */
  const VIEWS = {
    dashboard: { title: "Dashboard", sub: "Ledger of certifications & training" },
    employees: { title: "Employees", sub: "Personnel on file" },
    records: { title: "Training Records", sub: "All filings, certifications & courses" }
  };

  let currentView = "dashboard";

  function route() {
    const hash = location.hash.replace("#/", "") || "dashboard";
    currentView = VIEWS[hash] ? hash : "dashboard";
    $$(".nav-item").forEach((a) => a.classList.toggle("active", a.dataset.view === currentView));
    $$(".view").forEach((v) => (v.style.display = "none"));
    $("#view-" + currentView).style.display = "block";
    $("#page-title").textContent = VIEWS[currentView].title;
    $("#page-subtitle").textContent = VIEWS[currentView].sub;
    render();
  }

  function render() {
    $("#global-search").value = filters.q;
    if (currentView === "dashboard") renderDashboard();
    if (currentView === "employees") renderEmployees();
    if (currentView === "records") renderRecords();
  }

  const filters = { q: "", status: "all", category: "all" };

  /* ---------- dashboard ---------- */
  function renderDashboard() {
    const recs = Store.records;
    const emps = Store.employees;
    const counts = { valid: 0, expiring: 0, expired: 0, permanent: 0 };
    recs.forEach((r) => counts[statusOf(r)]++);

    const attention = recs
      .filter((r) => ["expiring", "expired"].includes(statusOf(r)))
      .sort((a, b) => daysUntil(a.expiresOn) - daysUntil(b.expiresOn));

    const compliance = recs.length
      ? Math.round(((counts.valid + counts.permanent) / recs.length) * 100)
      : 100;

    const byCat = {};
    recs.forEach((r) => (byCat[r.category] = (byCat[r.category] || 0) + 1));
    const maxCat = Math.max(1, ...Object.values(byCat));

    const recent = [...recs]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    $("#view-dashboard").innerHTML = `
      <div class="stat-grid">
        ${statCard(0, "01", "Employees on file", emps.length, "", "personnel registered")}
        ${statCard(1, "02", "Records filed", recs.length, "", "certificates & courses")}
        ${statCard(2, "03", "Expiring soon", counts.expiring, "is-warn", `within ${EXPIRING_WINDOW_DAYS} days`)}
        ${statCard(3, "04", "Expired", counts.expired, "is-alert", "require renewal")}
      </div>

      <div class="dash-grid">
        <div class="card panel reveal" style="animation-delay:.15s">
          <div class="panel-head">
            <h3>Requires Attention</h3>
            <span class="panel-meta">${attention.length} record(s)</span>
          </div>
          <div class="panel-body">
            ${attention.length === 0
              ? `<div class="empty"><div class="empty-mark">✓</div><p>All certifications in good standing</p></div>`
              : attention.slice(0, 6).map((r) => {
                  const e = empById(r.employeeId);
                  const d = daysUntil(r.expiresOn);
                  const chip = d < 0
                    ? `<span class="days-chip urgent">${Math.abs(d)}d overdue</span>`
                    : `<span class="days-chip soon">${d}d left</span>`;
                  return `<div class="expiry-row">
                    <div>
                      <div class="who">${esc(e ? e.name : "—")}</div>
                      <div class="what">${esc(r.course)} · expires ${fmtDate(r.expiresOn)}</div>
                    </div>
                    <div class="when">${chip}</div>
                  </div>`;
                }).join("")}
          </div>
        </div>

        <div>
          <div class="card panel reveal" style="animation-delay:.22s">
            <div class="panel-head"><h3>Compliance Standing</h3></div>
            <div class="meter-wrap">
              <div class="meter-track"><div class="meter-fill" style="width:${compliance}%"></div></div>
              <div class="meter-label"><span>Records in good standing</span><span>${compliance}%</span></div>
              <div class="meter-pct">${compliance}<span style="font-size:20px">%</span></div>
            </div>
          </div>

          <div class="card panel reveal" style="animation-delay:.29s; margin-top:18px">
            <div class="panel-head"><h3>By Category</h3></div>
            <div class="panel-body" style="padding:14px 0">
              ${Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([cat, n]) => `
                <div class="cat-row">
                  <span class="cat-name">${esc(cat)}</span>
                  <span class="cat-bar-track"><span class="cat-bar-fill" style="width:${(n / maxCat) * 100}%"></span></span>
                  <span class="cat-count">${n}</span>
                </div>`).join("") || `<div class="empty"><p>No filings yet</p></div>`}
            </div>
          </div>

          <div class="card panel reveal" style="animation-delay:.36s; margin-top:18px">
            <div class="panel-head"><h3>Recently Filed</h3></div>
            <div class="panel-body">
              ${recent.map((r) => {
                const e = empById(r.employeeId);
                return `<div class="expiry-row">
                  <div>
                    <div class="who">${esc(r.course)}</div>
                    <div class="what">${esc(e ? e.name : "—")} · filed ${new Date(r.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</div>
                  </div>
                  <div class="when">${stamp(statusOf(r))}</div>
                </div>`;
              }).join("")}
            </div>
          </div>
        </div>
      </div>`;
  }

  function statCard(i, num, label, value, cls, note) {
    return `<div class="card stat-card reveal" data-index="NO. ${num}" style="animation-delay:${i * 0.07}s">
      <div class="stat-label">${esc(label)}</div>
      <div class="stat-value ${cls}">${value}</div>
      <div class="stat-note">${esc(note)}</div>
    </div>`;
  }

  function stamp(status) {
    const m = STATUS_META[status];
    return `<span class="stamp ${m.cls}">${m.label}</span>`;
  }

  /* ---------- employees view ---------- */
  function renderEmployees() {
    const q = filters.q.toLowerCase();
    const emps = Store.employees
      .filter((e) =>
        !q || [e.name, e.email, e.department, e.role].join(" ").toLowerCase().includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    const countFor = (id) => Store.records.filter((r) => r.employeeId === id).length;

    $("#view-employees").innerHTML = `
      <div class="filter-bar reveal">
        <button class="btn btn-secondary btn-sm" id="btn-new-employee">+ Add Employee</button>
        <span class="result-count">${emps.length} of ${Store.employees.length} shown</span>
      </div>
      <div class="card table-card reveal" style="animation-delay:.08s">
        ${emps.length === 0 ? emptyState("No personnel match this entry") : `
        <div class="table-scroll"><table>
          <thead><tr>
            <th>Name</th><th>Department</th><th>Role</th><th>Hired</th><th>Records</th><th></th>
          </tr></thead>
          <tbody>
            ${emps.map((e) => `
              <tr>
                <td><div class="cell-main">${esc(e.name)}</div><div class="cell-sub">${esc(e.email)}</div></td>
                <td>${esc(e.department)}</td>
                <td>${esc(e.role)}</td>
                <td class="cell-mono">${fmtDate(e.hiredOn)}</td>
                <td class="cell-mono">${countFor(e.id)} filed</td>
                <td><div class="row-actions">
                  <button class="icon-btn" data-edit-emp="${e.id}">Edit</button>
                  <button class="icon-btn danger" data-del-emp="${e.id}">Strike</button>
                </div></td>
              </tr>`).join("")}
          </tbody>
        </table></div>`}
      </div>`;

    $("#btn-new-employee").addEventListener("click", () => employeeModal());
    $$("#view-employees [data-edit-emp]").forEach((b) =>
      b.addEventListener("click", () => employeeModal(empById(b.dataset.editEmp)))
    );
    $$("#view-employees [data-del-emp]").forEach((b) =>
      b.addEventListener("click", () => {
        const e = empById(b.dataset.delEmp);
        const n = countFor(e.id);
        confirmDialog(
          "Strike employee from registry?",
          `This removes <span class="confirm-name">${esc(e.name)}</span> and ${n} linked training record(s). This cannot be undone.`,
          () => {
            Store.deleteEmployee(e.id);
            toast(`Struck from registry: ${e.name}`);
            render();
          }
        );
      })
    );
  }

  /* ---------- records view ---------- */
  function renderRecords() {
    const q = filters.q.toLowerCase();
    const rows = Store.records
      .map((r) => ({ ...r, _status: statusOf(r) }))
      .filter((r) => filters.status === "all" || r._status === filters.status)
      .filter((r) => filters.category === "all" || r.category === filters.category)
      .filter((r) => {
        if (!q) return true;
        const e = empById(r.employeeId);
        return [r.course, r.category, r.provider, e && e.name, e && e.department]
          .join(" ").toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (!a.expiresOn) return 1;
        if (!b.expiresOn) return -1;
        return daysUntil(a.expiresOn) - daysUntil(b.expiresOn);
      });

    const counts = { all: Store.records.length };
    Object.keys(STATUS_META).forEach(
      (s) => (counts[s] = Store.records.filter((r) => statusOf(r) === s).length)
    );

    $("#view-records").innerHTML = `
      <div class="filter-bar reveal">
        ${["all", ...Object.keys(STATUS_META)].map((s) => `
          <button class="chip ${filters.status === s ? "active" : ""}" data-status="${s}">
            ${s === "all" ? "All" : STATUS_META[s].label}<span class="chip-count">${counts[s]}</span>
          </button>`).join("")}
        <span class="select-wrap">
          <select id="cat-filter">
            <option value="all">All categories</option>
            ${CATEGORIES.map((c) => `<option ${filters.category === c ? "selected" : ""} value="${c}">${c}</option>`).join("")}
          </select>
        </span>
        <span class="result-count">${rows.length} of ${Store.records.length} shown</span>
      </div>

      <div class="card table-card reveal" style="animation-delay:.08s">
        ${rows.length === 0 ? emptyState("No filings match this entry") : `
        <div class="table-scroll"><table>
          <thead><tr>
            <th>Employee</th><th>Course</th><th>Category</th><th>Completed</th><th>Expires</th><th>Status</th><th></th>
          </tr></thead>
          <tbody>
            ${rows.map((r) => {
              const e = empById(r.employeeId);
              return `<tr>
                <td><div class="cell-main">${esc(e ? e.name : "—")}</div><div class="cell-sub">${esc(e ? e.department : "")}</div></td>
                <td><div class="cell-main">${esc(r.course)}</div><div class="cell-sub">${esc(r.provider)}</div></td>
                <td class="cell-mono">${esc(r.category)}</td>
                <td class="cell-mono">${fmtDate(r.completedOn)}</td>
                <td class="cell-mono">${fmtDate(r.expiresOn)}</td>
                <td>${stamp(r._status)}</td>
                <td><div class="row-actions">
                  <button class="icon-btn" data-edit-rec="${r.id}">Edit</button>
                  <button class="icon-btn danger" data-del-rec="${r.id}">Strike</button>
                </div></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table></div>`}
      </div>`;

    $$("#view-records .chip").forEach((c) =>
      c.addEventListener("click", () => { filters.status = c.dataset.status; renderRecords(); })
    );
    $("#cat-filter").addEventListener("change", (ev) => { filters.category = ev.target.value; renderRecords(); });
    $$("#view-records [data-edit-rec]").forEach((b) =>
      b.addEventListener("click", () =>
        recordModal(Store.records.find((r) => r.id === b.dataset.editRec)))
    );
    $$("#view-records [data-del-rec]").forEach((b) =>
      b.addEventListener("click", () => {
        const r = Store.records.find((x) => x.id === b.dataset.delRec);
        confirmDialog(
          "Strike this record?",
          `<span class="confirm-name">${esc(r.course)}</span> will be removed from the registry. This cannot be undone.`,
          () => {
            Store.deleteRecord(r.id);
            toast(`Record struck: ${r.course}`);
            render();
          }
        );
      })
    );
  }

  function emptyState(msg) {
    return `<div class="empty"><div class="empty-mark">∅</div><p>${esc(msg)}</p></div>`;
  }

  /* ---------- modals ---------- */
  function openModal(html) {
    const root = $("#modal-root");
    root.innerHTML = `<div class="modal-overlay"><div class="modal">${html}</div></div>`;
    const overlay = root.firstElementChild;
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
    overlay.querySelector(".modal-close").addEventListener("click", closeModal);
    const first = overlay.querySelector("input, select, textarea");
    if (first) first.focus();
  }

  function closeModal() { $("#modal-root").innerHTML = ""; }

  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); });

  function field(label, inner, span2) {
    return `<div class="field ${span2 ? "span-2" : ""}"><label>${label}</label>${inner}<div class="field-error" hidden></div></div>`;
  }

  function employeeModal(emp) {
    const isEdit = !!emp;
    openModal(`
      <div class="modal-head">
        <div><h3>${isEdit ? "Amend Entry" : "Register Employee"}</h3><div class="form-tag">FORM P-01 · PERSONNEL</div></div>
        <button class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <form id="emp-form" class="form-grid" novalidate>
          ${field("Full name *", `<input name="name" required value="${esc(emp?.name || "")}" placeholder="e.g. Ada Marlow" />`)}
          ${field("Email *", `<input name="email" type="email" required value="${esc(emp?.email || "")}" placeholder="name@company.co" />`)}
          ${field("Department *", `<input name="department" required value="${esc(emp?.department || "")}" placeholder="e.g. Operations" />`)}
          ${field("Role *", `<input name="role" required value="${esc(emp?.role || "")}" placeholder="e.g. Shift Supervisor" />`)}
          ${field("Hired on", `<input name="hiredOn" type="date" value="${emp?.hiredOn || ""}" />`)}
        </form>
      </div>
      <div class="modal-foot">
        <button class="btn" id="emp-cancel">Cancel</button>
        <button class="btn btn-primary" id="emp-save">${isEdit ? "Save Amendments" : "Enter into Registry"}</button>
      </div>`);

    $("#emp-cancel").addEventListener("click", closeModal);
    $("#emp-save").addEventListener("click", () => {
      const f = $("#emp-form");
      const data = Object.fromEntries(new FormData(f).entries());
      if (!validate(f, {
        name: (v) => v.trim() !== "",
        email: (v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v),
        department: (v) => v.trim() !== "",
        role: (v) => v.trim() !== ""
      })) return;
      ["name", "email", "department", "role"].forEach((k) => (data[k] = data[k].trim()));
      if (isEdit) { Store.updateEmployee(emp.id, data); toast(`Entry amended: ${data.name}`); }
      else { Store.addEmployee(data); toast(`Registered: ${data.name}`); }
      closeModal(); render();
    });
  }

  function recordModal(rec) {
    const isEdit = !!rec;
    if (Store.employees.length === 0) {
      toast("Register an employee before filing records.");
      return;
    }
    openModal(`
      <div class="modal-head">
        <div><h3>${isEdit ? "Amend Record" : "File a Training Record"}</h3><div class="form-tag">FORM TR-52 · CERTIFICATION</div></div>
        <button class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="modal-body">
        <form id="rec-form" class="form-grid" novalidate>
          ${field("Employee *", `<select name="employeeId" required>
              ${Store.employees.map((e) => `<option value="${e.id}" ${rec?.employeeId === e.id ? "selected" : ""}>${esc(e.name)} — ${esc(e.department)}</option>`).join("")}
            </select>`, true)}
          ${field("Course / certification *", `<input name="course" required value="${esc(rec?.course || "")}" placeholder="e.g. Forklift Operator Certification" />`, true)}
          ${field("Category *", `<select name="category" required>
              ${CATEGORIES.map((c) => `<option ${rec?.category === c ? "selected" : ""}>${c}</option>`).join("")}
            </select>`)}
          ${field("Provider / issuer", `<input name="provider" value="${esc(rec?.provider || "")}" placeholder="e.g. SafeWork Institute" />`)}
          ${field("Completed on *", `<input name="completedOn" type="date" required value="${rec?.completedOn || ""}" />`)}
          ${field("Expires on <span style='text-transform:none'>(blank = no expiry)</span>", `<input name="expiresOn" type="date" value="${rec?.expiresOn || ""}" />`)}
          ${field("Notes", `<textarea name="notes" placeholder="Licence no., renewal instructions…">${esc(rec?.notes || "")}</textarea>`, true)}
        </form>
      </div>
      <div class="modal-foot">
        <button class="btn" id="rec-cancel">Cancel</button>
        <button class="btn btn-primary" id="rec-save">${isEdit ? "Save Amendments" : "File Record"}</button>
      </div>`);

    $("#rec-cancel").addEventListener("click", closeModal);
    $("#rec-save").addEventListener("click", () => {
      const f = $("#rec-form");
      const data = Object.fromEntries(new FormData(f).entries());
      if (!validate(f, {
        employeeId: (v) => v !== "",
        course: (v) => v.trim() !== "",
        completedOn: (v) => v !== "",
        expiresOn: (v, d) => !v || !d.completedOn || v >= d.completedOn
      })) return;
      data.course = data.course.trim();
      data.provider = data.provider.trim() || "—";
      data.expiresOn = data.expiresOn || null;
      if (isEdit) { Store.updateRecord(rec.id, data); toast(`Record amended: ${data.course}`); }
      else { Store.addRecord(data); toast(`Record filed: ${data.course}`); }
      closeModal(); render();
    });
  }

  function validate(form, rules) {
    const data = Object.fromEntries(new FormData(form).entries());
    let ok = true;
    Object.entries(rules).forEach(([name, test]) => {
      const input = form.elements[name];
      if (!input) return;
      const valid = test(data[name] || "", data);
      input.classList.toggle("invalid", !valid);
      const err = input.closest(".field").querySelector(".field-error");
      err.hidden = valid;
      if (!valid) {
        err.textContent = name === "expiresOn" ? "EXPIRY MUST BE ON OR AFTER COMPLETION DATE" : "REQUIRED / INVALID ENTRY";
        ok = false;
      }
    });
    return ok;
  }

  function confirmDialog(title, bodyHTML, onConfirm) {
    openModal(`
      <div class="modal-head">
        <div><h3>${esc(title)}</h3><div class="form-tag">FORM X-09 · DESTRUCTION NOTICE</div></div>
        <button class="modal-close" aria-label="Close">×</button>
      </div>
      <div class="confirm-body"><p>${bodyHTML}</p></div>
      <div class="modal-foot">
        <button class="btn" id="cf-cancel">Keep it</button>
        <button class="btn btn-danger" id="cf-ok">Strike it</button>
      </div>`);
    $("#cf-cancel").addEventListener("click", closeModal);
    $("#cf-ok").addEventListener("click", () => { closeModal(); onConfirm(); });
  }

  /* ---------- export / import ---------- */
  function download(filename, content, mime) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([content], { type: mime }));
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  $("#btn-export-json").addEventListener("click", () => {
    download("training-registry.json", Store.exportJSON(), "application/json");
    toast("Registry exported as JSON.");
  });

  $("#btn-export-csv").addEventListener("click", () => {
    const header = ["Employee", "Department", "Course", "Category", "Provider", "Completed", "Expires", "Status"];
    const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const lines = Store.records.map((r) => {
      const e = empById(r.employeeId) || {};
      return [e.name, e.department, r.course, r.category, r.provider, r.completedOn, r.expiresOn || "none", STATUS_META[statusOf(r)].label]
        .map(q).join(",");
    });
    download("training-records.csv", [header.map(q).join(","), ...lines].join("\n"), "text/csv");
    toast("Records exported as CSV.");
  });

  $("#btn-import").addEventListener("click", () => $("#import-file").click());
  $("#import-file").addEventListener("change", (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        Store.importJSON(reader.result);
        toast("Registry imported successfully.");
        render();
      } catch (err) {
        toast("Import failed: " + err.message);
      }
      ev.target.value = "";
    };
    reader.readAsText(file);
  });

  /* ---------- global wiring ---------- */
  let searchTimer;
  $("#global-search").addEventListener("input", (ev) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.q = ev.target.value;
      if (currentView === "dashboard" && filters.q) {
        location.hash = "#/records";
      } else render();
    }, 180);
  });

  $("#btn-new-record").addEventListener("click", () => recordModal());
  window.addEventListener("hashchange", route);

  route();
})();
