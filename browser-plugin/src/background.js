// background.js - Handles requests from the UI, runs the model, then sends back a response
import "@huggingface/transformers";
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
  pipeline
} from "@huggingface/transformers";
import { preDownloadModels, areModelsCached } from "./model-cache.js";
import { CONTEXT_MENU_ITEM_ID } from "./constants.js";

// Set up the stopping criteria for interrupting generation if needed
const stopping_criteria = new InterruptableStoppingCriteria();

let modelStatus = 'uninitialized';
let loadingProgress = 0;

// Note: ONNX Runtime will show warnings about some operations being assigned to CPU.
// This is expected and optimal behavior - certain operations (especially shape-related ones) 
// are deliberately run on CPU as they perform better there, even when using WebGPU
// as the primary execution provider.

// Function to broadcast status to all popup windows
function broadcastStatus(status, data = null) {
    // Add timestamp to loading status messages
    if (status === 'loading' && data?.status) {
        console.log(`[${new Date().toISOString()}] Loading progress:`, data);
    }
    chrome.runtime.sendMessage({
        status,
        data,
        progress: loadingProgress
    }).catch(() => {
        // Ignore errors when no popups are open
    });
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
      console.log('Cleaning up old model instance to free memory...');
      try {
        // Cleanup ONNX Runtime resources
        if (this.instance.model?.destroy) {
          await this.instance.model.destroy();
        }
        if (this.instance.tokenizer?.destroy) {
          await this.instance.tokenizer.destroy();
        }
        this.instance = null;
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      } catch (error) {
        console.warn('Error cleaning up model:', error);
      }
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
              console.log(`[${new Date().toISOString()}] Loading step:`, {
                  file: data.file,
                  status: data.status,
                  progress: data.progress
              });
              broadcastStatus('loading', data);
          }
          if (progress_callback) progress_callback(data);
      };

      // First try loading with WebGPU
      try {
          console.time('webgpuInit');
          if (!navigator.gpu) {
              throw new Error("WebGPU is not supported in this browser");
          }

          const adapter = await navigator.gpu.requestAdapter();
          if (!adapter) {
              throw new Error("Failed to get WebGPU adapter");
          }

          // Try to get device with f16 support, but don't require it
          let device;
          let features = [];
          try {
            device = await adapter.requestDevice({
              requiredFeatures: ['shader-f16']
            });
            features.push('shader-f16');
          } catch (e) {
            console.log('F16 shaders not supported, using standard WebGPU');
            device = await adapter.requestDevice();
          }

          // Set memory limits based on available GPU memory
          const gpuLimits = {
            maxStorageBufferBindingSize: Math.min(
              adapter.limits.maxStorageBufferBindingSize,
              2147483648 // 2GB max
            ),
            maxBufferSize: Math.min(
              adapter.limits.maxBufferSize,
              2147483648 // 2GB max
            )
          };

          console.log('Using WebGPU adapter:', {
            name: adapter.name,
            features: Array.from(adapter.features),
            limits: gpuLimits
          });

          // ONNX Runtime config based on available features
          const onnxConfig = {
            executionProviders: ["webgpu", "cpu"],
            graphOptimizationLevel: 99,
            enableMemoryPattern: false,
            executionMode: "sequential",
            enableCpuMemArena: false,
            webgpu: {
              gpuDevice: device,
              preferredLayout: "nchw",
              deviceType: "discrete",
              shaderPreprocess: true,
              useHostMemory: false
            }
          };

          // Add f16 settings only if supported
          if (features.includes('shader-f16')) {
            onnxConfig.webgpu.shader_features = ['f16'];
          }

          console.timeEnd('webgpuInit');

          console.time('tokenizerLoading');
          this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
              progress_callback: updateProgress,
              cache_dir: 'models',
              local_files_only: true, // Try to use cached files first
              truncation: true,
              max_length: 2048
          });
          console.timeEnd('tokenizerLoading');

          console.time('modelLoading');
          this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
              ...onnxConfig,
              progress_callback: updateProgress,
              cache_dir: 'models',
              local_files_only: true, // Try to use cached files first
              load_in_8bit: true, // Use 8-bit quantization
              torch_dtype: 'float16' // Use fp16 precision
          });
          console.timeEnd('modelLoading');

      } catch (gpuError) {
          // If WebGPU fails, fall back to WASM
          console.warn('WebGPU initialization failed, falling back to WASM:', gpuError);
          
          this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
              progress_callback: updateProgress,
          });

          this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
              device: "wasm",
              progress_callback: updateProgress
          });
          
          console.log('Successfully initialized on WASM');
      }

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
      
      // Set up automatic cleanup
      const cleanupInterval = setInterval(() => {
        const timeSinceLastUse = Date.now() - this.lastUsed;
        if (timeSinceLastUse > this.memoryCleanupInterval) {
          console.log('Auto-cleaning unused model instance...');
          clearInterval(cleanupInterval);
          this.instance?.destroy();
          this.instance = null;
        }
      }, this.memoryCleanupInterval);
      
      return this.instance;
    } catch (error) {
      modelStatus = 'error';
      const errorMessage = error.message.includes('WebGPU') ? 
        `WebGPU error: ${error.message}. Falling back to WASM...` :
        error.message;
      broadcastStatus('error', errorMessage);
      throw new Error(errorMessage);
    }
  }
}

