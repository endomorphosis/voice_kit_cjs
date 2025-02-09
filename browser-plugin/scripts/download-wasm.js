import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WASM_DIR = path.join(__dirname, '..', 'public', 'wasm');

const WASM_FILES = [
  'ort-wasm.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm-simd-threaded.wasm'
];

const CDN_BASE = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/';

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, response => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', err => {
      fs.unlink(dest);
      reject(err);
    });
  });
}

async function main() {
  // Create wasm directory if it doesn't exist
  await fs.mkdir(WASM_DIR, { recursive: true });
  
  // Download each WASM file
  for (const file of WASM_FILES) {
    const url = CDN_BASE + file;
    const dest = path.join(WASM_DIR, file);
    console.log(`Downloading ${url} to ${dest}`);
    await downloadFile(url, dest);
  }
}

main().catch(console.error);