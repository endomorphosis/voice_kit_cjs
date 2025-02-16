// background.js - Handles requests from the UI, runs the model, then sends back a response
import { pipeline } from '@xenova/transformers';
import { preDownloadModels, areModelsCached } from './model-cache.js';
import { CONTEXT_MENU_ITEM_ID } from './constants.js';

// Initialize model paths and WASM configuration
const wasmPath = self.registration.scope + 'wasm/';
const modelPath = self.registration.scope + 'models/';

let asrWorker = null;
let modelStatus = 'uninitialized';
let loadingProgress = 0;
let whisperPipeline = null;

// Initialize ASR pipeline with proper configuration
async function initASR() {
  try {
    if (whisperPipeline) return whisperPipeline;

    whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
      revision: 'main',
      quantized: false,
      config: {
        wasmPath,
        type: 'wasm'
      }
    });

    modelStatus = 'ready';
    self.postMessage({ type: 'ready' });
    return whisperPipeline;
  } catch (error) {
    console.error('Failed to initialize ASR:', error);
    modelStatus = 'error';
    self.postMessage({ type: 'error', error: error.message });
    throw error;
  }
}

// Set up the stopping criteria for interrupting generation if needed
const stopping_criteria = new InterruptableStoppingCriteria();

// Function to broadcast status to all popup windows
function broadcastStatus(status, data = null) {
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        status,
        data,
        progress: loadingProgress
      });
    });
  });
}

// Function to extract text from a URL
async function fetchUrlText(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Use regex to remove scripts, styles, and HTML tags
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 2000); // Limit to 2000 chars
    
    return cleanText;
  } catch (error) {
    console.error('Error fetching URL:', error);
    throw new Error('Could not fetch content from URL');
  }
}

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */
class TextGenerationPipeline {
  static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
  static instance = null;
  static lastUsed = Date.now();
  static memoryCleanupInterval = 5 * 60 * 1000; // 5 minutes

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
      modelStatus = 'loading';
      broadcastStatus('loading');

      const updateProgress = (data) => {
        if (data.progress !== undefined) {
          loadingProgress = data.progress;
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
      modelStatus = 'ready';
      broadcastStatus('ready');
      console.timeEnd('totalModelLoading');

      return this.instance;
    } catch (error) {
      modelStatus = 'error';
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

// Add cleanup on extension unload
self.addEventListener('message', async (event) => {
  const { type, data } = event.data;

  if (type === 'check_status') {
    event.ports[0].postMessage({
      status: modelStatus,
      progress: loadingProgress
    });
  }

  if (type === 'transcribe' && data?.audio) {
    try {
      const pipeline = await initASR();
      if (!pipeline) {
        throw new Error('ASR pipeline not initialized');
      }

      // Convert input to Float32Array if needed
      let audioArray;
      if (data.audio instanceof Float32Array) {
        audioArray = data.audio;
      } else if (Array.isArray(data.audio)) {
        if (!data.audio.every(x => typeof x === 'number')) {
          throw new Error('Invalid audio data - must contain only numbers');
        }
        audioArray = Float32Array.from(data.audio);
      } else {
        throw new Error('Invalid audio data format');
      }

      const result = await pipeline(audioArray);
      if (typeof result?.text === 'string') {
        self.postMessage({ type: 'transcription', text: result.text });
      } else {
        throw new Error('Invalid transcription result');
      }
    } catch (error) {
      console.error('ASR Error:', error);
      self.postMessage({ type: 'error', error: error.message });
    }
  }
});

// Create generate function with static configuration
const generate = async (text) => {
  try {
    const { tokenizer, model } = await TextGenerationPipeline.getInstance();
    
    const messages = [{ role: "user", content: text }];
    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
      max_length: 2048
    });

    if (inputs.input_ids?.length > 2048) {
      throw new Error('Input is too long - please provide shorter text');
    }

    const generateConfig = {
      ...inputs,
      do_sample: false,
      max_new_tokens: 512,
      min_new_tokens: 1,
      max_length: 2048,
      pad_token_id: tokenizer.pad_token_id,
      eos_token_id: tokenizer.eos_token_id,
      stopping_criteria,
      return_dict_in_generate: true,
      repetition_penalty: 1.2,
      no_repeat_ngram_size: 3,
      early_stopping: true
    };

    try {
      const { sequences } = await model.generate(generateConfig);
      const decoded = tokenizer.batch_decode(sequences, {
        skip_special_tokens: true,
      });
      return decoded[0];
    } catch (genError) {
      if (genError.message?.includes('1879778072')) {
        const truncatedConfig = {
          ...generateConfig,
          input_ids: inputs.input_ids.slice(-512),
          attention_mask: inputs.attention_mask.slice(-512),
          max_new_tokens: 256,
          max_length: 768
        };

        const { sequences } = await model.generate(truncatedConfig);
        const decoded = tokenizer.batch_decode(sequences, {
          skip_special_tokens: true,
        });
        return decoded[0] + "\n\n(Note: Response was truncated due to length)";
      }
      throw genError;
    }
  } catch (error) {
    if (error.message?.includes('1879778072')) {
      throw new Error('The model ran out of memory. Please try with shorter input text.');
    }
    throw error;
  }
};

// Initialize extension with proper error handling
async function initializeExtension() {
  try {
    // Create menu items
    await chrome.contextMenus.create({
      id: CONTEXT_MENU_ITEM_ID,
      title: 'Generate from "%s"',
      contexts: ["selection"]
    });

    await chrome.contextMenus.create({
      id: 'generate-from-link',
      title: 'Generate summary from link',
      contexts: ["link"]
    });

    // Pre-download models if needed
    const modelsAreCached = await areModelsCached();
    if (!modelsAreCached) {
      await preDownloadModels((progress) => {
        broadcastStatus('loading', {
          status: 'downloading',
          model: progress.model,
          file: progress.file,
          progress: progress.progress
        });
      });
    }

    // Initialize ASR
    await initASR();
    
  } catch (error) {
    console.error('Error initializing extension:', error);
    modelStatus = 'error';
    self.postMessage({ type: 'error', error: error.message });
  }
}

// Register service worker and initialize
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

// Context menu handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.menuItemId.startsWith('generate')) return;

  try {
    let text;
    if (info.menuItemId === CONTEXT_MENU_ITEM_ID) {
      text = info.selectionText;
    } else if (info.menuItemId === 'generate-from-link') {
      // Show loading via content script
      await chrome.tabs.sendMessage(tab.id, { action: 'showLoading' });

      text = await fetchUrlText(info.linkUrl);
      
      // Hide loading via content script
      await chrome.tabs.sendMessage(tab.id, { action: 'hideLoading' });
    }

    if (!text) throw new Error('No content found to generate from');

    const result = await generate(text);

    // Show result via content script
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

// Keep service worker alive and handle cleanup
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      self.skipWaiting(),
      initASR()
    ])
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      initASR()
    ])
  );
});

