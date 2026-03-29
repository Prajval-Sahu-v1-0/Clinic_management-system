"use client";

import { useState, useEffect } from "react";

export function useTheme() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Determine initial theme from localStorage or OS preference
    const saved = localStorage.getItem("theme");
    const prefersDark =
      !saved && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = saved === "dark" || prefersDark;

    if (dark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    setIsDark(dark);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
      return next;
    });
  };

  return { isDark, toggleTheme };
}
