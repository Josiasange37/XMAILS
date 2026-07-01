"use client";

import { useRef, ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, y: 12, scale: 0.98 });

    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    tl.to(el, { opacity: 1, y: 0, scale: 1, duration: 0.45 });

    const animatable = el.querySelectorAll(
      "h1, h2, h3, h4, p, .card, button, a, input, select, textarea, .badge, table, tr, .stat-card, .kpi-card, .chart-card, form, .contact-row"
    );

    if (animatable.length > 0) {
      const items = Array.from(animatable).slice(0, 40);
      tl.fromTo(
        items,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.02 },
        "-=0.3"
      );
    }
  }, { scope: ref });

  return (
    <div ref={ref} style={{ willChange: "transform, opacity" }}>
      {children}
    </div>
  );
}
