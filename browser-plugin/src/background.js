// background.js - Using ES modules
import { pipeline, env, AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers';
import { preDownloadModels, areModelsCached } from './model-cache.js';
import { CONTEXT_MENU_ITEM_ID } from './constants.js';

// Configure environment
env.useBrowserCache = false;
env.useCustomCache = true;
env.localModelPath = chrome.runtime.getURL('models');
env.backends = ['wasm']; // Remove WebGPU from service worker
env.wasmRoot = chrome.runtime.getURL('wasm/');

let textGenerator = null;

// Initialize LLM
async function initializeLLM() {
  if (textGenerator) return;

  try {
    textGenerator = await pipeline('text-generation', 'Xenova/gpt2-small', {
      quantized: true
    });

    console.log('LLM initialized successfully');
  } catch (error) {
    console.error('Failed to initialize LLM:', error);
    throw error;
  }
}

// State management using a closure to avoid global state issues
const createState = () => ({
  modelStatus: 'uninitialized',
  loadingProgress: 0,
  whisperPipeline: null,
  textPipeline: null,
  contextMenuCreated: false,
  stopping_criteria: {
    shouldStop: false,
    call: async () => this.shouldStop,
    interrupt: () => { this.shouldStop = true },
    reset: () => { this.shouldStop = false }
  }
});

const state = createState();

// Broadcast status to all connected clients
const broadcastStatus = async (status, data = null) => {
  const ports = [];
  // Use MessageChannel for reliable communication
  const channel = new MessageChannel();
  ports.push(channel.port1);
  
  ports.forEach(port => {
    port.postMessage({
      status,
      data,
      progress: state.loadingProgress
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
  if (state.whisperPipeline) return state.whisperPipeline;

  try {
    const pipelineConfig = {
      quantized: true,
      progress_callback: (progress) => {
        if (progress && typeof progress.progress === 'number') {
          state.loadingProgress = progress.progress;
          broadcastStatus('loading', progress);
        }
      },
      cache_dir: env.cacheDir,
      revision: 'main'
    };

    state.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', pipelineConfig);
    
    if (!state.whisperPipeline) {
      throw new Error('Failed to initialize ASR pipeline');
    }

    state.modelStatus = 'ready';
    await broadcastStatus('ready');
    return state.whisperPipeline;
  } catch (error) {
    state.modelStatus = 'error';
    await broadcastStatus('error', error.message);
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
  const { type, data, port } = event.data || {};
  
  if (!type || typeof type !== 'string') {
    port?.postMessage({ error: 'Invalid message format' });
    return;
  }

  try {
    switch (type) {
      case 'check_status':
        port?.postMessage({
          status: state.modelStatus,
          progress: state.loadingProgress
        });
        break;

      case 'transcribe':
        if (!data?.audio) {
          throw new Error('No audio data provided');
        }
        
        const text = await handleTranscription(data.audio);
        port?.postMessage({ success: true, text });
        break;

      default:
        port?.postMessage({ error: `Unknown message type: ${type}` });
    }
  } catch (error) {
    port?.postMessage({ error: error.message });
  }
});

// Safe audio data handling
async function handleTranscription(audioData) {
  const pipeline = await initASR();
  if (!pipeline) {
    throw new Error('ASR pipeline not initialized');
  }

  let audioArray;
  try {
    if (audioData instanceof Float32Array) {
      audioArray = audioData;
    } else if (ArrayBuffer.isView(audioData)) {
      audioArray = new Float32Array(audioData.buffer);
    } else if (Array.isArray(audioData)) {
      if (!audioData.every(x => typeof x === 'number' && !isNaN(x))) {
        throw new Error('Invalid audio data - must contain only valid numbers');
      }
      audioArray = Float32Array.from(audioData);
    } else {
      throw new Error('Invalid audio data format');
    }
  } catch (error) {
    throw new Error(`Failed to process audio data: ${error.message}`);
  }

  const result = await pipeline(audioArray);
  return safeProcessText(result?.text);
}

// Initialize extension
async function initializeExtension() {
  try {
    // First check and initialize models
    const modelsAreCached = await areModelsCached();
    if (!modelsAreCached) {
      await preDownloadModels((progress) => {
        if (typeof progress.progress === 'number') {
          state.loadingProgress = progress.progress;
          broadcastStatus('loading', {
            status: 'downloading',
            model: progress.model,
            file: progress.file,
            progress: state.loadingProgress
          });
        }
      });
    }

    // Initialize ASR pipeline
    await initASR();

    // Create context menu after models are loaded
    if (!state.contextMenuCreated) {
      await chrome.contextMenus.removeAll();
      await chrome.contextMenus.create({
        id: CONTEXT_MENU_ITEM_ID,
        title: 'Generate from "%s"',
        contexts: ["selection"]
      });
      state.contextMenuCreated = true;
    }
    
  } catch (error) {
    console.error('Error initializing extension:', error);
    state.modelStatus = 'error';
    await broadcastStatus('error', error.message);
    throw error;
  }
}

// Context menu handler with duplicate check
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID || !tab?.id) return;
  
  try {
    const text = info.selectionText;
    if (!text?.trim()) throw new Error('No text selected');
    
    const pipelineConfig = {
      quantized: true,
      cache_dir: env.cacheDir,
      revision: 'main'
    };
    
    const generator = await pipeline('text-generation', 'Xenova/gpt2-small', pipelineConfig);
    
    const result = await generator(text, {
      max_new_tokens: 256,
      temperature: 0.7,
      top_p: 0.95,
      do_sample: true
    });
    
    await chrome.tabs.sendMessage(tab.id, { 
      action: 'showResult',
      result: result[0]?.generated_text || 'No result generated',
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
const safeString = (input) => {
  if (input === null || input === undefined) return '';
  if (typeof input === 'string') return input;
  if (input && typeof input.toString === 'function') return input.toString();
  return '';
};

// Safe text processing
function safeProcessText(text) {
  if (!text) return '';
  return String(text).trim();
}

// Initialize models
const initializeModels = async () => {
  try {
    state.modelStatus = 'loading';
    broadcastStatus('loading', 'Initializing models...');

    // First check if models are cached
    const cached = await areModelsCached();
    if (!cached) {
      await preDownloadModels((progress) => {
        state.loadingProgress = progress.progress || 0;
        broadcastStatus('loading', progress);
      });
    }

    state.modelStatus = 'ready';
    broadcastStatus('ready');
  } catch (error) {
    console.error('Error initializing extension:', error);
    state.modelStatus = 'error';
    broadcastStatus('error', error.message);
    throw error;
  }
};

// Handle messages from popup and content script with connection check
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') {
    sendResponse({ error: 'Invalid message format' });
    return true;
  }

  // Create a promise to handle the message
  const messagePromise = (async () => {
    try {
      const response = await handleMessage(message);
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      return response;
    } catch (error) {
      console.error('Message handling error:', error);
      return { error: error.message };
    }
  })();

  // Handle the promise and ensure response is sent
  messagePromise.then(response => {
    try {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        return;
      }
      sendResponse(response);
    } catch (error) {
      console.error('Response error:', error);
    }
  });

  return true; // Will respond asynchronously
});

// Handle messages with retries
async function handleMessage(message) {
  let retries = 3;
  while (retries > 0) {
    try {
      switch (message.action) {
        case 'generate':
          if (!textGenerator) {
            await initializeLLM();
          }
          const processedText = safeProcessText(message.text);
          const result = await textGenerator(processedText, {
            max_new_tokens: 50,
            temperature: 0.7
          });
          return { text: safeProcessText(result[0]?.generated_text) };

        case 'checkGPU':
          return { hasWebGPU: false }; // Service workers don't support WebGPU

        default:
          throw new Error(`Unknown action: ${message.action}`);
      }
    } catch (error) {
      retries--;
      if (retries === 0) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
    }
  }
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
  initializeModels().catch(console.error);
  initializeLLM().catch(console.error);
});

console.log('Background service worker running.');

// Use chrome.runtime messaging without relying on document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message in background:', message);
  // Process messages related to LLM/ASR initialization
  if (message.type === 'initialize') {
    // Initialize Transformers.js and WebGPU components here
    // For example, dynamic import modules as needed
    import('./local-model-loader.js').then(module => {
      module.initializeModel().then(() => {
        sendResponse({ status: 'initialized' });
      }).catch(err => {
        sendResponse({ status: 'error', error: String(err) });
      });
    });
    return true; // asynchronous response
  } else {
    sendResponse({ status: 'unrecognized message' });
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  const { modelLoader } = await import('./local-model-loader.js');
  const model = await modelLoader.loadModel('Xenova/whisper-small');
  console.log('Model loaded:', model);
});

