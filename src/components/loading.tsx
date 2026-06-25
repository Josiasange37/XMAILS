"use client";
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background animate-fade-in">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
            <Mail className="h-8 w-8 text-foreground" />
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-foreground animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      )}
      <div style={{ display: show ? "none" : undefined }}>{children}</div>
    </>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
