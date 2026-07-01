"use client";

import React from 'react';
import Link from 'next/link';

export default function PagePlaceholder({ title }: { title: string }) {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16"
      style={{ background: 'var(--bg)', color: 'var(--text)' }}
    >
      <div className="max-w-md text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--bg-alt)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#39d353" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-bold mb-4">{title}</h1>
        <p className="text-[15px] leading-relaxed mb-8" style={{ color: 'var(--text-secondary)' }}>
          This page is coming soon. We&apos;re working on it.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[14px] font-semibold text-black transition-all hover:scale-105 active:scale-95"
          style={{ background: '#39d353' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back home
        </Link>
      </div>
    </main>
  );
}
