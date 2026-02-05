import { readBodyHtml } from "../../lib/html";
import LegacyShell from "../../components/legacy-shell";

export default function AdminPage() {
  const html = readBodyHtml("admin.html");
  return <LegacyShell html={html} scriptSrc="/admin.js" needsXlsx />;
}
