import { readBodyHtml } from "../lib/html";
import LegacyShell from "../components/legacy-shell";

export default function Page() {
  const html = readBodyHtml("index.html");
  return <LegacyShell html={html} scriptSrc="/app.js" needsXlsx />;
}
