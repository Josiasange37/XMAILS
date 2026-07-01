const fs = require('fs');
const files = [
  'src/components/HeroSection.tsx',
  'src/components/ExploreSection.tsx',
  'src/components/PrivacySection.tsx',
  'src/components/LicensedSection.tsx',
  'src/components/FaqSection.tsx',
  'src/components/contact-select.tsx',
  'src/components/sidebar.tsx'
];

for (const f of files) {
  if (!fs.existsSync(f)) continue;
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/bg-gray-50/g, 'bg-black')
             .replace(/text-gray-900/g, 'text-white')
             .replace(/rgba\(0,0,0,0\.05\)/g, 'rgba(255,255,255,0.05)')
             .replace(/rgba\(0,0,0,0\.5\)/g, 'rgba(255,255,255,0.5)')
             .replace(/border-black\/5/g, 'border-white/5')
             .replace(/bg-white dark:bg-gray-900/g, 'bg-gray-900')
             .replace(/hover:bg-gray-50/g, 'hover:bg-white/5');
  fs.writeFileSync(f, text);
}
console.log('Done!');
