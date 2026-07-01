"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const BG_BARS = [
  { left: '3%',  height: '55%', top: '5%',  delay: 0.0, color: '#a78bfa' },
  { left: '11%', height: '75%', top: '0%',  delay: 0.1, color: '#39d353' },
  { left: '19%', height: '45%', top: '15%', delay: 0.05, color: '#22d3ee' },
  { left: '27%', height: '65%', top: '8%',  delay: 0.15, color: '#f59e0b' },
  { left: '60%', height: '60%', top: '5%',  delay: 0.15, color: '#818cf8' },
  { left: '68%', height: '80%', top: '0%',  delay: 0.1, color: '#39d353' },
  { left: '76%', height: '50%', top: '12%', delay: 0.05, color: '#a78bfa' },
  { left: '84%', height: '70%', top: '3%',  delay: 0.0, color: '#22d3ee' },
];

const BADGES = [
  'Smart compose',
  'AI replies',
  'Send scheduling',
  'Email tracking',
  'End-to-end encrypted',
  'Built by Xyberclan',
];

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const barsWrapperRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);
  const personRef = useRef<HTMLDivElement>(null);
  const barEls = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    try {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

    tl.from(barEls.current.filter(Boolean), {
      scaleY: 0,
      transformOrigin: 'bottom center',
      opacity: 0,
      duration: 1.2,
      stagger: 0.08,
    }, 0)

    .from(personRef.current, {
      opacity: 0,
      scale: 0.96,
      duration: 1.4,
    }, 0.2)

    .from(badgeRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.8,
    }, 0.3)

    .from(headingRef.current, {
      y: 35,
      opacity: 0,
      duration: 1.1,
    }, 0.45)

    .from(ctaRef.current, {
      y: 20,
      opacity: 0,
      duration: 0.9,
    }, 0.7)

    .from('.hero-badge', {
      y: 16,
      opacity: 0,
      stagger: 0.06,
      duration: 0.7,
    }, 0.85);

    barEls.current.forEach((el, i) => {
      if (!el) return;
      gsap.to(el, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -20 - (i % 3) * 15,
        ease: 'none',
      });
    });

    gsap.to(personRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: 80,
      scale: 0.92,
      ease: 'none',
    });

    gsap.to(headingRef.current, {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: -40,
      ease: 'none',
    });

    gsap.to('.hero-badge', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1,
      },
      y: 30,
      stagger: 0.03,
      ease: 'none',
    });

    } catch (e) { console.warn('HeroSection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative w-full overflow-hidden"
      style={{ minHeight: '100svh', background: 'var(--bg)' }}
    >
      <div
        ref={barsWrapperRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
      >
        {BG_BARS.map((bar, i) => (
          <div
            key={i}
            ref={el => { barEls.current[i] = el; }}
            className="hero-bar absolute rounded-[18px]"
            style={{
              left: bar.left,
              top: bar.top,
              width: '7%',
              height: bar.height,
              background: `linear-gradient(180deg, ${bar.color}22 0%, ${bar.color}08 100%)`,
              boxShadow: `0 0 40px ${bar.color}08`,
              maxWidth: 120,
            }}
          />
        ))}
      </div>

      <div
        className="absolute bottom-0 left-0 w-full pointer-events-none"
        style={{
          height: '25%',
          background: 'var(--hero-vignette)',
        }}
        aria-hidden="true"
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'var(--hero-radial)' }}
        aria-hidden="true"
      />

      <div
        ref={personRef}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{ width: '75%', maxWidth: 960, zIndex: 1 }}
        aria-hidden="true"
      >
        <img
          src="/hero-dark.png"
          alt=""
          className="w-full h-auto object-contain object-bottom"
          style={{ maxHeight: '85vh' }}
        />
      </div>

      <div
        className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 pt-24 sm:pt-32 pb-24 sm:pb-28 xl:pt-40 xl:pb-32"
        style={{ minHeight: '100svh', zIndex: 2 }}
      >
        <div ref={badgeRef} className="mb-8">
          <span
            className="serif inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm tracking-wide"
            style={{
              color: '#39d353',
              background: 'rgba(57,211,83,0.08)',
              border: '1px solid rgba(57,211,83,0.2)',
              fontSize: 'clamp(0.85rem, 1.2vw, 1rem)',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="#39d353" strokeWidth="1.5" />
              <circle cx="6" cy="6" r="2" fill="#39d353" />
            </svg>
            A product by Xyberclan
          </span>
        </div>

        <h1
          ref={headingRef}
          className="font-display font-bold leading-[1.1] tracking-tight mb-10"
          style={{
            fontSize: 'clamp(2rem, 5vw, 5rem)',
            color: 'var(--text)',
            textShadow: '0 2px 32px rgba(0,0,0,0.8)',
          }}
        >
          AI-powered email<br />
          that works as hard as you
        </h1>

        <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            id="hero-cta-primary"
            className="inline-flex items-center px-8 py-3.5 rounded-full font-semibold text-[16px] text-black transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: '#39d353',
              boxShadow: '0 0 28px rgba(57,211,83,0.35)',
            }}
          >
            Start for free
          </Link>

          <Link
            href="#features"
            id="hero-cta-learn"
            className="inline-flex items-center px-8 py-3.5 rounded-full font-semibold text-[15px] transition-all hover:scale-[1.03] active:scale-[0.98]"
            style={{
              color: 'var(--text)',
              border: '1px solid var(--border)',
              background: 'var(--bg-alt)',
            }}
          >
            See features
          </Link>
        </div>
      </div>

      <div
        ref={badgesRef}
        className="absolute bottom-0 left-0 w-full flex items-center justify-center gap-2 pb-5 px-4 flex-wrap"
        style={{ zIndex: 3 }}
      >
        {BADGES.map((label, i) => (
          <div
            key={i}
            className="hero-badge px-4 py-2 rounded-full text-[13px] font-medium whitespace-nowrap select-none"
            style={{
              color: 'var(--text)',
              background: 'var(--bg-alt)',
              border: '1px solid var(--border-light)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
