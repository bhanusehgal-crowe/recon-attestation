# Crowe Hourly Charge Reconciliation

This version removes employee file uploads. The admin publishes a package to Vercel Blob, employees automatically load the latest package, and attestation events are stored in Neon.

**Quick Start**
1. Create a Neon database and run `schema.sql`.
2. Create a Vercel Blob store and get a `BLOB_READ_WRITE_TOKEN`.
3. Set environment variables in Vercel: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`.
4. Install deps and run Next.js locally:
   - `npm install`
   - `npm run dev`

**How It Works**
- Admin uploads the Excel workbooks in the browser, then clicks **Publish Package**.
- The package JSON is stored in Vercel Blob with a random suffix.
- Employees load the latest package automatically from `/api/packages/latest`.
- Employee views and attestations are saved via `/api/attestations`.
- Admin uses **Refresh Status** to see up-to-date completion.
- When 100% of employees have attested, an email is sent to Bhanu.Sehgal@crowe.com with an Excel attachment of notes.

**Privacy Note**
Vercel Blob currently supports public access only. This app keeps blob URLs private by never exposing them to the browser and by adding a random suffix to each package. If you need stronger access control, add authentication to the API routes or store the package JSON in Neon instead of Blob.

**Files**
- `app/`: Next.js App Router pages that render the legacy HTML.
- `public/app.js`, `public/admin.js`, `public/employee.js`: Extracted client scripts.
- `index.html`, `admin.html`, `employee.html`: Legacy markup used by Next.js pages.
- `pages/api/`: Next.js API routes (migrated from Vercel functions).
- `schema.sql`: Neon schema.

**API Endpoints**
- `POST /api/packages` publishes a new package.
- `GET /api/packages/latest` returns the latest package JSON.
- `POST /api/attestations` stores view/attest events.
- `GET /api/attestations/status?packageId=...` returns status and event log data.

**Local Development**
1. `npm install`
2. `npm run dev`
