"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

function AppIcon() {
  return (
    <svg
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="60" rx="14" fill="var(--bg)" />
      <rect x="2" y="2" width="60" height="60" rx="14" stroke="#a78bfa" strokeWidth="2" />
      <path d="M20 28 L32 38 L44 28" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M20 36 L32 46 L44 36" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.4" />
    </svg>
  );
}

export default function FeatureSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);
  const bgGlowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    try {
    gsap.from('.feat2-title', {
      y: 36,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.feat2-title',
        start: 'top 85%',
      },
    });

    gsap.from(phoneRef.current, {
      y: 80,
      opacity: 0,
      duration: 1.3,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: phoneRef.current,
        start: 'top 88%',
      },
    });

    gsap.from('.feat2-card', {
      x: 40,
      opacity: 0,
      rotation: 5,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: '.feat2-card',
        start: 'top 90%',
      },
    });

    gsap.to(phoneRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: -40,
      scale: 1.02,
      ease: 'none',
    });

    gsap.to(bgGlowRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
      scale: 1.5,
      opacity: 0.06,
      ease: 'none',
    });

    } catch (e) { console.warn('FeatureSection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100vh', background: 'var(--bg)' }}
    >
      <div
        ref={bgGlowRef}
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 20%, var(--glow-purple), transparent)' }}
      />

      <div className="relative z-10 pt-20 pb-6 text-center px-6">
        <span className="inline-block text-xs font-bold tracking-[0.22em] uppercase mb-3" style={{ color: '#a78bfa' }}>
          Features
        </span>
        <h2
          className="feat2-title font-display font-bold tracking-tight"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', color: 'var(--text)' }}
        >
          Modern email platform
        </h2>
      </div>

      <div className="relative z-10 flex justify-center items-end w-full px-4">
        <div ref={phoneRef} className="relative w-full max-w-[min(90vw,800px)]">
          <img
            src="/hand-phone-dark.png"
            alt="Xmailo mobile email interface"
            className="w-full h-auto object-contain"
            style={{
              filter: 'drop-shadow(0 40px 120px rgba(167,139,250,0.12))',
            }}
          />
        </div>
      </div>

      <div
        className="absolute bottom-6 sm:bottom-10 right-[6%] md:right-[10%] xl:right-[14%] z-20 feat2-card"
        style={{ maxWidth: 280 }}
      >
        <div
          className="flex items-start gap-3 p-4 rounded-2xl"
          style={{
            background: '#a78bfa',
            boxShadow: '0 8px 40px rgba(167,139,250,0.35)',
          }}
        >
          <div
            className="flex-shrink-0 rounded-xl overflow-hidden"
            style={{ background: '#a78bfa', padding: 4 }}
          >
            <AppIcon />
          </div>

          <div className="flex flex-col justify-center gap-1">
            <p className="font-bold text-black leading-tight text-[15px]">
              Your inbox,<br />
              in your hands
            </p>
            <Link
              href="/dashboard"
              id="feat-card-cta"
              className="text-[13px] font-semibold text-black/70 hover:text-black transition-colors flex items-center gap-0.5"
            >
              Get started now <span className="text-[16px]">›</span>
            </Link>
          </div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '120px',
          background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)',
          zIndex: 5,
        }}
        aria-hidden="true"
      />
    </section>
  );
}
