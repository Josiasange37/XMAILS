"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

const cardBorder = (c: string) => `1px solid ${c}22`;
const cardGlow = (c: string) => `${c}11`;

export default function ExploreSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useGSAP(() => {
    try {
    cardRefs.current.forEach((card, i) => {
      if (!card) return;
      gsap.from(card, {
        y: 60,
        opacity: 0,
        scale: 0.97,
        duration: 1,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: card,
          start: 'top 85%',
          toggleActions: 'play reverse play reverse',
        },
      });

      gsap.to(card, {
        scrollTrigger: {
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: i % 2 === 0 ? -15 : 15,
        ease: 'none',
      });
    });

    } catch (e) { console.warn('ExploreSection GSAP error:', e); }
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="explore" className="relative w-full py-16 sm:py-24 xl:py-32 px-4 sm:px-6 overflow-hidden" style={{ background: 'var(--bg)' }}>
      <div className="max-w-5xl 2xl:max-w-7xl mx-auto">
        <h2 className="text-center font-display font-bold leading-tight mb-12 sm:mb-16 tracking-tight" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 4rem)', color: 'var(--text)' }}>
          Everything your inbox<br />
          <span style={{ color: 'var(--text-secondary)' }}>needs, right in the browser</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 xl:gap-6">
          {/* Top Full-Width Card: Smart Inbox */}
           <div ref={el => { cardRefs.current[0] = el; }} className="bento-card md:col-span-2 rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between relative overflow-hidden"
               style={{ background: 'var(--bento-card-bg)', border: cardBorder('#39d353') }}>
             <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 20% 80%, ${cardGlow('#39d353')}, transparent)` }} />
            
            <div className="md:w-5/12 flex flex-col items-start z-10">
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-3" style={{ color: '#39d353' }}>Inbox</span>
              <h3 className="text-xl md:text-2xl mb-8 leading-snug" style={{ color: 'var(--bento-text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--bento-text-white)' }}>Organized inbox</span><br/>focused on what matters
              </h3>
              <Link
                href="/dashboard"
                className="px-7 py-3 rounded-full font-bold text-black mb-4 transition-transform hover:scale-[1.03]"
                style={{ background: '#39d353', boxShadow: '0 0 20px rgba(57,211,83,0.2)' }}
              >
                Open your inbox
              </Link>
              <a href="#features" className="text-[13px] font-semibold hover:underline" style={{ color: '#39d353' }}>
                Learn more &gt;
              </a>
            </div>
            
            <div className="md:w-7/12 mt-10 md:mt-0 flex justify-end relative w-full" style={{ minHeight: 200 }}>
               <div className="w-full min-h-[180px] sm:min-h-[220px] rounded-2xl flex flex-col items-start relative overflow-hidden p-4 sm:p-5 gap-2 sm:gap-3" style={{ background: 'var(--bento-inner-bg)', border: '1px solid var(--bento-inner-border)' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(57,211,83,0.06), transparent)' }} />
                 {[
                   { subject: 'Team standup recap', unread: true },
                   { subject: 'Your invoice is ready', unread: true },
                   { subject: 'Welcome to Xmailo', unread: false },
                   { subject: 'Re: Project update', unread: false },
                 ].map((item, i) => (
                   <div key={i} className="relative z-10 flex items-center gap-3 w-full">
                     <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.unread ? '#39d353' : 'var(--bento-text-faint)' }} />
                     <span className="text-[13px] truncate" style={{ color: item.unread ? 'var(--bento-text-white)' : 'var(--bento-text-faint)' }}>{item.subject}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Left Column */}
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 xl:gap-6">
            <div ref={el => { cardRefs.current[1] = el; }} className="bento-card rounded-[2rem] p-6 sm:p-8 pb-0 flex flex-col items-center text-center overflow-hidden relative min-h-[340px] sm:min-h-[380px] xl:min-h-[420px]"
                 style={{ background: 'var(--bento-card-bg)', border: cardBorder('#a78bfa') }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cardGlow('#a78bfa')}, transparent)` }} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-3 z-10" style={{ color: '#a78bfa' }}>AI</span>
              <h4 className="text-[1.1rem] leading-snug mb-3 z-10" style={{ color: 'var(--bento-text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--bento-text-white)' }}>AI-powered replies</span><br/>respond in seconds
              </h4>
              <a href="#features" className="text-[13px] font-semibold mb-6 z-10 hover:underline" style={{ color: '#a78bfa' }}>
                Learn more &gt;
              </a>
              <div className="w-full flex-grow rounded-t-2xl flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bento-inner-bg)', border: '1px solid var(--bento-inner-border)', borderBottom: 'none' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(147,112,219,0.08), transparent)' }} />
                 <div className="relative z-10 px-4 py-3 rounded-xl text-[12px] text-left max-w-[80%]" style={{ background: 'var(--bg-alt)', border: '1px solid var(--bento-inner-border)', color: 'var(--bento-text-muted)' }}>
                   &ldquo;Thanks for reaching out! Happy to jump on a call this week — does Thursday work?&rdquo;
                   <div className="mt-1 text-[11px] font-medium" style={{ color: '#a78bfa' }}>Generated by Xmailo AI</div>
                 </div>
              </div>
            </div>

            <div ref={el => { cardRefs.current[2] = el; }} className="bento-card rounded-[2rem] p-6 sm:p-8 pb-0 flex flex-col items-center text-center overflow-hidden relative min-h-[280px] sm:min-h-[320px]"
                 style={{ background: 'var(--bento-card-bg)', border: cardBorder('#f59e0b') }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cardGlow('#f59e0b')}, transparent)` }} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-3 z-10" style={{ color: '#f59e0b' }}>Schedule</span>
              <h4 className="text-[1.1rem] leading-snug mb-3 z-10" style={{ color: 'var(--bento-text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--bento-text-white)' }}>Send scheduling</span><br/>choose the perfect moment
              </h4>
              <a href="#features" className="text-[13px] font-semibold mb-6 z-10 hover:underline" style={{ color: '#f59e0b' }}>
                Learn more &gt;
              </a>
              <div className="w-[85%] flex-grow rounded-t-2xl flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bento-inner-bg)', border: '1px solid var(--bento-inner-border)', borderBottom: 'none' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(245,158,11,0.06), transparent)' }} />
                 <div className="relative z-10 flex flex-col items-center gap-1">
                   <div className="text-[11px]" style={{ color: 'var(--bento-text-faint)' }}>Scheduled for</div>
                   <div className="font-bold text-[18px]" style={{ color: '#f59e0b' }}>Mon 9:00 AM</div>
                 </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="flex flex-col gap-3 sm:gap-4 md:gap-5 xl:gap-6">
            <div ref={el => { cardRefs.current[3] = el; }} className="bento-card rounded-[2rem] p-6 sm:p-8 pb-0 flex flex-col items-center text-center overflow-hidden relative min-h-[280px] sm:min-h-[320px]"
                 style={{ background: 'var(--bento-card-bg)', border: cardBorder('#22d3ee') }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cardGlow('#22d3ee')}, transparent)` }} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-3 z-10" style={{ color: '#22d3ee' }}>Tracking</span>
              <h4 className="font-bold text-[1.1rem] mb-3 z-10" style={{ color: 'var(--bento-text-white)' }}>Email tracking</h4>
              <a href="#features" className="text-[13px] font-semibold mb-6 z-10 hover:underline" style={{ color: '#22d3ee' }}>
                Learn more &gt;
              </a>
              <div className="w-full flex-grow rounded-t-2xl flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bento-inner-bg)', border: '1px solid var(--bento-inner-border)', borderBottom: 'none' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(6,182,212,0.08), transparent)' }} />
                 <div className="relative z-10 flex flex-col items-center gap-2">
                   <div className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#22d3ee' }}>
                     <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22d3ee' }} />
                     Opened · 2 min ago
                   </div>
                   <div className="text-[11px]" style={{ color: 'var(--bento-text-faint)' }}>Re: Project proposal</div>
                 </div>
              </div>
            </div>

            <div ref={el => { cardRefs.current[4] = el; }} className="bento-card rounded-[2rem] p-6 sm:p-8 pb-0 flex flex-col items-center text-center overflow-hidden relative min-h-[340px] sm:min-h-[380px] xl:min-h-[420px]"
                 style={{ background: 'var(--bento-card-bg)', border: cardBorder('#818cf8') }}>
              <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${cardGlow('#818cf8')}, transparent)` }} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase mb-3 z-10" style={{ color: '#818cf8' }}>Security</span>
              <h4 className="text-[1.1rem] leading-snug mb-8 z-10" style={{ color: 'var(--bento-text-muted)' }}>
                <span className="font-bold" style={{ color: 'var(--bento-text-white)' }}>End-to-end encryption</span><br/>
                only you and your recipient<br/>can read what&rsquo;s sent
              </h4>
              <div className="w-[80%] flex-grow rounded-t-2xl flex items-center justify-center relative overflow-hidden" style={{ background: 'var(--bento-inner-bg)', border: '1px solid var(--bento-inner-border)', borderBottom: 'none' }}>
                 <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(99,102,241,0.08), transparent)' }} />
                 <svg className="relative z-10 w-12 h-12" style={{ color: 'rgba(129,140,248,0.5)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                 </svg>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
