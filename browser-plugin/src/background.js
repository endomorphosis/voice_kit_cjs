// background.js - Handles requests from the UI, runs the model, then sends back a response
import { pipeline, env } from "@huggingface/transformers";
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";
import { KokoroTTS } from "kokoro-js";

import { CONTEXT_MENU_ITEM_ID } from "./constants.js";

// Configure transformers.js to use WASM files from extension
env.backends.onnx.wasm.wasmPaths = {
  'ort-wasm.wasm': chrome.runtime.getURL('ort-wasm.wasm'),
  'ort-wasm-simd.wasm': chrome.runtime.getURL('ort-wasm-simd.wasm'),
  'ort-wasm-threaded.wasm': chrome.runtime.getURL('ort-wasm-threaded.wasm'),
  'ort-wasm-simd-threaded.wasm': chrome.runtime.getURL('ort-wasm-simd-threaded.wasm'),
  'ort.wasm': chrome.runtime.getURL('ort.wasm'),
  'ort-wasm-simd-threaded.jsep.wasm': chrome.runtime.getURL('ort-wasm-simd-threaded.jsep.wasm')
};

// Set preferred backend order with fallbacks
env.backends.onnx.preferredBackendOrder = ["webgpu", "wasm", "cpu"];
env.backends.onnx.initTimeout = 30000; // Increase timeout for initialization

// Set up the stopping criteria for interrupting generation if needed
const stopping_criteria = new InterruptableStoppingCriteria();

let modelStatus = 'uninitialized';
let loadingProgress = 0;
let tts = null;

// Function to broadcast status to all popup windows
function broadcastStatus(status, data = null) {
    chrome.runtime.sendMessage({
        status,
        data,
        progress: loadingProgress
    }).catch(() => {
        // Ignore errors when no popups are open
    });
}

async function logDetailedError(error, context) {
    const errorDetails = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context: context,
        type: error.type || typeof error,
        cause: error.cause ? {
            name: error.cause.name,
            message: error.cause.message,
            stack: error.cause.stack
        } : undefined
    };
    
    console.error(`TTS Error in ${context}:`, errorDetails);
    broadcastStatus('error', {
        message: error.toString(),
        context: context,
        details: errorDetails
    });
    return errorDetails;
}

/**
 * Initialize TTS engine
 */
async function initTTS() {
    if (tts) return tts;
    
    try {
        console.log('Starting TTS initialization with configuration:', {
            model_id: "onnx-community/Kokoro-82M-v1.0-ONNX",
            dtype: "fp32",
            device: "wasm"
        });
        
        modelStatus = 'loading';
        broadcastStatus('loading');
        
        const model_id = "onnx-community/Kokoro-82M-v1.0-ONNX";
        tts = await KokoroTTS.from_pretrained(model_id, {
            dtype: "fp32",
            device: "wasm",
            progress_callback: (progress) => {
                loadingProgress = progress;
                console.log(`Loading TTS model: ${Math.round(progress * 100)}%`, {
                    bytes_loaded: progress,
                    model_id: model_id
                });
                broadcastStatus('loading');
            }
        });
        
        // Test the TTS with a simple phrase
        try {
            console.log('Testing TTS with sample text...');
            const testAudio = await tts.generate("Test message", { voice: "af_heart" });
            console.log('TTS test successful:', {
                audio_length: testAudio.length,
                sample_rate: testAudio.sampleRate
            });
        } catch (error) {
            throw new Error('TTS test generation failed: ' + error.message, { cause: error });
        }
        
        modelStatus = 'ready';
        broadcastStatus('ready');
        console.log('TTS model loaded and tested successfully');
        return tts;
    } catch (error) {
        const errorDetails = await logDetailedError(error, 'tts_initialization');
        modelStatus = 'error';
        throw new Error('TTS initialization failed: ' + error.message, { 
            cause: error,
            details: errorDetails 
        });
    }
}

/**
 * Generate speech from text using Kokoro TTS
 */
