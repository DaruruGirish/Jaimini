import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Report Card Management System",
  description: "Jaimini Public School, Hiriyur — academic report cards",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} h-full`}>
      <body className="min-h-full bg-[#eef4fb] font-sans text-slate-800 antialiased">{children}</body>
    </html>
  );
}
