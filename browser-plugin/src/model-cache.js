import { pipeline, env } from "@xenova/transformers";
import { cacheManager } from './cache-manager.js';

// Configure environment for browser extension
env.useBrowserCache = true;
env.allowLocalModels = true;
env.allowRemoteModels = true;
env.useModelCaching = true;
env.localModelPath = chrome.runtime.getURL('models');
env.cacheDir = env.localModelPath;
env.useFS = false;
env.wasmPaths = {
  'ort-wasm-simd-threaded.wasm': chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.wasm'),
  'ort-wasm-simd.wasm': chrome.runtime.getURL('wasm/ort-wasm-simd.wasm'),
  'ort-wasm-threaded.wasm': chrome.runtime.getURL('wasm/ort-wasm-threaded.wasm'),
  'ort-wasm.wasm': chrome.runtime.getURL('wasm/ort-wasm.wasm')
};
env.backends = ['wasm'];
env.quantized = true;

// Model configurations
const MODELS = {
  TEXT: {
    modelId: "Xenova/gpt2-small",
    type: "text-generation",
    files: [
      "tokenizer.json",
      "tokenizer_config.json",
      "config.json",
      "model.onnx"
    ]
  },
  ASR: {
    modelId: "Xenova/whisper-small",
    type: "automatic-speech-recognition",
    files: [
      "preprocessor_config.json",
      "tokenizer.json",
      "tokenizer_config.json",
      "config.json",
      "decoder_model_merged.onnx",
      "encoder_model.onnx"
    ]
  }
};

// Initialize WASM
async function initWasm() {
  try {
    const wasmFiles = Object.keys(env.wasmPaths);
    await Promise.all(wasmFiles.map(async (file) => {
      const response = await fetch(env.wasmPaths[file]);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      const wasmBuffer = await response.arrayBuffer();
      await WebAssembly.compile(wasmBuffer);
    }));
  } catch (error) {
    console.error('WASM initialization error:', error);
    throw error;
  }
}

// Download and cache models
export const preDownloadModels = async (progressCallback) => {
  try {
    // Initialize WASM first
    await initWasm();

    for (const [type, config] of Object.entries(MODELS)) {
      try {
        const pipelineConfig = {
          quantized: true,
          progress_callback: progressCallback,
          cache_dir: env.cacheDir,
          local_files_only: false,
          revision: 'main'
        };
        
        const modelInstance = await pipeline(config.type, config.modelId, pipelineConfig);
        
        await cacheManager.set(`${type}_${config.modelId}`, {
          type: config.type,
          modelId: config.modelId,
          timestamp: Date.now()
        });

        console.log(`Successfully cached ${type} model`);
      } catch (modelError) {
        console.error(`Error loading ${type} model:`, modelError);
        throw modelError;
      }
    }
    return true;
  } catch (error) {
    console.error('Error pre-downloading models:', error);
    throw error;
  }
};

// Check cached models
export const areModelsCached = async () => {
  try {
    await initWasm();
    
    const results = await Promise.all(
      Object.entries(MODELS).map(async ([type, config]) => {
        try {
          const pipelineConfig = {
            quantized: true,
            local_files_only: true,
            cache_dir: env.cacheDir,
            revision: 'main'
          };
          
          await pipeline(config.type, config.modelId, pipelineConfig);
          return true;
        } catch (error) {
          console.warn(`Error checking ${type} model:`, error);
          return false;
        }
      })
    );
    return results.every(Boolean);
  } catch (error) {
    console.error('Error checking model cache:', error);
    return false;
  }
};