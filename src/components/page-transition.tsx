"use client"

import { useRef, useEffect, ReactNode } from "react"
import gsap from "gsap"

export function usePageTransition() {
  const ref = useRef<HTMLDivElement>(null)
  return ref
}

export function PageTransition({ children }: { children: ReactNode }) {
  const ref = usePageTransition()

  useEffect(() => {
    const tl = gsap.fromTo(
      ref.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
    )
    return () => { tl.kill(); void 0; }
  }, [])

  return <div ref={ref}>{children}</div>
}
