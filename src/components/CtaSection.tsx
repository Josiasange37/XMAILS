"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export default function CtaSection() {
  const ctaRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const ctaBtnRef = useRef<HTMLAnchorElement>(null);

  useGSAP(() => {
    gsap.from('.cta-content > *', {
      y: 40,
      opacity: 0,
      stagger: 0.15,
      duration: 0.9,
      ease: 'power3.out',
      scrollTrigger: { trigger: ctaRef.current, start: 'top 80%' },
    });

    gsap.to(glowRef.current, {
      scale: 1.3,
      opacity: 0.06,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    gsap.to(ctaBtnRef.current, {
      scale: 1.04,
      duration: 1.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
      boxShadow: '0 0 50px rgba(57,211,83,0.5)',
    });

    gsap.from('.cta-bg-lines', {
      scrollTrigger: {
        trigger: ctaRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 2,
      },
      y: 40,
      opacity: 0,
      ease: 'none',
    });

  }, { scope: ctaRef });

  return (
    <section
      ref={ctaRef}
      id="cta"
      className="relative w-full py-20 sm:py-24 md:py-32 xl:py-40 overflow-hidden border-t"
      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
    >
      <div className="cta-bg-lines absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute left-[10%] top-0 bottom-0 w-px" style={{ background: 'var(--border-light)' }} />
        <div className="absolute left-[30%] top-0 bottom-0 w-px" style={{ background: 'var(--border-light)' }} />
        <div className="absolute left-[50%] top-0 bottom-0 w-px" style={{ background: 'var(--border-light)' }} />
        <div className="absolute left-[70%] top-0 bottom-0 w-px" style={{ background: 'var(--border-light)' }} />
        <div className="absolute left-[90%] top-0 bottom-0 w-px" style={{ background: 'var(--border-light)' }} />
      </div>

      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10 text-center relative z-10">
        <span className="cta-content inline-block text-xs font-bold tracking-[0.22em] uppercase mb-6" style={{ color: '#39d353' }}>
          Get started
        </span>
        <h2 className="cta-content font-display font-bold mb-6 leading-[1.2]" style={{ fontSize: 'clamp(2rem, 5vw, 5rem)', color: 'var(--text)' }}>
          Ready to take control<br />
          of your inbox?
        </h2>
        <p className="cta-content text-[15px] max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Join thousands of users who send smarter every day. No downloads, no installs — just open your browser and start.
        </p>
        <div className="cta-content">
          <Link
            ref={ctaBtnRef}
            href="/dashboard"
            className="inline-block text-black font-semibold text-[15px] px-10 py-4 rounded-full transition-transform"
            style={{
              background: '#39d353',
              boxShadow: '0 0 30px rgba(57,211,83,0.3)',
            }}
          >
            Get started for free
          </Link>
        </div>
      </div>

      <div ref={glowRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(80vw,600px)] h-[min(80vw,600px)] opacity-[0.03] blur-[min(15vw,100px)] rounded-full pointer-events-none" style={{ background: '#39d353' }} />
    </section>
  );
}
