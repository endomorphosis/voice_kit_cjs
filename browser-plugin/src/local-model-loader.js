import { env } from '@xenova/transformers';

// Model configurations - match with model-cache.js
export const MODEL_PATHS = {
  'Xenova/whisper-small': {
    files: [
      'preprocessor_config.json',
      'tokenizer.json',
      'tokenizer_config.json',
      'config.json',
      'decoder_model_merged.onnx',
      'encoder_model.onnx'
    ],
    type: 'automatic-speech-recognition'
  },
  'Xenova/gpt2-small': {
    files: [
      'tokenizer.json',
      'tokenizer_config.json',
      'config.json',
      'model.onnx'
    ],
    type: 'text-generation'
  }
};

// Initialize environment for browser extension context
env.allowRemoteModels = true;
env.useBrowserCache = true;
env.useCustomCache = true;
env.localModelPath = chrome.runtime.getURL('models');
env.cacheDir = chrome.runtime.getURL('models');
env.useFS = false;
env.wasmPath = chrome.runtime.getURL('wasm/');
env.remoteHost = 'https://huggingface.co';

class LocalModelLoader {
  constructor() {
    this.cache = new Map();
  }

  async loadModel(modelId, progressCallback) {
    const modelConfig = MODEL_PATHS[modelId];
    if (!modelConfig) throw new Error(`Model ${modelId} not found`);

    const modelFiles = await this.getModelFiles(modelId);
    const model = await env.loadModel(modelFiles, progressCallback);
    this.cache.set(modelId, model);
    return model;
  }

  async getModelFiles(modelId) {
    const modelConfig = MODEL_PATHS[modelId];
    const modelFiles = await Promise.all(modelConfig.files.map(async (file) => {
      const response = await fetch(`${env.localModelPath}/${file}`);
      if (!response.ok) throw new Error(`Failed to load ${file}`);
      return response.arrayBuffer();
    }));
    return modelFiles;
  }

  async hasModel(modelId) {
    return this.cache.has(modelId);
  }

  clearCache() {
    this.cache.clear();
  }
}

export const modelLoader = new LocalModelLoader();

export async function initializeModel() {
  await modelLoader.loadModel('Xenova/whisper-small');
  await modelLoader.loadModel('Xenova/gpt2-small');
}