// Add cleanup on extension unload
chrome.runtime.onSuspend.addListener(async () => {
  if (TextGenerationPipeline.instance) {
    console.log('Cleaning up model on extension unload...');
    await TextGenerationPipeline.instance.destroy();
    TextGenerationPipeline.instance = null;
  }
});

// Create generic generate function that will be reused
const generate = async (text) => {
  console.log('Starting text generation for:', text);
  try {
    // Get the pipeline instance with correct WASM path
    globalThis.__TRANSFORMER_WORKER_WASM_PATH__ = '/wasm/';
    console.log('Getting pipeline instance...');
    const { tokenizer, model } = await TextGenerationPipeline.getInstance((data) => {
      console.log("Loading model progress:", data);
    });
    console.log('Pipeline instance ready');

    const messages = [{ role: "user", content: text }];
    console.log('Applying chat template...');
    const inputs = tokenizer.apply_chat_template(messages, {
      add_generation_prompt: true,
      return_dict: true,
      max_length: 2048 // Limit input length to avoid memory issues
    });

    // Log the tokenized input for debugging
    console.log('Tokenized input:', {
      inputIds: inputs.input_ids?.length,
      attentionMask: inputs.attention_mask?.length,
    });

    // Add memory management - ensure we're not exceeding safe limits
    if (inputs.input_ids?.length > 2048) {
      throw new Error('Input is too long - please provide shorter text');
    }

    console.log('Starting model generation...');
    try {
      const { sequences } = await model.generate({
        ...inputs,
        do_sample: false,
        max_new_tokens: 512,
        min_new_tokens: 1, // Ensure we generate at least something
        max_length: 2048,
        pad_token_id: tokenizer.pad_token_id,
        eos_token_id: tokenizer.eos_token_id,
        stopping_criteria,
        return_dict_in_generate: true,
        // Add safety parameters
        repetition_penalty: 1.2,
        no_repeat_ngram_size: 3,
        early_stopping: true
      });

      console.log('Decoding generated sequences...');
      const decoded = tokenizer.batch_decode(sequences, {
        skip_special_tokens: true,
      });

      console.log('Generation complete:', decoded[0]);
      return decoded[0];
    } catch (genError) {
      // Handle specific ONNX runtime errors
      if (genError.message?.includes('1879778072')) {
        console.error('ONNX memory allocation error:', genError);
        
        // Try to recover by clearing model cache and retrying with smaller context
        console.log('Attempting recovery with smaller context...');
        const truncatedInputs = {
          ...inputs,
          input_ids: inputs.input_ids.slice(-512), // Take last 512 tokens
          attention_mask: inputs.attention_mask.slice(-512)
        };

        const { sequences } = await model.generate({
          ...truncatedInputs,
          do_sample: false,
          max_new_tokens: 256, // Reduce output size
          min_new_tokens: 1,
          max_length: 768,
          pad_token_id: tokenizer.pad_token_id,
          eos_token_id: tokenizer.eos_token_id,
          stopping_criteria,
          return_dict_in_generate: true,
          repetition_penalty: 1.2,
          no_repeat_ngram_size: 3,
          early_stopping: true
        });

        const decoded = tokenizer.batch_decode(sequences, {
          skip_special_tokens: true,
        });

        return decoded[0] + "\n\n(Note: Response was truncated due to length)";
      }
      throw genError;
    }
  } catch (error) {
    console.error('Error in generate function:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      inputs: text?.length
    });
    
    // Provide more helpful error messages
    if (error.message?.includes('1879778072')) {
      throw new Error('The model ran out of memory. Please try with shorter input text.');
    }
    throw error;
  }
};

