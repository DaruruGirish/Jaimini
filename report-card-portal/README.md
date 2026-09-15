# Report Card Management System

Standalone portal for **Jaimini Public School, Hiriyur** (Vani Trust and Rural Development).  
Do **not** merge this into the public school website. That site later adds one button/link here.

Product name in UI: **Report Card Management System**

## Demo logins (fake test data)

Loaded by `npm run db:setup` / `npm run db:seed` from `prisma/seed.ts` into `prisma/dev.db`. This is dummy data so the Principal dashboard has something to click. Replace it when real records arrive.

| Role | Email | Password | What you can test |
|---|---|---|---|
| Principal | `principal@jaimini.edu` | `principal123` | Mix of pending and approved sheets |
| Class teacher 12-A | `teacher12a@jaimini.edu` | `teacher123` | 3 approved, 3 still waiting |
| Class teacher 10-B | `teacher10b@jaimini.edu` | `teacher123` | Marks still **draft** |
| Class teacher 9-A | `teacher9a@jaimini.edu` | `teacher123` | 3 approved, 2 still waiting |

Sample Excel files (also dummy) are in `public/samples/`:

- `sample-teachers.xlsx` — Name, Email, Password for Principal → Teachers
- `sample-students-10B.xlsx` / `sample-students-12A.xlsx` — class roster for the teacher
- `sample-marks-10B.xlsx` / `sample-marks-12A.xlsx` — Part A, Part B, Attendance

## Run locally

School branding is seeded from the real school identity:

- Name: JAIMINI PUBLIC SCHOOL
- Tagline: SERVE FOR NATION
- Address: Mysore Road, behind Taha Palace, Hiriyur, Karnataka 577598
- Logo: `public/uploads/logo/jaimini-logo.png`
- Footer: *Shaping Minds, Building Futures, Creating Leaders*
- Barcode prefix: `JPS` (example after approve: `JPS2512A012`)

## Run locally

Needs Node 22+. SQLite is used locally (no Postgres required). Optional Docker Postgres remains in `docker-compose.yml` if you switch the Prisma provider later.

```bash
cd report-card-portal
npm install
npx prisma generate
npm run db:setup
npm run dev
```

Open http://localhost:3000

Public verify (no login): http://localhost:3000/verify

## Website button later

On the Jaimini public site, add:

```html
<a href="http://localhost:3000">Report Cards</a>
```

Point that href at the deployed portal URL in production.

## Rules (v1)

- Two roles only: Principal and Class Teacher. No student/parent login.
- FA max 15, SA max 20. Totals and grades are automatic.
- Official print (barcode) only after Principal **approves the class**.
- Reject after approve invalidates barcodes; re-approve issues new codes.
