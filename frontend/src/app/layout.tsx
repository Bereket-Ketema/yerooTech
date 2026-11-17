import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "YerooTech | Multi-Tenant SaaS Attendance Management System",
  description: "Next-generation attendance management system featuring dynamic QR codes, GPS geofencing, temporary PINs, and comprehensive analytics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="custom-scrollbar bg-slate-50 min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

