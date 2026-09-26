import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";
import { getActiveLanguage } from "@/lib/language";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NIRA Services Portal",
  description:
    "Access National Identification and Registration Authority services.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = await getActiveLanguage();

  return (
    <html lang={language} suppressHydrationWarning>
      <body
        className={`${inter.className} bg-background text-foreground flex flex-col min-h-screen`}
      >
        <ThemeProvider>
          <Header language={language} />
          <main className="flex-1 bg-background">{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}