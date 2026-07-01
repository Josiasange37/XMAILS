"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ACCENT = '#22d3ee';

const faqs = [
  {
    q: "What is Xmailo and how is it different?",
    a: "Xmailo is a modern email platform built by Xyberclan that combines smart compose, send scheduling, read receipts, and AI-assisted replies in a fast, browser-based interface. Unlike traditional email clients, Xmailo is designed for productivity — no downloads, no bloat, just your inbox working smarter.",
  },
  {
    q: "Can I bring my own sending domain?",
    a: "Yes. You can verify any domain and start sending from it in under 5 minutes. We walk you through the DNS setup and validate DKIM, SPF, and DMARC records automatically.",
  },
  {
    q: "Is Xmailo really free to start?",
    a: "Absolutely. The Free plan includes smart inbox, basic scheduling, and email tracking — no credit card required. Upgrade to Pro or Team when you need higher volumes, AI compose, and premium features.",
  },
  {
    q: "How does AI compose work?",
    a: "Xmailo AI learns your writing style and suggests complete replies with a single click. It handles context-aware draft generation, tone adjustments, and multi-language support — so you respond in seconds, not minutes.",
  },
  {
    q: "Is my data secure and private?",
    a: "Yes. Xmailo uses end-to-end encryption with AES-256 and TLS 1.3 protocols. We never sell your data, and all email content is encrypted both in transit and at rest. Xmailo is built by Xyberclan with security as a core principle.",
  },
];

function FaqItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!bodyRef.current) return;
    gsap.to(bodyRef.current, {
      height: open ? 'auto' : 0,
      opacity: open ? 1 : 0,
      duration: open ? 0.4 : 0.3,
      ease: 'power2.out',
    });
  }, [open]);

  useGSAP(() => {
    if (!itemRef.current) return;
    gsap.from(itemRef.current, {
      x: index % 2 === 0 ? -20 : 20,
      opacity: 0,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: itemRef.current,
        start: 'top 85%',
        toggleActions: 'play reverse play reverse',
      },
    });
  }, { scope: itemRef });

  return (
    <div
      ref={itemRef}
      className="faq-item border-b"
      style={{ borderColor: 'var(--faq-border)' }}
    >
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between py-6 text-left group"
        aria-expanded={open}
      >
        <span
          className="font-medium pr-6 transition-colors duration-200"
          style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)', color: open ? 'var(--text)' : 'var(--text-secondary)' }}
        >
          {q}
        </span>
        <span
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
          style={{
            background: open ? ACCENT : 'var(--bg-alt)',
            border: open ? '1px solid transparent' : '1px solid var(--border)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
          }}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke={open ? '#000' : 'var(--text-tertiary)'}
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </button>

      <div
        ref={bodyRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <p
          className="pb-6 leading-relaxed"
          style={{ fontSize: 'clamp(0.9rem, 1.3vw, 1rem)', color: 'var(--faq-color)' }}
        >
          {a}
        </p>
      </div>
    </div>
  );
}

export default function FaqSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.faq-heading', {
      y: 40,
      opacity: 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: '.faq-heading', start: 'top 82%' },
    });

  }, { scope: sectionRef });

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="relative w-full overflow-hidden py-28 md:py-36"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[70vw] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--border), transparent)' }}
        aria-hidden="true"
      />

      <div className="max-w-3xl mx-auto px-6 md:px-10">
        <div className="faq-heading mb-16">
          <span
            className="inline-block text-xs font-bold tracking-[0.22em] uppercase mb-4"
            style={{ color: ACCENT }}
          >
            FAQ
          </span>
          <h2
            className="font-display font-black leading-[1.06] tracking-tight"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', color: 'var(--text)' }}
          >
            Common<br />
            <span style={{ color: ACCENT }}>questions.</span>
          </h2>
        </div>

        <div>
          {faqs.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} index={i} />)}
        </div>

      </div>
    </section>
  );
}
