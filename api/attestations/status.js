import { getSql } from "../_lib/db.js";
import { sendJson, sendText } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendText(res, 405, "Method not allowed");
  }

  const url = new URL(req.url, "http://localhost");
  const packageId = url.searchParams.get("packageId");
  if (!packageId) {
    return sendText(res, 400, "Missing packageId");
  }

  try {
    const sql = getSql();
    const statusRows = await sql`
      select
        employee_key as "employeeKey",
        max(employee_name) as "employeeName",
        max(worker_id) as "workerId",
        max(case when event_type = 'Viewed' then created_at end) as "lastViewed",
        max(case when event_type = 'Attested' then created_at end) as "lastAttested"
      from attestation_events
      where package_id = ${packageId}
      group by employee_key
      order by employee_key
    `;

    const eventRows = await sql`
      select
        employee_key as "employeeKey",
        employee_name as "employeeName",
        worker_id as "workerId",
        event_type as "eventType",
        details as "details",
        created_at as "createdAt"
      from attestation_events
      where package_id = ${packageId}
      order by created_at asc
    `;

    return sendJson(res, 200, { status: statusRows, events: eventRows });
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to load attestation status");
  }
}
