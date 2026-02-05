import { getSql } from "../_lib/db.js";
import { sendJson, sendText } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendText(res, 405, "Method not allowed");
  }

  try {
    const sql = getSql();
    const rows = await sql`
      select package_id, blob_url
      from packages
      order by generated_at desc nulls last, created_at desc
      limit 1
    `;

    if (!rows || rows.length === 0) {
      return sendText(res, 404, "No package published yet");
    }

    const response = await fetch(rows[0].blob_url);
    if (!response.ok) {
      return sendText(res, 502, "Unable to load package");
    }
    const pkg = await response.json();
    return sendJson(res, 200, pkg);
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to load package");
  }
}
