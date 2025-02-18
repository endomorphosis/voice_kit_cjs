// Initialize WASM loading and caching
import { env } from '@xenova/transformers';

const WASM_FILES = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd.wasm',
  'ort-wasm-threaded.wasm',
  'ort-wasm.wasm'
];

class WasmLoader {
  static cache = new Map();
  static isInitialized = false;

  static async init() {
    if (this.isInitialized) return;

    try {
      await Promise.all(WASM_FILES.map(async (file) => {
        const wasmUrl = chrome.runtime.getURL(`wasm/${file}`);
        const response = await fetch(wasmUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to load WASM file: ${file}`);
        }
        
        const wasmBuffer = await response.arrayBuffer();
        const wasmModule = await WebAssembly.compile(wasmBuffer);
        this.cache.set(file, wasmModule);
      }));

      // Configure environment with cached WASM modules
      env.wasmPaths = Object.fromEntries(
        WASM_FILES.map(file => [file, chrome.runtime.getURL(`wasm/${file}`)])
      );
      
      this.isInitialized = true;
    } catch (error) {
      console.error('WASM initialization failed:', error);
      throw error;
    }
  }

  static async getWasmModule(name) {
    if (!this.cache.has(name)) {
      await this.init();
    }
    return this.cache.get(name);
  }

  static clearCache() {
    this.cache.clear();
    this.isInitialized = false;
  }
}

export { WasmLoader };