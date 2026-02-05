import { del, put } from "@vercel/blob";
import { getSql } from "../_lib/db.js";
import { readJson, sendJson, sendText } from "../_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "DELETE") {
    return sendText(res, 405, "Method not allowed");
  }

  const sql = getSql();

  if (req.method === "DELETE") {
    try {
      const rows = await sql`select package_id, blob_url from packages`;
      const blobUrls = rows.map((row) => row.blob_url).filter(Boolean);
      for (const url of blobUrls) {
        try {
          await del(url);
        } catch (err) {
          console.error("Blob delete failed:", err);
        }
      }
      await sql`delete from packages`;
      return sendJson(res, 200, { deleted: true, count: rows.length });
    } catch (err) {
      return sendText(res, 500, err.message || "Failed to delete packages");
    }
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
    // Ensure only one package exists at a time.
    const existing = await sql`select package_id, blob_url from packages`;
    const existingUrls = existing.map((row) => row.blob_url).filter(Boolean);
    for (const url of existingUrls) {
      try {
        await del(url);
      } catch (err) {
        console.error("Blob delete failed:", err);
      }
    }
    await sql`delete from packages`;

    const employeeCount = Array.isArray(pkg.assignments) ? pkg.assignments.length : null;
    const blob = await put(`packages/${pkg.packageId}.json`, JSON.stringify(pkg), {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json"
    });

    await sql`
      insert into packages (package_id, period_start, period_end, generated_at, blob_url, employee_count)
      values (${pkg.packageId}, ${pkg.period.start}, ${pkg.period.end}, ${pkg.generatedAt}, ${blob.url}, ${employeeCount})
    `;

    return sendJson(res, 200, { packageId: pkg.packageId });
  } catch (err) {
    return sendText(res, 500, err.message || "Failed to publish package");
  }
}
