import { readBodyHtml } from "../../lib/html";
import LegacyShell from "../../components/legacy-shell";

export default function EmployeePage() {
  const html = readBodyHtml("employee.html");
  return <LegacyShell html={html} scriptSrc="/employee.js" />;
}
