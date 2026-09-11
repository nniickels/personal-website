"use client";
import { useEffect, useState } from "react";
export function ViewCounter() {
  const [count, setCount] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadCount = async () => {
      try {
        const response = await fetch("/gc/counter/TOTAL.json", { cache: "no-store" });
        if (!response.ok) return;

        const payload: unknown = await response.json();
        if (
          !cancelled &&
          typeof payload === "object" &&
          payload !== null &&
          "count" in payload &&
          typeof payload.count === "string"
        ) {
          setCount(payload.count);
        }
      } catch {
        // Keep the counter hidden until GoatCounter is configured and reachable.
      }
    };

    if (!document.querySelector('script[data-nicole-view-counter="true"]')) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "/gc/count.js";
      script.dataset.goatcounter = `${window.location.origin}/gc/count`;
      script.dataset.nicoleViewCounter = "true";
      document.head.appendChild(script);
    }

    void loadCount();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!count) return null;

  return (
    <span className="footer-views" aria-label={`${count} total site views`} aria-live="polite">
      <svg className="footer-eye" viewBox="0 0 20 14" aria-hidden="true">
        <path d="M1.5 7C3.8 4 6.5 2.5 10 2.5S16.2 4 18.5 7C16.2 10 13.5 11.5 10 11.5S3.8 10 1.5 7Z" />
        <circle cx="10" cy="7" r="2.25" />
      </svg>
      <span>{count}</span>
    </span>
  );
}
