import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceIcon = join(__dirname, '../../errows-web/public/icon-512.png');
const resDir = join(__dirname, '../android/app/src/main/res');

// Android icon sizes
const iconSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground icon sizes (for adaptive icons)
const foregroundSizes = [
  { name: 'mipmap-mdpi', size: 108 },
  { name: 'mipmap-hdpi', size: 162 },
  { name: 'mipmap-xhdpi', size: 216 },
  { name: 'mipmap-xxhdpi', size: 324 },
  { name: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
  console.log('Generating Android icons from:', sourceIcon);

  // Generate regular icons
  for (const { name, size } of iconSizes) {
    const outputPath = join(resDir, name, 'ic_launcher.png');
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name}/ic_launcher.png (${size}x${size})`);

    // Round icon
    const roundOutputPath = join(resDir, name, 'ic_launcher_round.png');
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(roundOutputPath);
    console.log(`Generated: ${name}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate foreground icons
  for (const { name, size } of foregroundSizes) {
    const outputPath = join(resDir, name, 'ic_launcher_foreground.png');
    await sharp(sourceIcon)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Generated: ${name}/ic_launcher_foreground.png (${size}x${size})`);
  }

  console.log('Done!');
}

generateIcons().catch(console.error);
