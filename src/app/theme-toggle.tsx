"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

type Theme = "light" | "dark";

const storedThemeKey = "portfolio-theme-override";

function systemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const overrideTheme = useRef<Theme | null>(null);

  function applyTheme(nextTheme: Theme) {
    document.documentElement.dataset.theme = nextTheme;
    setTheme(nextTheme);
  }

  function setThemeWithTransition(nextTheme: Theme) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion || typeof document.startViewTransition !== "function") {
      applyTheme(nextTheme);
      return;
    }

    document.startViewTransition(() => {
      flushSync(() => applyTheme(nextTheme));
    });
  }

  useEffect(() => {
    const storedTheme = localStorage.getItem(storedThemeKey);
    overrideTheme.current = storedTheme === "light" || storedTheme === "dark" ? storedTheme : null;
    applyTheme(overrideTheme.current ?? systemTheme());

    const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => {
      const nextSystemTheme = systemTheme();

      if (overrideTheme.current && overrideTheme.current !== nextSystemTheme) {
        overrideTheme.current = null;
        localStorage.removeItem(storedThemeKey);
      }

      if (!overrideTheme.current) {
        setThemeWithTransition(nextSystemTheme);
      }
    };

    systemThemeQuery.addEventListener("change", handleSystemThemeChange);
    return () => systemThemeQuery.removeEventListener("change", handleSystemThemeChange);
  }, []);

  function toggleTheme() {
    const currentTheme = theme ?? systemTheme();
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    overrideTheme.current = nextTheme;
    localStorage.setItem(storedThemeKey, nextTheme);
    setThemeWithTransition(nextTheme);
  }

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className={`text-btn theme-toggle${theme === "dark" ? " is-dark" : ""}`}
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
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
