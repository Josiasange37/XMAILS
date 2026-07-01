const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const pageFile = path.join(__dirname, 'src', 'app', 'page.tsx');

const files = [
  pageFile,
  ...fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx')).map(f => path.join(componentsDir, f))
];

const replacements = [
  { from: /bg-\[\#0a0a0a\]/g, to: 'bg-white' },
  { from: /bg-black/g, to: 'bg-gray-50' },
  { from: /text-white/g, to: 'text-gray-900' },
  { from: /text-\[\#a3a3a3\]/g, to: 'text-gray-500' },
  { from: /text-white\/([0-9]+)/g, to: 'text-gray-900/$1' },
  { from: /bg-white\/([0-9]+)/g, to: 'bg-black/$1' },
  { from: /border-white\/([0-9]+)/g, to: 'border-black/$1' },
  { from: /border-white/g, to: 'border-black' },
  { from: /rgba\(255,255,255,/g, to: 'rgba(0,0,0,' },
  { from: /rgba\(255, 255, 255,/g, to: 'rgba(0, 0, 0,' },
  { from: /from-black/g, to: 'from-white' },
  { from: /via-black/g, to: 'via-white' },
  { from: /to-black/g, to: 'to-white' },
  { from: /maskImage: 'linear-gradient\(to bottom, rgba\(0,0,0,1\)/g, to: "maskImage: 'linear-gradient(to bottom, rgba(255,255,255,1)" },
  { from: /mask-image: linear-gradient\(to bottom, rgba\(0,0,0,1\)/g, to: "mask-image: linear-gradient(to bottom, rgba(255,255,255,1)" }
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    replacements.forEach(({ from, to }) => {
      content = content.replace(from, to);
    });
    
    // some specific fixes for mask images (since mask image expects black/transparent to hide, actually mask doesn't depend on color, just alpha! so rgba(0,0,0,1) is correct for BOTH light and dark themes. Let's revert that one.
    content = content.replace(/rgba\(255,255,255,1\)/g, 'rgba(0,0,0,1)'); // masks need black alpha

    if (content !== original) {
      fs.writeFileSync(file, content);
      console.log('Updated', path.basename(file));
    }
  }
});
