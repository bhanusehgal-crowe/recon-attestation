import { put } from "@vercel/blob";
import { getSql } from "../_lib/db.js";
import { readJson, sendJson, sendText } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendText(res, 405, "Method not allowed");
  }

  let pkg;
  try {
    pkg = await readJson(req);
  } catch (err) {
    return sendText(res, 400, "Invalid JSON");
  }

  if (!pkg || !pkg.packageId || !pkg.period || !pkg.period.start || !pkg.period.end || !pkg.generatedAt) {
    return sendText(res, 400, "Missing package fields");
  }

  try {
    const blob = await put(`packages/${pkg.packageId}.json`, JSON.stringify(pkg), {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json"
    });

    const sql = getSql();
    await sql`
      insert into packages (package_id, period_start, period_end, generated_at, blob_url)
      values (${pkg.packageId}, ${pkg.period.start}, ${pkg.period.end}, ${pkg.generatedAt}, ${blob.url})
      on conflict (package_id) do update
        set period_start = excluded.period_start,
            period_end = excluded.period_end,
            generated_at = excluded.generated_at,
            blob_url = excluded.blob_url
    `;

    return sendJson(res, 200, { packageId: pkg.packageId });
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to publish package");
  }
}
