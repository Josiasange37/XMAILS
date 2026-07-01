"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: "Xmailo completely changed how I handle email. The AI compose feature alone saves me hours every week.",
    author: "Sarah Chen",
    role: "Founder, Meridian Studio",
    accent: '#a78bfa',
  },
  {
    quote: "We migrated our entire team to Xmailo and never looked back. The scheduling and tracking are game-changers.",
    author: "Marcus Johnson",
    role: "CTO, Cloudbase Inc.",
    accent: '#22d3ee',
  },
  {
    quote: "Finally, an email platform that actually respects your time. Fast, intuitive, and the encryption gives me peace of mind.",
    author: "Priya Patel",
    role: "Product Lead, Nexus Labs",
    accent: '#f59e0b',
  },
];

export default function TestimonialSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    try {
    gsap.from('.testi-heading', {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.testi-heading', start: 'top 82%' },
    });

    cardsRef.current.forEach((card, i) => {
      if (!card) return;
      gsap.from(card, {
        y: 60,
        opacity: 0,
        rotateX: 10,
        transformOrigin: 'center bottom',
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
        },
      });

      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -10 - i * 5,
        rotateX: -3 + i * 1.5,
        ease: 'none',
      });
    });

    } catch (e) { console.warn('TestimonialSection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative w-full overflow-hidden py-20 sm:py-28 md:py-36 xl:py-44"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }}
        aria-hidden="true"
      />

      <div className="testi-heading max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-16 mb-12 sm:mb-16 text-center">
        <span
          className="inline-block text-xs font-bold tracking-[0.22em] uppercase mb-4"
          style={{ color: '#a78bfa' }}
        >
          What people say
        </span>
        <h2
          className="font-display font-black leading-[1.06] tracking-tight"
          style={{ fontSize: 'clamp(2rem, 5vw, 5rem)', color: 'var(--text)' }}
        >
          Trusted by<br />
          <span style={{ color: '#a78bfa' }}>builders.</span>
        </h2>
      </div>

      <div className="max-w-5xl 2xl:max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 xl:gap-6">
        {testimonials.map((t, i) => (
          <div
            key={i}
            ref={el => { cardsRef.current[i] = el; }}
            className="testi-card rounded-[1.5rem] p-6 sm:p-8 flex flex-col relative overflow-hidden"
            style={{ background: 'var(--testi-card-bg)', border: '1px solid var(--testi-card-border)' }}
          >
            <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 50% at 50% 100%, ${t.accent}08, transparent)` }} />
            <svg className="w-8 h-8 mb-4 relative z-10" style={{ color: t.accent }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C9.591 11.69 11 13.166 11 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.656-2.917-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311C19.591 11.69 21 13.166 21 15c0 1.933-1.567 3.5-3.5 3.5-1.271 0-2.404-.656-2.917-1.179z" />
            </svg>
            <p className="leading-relaxed mb-6 flex-grow relative z-10" style={{ fontSize: 'clamp(0.9rem, 1.2vw, 0.95rem)', color: 'var(--testi-quote)' }}>
              {t.quote}
            </p>
            <div className="relative z-10">
              <p className="font-semibold text-[14px]" style={{ color: 'var(--testi-name)' }}>{t.author}</p>
              <p className="text-[12px]" style={{ color: 'var(--testi-role)' }}>{t.role}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-16">
        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full"
          style={{
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.2)',
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#a78bfa' }} />
          <span className="text-sm" style={{ color: 'var(--testi-join-text)' }}>
            Join thousands using Xmailo —{" "}
            <a href="/dashboard" className="font-semibold hover:underline" style={{ color: '#a78bfa' }}>
              start for free
            </a>
          </span>
        </div>
      </div>
    </section>
  );
}
