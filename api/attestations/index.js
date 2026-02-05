import { getSql } from "../_lib/db.js";
import { readJson, sendJson, sendText } from "../_lib/http.js";

const VALID_EVENTS = new Set(["Viewed", "Attested"]);

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
        ${body.details || ""}
      )
    `;

    return sendJson(res, 200, { ok: true });
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to save attestation");
  }
}
