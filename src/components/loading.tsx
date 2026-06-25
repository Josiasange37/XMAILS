"use client";
import React, { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import gsap from "gsap";
import { Mail } from "lucide-react";

const LoadingContext = createContext<{ done: () => void }>({
  done: () => {},
});

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [show, setShow] = useState(true);
  const screenRef = useRef<HTMLDivElement>(null);

  const done = useCallback(() => {
    const el = screenRef.current;
    if (!el) return;
    gsap.to(el, {
      opacity: 0,
      duration: 0.4,
      ease: "power2.inOut",
      onComplete: () => setShow(false),
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(done, 1200);
    return () => clearTimeout(timer);
  }, [done]);

  return (
    <LoadingContext.Provider value={{ done }}>
      {show && <LoadingScreen ref={screenRef} />}
      <div style={{ display: show ? "none" : undefined }}>{children}</div>
    </LoadingContext.Provider>
  );
}

export function useAppLoading() {
  return useContext(LoadingContext);
}

const LoadingScreen = React.forwardRef<HTMLDivElement, object>((_, ref) => {
  const iconRef = useRef<HTMLDivElement>(null);
  const barRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(
      iconRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6 }
    ).to(iconRef.current, {
      scale: 1.1,
      duration: 0.4,
      yoyo: true,
      repeat: -1,
      ease: "power1.inOut",
    });
    tl.fromTo(
      barRefs.current,
      { scaleX: 0, transformOrigin: "left center" },
      { scaleX: 1, duration: 0.8, stagger: 0.15, ease: "power3.out" },
      "-=0.2"
    );
    return () => { tl.kill(); };
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-background"
    >
      <div
        ref={iconRef}
        className="flex items-center justify-center w-16 h-16 rounded-2xl bg-muted"
      >
        <Mail className="h-8 w-8 text-foreground" />
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            ref={(el) => { if (el) barRefs.current[i] = el; }}
            className="w-2 h-2 rounded-full bg-foreground"
          />
        ))}
      </div>
    </div>
  );
});

export function LoadingSpinner({ className }: { className?: string }) {
  const dotRefs = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const dots = dotRefs.current;
    dots.forEach((dot, i) => {
      gsap.to(dot, {
        y: -8,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        delay: i * 0.15,
        ease: "power1.inOut",
      });
    });
    return () => dots.forEach((d) => gsap.killTweensOf(d));
  }, []);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          ref={(el) => { if (el) dotRefs.current[i] = el; }}
          className="w-2 h-2 rounded-full bg-muted-foreground"
        />
      ))}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