////////////////////// 1. Context Menus //////////////////////
// Handle extension installation
chrome.runtime.onInstalled.addListener(async (details) => {
  // Create context menu
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Generate from "%s"',
    contexts: ["selection"],
  });

  // Start pre-downloading models if not cached
  const modelsAreCached = await areModelsCached();
  if (!modelsAreCached) {
    console.log('Starting model pre-download...');
    preDownloadModels((progress) => {
      broadcastStatus('loading', {
        status: 'downloading',
        model: progress.model,
        file: progress.file,
        progress: progress.progress
      });
    });
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('Context menu clicked:', info);
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID || !info.selectionText) return;

  try {
    // Generate text from the selected text
    console.log('Generating text from selection:', info.selectionText);
    const result = await generate(info.selectionText);
    console.log('Generated result:', result);

    // Show the result in the webpage
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [result],
      function: (result) => {
        // Create a floating div to show the result
        const chatContainer = document.createElement('div');
        chatContainer.id = 'copilot-chat-container';
        chatContainer.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          width: 400px;
          max-height: 80vh;
          background: white;
          border: 1px solid #ccc;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          z-index: 10000;
          display: flex;
          flex-direction: column;
        `;

        // Add header with title and close button
        const header = document.createElement('div');
        header.style.cssText = `
          padding: 12px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        header.innerHTML = '<span style="font-weight: bold;">AI Response</span>';

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
          border: none;
          background: none;
          cursor: pointer;
          font-size: 20px;
          padding: 0 4px;
        `;
        closeBtn.onclick = () => chatContainer.remove();
        header.appendChild(closeBtn);

        // Add chat content
        const content = document.createElement('div');
        content.style.cssText = `
          padding: 16px;
          overflow-y: auto;
          font-size: 14px;
          line-height: 1.5;
        `;

        // Add user message
        const userMessage = document.createElement('div');
        userMessage.style.cssText = `
          margin-bottom: 12px;
          padding: 8px 12px;
          background: #f0f0f0;
          border-radius: 8px;
        `;
        userMessage.textContent = window.getSelection().toString();

        // Add AI response
        const aiResponse = document.createElement('div');
        aiResponse.style.cssText = `
          padding: 8px 12px;
          background: #e3f2fd;
          border-radius: 8px;
          white-space: pre-wrap;
        `;
        aiResponse.textContent = result;

        content.appendChild(userMessage);
        content.appendChild(aiResponse);

        chatContainer.appendChild(header);
        chatContainer.appendChild(content);
        document.body.appendChild(chatContainer);

        console.log('Chat UI created and displayed');
      },
    });
  } catch (error) {
    console.error('Error handling context menu click:', error);
    // Show error to user
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [error.message],
      function: (errorMessage) => {
        alert('Error: ' + errorMessage);
      },
    });
  }
});

////////////////////// 2. Message Events /////////////////////
// Handle messages from the popup or other parts of the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message);
  
  if (message.type === 'check_status') {
    sendResponse({
      status: modelStatus,
      progress: loadingProgress
    });
    return true;
  }

  if (message.action !== "generate") return false;

  // Handle generate action
  (async function () {
    try {
      console.log('Generating response for message:', message);
      const result = await generate(message.text);
      console.log('Generated response:', result);
      sendResponse(result);
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ error: error.message });
    }
  })();

  return true; // Will respond asynchronously
});

// Listen for connection-related events
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'popup') {
    port.onDisconnect.addListener(() => {
      console.log('Popup disconnected');
    });
    
    port.onMessage.addListener((msg) => {
      if (msg.type === 'check_status') {
        port.postMessage({
          status: modelStatus,
          progress: loadingProgress
        });
      }
    });
  }
});

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log('Extension starting up');
});

// Ensure cleanup on unload
chrome.runtime.onSuspend.addListener(async () => {
  console.log('Extension being suspended');
  if (TextGenerationPipeline.instance) {
    await TextGenerationPipeline.instance.destroy();
    TextGenerationPipeline.instance = null;
  }
});

// Handle installed/updated events
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  
  // Create context menu
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Generate from "%s"',
    contexts: ["selection"],
  });

  // Start pre-downloading models if not cached
  const modelsAreCached = await areModelsCached();
  if (!modelsAreCached) {
    console.log('Starting model pre-download...');
    preDownloadModels((progress) => {
      broadcastStatus('loading', {
        status: 'downloading',
        model: progress.model,
        file: progress.file,
        progress: progress.progress
      });
    });
  }
});
