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
    default: "Aceit Technologies (P) Ltd.",
    template: "%s | ServicePoint",
  },
  description:
    "Service CRM by Aceit Technologies (P) Ltd. — manage complaints, service centers, and engineers from one platform.",
  applicationName: "ServicePoint",
  authors: [{ name: "Aceit Technologies (P) Ltd." }],
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