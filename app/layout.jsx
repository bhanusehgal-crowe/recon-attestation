import "./globals.css";

export const metadata = {
  title: "Crowe Hourly Charge Reconciliation",
  description: "Crowe reconciliation and attestation portal",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
