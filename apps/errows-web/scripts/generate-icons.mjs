import sharp from 'sharp';
import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sizes = [192, 512];
const inputFile = join(__dirname, '../public/logo.png');
const outputDir = join(__dirname, '../public');

async function generateIcons() {
  try {
    // 检查源文件是否存在
    await fs.access(inputFile);
    
    console.log('🎨 生成 PWA 图标...\n');

    for (const size of sizes) {
      // 生成普通图标（any）
      const anyOutput = join(outputDir, `icon-${size}.png`);
      await sharp(inputFile)
        .resize(size, size, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
        })
        .png()
        .toFile(anyOutput);
      
      console.log(`✅ 生成 icon-${size}.png`);

      // 生成 maskable 图标（带安全区域）
      const padding = Math.floor(size * 0.1); // 10% padding
      const maskOutput = join(outputDir, `icon-${size}-mask.png`);
      
      await sharp(inputFile)
        .resize(size - padding * 2, size - padding * 2, { 
          fit: 'contain', 
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: '#0E0F17' // 你的主题背景色
        })
        .png()
        .toFile(maskOutput);
      
      console.log(`✅ 生成 icon-${size}-mask.png`);
    }

    console.log('\n🎉 所有图标生成完成！');
    console.log('\n📁 生成的文件：');
    console.log('  - public/icon-192.png');
    console.log('  - public/icon-192-mask.png');
    console.log('  - public/icon-512.png');
    console.log('  - public/icon-512-mask.png');
    console.log('\n💡 接下来：');
    console.log('  1. 检查生成的图标是否正确');
    console.log('  2. 更新 vite.config.ts 中的图标路径');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    if (error.code === 'ENOENT') {
      console.log('\n💡 请确保 public/logo.png 文件存在');
    }
  }
}

generateIcons();
