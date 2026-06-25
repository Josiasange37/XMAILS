"use client";
import { useEffect } from "react";

export function ErrorLogger() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.error?.message?.includes("Minified React error")) {
        console.warn("=== React Error #310 Debug Info ===");
        console.warn("Full error:", event.error);
        console.warn("Error stack:", event.error?.stack);
        console.warn("Event source:", event.filename, "line:", event.lineno);
        console.warn("================================");
      }
    };

    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  return null;
}