async function speakText(text, voice = "af_heart") {
    try {
        console.log('Starting TTS generation:', {
            text_length: text.length,
            voice: voice
        });
        
        const ttsInstance = await initTTS();
        console.log('Generating audio...');
        const audio = await ttsInstance.generate(text, { voice });
        
        console.log('Audio generated successfully:', {
            duration: audio.length / audio.sampleRate,
            sample_rate: audio.sampleRate,
            channels: audio.numberOfChannels
        });
        
        // Create an audio element and play
        const audioBlob = audio.toBlob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const audioElement = new Audio(audioUrl);
        await audioElement.play();
        console.log('Audio playback started');
        
        // Clean up URL after playing
        audioElement.onended = () => {
            URL.revokeObjectURL(audioUrl);
            console.log('Audio playback completed and resources cleaned up');
        };
        
    } catch (error) {
        await logDetailedError(error, 'tts_generation');
        throw new Error('TTS generation failed: ' + error.message, { cause: error });
    }
}

// Create generic generate function that will be reused
const generate = async (text) => {
  console.log('Starting text generation for:', text);
  try {
    // Get the pipeline instance
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
    });

    // Create text streamer for token-by-token updates
    const textStreamer = new TextStreamer(tokenizer, {
      skip_special_tokens: true,
      callback: (token) => {
        // Broadcast each token to all connected popups
        chrome.runtime.sendMessage({
          type: "token",
          token: token
        }).catch(() => {
          // Ignore errors when no popups are open
        });
      }
    });

    console.log('Starting model generation with streaming...');
    const { sequences } = await model.generate({
      ...inputs,
      do_sample: false,
      max_new_tokens: 512,
      stopping_criteria,
      streamer: textStreamer,
      return_dict_in_generate: true,
    });

    console.log('Decoding final sequences...');
    const decoded = tokenizer.batch_decode(sequences, {
      skip_special_tokens: true,
    });

    const response = decoded[0];
    console.log('Generation complete:', response);
    
    // Send completion message
    chrome.runtime.sendMessage({
      type: "complete",
      fullText: response
    }).catch(() => {
      // Ignore errors when no popups are open
    });
    
    // Speak the generated text
    await speakText(response);
    
    return response;
  } catch (error) {
    console.error('Error in generate function:', error);
    throw error;
  }
};

////////////////////// 1. Context Menus //////////////////////
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Generate from "%s"',
    contexts: ["selection"],
  });
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

    // Generate audio
    const ttsInstance = await initTTS();
    const audio = await ttsInstance.generate(result);
    const audioBlob = audio.toBlob();
    const audioUrl = URL.createObjectURL(audioBlob);

    // Show the result in the webpage with audio
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      args: [result, audioUrl],
      function: (result, audioUrl) => {
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

        // Add header with title, play button and close button
        const header = document.createElement('div');
        header.style.cssText = `
          padding: 12px;
          border-bottom: 1px solid #eee;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        
        const titleArea = document.createElement('div');
        titleArea.style.cssText = `
          display: flex;
          align-items: center;
          gap: 8px;
        `;
        titleArea.innerHTML = '<span style="font-weight: bold;">AI Response</span>';

        // Add play button
        const playBtn = document.createElement('button');
        playBtn.innerHTML = '🔊';
        playBtn.style.cssText = `
          border: none;
          background: none;
          cursor: pointer;
          font-size: 16px;
          padding: 4px 8px;
        `;
        playBtn.onclick = () => {
          const audio = new Audio(audioUrl);
          audio.play();
          audio.onended = () => URL.revokeObjectURL(audioUrl);
        };
        titleArea.appendChild(playBtn);
        header.appendChild(titleArea);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
          border: none;
          background: none;
          cursor: pointer;
          font-size: 20px;
          padding: 0 4px;
        `;
        closeBtn.onclick = () => {
          URL.revokeObjectURL(audioUrl);
          chatContainer.remove();
        };
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
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'check_status') {
    broadcastStatus(modelStatus);
    return;
  }
  console.log('Received message:', message);
  if (message.action !== "generate") return;

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

  return true;
});
