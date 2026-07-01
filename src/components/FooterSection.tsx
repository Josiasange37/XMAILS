"use client";

import React, { useRef } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function FooterSection() {
  const footerRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.footer-col', {
      y: 40,
      opacity: 0,
      rotateX: 5,
      stagger: 0.12,
      duration: 1,
      ease: 'power4.out',
      scrollTrigger: { trigger: footerRef.current, start: 'top 85%' },
    });

    gsap.from('.footer-bottom', {
      y: 30,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: { trigger: footerRef.current, start: 'top 90%' },
    });

  }, { scope: footerRef });

  return (
    <footer
      ref={footerRef}
      id="footer"
      className="relative w-full pt-20 pb-10 font-sans"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="max-w-7xl 2xl:max-w-[1400px] mx-auto px-4 sm:px-6 md:px-10">
        
        {/* Top 3 Columns */}
        <div className="footer-col grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-10 mb-20">
          {/* Column 1 */}
          <div>
            <h3 className="text-xl md:text-[22px] font-medium leading-[1.3] mb-4" style={{ color: 'var(--footer-heading)' }}>
              Email that works<br />as hard as you do
            </h3>
            <p className="text-[13px] leading-[1.7] mb-6 pr-4" style={{ color: 'var(--footer-text)' }}>
              Xmailo is a modern email platform built for people who live in their inbox. Whether you&apos;re a solo founder, a growing team, or a power user, Xmailo gives you the tools to write faster, send smarter, and stay on top of every conversation — all from your browser, no install required.
            </p>
            <Link href="#features" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-colors" style={{ background: 'var(--bg-alt)', color: 'var(--footer-heading)', border: '1px solid var(--border)' }}>
              Read more
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          
          {/* Column 2 */}
          <div className="relative">
            <h3 className="text-xl md:text-[22px] font-medium leading-[1.3] mb-4" style={{ color: 'var(--footer-heading)' }}>
              A reliable web app<br />is all you need
            </h3>
            <p className="text-[13px] leading-[1.7] mb-4 pr-4" style={{ color: 'var(--footer-text)' }}>
              Forget heavy desktop clients and clunky installs. Xmailo runs entirely in your browser — fast, secure, and always up to date. Access your inbox from any device, anywhere in the world, with zero setup.
            </p>
            <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--footer-text)' }}>
              Why Xmailo stands out from the crowd
            </p>
            <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }} />
          </div>

          {/* Column 3 */}
          <div className="relative">
            <h3 className="text-xl md:text-[22px] font-medium leading-[1.3] mb-4" style={{ color: 'var(--footer-heading)' }}>
              Start in seconds with<br />an intuitive interface
            </h3>
            <p className="text-[13px] leading-[1.7] mb-4 pr-4" style={{ color: 'var(--footer-text)' }}>
              Smart compose, one-click scheduling, read receipts, and AI-assisted replies — Xmailo brings the tools you always wished your email had, without the learning curve. Sign up and be composing in under a minute.
            </p>
            <p className="text-[13px] leading-[1.7]" style={{ color: 'var(--footer-text)' }}>
              Xmailo&apos;s Help Center has everything you need to
            </p>
             <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, var(--bg) 0%, transparent 100%)' }} />
          </div>
        </div>

        {/* Social & Get Started Block */}
        <div className="footer-col flex flex-col md:flex-row justify-between items-start md:items-center border-t pt-12 pb-16 gap-8" style={{ borderColor: 'var(--footer-border)' }}>
          
          <div className="flex flex-col gap-4">
            <span className="text-[15px] font-medium leading-snug" style={{ color: 'var(--footer-heading)' }}>
              Follow us<br />on social media
            </span>
            <div className="flex gap-3">
              <a href="https://linkedin.com/company/xyberclan" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="https://github.com/xyberclan" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@xyberclan" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="w-10 h-10 rounded-full flex items-center justify-center transition-colors" style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 pr-6 rounded-[20px]" style={{ background: 'var(--bg-alt)', border: '1px solid var(--border)' }}>
            <div className="w-[56px] h-[56px] rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(57,211,83,0.12)', border: '1px solid rgba(57,211,83,0.2)' }}>
              <svg className="w-7 h-7" fill="none" stroke="#39d353" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[15px] font-medium mb-1.5 leading-snug" style={{ color: 'var(--footer-heading)' }}>
                No download needed.<br />Works in any browser
              </span>
              <Link href="/dashboard" className="text-[#39d353] text-[13px] font-semibold hover:underline flex items-center gap-1.5">
                Open Xmailo now
                <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

        </div>

        {/* Links Grid */}
        <div className="footer-col grid grid-cols-2 md:grid-cols-4 gap-8 mb-24">
          
          <div className="flex flex-col gap-5">
            <h4 className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--footer-heading)' }}>
              Product
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mt-0.5">
                <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[{ label: 'Smart Inbox', href: '#features' }, { label: 'AI Compose', href: '#features' }, { label: 'Send Scheduling', href: '#explore' }, { label: 'Email Tracking', href: '#explore' }, { label: 'Read Receipts', href: '#features' }, { label: 'Keyboard Shortcuts', href: '#features' }, { label: 'Integrations', href: '#explore' }, { label: 'Mobile Web', href: '#explore' }].map((link, idx) => (
                <li key={idx}><a href={link.href} className="text-[13px] transition-colors" style={{ color: 'var(--footer-text)' }}>{link.label}</a></li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col gap-5">
            <h4 className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--footer-heading)' }}>
              Company
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mt-0.5">
                <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[{ label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }, { label: 'Careers', href: '/careers' }, { label: 'Press', href: '/press' }, { label: 'Changelog', href: '/changelog' }, { label: 'Reviews', href: '/reviews' }].map((link, idx) => (
                <li key={idx}><Link href={link.href} className="text-[13px] transition-colors" style={{ color: 'var(--footer-text)' }}>{link.label}</Link></li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col gap-5">
            <h4 className="text-[14px] font-semibold flex items-center gap-1.5" style={{ color: 'var(--footer-heading)' }}>
              Pricing
              <svg width="6" height="10" viewBox="0 0 6 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50 mt-0.5">
                <path d="M1 1L5 5L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[{ label: 'Free Plan', href: '#explore' }, { label: 'Pro Plan', href: '#explore' }, { label: 'Team Plan', href: '#explore' }, { label: 'Enterprise', href: '/enterprise' }, { label: 'Compare Plans', href: '#explore' }].map((link, idx) => (
                <li key={idx}><a href={link.href} className="text-[13px] transition-colors" style={{ color: 'var(--footer-text)' }}>{link.label}</a></li>
              ))}
            </ul>
          </div>
          
          <div className="flex flex-col gap-5">
            <h4 className="text-[14px] font-semibold" style={{ color: 'var(--footer-heading)' }}>
              Help
            </h4>
            <ul className="flex flex-col gap-3.5">
              {[{ label: 'FAQ', href: '#faq' }, { label: 'Support', href: '/support' }, { label: 'Documentation', href: '/docs' }, { label: 'Status', href: '/status' }, { label: 'Community', href: '/community' }].map((link, idx) => (
                <li key={idx}><Link href={link.href} className="text-[13px] transition-colors" style={{ color: 'var(--footer-text)' }}>{link.label}</Link></li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Area */}
        <div className="footer-bottom flex flex-col gap-6 pb-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight" style={{ color: 'var(--text)' }}>
              <svg width="28" height="18" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="8" width="6" height="12" rx="2" fill="currentColor"/>
                <rect x="8" y="4" width="6" height="16" rx="2" fill="currentColor"/>
                <rect x="16" y="0" width="6" height="20" rx="2" fill="currentColor"/>
                <rect x="24" y="6" width="6" height="14" rx="2" fill="currentColor"/>
              </svg>
              Xmailo
            </Link>
            <p className="text-[13px]" style={{ color: 'var(--text-tertiary)' }}>
              &copy; {new Date().getFullYear()} Xmailo by <a href="https://xyberclan.me" target="_blank" rel="noopener noreferrer" className="hover:underline transition-colors" style={{ color: 'var(--text-secondary)' }}>Xyberclan</a>. All rights reserved.
            </p>
          </div>
          <p className="text-[11px] leading-[1.7] max-w-[900px]" style={{ color: 'var(--text-tertiary)' }}>
            Xmailo is a web-based email productivity platform. All email processing is handled securely in the cloud. By using Xmailo, you agree to our Terms of Service and Privacy Policy. Xmailo does not sell your data to third parties.
          </p>
          <div className="flex gap-8 mt-2">
            <Link href="/privacy" className="text-[12.5px] transition-colors" style={{ color: 'var(--footer-text)' }}>Privacy Policy</Link>
            <Link href="/terms" className="text-[12.5px] transition-colors" style={{ color: 'var(--footer-text)' }}>Terms of Service</Link>
            <Link href="/cookies" className="text-[12.5px] transition-colors" style={{ color: 'var(--footer-text)' }}>Cookie Policy</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
