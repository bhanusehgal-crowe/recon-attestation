import { getSql } from "../_lib/db.js";
import { readJson, sendJson, sendText } from "../_lib/http.js";
import { sendCompletionEmail } from "../_lib/email.js";
import * as XLSX from "xlsx";

const VALID_EVENTS = new Set(["Viewed", "Attested"]);
const COMPLETION_RECIPIENTS = ["Bhanu.Sehgal@crowe.com"];

async function maybeSendCompletionEmail(sql, packageId) {
  const pkgRows = await sql`
    select package_id, period_start, period_end, generated_at, blob_url, employee_count, completion_notified_at
    from packages
    where package_id = ${packageId}
    limit 1
  `;
  if (!pkgRows || pkgRows.length === 0) return;
  const pkg = pkgRows[0];
  if (pkg.completion_notified_at) return;

  let employeeCount = pkg.employee_count ? Number(pkg.employee_count) : 0;
  if (!employeeCount && pkg.blob_url) {
    try {
      const response = await fetch(pkg.blob_url);
      if (response.ok) {
        const blobPkg = await response.json();
        if (Array.isArray(blobPkg.assignments)) {
          employeeCount = blobPkg.assignments.length;
          if (employeeCount > 0) {
            await sql`
              update packages
              set employee_count = ${employeeCount}
              where package_id = ${packageId}
            `;
          }
        }
      }
    } catch (err) {
      // ignore blob fetch errors
    }
  }

  if (!employeeCount) return;

  const countRows = await sql`
    select count(distinct employee_key) as attested
    from attestation_events
    where package_id = ${packageId} and event_type = 'Attested'
  `;
  const attestedCount = Number(countRows[0]?.attested || 0);
  if (attestedCount < employeeCount) return;

  const attestedRows = await sql`
    select distinct on (employee_key)
      employee_name,
      worker_id,
      created_at,
      details
    from attestation_events
    where package_id = ${packageId} and event_type = 'Attested'
    order by employee_key, created_at desc
  `;

  const rows = [
    ["Employee", "Worker ID", "Attested At", "Notes"]
  ];
  attestedRows.forEach((row) => {
    rows.push([
      row.employee_name || "",
      row.worker_id || "",
      row.created_at ? new Date(row.created_at).toLocaleString("en-US") : "",
      row.details || ""
    ]);
  });

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, sheet, "Attestations");
  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const completedAt = new Date();

  const subject = `Reconciliation Attestations Complete (${pkg.period_start} to ${pkg.period_end})`;
  const text = [
    "All employees have completed their attestation.",
    `Completed at: ${completedAt.toLocaleString("en-US")}.`,
    "The attached spreadsheet includes each employee's attestation time and notes."
  ].join("\n");

  const result = await sendCompletionEmail({
    to: COMPLETION_RECIPIENTS,
    subject,
    text,
    filename: `Attestations_${pkg.period_start}_${pkg.period_end}.xlsx`,
    contentBase64: buffer.toString("base64")
  });

  if (result.sent) {
    await sql`
      update packages
      set completion_notified_at = ${completedAt.toISOString()}
      where package_id = ${packageId}
    `;
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendText(res, 405, "Method not allowed");
  }

  let body;
  try {
    body = await readJson(req);
  } catch (err) {
    return sendText(res, 400, "Invalid JSON");
  }

  if (!body || !body.packageId || !body.employeeKey || !body.eventType) {
    return sendText(res, 400, "Missing attestation fields");
  }
  if (!VALID_EVENTS.has(body.eventType)) {
    return sendText(res, 400, "Invalid event type");
  }

  try {
    const sql = getSql();
    const details = String(body.details || "").trim();
    if (details.length > 256) {
      return sendText(res, 400, "Notes must be 256 characters or fewer");
    }
    await sql`
      insert into attestation_events (
        package_id,
        employee_key,
        employee_name,
        worker_id,
        event_type,
        details
      )
      values (
        ${body.packageId},
        ${body.employeeKey},
        ${body.employeeName || ""},
        ${body.workerId || ""},
        ${body.eventType},
        ${details}
      )
    `;

    if (body.eventType === "Attested") {
      try {
        await maybeSendCompletionEmail(sql, body.packageId);
      } catch (err) {
        // Email errors should not block attestation writes.
        console.error("Completion email error:", err);
      }
    }

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to save attestation");
  }
}
