/* Seed ledger. Dates are computed relative to day so the
   demo always shows a live mix of valid / expiring / expired. */
const SeedData = (() => {
  const day = 86400000;
  const now = new Date();

  const iso = (offsetDays) => {
    const d = new Date(now.getTime() + offsetDays * day);
    return d.toISOString().slice(0, 10);
  };

  const employees = [
    { id: "e-marlow",   name: "Ada Marlow",    email: "ada.marlow@northline.co",    department: "Operations",  role: "Shift Supervisor",  hiredOn: "2019-03-11" },
    { id: "e-okafor",   name: "Chidi Okafor",  email: "chidi.okafor@northline.co",  department: "Maintenance", role: "Electrician",       hiredOn: "2021-06-01" },
    { id: "e-reyes",    name: "Lucía Reyes",   email: "lucia.reyes@northline.co",   department: "Safety",      role: "HSE Coordinator",   hiredOn: "2018-01-22" },
    { id: "e-tanaka",   name: "Kenji Tanaka",  email: "kenji.tanaka@northline.co",  department: "Warehouse",   role: "Forklift Operator", hiredOn: "2022-09-14" },
    { id: "e-beaumont", name: "Ingrid Beaumont", email: "ingrid.b@northline.co",    department: "HR",          role: "HR Generalist",     hiredOn: "2020-04-06" },
    { id: "e-haddad",   name: "Omar Haddad",   email: "omar.haddad@northline.co",   department: "Operations",  role: "Machine Operator",  hiredOn: "2023-02-27" },
    { id: "e-lindqvist", name: "Sigrid Lindqvist", email: "sigrid.l@northline.co",  department: "Quality",     role: "QC Inspector",      hiredOn: "2017-11-08" },
    { id: "e-petrov",   name: "Viktor Petrov", email: "viktor.petrov@northline.co", department: "Maintenance", role: "Mechanic",          hiredOn: "2024-05-20" }
  ];

  const r = (employeeId, course, category, provider, completedOn, expiresOn, notes = "") => ({
    employeeId, course, category, provider, completedOn, expiresOn, notes
  });

  const records = [
    r("e-marlow",    "LOTO — Lockout/Tagout Authorized", "Safety",      "SafeWork Institute",   iso(-340), iso(+25)),
    r("e-marlow",    "Supervisor Leadership Series",     "Leadership",  "Northline Academy",    iso(-200), null),
    r("e-okafor",    "NFPA 70E Electrical Safety",       "Safety",      "SafeWork Institute",   iso(-300), iso(-16)),
    r("e-okafor",    "PLC Troubleshooting Level II",     "Technical",   "Siemens Learning",     iso(-150), iso(+215)),
    r("e-reyes",     "OSHA 30-Hour General Industry",    "Compliance",  "OSHA Education Ctr",   iso(-500), iso(+47)),
    r("e-reyes",     "Incident Investigation & RCA",     "Safety",      "Northline Academy",    iso(-90),  iso(+640)),
    r("e-reyes",     "First Aid / CPR / AED",            "First Aid",   "Red Cross",            iso(-400), iso(-38)),
    r("e-tanaka",    "Forklift Operator Certification",  "Equipment",   "LiftSafe Training",    iso(-350), iso(-9)),
    r("e-tanaka",    "HAZMAT Handling Awareness",        "Compliance",  "SafeWork Institute",   iso(-180), iso(+185)),
    r("e-beaumont",  "Anti-Harassment & Workplace Civility", "HR",      "Northline Academy",    iso(-220), iso(+140)),
    r("e-beaumont",  "HR Data Privacy (GDPR Basics)",    "Compliance",  "Coursera / Northline", iso(-75),  iso(+290)),
    r("e-haddad",    "Machine Guarding & Safe Operation","Safety",      "SafeWork Institute",   iso(-160), iso(+12)),
    r("e-haddad",    "Lean Manufacturing Foundations",   "Technical",   "Northline Academy",    iso(-60),  null),
    r("e-lindqvist", "ISO 9001 Internal Auditor",        "Quality",     "BSI Training",         iso(-370), iso(+58)),
    r("e-lindqvist", "Precision Measurement & Calibration", "Technical","Mitutoyo Institute",   iso(-310), iso(+420)),
    r("e-petrov",    "Confined Space Entry",             "Safety",      "SafeWork Institute",   iso(-130), iso(+33)),
    r("e-petrov",    "Hydraulics Systems Maintenance",   "Technical",   "Parker Training",      iso(-45),  iso(+320))
  ];

  return { employees, records };
})();
