// background.js - Using ES modules
import { pipeline, env } from '@xenova/transformers';
import { preDownloadModels, areModelsCached } from './model-cache.js';
import { CONTEXT_MENU_ITEM_ID } from './constants.js';

// Configure environment
env.useBrowserCache = true;
env.cacheDir = 'models';
env.allowLocalModels = true;

// Define StoppingCriteria class
class InterruptableStoppingCriteria {
  constructor() {
    this.shouldStop = false;
  }
  
  async call(outputIds, scores, kwargs = {}) {
    return this.shouldStop;
  }
  
  interrupt() {
    this.shouldStop = true;
  }
  
  reset() {
    this.shouldStop = false;
  }
}

// Initialize model paths properly for extension context
const getModelPath = () => 'models/';

// State management
const state = {
  modelStatus: 'uninitialized',
  loadingProgress: 0,
  whisperPipeline: null,
  stopping_criteria: new InterruptableStoppingCriteria()
};

// Broadcast status to all connected clients
const broadcastStatus = (status, data = null) => {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        status,
        data,
        progress: state.loadingProgress
      });
    });
  });
};

// Text generation pipeline with proper memory management
class TextGenerationPipeline {
  static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
  static instance = null;
  static lastUsed = Date.now();
  static memoryCleanupInterval = 5 * 60 * 1000;

  static async getInstance(progress_callback = null) {
    const now = Date.now();
    
    // Check if we need to clean up old instance
    if (this.instance && (now - this.lastUsed > this.memoryCleanupInterval)) {
      console.log('Cleaning up old model instance...');
      await this.cleanupInstance();
    }

    if (this.instance) {
      this.lastUsed = now;
      broadcastStatus('ready');
      return this.instance;
    }

    try {
      console.time('totalModelLoading');
      state.modelStatus = 'loading';
      broadcastStatus('loading');

      const updateProgress = (data) => {
        if (data.progress !== undefined) {
          state.loadingProgress = data.progress;
          console.log(`Loading step:`, {
            file: data.file,
            status: data.status,
            progress: data.progress
          });
          broadcastStatus('loading', data);
        }
        if (progress_callback) progress_callback(data);
      };

      // Initialize with WASM by default since WebGPU is not available in service workers
      this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
        progress_callback: updateProgress,
        quantized: true
      });

      this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
        progress_callback: updateProgress,
        quantized: true
      });

      this.instance = {
        tokenizer: this.tokenizer,
        model: this.model,
        destroy: async () => {
          try {
            if (this.model?.destroy) await this.model.destroy();
            if (this.tokenizer?.destroy) await this.tokenizer.destroy();
          } catch (error) {
            console.warn('Error destroying model:', error);
          }
        }
      };

      this.lastUsed = now;
      state.modelStatus = 'ready';
      broadcastStatus('ready');
      console.timeEnd('totalModelLoading');

      return this.instance;
    } catch (error) {
      state.modelStatus = 'error';
      broadcastStatus('error', error.message);
      throw error;
    }
  }

  static async cleanupInstance() {
    if (this.instance) {
      await this.instance.destroy();
      this.instance = null;
    }
  }
}

// Initialize ASR pipeline with proper error handling
async function initASR() {
  try {
    if (state.whisperPipeline) return state.whisperPipeline;

    state.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
      quantized: false,
      local: true,
      cache_dir: env.cacheDir
    });

    state.modelStatus = 'ready';
    broadcastStatus('ready');
    return state.whisperPipeline;
  } catch (error) {
    console.error('Failed to initialize ASR:', error);
    state.modelStatus = 'error';
    broadcastStatus('error', safeString(error.message));
    throw error;
  }
}

// Service worker event listeners
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      initializeExtension()
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      initializeExtension()
    ])
  );
});

// Message handling with proper type checking
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (!type) return;

  try {
    switch (type) {
      case 'check_status':
        event.ports[0]?.postMessage({
          status: state.modelStatus,
          progress: state.loadingProgress
        });
        break;

      case 'transcribe':
        if (!data?.audio) {
          throw new Error('No audio data provided');
        }
        await handleTranscription(data.audio);
        break;

      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('Error handling message:', error);
    event.ports[0]?.postMessage({ error: safeString(error.message) });
  }
});

// Safe audio data handling
async function handleTranscription(audioData) {
  const pipeline = await initASR();
  if (!pipeline) {
    throw new Error('ASR pipeline not initialized');
  }

  let audioArray;
  if (audioData instanceof Float32Array) {
    audioArray = audioData;
  } else if (Array.isArray(audioData)) {
    if (!audioData.every(x => typeof x === 'number' && !isNaN(x))) {
      throw new Error('Invalid audio data - must contain only valid numbers');
    }
    audioArray = Float32Array.from(audioData);
  } else {
    throw new Error('Invalid audio data format');
  }

  const result = await pipeline(audioArray);
  if (!result?.text) {
    throw new Error('No transcription result');
  }

  broadcastStatus('transcription', result.text);
}

// Initialize extension
async function initializeExtension() {
  try {
    await chrome.contextMenus.create({
      id: CONTEXT_MENU_ITEM_ID,
      title: 'Generate from "%s"',
      contexts: ["selection"]
    });

    const modelsAreCached = await areModelsCached();
    if (!modelsAreCached) {
      await preDownloadModels((progress) => {
        state.loadingProgress = progress.progress || 0;
        broadcastStatus('loading', {
          status: 'downloading',
          model: progress.model,
          file: progress.file,
          progress: state.loadingProgress
        });
      });
    }

    await initASR();
    
  } catch (error) {
    console.error('Error initializing extension:', error);
    state.modelStatus = 'error';
    broadcastStatus('error', error.message);
  }
}

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID) return;

  try {
    const text = info.selectionText;
    if (!text) throw new Error('No text selected');

    const result = await TextGenerationPipeline.getInstance().then(pipeline => 
      pipeline.generate(text)
    );

    await chrome.tabs.sendMessage(tab.id, { 
      action: 'showResult',
      result,
      userText: text
    });
  } catch (error) {
    await chrome.tabs.sendMessage(tab.id, {
      action: 'showError',
      error: error.message
    });
  }
});

// Safe string handling
const safeString = input => input == null ? '' : String(input);

