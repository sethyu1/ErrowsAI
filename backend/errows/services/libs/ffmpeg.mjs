import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/**
 * 合并多个 WAV 文件为单个文件，按输入顺序拼接
 * @param {string[]} filePaths - 需要合并的 WAV 文件路径集合
 * @param {string} [outputPath] - 输出文件路径，默认写入临时目录
 * @returns {Promise<string>} 返回生成的 WAV 文件路径
 */
export async function mergeWAV(
  filePaths,
  outputPath = join(tmpdir(), `errows-merge-${randomUUID()}.wav`)
) {
  if (!Array.isArray(filePaths) || filePaths.length === 0) {
    throw new Error('mergeWAV requires a non-empty array of file paths');
  }

  await new Promise((resolve, reject) => {
    const args = ['-y'];
    filePaths.forEach(pathItem => {
      args.push('-i', pathItem);
    });

    if (filePaths.length === 1) {
      args.push('-c', 'copy', outputPath);
    } else {
      const filterInputs = filePaths.map((_, index) => `[${index}:a]`).join('');
      const filter = `${filterInputs}concat=n=${filePaths.length}:v=0:a=1[outa]`;
      args.push('-filter_complex', filter, '-map', '[outa]', '-c:a', 'pcm_s16le', outputPath);
    }

    const ffmpeg = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';

    ffmpeg.stderr.on('data', chunk => {
      stderr += chunk.toString();
    });

    ffmpeg.once('error', error => {
      reject(error);
    });

    ffmpeg.once('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
      }
    });
  });

  return outputPath;
}
