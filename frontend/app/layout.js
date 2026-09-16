import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: {
    default: "Service CRM",
    template: "%s | Service CRM",
  },
  description:
    "Service CRM by  — manage complaints, service centers, and engineers from one platform.",
  applicationName: "Service CRM",
  authors: [{ name: "Service CRM" }],
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children} <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}