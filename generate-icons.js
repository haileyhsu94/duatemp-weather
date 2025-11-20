import sharp from 'sharp';
import fs from 'fs';

const logoPath = './public/logo.png';

async function generateIcons() {
  // Generate 192x192 icon
  await sharp(logoPath)
    .resize(192, 192, {
      fit: 'contain',
      background: { r: 244, g: 241, b: 234, alpha: 1 } // newspaper color
    })
    .png()
    .toFile('./public/icon-192x192.png');
  
  // Generate 512x512 icon
  await sharp(logoPath)
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 244, g: 241, b: 234, alpha: 1 } // newspaper color
    })
    .png()
    .toFile('./public/icon-512x512.png');
  
  // Generate favicon
  await sharp(logoPath)
    .resize(32, 32, {
      fit: 'contain',
      background: { r: 244, g: 241, b: 234, alpha: 1 }
    })
    .png()
    .toFile('./public/favicon.ico');
  
  // Generate apple touch icon
  await sharp(logoPath)
    .resize(180, 180, {
      fit: 'contain',
      background: { r: 244, g: 241, b: 234, alpha: 1 }
    })
    .png()
    .toFile('./public/apple-touch-icon.png');
  
  console.log('Icons generated successfully from logo.png!');
}

generateIcons().catch(console.error);
