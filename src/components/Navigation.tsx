"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#explore' },
  { label: 'About', href: '#privacy' },
  { label: 'Help', href: '#faq' },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [dark, setDark] = useState(true);
  const [activeSection, setActiveSection] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const linksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const rightRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const mobileCtaRef = useRef<HTMLAnchorElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem('theme');
    const isDark = stored ? stored === 'dark' : true;
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
      const ids = ['features', 'explore', 'privacy', 'faq'];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 180) {
            setActiveSection(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useGSAP(() => {
    try {
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });
      tl.fromTo(navRef.current, { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 })
        .fromTo(logoRef.current, { x: -30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, '-=0.45')
        .fromTo(
          linksRef.current.filter(Boolean),
          { y: -24, opacity: 0, scale: 0.9 },
          { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.07, ease: 'back.out(1.7)' },
          '-=0.3'
        )
        .fromTo(rightRef.current, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 }, '-=0.2');
    } catch (e) { console.warn('Nav GSAP error:', e); }
  }, { scope: navRef });

  useEffect(() => {
    if (!mobileMenuRef.current || !mobileLinksRef.current.length) return;
    const mm = gsap.matchMedia();
    mm.add('(max-width: 767px)', () => {
      if (mobileOpen) {
        gsap.set(mobileMenuRef.current, { display: 'flex' });
        gsap.fromTo(
          mobileMenuRef.current,
          { opacity: 0, y: -10, scaleY: 0.97, transformOrigin: 'top center' },
          { opacity: 1, y: 0, scaleY: 1, duration: 0.35, ease: 'power3.out' }
        );
        gsap.fromTo(
          mobileLinksRef.current.filter(Boolean),
          { x: -16, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out' },
        );
        if (mobileCtaRef.current) {
          gsap.fromTo(mobileCtaRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, delay: 0.25, ease: 'power2.out' });
        }
      } else {
        gsap.to(mobileMenuRef.current, {
          opacity: 0,
          y: -10,
          scaleY: 0.97,
          duration: 0.25,
          ease: 'power2.in',
          onComplete: () => { gsap.set(mobileMenuRef.current, { display: 'none' }); },
        });
      }
    });
    return () => mm.revert();
  }, [mobileOpen]);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileOpen(false);
  }, []);

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 w-full z-50 transition-all duration-500"
        style={{
          background: scrolled ? 'var(--nav-blur)' : 'transparent',
          borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(1.8)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px) saturate(1.8)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16 md:h-[72px]">
          <Link
            ref={logoRef}
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 font-bold text-lg sm:text-xl tracking-tight shrink-0 min-h-[44px]"
            style={{ color: 'var(--text)' }}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#39d353' }}>
              <svg width="16" height="10" viewBox="0 0 32 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[18px] sm:h-[12px]">
                <rect x="0" y="8" width="6" height="12" rx="2" fill="black"/>
                <rect x="8" y="4" width="6" height="16" rx="2" fill="black"/>
                <rect x="16" y="0" width="6" height="20" rx="2" fill="black"/>
                <rect x="24" y="6" width="6" height="14" rx="2" fill="black"/>
              </svg>
            </div>
            <span>Xmailo</span>
            <span
              className="hidden xs:inline text-[8px] sm:text-[9px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full tracking-wide"
              style={{ background: 'var(--bg-alt)', color: '#39d353' }}
            >
              by Xyberclan
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link, i) => {
              const isActive = activeSection === link.href.replace('#', '');
              return (
                <a
                  key={link.href}
                  ref={el => { linksRef.current[i] = el; }}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className="relative px-4 py-2 text-[14px] font-medium rounded-lg transition-all duration-300"
                  style={{
                    color: isActive ? 'var(--text)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--bg-alt)' : 'transparent',
                  }}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute -bottom-[1px] left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full"
                      style={{ background: '#39d353' }}
                    />
                  )}
                </a>
              );
            })}
          </div>

          <div ref={rightRef} className="flex items-center gap-1.5 sm:gap-2.5">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="w-[44px] h-[44px] sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all duration-300 active:scale-90 sm:hover:scale-105"
              style={{ background: 'var(--bg-alt)', color: 'var(--text-secondary)' }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-[15px] sm:h-[15px]">
                {dark ? (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </>
                ) : (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                )}
              </svg>
            </button>

            <Link
              href="/login"
              className="hidden sm:inline-flex text-[13px] sm:text-[14px] font-medium px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 active:scale-90 sm:hover:scale-105 min-h-[44px] sm:min-h-0 items-center"
              style={{ color: 'var(--text-secondary)' }}
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="px-4 sm:px-5 py-2 rounded-lg text-black font-semibold text-[13px] sm:text-[14px] transition-all duration-300 active:scale-90 sm:hover:scale-105 min-h-[44px] flex items-center"
              style={{ background: '#39d353' }}
            >
              Try for free
            </Link>

            <button
              onClick={() => setMobileOpen(prev => !prev)}
              className="md:hidden w-[44px] h-[44px] rounded-lg flex items-center justify-center active:scale-90 transition-transform"
              style={{ background: 'var(--bg-alt)', color: 'var(--text)' }}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileOpen ? (
                  <>
                    <path d="M6 6l12 12M18 6l-12 12" />
                  </>
                ) : (
                  <>
                    <path d="M4 6h16M4 12h16M4 18h16" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'var(--bg)' }}
        >
          <div
            ref={mobileMenuRef}
            className="flex flex-col justify-between min-h-[calc(100dvh-56px)] px-4 pt-3 pb-8"
            style={{ marginTop: '56px' }}
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link, i) => {
                const isActive = activeSection === link.href.replace('#', '');
                return (
                  <a
                    key={link.href}
                    ref={el => { mobileLinksRef.current[i] = el; }}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="flex items-center px-4 py-4 rounded-xl text-[17px] font-medium transition-colors min-h-[52px]"
                    style={{
                      color: isActive ? '#39d353' : 'var(--text)',
                      background: isActive ? 'rgba(57,211,83,0.06)' : 'transparent',
                    }}
                  >
                    {link.label}
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#39d353]" />
                    )}
                  </a>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 pt-4">
              <Link
                ref={mobileCtaRef}
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-5 py-4 rounded-xl text-black font-semibold text-[16px] min-h-[52px] flex items-center justify-center active:scale-[0.97] transition-transform"
                style={{ background: '#39d353' }}
              >
                Try for free
              </Link>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="w-full text-center px-5 py-4 rounded-xl text-[15px] font-medium min-h-[52px] flex items-center justify-center active:scale-[0.97] transition-transform"
                style={{ background: 'var(--bg-alt)', color: 'var(--text-secondary)' }}
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
