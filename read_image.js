const Tesseract = require('tesseract.js');
const fs = require('fs');

async function readImage(path) {
  try {
    const { data: { text } } = await Tesseract.recognize(path, 'eng');
    console.log(`\n--- Text from ${path} ---\n`);
    console.log(text);
  } catch (error) {
    console.error(`Error reading ${path}:`, error);
  }
}

async function main() {
  await readImage('/home/almight/.gemini/antigravity/brain/d541ee0c-7147-49af-9949-40f8f0c8b9a3/media__1782748328441.png');
  await readImage('/home/almight/.gemini/antigravity/brain/d541ee0c-7147-49af-9949-40f8f0c8b9a3/media__1782748349771.png');
  await readImage('/home/almight/.gemini/antigravity/brain/d541ee0c-7147-49af-9949-40f8f0c8b9a3/media__1782748383262.png');
}

main();
