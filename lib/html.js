import fs from "fs";
import path from "path";

export function readBodyHtml(filename) {
  const filePath = path.join(process.cwd(), filename);
  const raw = fs.readFileSync(filePath, "utf-8");
  const bodyMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return "";
  let body = bodyMatch[1];
  body = body.replace(/<script[\s\S]*?<\/script>/gi, "");
  return body.trim();
}
