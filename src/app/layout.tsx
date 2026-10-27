import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApplyForge — College Placement Tracker",
  description:
    "ApplyForge is a placement job broadcast & student application tracking platform for college placement cells.",
  keywords: ["placement", "jobs", "college", "tracking", "applications"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
