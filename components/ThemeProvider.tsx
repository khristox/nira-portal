"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { useEffect } from "react";

const THEME_VERSION = "v2"; // bump this when you want to force-reset

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const seen = localStorage.getItem("theme_version");
    if (seen !== THEME_VERSION) {
      localStorage.removeItem("theme");
      localStorage.setItem("theme_version", THEME_VERSION);
    }
  }, []);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}