import React from 'react';
import Navigation from '@/components/Navigation';
import HeroSection from '@/components/HeroSection';
import FeatureSection from '@/components/FeatureSection';
import HighlightSection from '@/components/HighlightSection';
import ExploreSection from '@/components/ExploreSection';
import PrivacySection from '@/components/PrivacySection';
import TestimonialSection from '@/components/TestimonialSection';
import CtaSection from '@/components/CtaSection';
import FooterSection from '@/components/FooterSection';

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Navigation />
      
      <HeroSection />
      <FeatureSection />
      <HighlightSection />
      <ExploreSection />
      <PrivacySection />
      
      {/* What people say / Trusted by builders */}
      <TestimonialSection />

      {/* CTA Section */}
      <CtaSection />
      
      <FooterSection />
      
    </main>
  );
}
