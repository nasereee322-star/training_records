/* Store — persistence layer over localStorage. */
const Store = (() => {
  const KEY = "training-registry.v1";
  let state = null;

  const uid = (prefix) =>
    prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = JSON.parse(raw);
        if (Array.isArray(state.employees) && Array.isArray(state.records)) return;
      }
    } catch (e) {
      /* corrupted state falls through to reseed */
    }
    const stamp = new Date().toISOString();
    state = {
      employees: SeedData.employees.map((e) => ({ ...e, createdAt: stamp })),
      records: SeedData.records.map((rec, i) => ({
        id: uid("r") + i,
        ...rec,
        createdAt: new Date(Date.now() - i * 3600000).toISOString()
      }))
    };
    save();
  }

  function addEmployee(data) {
    const emp = { id: uid("e"), ...data, createdAt: new Date().toISOString() };
    state.employees.push(emp);
    save();
    return emp;
  }

  function updateEmployee(id, data) {
    const i = state.employees.findIndex((e) => e.id === id);
    if (i === -1) return null;
    state.employees[i] = { ...state.employees[i], ...data };
    save();
    return state.employees[i];
  }

  function deleteEmployee(id) {
    state.employees = state.employees.filter((e) => e.id !== id);
    state.records = state.records.filter((r) => r.employeeId !== id);
    save();
  }

  function addRecord(data) {
    const rec = { id: uid("r"), ...data, createdAt: new Date().toISOString() };
    state.records.push(rec);
    save();
    return rec;
  }

  function updateRecord(id, data) {
    const i = state.records.findIndex((r) => r.id === id);
    if (i === -1) return null;
    state.records[i] = { ...state.records[i], ...data };
    save();
    return state.records[i];
  }

  function deleteRecord(id) {
    state.records = state.records.filter((r) => r.id !== id);
    save();
  }

  function exportJSON() {
    return JSON.stringify(
      { employees: state.employees, records: state.records, exportedAt: new Date().toISOString() },
      null,
      2
    );
  }

  function importJSON(json) {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed.employees) || !Array.isArray(parsed.records)) {
      throw new Error("File must contain 'employees' and 'records' arrays.");
    }
    state = parsed;
    save();
  }

  function reset() {
    localStorage.removeItem(KEY);
    load();
  }

  load();

  return {
    get employees() { return state.employees; },
    get records() { return state.records; },
    addEmployee, updateEmployee, deleteEmployee,
    addRecord, updateRecord, deleteRecord,
    exportJSON, importJSON, reset
  };
})();
