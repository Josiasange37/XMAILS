"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function HighlightSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    try {
    gsap.from('.hl-word', {
      y: 80,
      opacity: 0,
      rotateX: 25,
      duration: 1,
      ease: 'power4.out',
      stagger: 0.15,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
        toggleActions: 'play reverse play reverse',
      },
    });

    gsap.to(bgRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
      scale: 2,
      opacity: 0.08,
      ease: 'none',
    });

    } catch (e) { console.warn('HighlightSection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="highlights"
      className="relative w-full overflow-hidden flex items-center justify-center"
      style={{ minHeight: '30vh', padding: 'clamp(40px, 6vw, 120px) clamp(16px, 4vw, 48px)', background: 'var(--bg)' }}
    >
      <div ref={bgRef} className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 50% 50% at 50% 50%, var(--glow-indigo), transparent)' }} />
      <h2
        className="text-center font-display font-black leading-[1.06] tracking-tight relative z-10 max-w-[95%] xl:max-w-[1400px]"
        style={{ fontSize: 'clamp(2rem, 6vw, 7rem)', color: 'var(--text)' }}
      >
        <span className="hl-word inline">Discover the perfect </span>
        <span className="hl-word inline">blend of </span>
        <span className="hl-word inline" style={{ color: '#a78bfa' }}>speed, </span>
        <span className="hl-word inline" style={{ color: '#22d3ee' }}>reliability </span>
        <span className="hl-word inline">and </span>
        <span className="hl-word inline" style={{ color: '#f59e0b' }}>usability</span>
      </h2>
    </section>
  );
}
