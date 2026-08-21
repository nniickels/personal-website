"use client";

import { useEffect, useRef } from "react";

type Theme = "light" | "dark";

const storedThemeKey = "portfolio-theme-override";

export function ThemeToggle() {
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const themeToggle = toggleRef.current;
    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const storedTheme = localStorage.getItem(storedThemeKey);
    let overrideTheme: Theme | null =
      storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;

    const getSystemTheme = (): Theme => (systemThemeQuery.matches ? "dark" : "light");

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
        (document.documentElement.dataset.theme as Theme | undefined) ?? getSystemTheme();
      overrideTheme = currentTheme === "dark" ? "light" : "dark";
      localStorage.setItem(storedThemeKey, overrideTheme);
      setTheme(overrideTheme);
    };

    const handleSystemThemeChange = () => {
      const nextSystemTheme = getSystemTheme();

      if (overrideTheme && overrideTheme !== nextSystemTheme) {
        overrideTheme = null;
        localStorage.removeItem(storedThemeKey);
      }

      if (!overrideTheme) {
        setTheme(nextSystemTheme);
      }
    };

    applyTheme(overrideTheme ?? getSystemTheme());
    themeToggle?.addEventListener("click", handleToggle);
    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
    return () => {
      themeToggle?.removeEventListener("click", handleToggle);
      systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
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
