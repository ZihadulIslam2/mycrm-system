import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/AppLayout";

export const metadata: Metadata = {
  title: "CRM System - Lead Management",
  description: "Professional CRM for lead management and outreach",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-gray-50 min-h-screen" suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
