# Registry — Training Records Bureau

A distinctive, production-grade training records management web app with an archival-ledger
aesthetic. Track employees, certifications, expiry dates, and compliance standing — all in
the browser with zero build steps.

## Features

- **Dashboard** — headcount, filing counts, expiring/expired alerts, compliance meter,
  category breakdown, recent filings
- **Employees** — full CRUD with validation, linked training record counts
- **Training records** — full CRUD with category/status filters, expiry tracking
  (`Valid` / `Expiring ≤60 days` / `Expired` / `No expiry`) shown as rubber-stamp badges
- **Global search** across names, departments, courses, providers
- **Import / export** — full registry as JSON, records as CSV
- **Persistence** — everything stored in `localStorage`; a realistic seed ledger loads on
  first run

## Project structure

```
.
├── index.html          # App shell (sidebar, topbar, views, modal/toast roots)
├── css/
│   └── styles.css      # Archival-ledger design system
├── js/
│   ├── seed.js         # Demo ledger (relative dates so statuses stay live)
│   ├── store.js        # Persistence layer over localStorage
│   └── app.js          # Router, views, forms, import/export
└── assets/
    └── favicon.svg
```

## Run it

No build step required. Serve the folder with any static server:

```bash
npx serve .
# or
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Data model

- **Employee** — `id, name, email, department, role, hiredOn, createdAt`
- **Record** — `id, employeeId, course, category, provider, completedOn, expiresOn
  (nullable), notes, createdAt`

Deleting an employee cascades to their records. JSON import expects `employees` and
`records` arrays (see `JSON export` output for the exact shape).
