import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/AppShell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = {
  title: "Nusa Toys",
  description: "Web Manajemen Toko Mainan Robotik",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={`${inter.variable} h-full`}>
      <body className="h-full antialiased">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
