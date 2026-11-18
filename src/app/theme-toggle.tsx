"use client";

import { useEffect, useRef } from "react";

type Theme = "light" | "dark";

const storedThemeKey = "portfolio-theme-override";

export function ThemeToggle() {
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const themeToggle = toggleRef.current;
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const systemTheme = (): Theme => systemThemeQuery.matches ? "dark" : "light";
    const defaultTheme = (): Theme => document.documentElement.dataset.themeReferral === "neocities" ? "light" : systemTheme();
    let manualTheme: Theme | null = null;
    try {
      const saved = localStorage.getItem(storedThemeKey);
      if (saved === "light" || saved === "dark") manualTheme = saved;
    } catch {
      // Keep the referral or system default when browser storage is unavailable.
    }

    const applyTheme = (nextTheme: Theme) => {
      document.documentElement.dataset.theme = nextTheme;
      themeToggle?.classList.toggle("is-dark", nextTheme === "dark");
      const followingTheme = nextTheme === "dark" ? "light" : "dark";
      themeToggle?.setAttribute("aria-label", `Switch to ${followingTheme} mode`);
      themeToggle?.setAttribute("title", `Switch to ${followingTheme} mode`);
    };

    const setTheme = (nextTheme: Theme) => {
      if (reducedMotionQuery.matches || typeof document.startViewTransition !== "function") {
        applyTheme(nextTheme);
        return;
      }

      document.startViewTransition(() => applyTheme(nextTheme));
    };

    const handleToggle = () => {
      const currentTheme =
        (document.documentElement.dataset.theme as Theme | undefined) ?? defaultTheme();
      const nextTheme = currentTheme === "dark" ? "light" : "dark";
      manualTheme = nextTheme;
      try {
        localStorage.setItem(storedThemeKey, nextTheme);
      } catch {
        // The toggle still works when browser storage is unavailable.
      }
      setTheme(nextTheme);
    };

    const handleSystemTheme = () => {
      if (!manualTheme) setTheme(defaultTheme());
    };
    applyTheme(manualTheme ?? defaultTheme());
    themeToggle?.addEventListener("click", handleToggle);
    systemThemeQuery.addEventListener("change", handleSystemTheme);
    return () => {
      themeToggle?.removeEventListener("click", handleToggle);
      systemThemeQuery.removeEventListener("change", handleSystemTheme);
    };
  }, []);

  return (
    <button
      ref={toggleRef}
      className="text-btn theme-toggle"
      type="button"
      aria-label="Toggle color mode"
      title="Toggle color mode"
    >
      <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle className="theme-icon__sun" cx="12" cy="12" r="4.2" />
        <path
          className="theme-icon__rays"
          d="M12 2.25v2.45M12 19.3v2.45M4.93 4.93l1.73 1.73M17.34 17.34l1.73 1.73M2.25 12h2.45M19.3 12h2.45M4.93 19.07l1.73-1.73M17.34 6.66l1.73-1.73"
        />
        <path
          className="theme-icon__moon"
          d="M14.4 3.6A8.4 8.4 0 1 0 20.4 16 7.05 7.05 0 1 1 14.4 3.6Z"
        />
      </svg>
      <span className="visually-hidden">Toggle color mode</span>
    </button>
  );
}
