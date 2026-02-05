# Crowe Hourly Charge Reconciliation

This version removes employee file uploads. The admin publishes a package to Vercel Blob, employees automatically load the latest package, and attestation events are stored in Neon.

**Quick Start**
1. Create a Neon database and run `schema.sql`.
2. Create a Vercel Blob store and get a `BLOB_READ_WRITE_TOKEN`.
3. Set environment variables in Vercel: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, `MAIL_FROM`.
4. Deploy to Vercel (static + serverless functions).

**How It Works**
- Admin uploads the Excel workbooks in the browser, then clicks **Publish Package**.
- The package JSON is stored in Vercel Blob with a random suffix.
- Employees load the latest package automatically from `/api/packages/latest`.
- Employee views and attestations are saved via `/api/attestations`.
- Admin uses **Refresh Status** to see up-to-date completion.
- When 100% of employees have attested, an email is sent to Meghan.Burns@crowe.com and Bhanu.Sehgal@crowe.com with an Excel attachment of notes.

**Privacy Note**
Vercel Blob currently supports public access only. This app keeps blob URLs private by never exposing them to the browser and by adding a random suffix to each package. If you need stronger access control, add authentication to the API routes or store the package JSON in Neon instead of Blob.

**Files**
- `index.html`: Combined admin/employee UI.
- `admin.html`: Admin-only UI.
- `employee.html`: Employee-only UI.
- `api/`: Vercel serverless functions.
- `schema.sql`: Neon schema.

**API Endpoints**
- `POST /api/packages` publishes a new package.
- `GET /api/packages/latest` returns the latest package JSON.
- `POST /api/attestations` stores view/attest events.
- `GET /api/attestations/status?packageId=...` returns status and event log data.

**Local Development**
1. `npm install`
2. `vercel dev`
