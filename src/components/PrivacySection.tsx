"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ACCENT = '#818cf8';

export default function PrivacySection() {
  const sectionRef = useRef<HTMLElement>(null);
  const lockRef = useRef<SVGSVGElement>(null);
  const ringOuter = useRef<HTMLDivElement>(null);
  const ringMid = useRef<HTMLDivElement>(null);
  const ringInner = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    try {
    gsap.from('.privacy-card', {
      y: 80,
      opacity: 0,
      scale: 0.95,
      duration: 1.2,
      ease: 'power4.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 80%',
      },
    });

    gsap.from('.privacy-text > *', {
      y: 30,
      opacity: 0,
      stagger: 0.2,
      duration: 0.8,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
      },
    });

    gsap.to(lockRef.current, {
      y: -6,
      duration: 2.5,
      ease: 'sine.inOut',
      yoyo: true,
      repeat: -1,
    });

    if (ringOuter.current) {
      gsap.to(ringOuter.current, {
        scale: 1.08,
        opacity: 0.4,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }

    if (ringMid.current) {
      gsap.to(ringMid.current, {
        scale: 1.05,
        opacity: 0.3,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.3,
      });
    }

    if (ringInner.current) {
      gsap.to(ringInner.current, {
        scale: 1.03,
        opacity: 0.2,
        duration: 2.5,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
        delay: 0.6,
      });
    }

    gsap.to('.privacy-badge', {
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1.5,
      },
      y: 10,
      ease: 'none',
    });

    } catch (e) { console.warn('PrivacySection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="privacy" className="relative w-full py-16 sm:py-24 xl:py-32 px-4 sm:px-6 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto">
        <div
          className="privacy-card w-full rounded-[2.5rem] flex flex-col md:flex-row overflow-hidden relative"
          style={{ background: 'var(--privacy-card-bg)', border: '1px solid rgba(129,140,248,0.15)' }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 80% 60% at 30% 50%, rgba(129,140,248,0.04), transparent)' }} />

          <div className="w-full md:w-[55%] min-h-[320px] sm:min-h-[380px] md:min-h-[450px] xl:min-h-[500px] relative border-b md:border-b-0 md:border-r" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
            <div className="absolute left-[55%] top-0 bottom-0 w-px border-l border-dashed" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
            <div className="absolute left-0 right-0 top-[45%] h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative flex items-center justify-center">
                <div ref={ringOuter} className="absolute w-[160px] sm:w-[200px] md:w-[220px] h-[160px] sm:h-[200px] md:h-[220px] rounded-full" style={{ border: '1px solid rgba(129,140,248,0.15)' }} />
                <div ref={ringMid} className="absolute w-[130px] sm:w-[155px] md:w-[170px] h-[130px] sm:h-[155px] md:h-[170px] rounded-full" style={{ border: '1px solid rgba(129,140,248,0.1)' }} />
                <div ref={ringInner} className="absolute w-[100px] sm:w-[120px] md:w-[130px] h-[100px] sm:h-[120px] md:h-[130px] rounded-full" style={{ border: '1px solid rgba(129,140,248,0.06)' }} />
                <svg ref={lockRef} className="relative z-10 w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16" style={{ color: ACCENT }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </div>
            </div>

            <div className="privacy-badge absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3">
              <div className="px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-center shadow-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(129,140,248,0.1)' }}>
                <div className="text-white/40 text-[10px] sm:text-[12px] font-medium mb-0.5 sm:mb-1">Encryption</div>
                <div className="font-bold text-sm sm:text-lg" style={{ color: ACCENT }}>AES-256</div>
              </div>
              <div className="px-3 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-center shadow-xl" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(129,140,248,0.1)' }}>
                <div className="text-white/40 text-[10px] sm:text-[12px] font-medium mb-0.5 sm:mb-1">Protocol</div>
                <div className="text-white font-bold text-sm sm:text-lg">TLS 1.3</div>
              </div>
            </div>
          </div>

          <div className="w-full md:w-[45%] flex items-center justify-center p-8 sm:p-12 md:p-16 xl:p-24">
            <div className="privacy-text text-center max-w-sm">
              <h2 className="font-display font-bold leading-[1.15] mb-6 sm:mb-8 tracking-tight" style={{ fontSize: 'clamp(1.5rem, 3.5vw, 3rem)', color: 'var(--text)' }}>
                Your privacy is<br/>
                <span style={{ color: ACCENT }}>our top priority</span><br/>
                end-to-end encrypted
              </h2>
              <p className="text-[1.1rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Every email you send and receive is encrypted<br/>
                with industry-standard AES-256 and TLS 1.3
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
