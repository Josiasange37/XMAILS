"use client";

import React, { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function LicensedSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(() => {
    gsap.from('.licensed-content', {
      y: 40,
      opacity: 0,
      duration: 1,
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 75%',
      }
    });

    gsap.to('.moss-glow', {
      opacity: 0.3,
      scale: 1.1,
      duration: 4,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut'
    });
  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} id="licensed" className="relative w-full bg-black pt-32 pb-10 px-6 overflow-hidden flex flex-col items-center">
      <div className="licensed-content text-center max-w-2xl mx-auto flex flex-col items-center z-10 relative">
        <h2 className="text-white font-medium text-[1.3rem] md:text-[1.5rem] leading-snug mb-5">
          Xmailo is a certified<br/>and compliant email platform
        </h2>
        
        {/* Fake Logos / Badges */}
        <div className="flex items-center justify-center gap-3 mb-10">
          {[
            { id: 1, initial: 'S' },
            { id: 2, initial: 'G' },
            { id: 3, initial: 'I' },
            { id: 4, initial: 'H' },
            { id: 5, initial: 'C' }
          ].map((badge) => (
            <div key={badge.id} className="w-9 h-9 rounded-full bg-[#111] border border-black/10 flex items-center justify-center">
              <span className="text-white/40 text-[10px] font-bold">{badge.initial}</span>
            </div>
          ))}
        </div>
        
        <a href="#" className="text-[#39d353] text-xs font-semibold hover:underline mb-8">
          Learn more &gt;
        </a>
      </div>

      {/* The big 3D graphic representation */}
      <div className="relative w-full max-w-[800px] h-[350px] flex items-center justify-center -mt-8">
        {/* Glow */}
        <div className="moss-glow absolute w-[400px] h-[400px] bg-[#39d353] rounded-full blur-[100px] opacity-20 pointer-events-none" />
        
        {/* Moss/Spheres background elements */}
        <div className="absolute bottom-0 w-full h-[180px] flex items-end justify-center overflow-hidden z-0">
          <div className="relative w-full h-full max-w-[500px]">
            <div className="absolute bottom-[-60px] left-[10%] w-[180px] h-[150px] rounded-[100px] bg-[#0c2a10] blur-[2px] shadow-[inset_0_10px_30px_rgba(57,211,83,0.1)]" />
            <div className="absolute bottom-[-30px] left-[25%] w-[220px] h-[180px] rounded-[100px] bg-[#113a17] blur-[1px] shadow-[inset_0_15px_30px_rgba(57,211,83,0.15)]" />
            <div className="absolute bottom-[-50px] right-[15%] w-[200px] h-[160px] rounded-[100px] bg-[#0a200c] blur-[2px] shadow-[inset_0_10px_20px_rgba(57,211,83,0.1)]" />
            <div className="absolute bottom-[-20px] right-[30%] w-[200px] h-[150px] rounded-[100px] bg-[#154a1d] blur-[1px] shadow-[inset_0_20px_40px_rgba(57,211,83,0.25)]" />
            <div className="absolute bottom-[-10px] left-[40%] w-[160px] h-[120px] rounded-[100px] bg-[#1b5e25] shadow-[inset_0_20px_50px_rgba(57,211,83,0.4)]" />
          </div>
        </div>

        {/* The metallic geometric shape */}
        <div className="relative z-10 w-[320px] h-[200px] origin-center -rotate-[15deg] drop-shadow-[0_25px_35px_rgba(0,0,0,0.8)]">
          <svg viewBox="0 0 300 150" className="w-full h-full overflow-visible">
            <defs>
              <linearGradient id="frameGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#777" />
                <stop offset="25%" stopColor="#222" />
                <stop offset="50%" stopColor="#0a0a0a" />
                <stop offset="80%" stopColor="#1a1a1a" />
                <stop offset="100%" stopColor="#555" />
              </linearGradient>
              <filter id="innerGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="shadowDiff" />
                <feFlood floodColor="#39d353" floodOpacity="0.8" />
                <feComposite in2="shadowDiff" operator="in" />
                <feComposite in2="SourceGraphic" operator="over" />
              </filter>
            </defs>
            
            {/* The thick outer metallic frame */}
            <path d="M 60 140 L 10 75 L 60 10 L 145 10 L 240 10 L 290 75 L 240 140 Z" 
                  fill="url(#frameGrad)" 
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinejoin="round" />
                  
            {/* The two inner cutouts with green inner glow */}
            <path d="M 70 120 L 30 75 L 70 30 L 130 30 L 110 120 Z" fill="black" filter="url(#innerGlow)" />
            <path d="M 230 120 L 180 120 L 160 30 L 230 30 L 270 75 Z" fill="black" filter="url(#innerGlow)" />
          </svg>
        </div>
      </div>
    </section>
  );
}
