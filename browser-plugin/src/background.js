// background.js - Handles requests from the UI, runs the model, then sends back a response

import { pipeline } from "@huggingface/transformers";
import {
  AutoTokenizer,
  AutoModelForCausalLM,
  TextStreamer,
  InterruptableStoppingCriteria,
} from "@huggingface/transformers";

import { CONTEXT_MENU_ITEM_ID } from "./constants.js";

// Set up the stopping criteria for interrupting generation if needed
const stopping_criteria = new InterruptableStoppingCriteria();

let modelStatus = 'uninitialized';
let loadingProgress = 0;

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

/**
 * This class uses the Singleton pattern to enable lazy-loading of the pipeline
 */
class TextGenerationPipeline {
  static model_id = "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX";
  static instance = null;

  static async getInstance(progress_callback = null) {
    if (this.instance) {
        broadcastStatus('ready');
        return this.instance;
    }

    try {
        modelStatus = 'loading';
        broadcastStatus('loading');

        const updateProgress = (data) => {
            if (data.progress !== undefined) {
                loadingProgress = data.progress;
                broadcastStatus('loading', data);
            }
            if (progress_callback) progress_callback(data);
        };

        this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
            progress_callback: updateProgress,
        });

        this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
            dtype: "q4f16",
            device: "webgpu",
            progress_callback: updateProgress,
        });

        this.instance = { tokenizer: this.tokenizer, model: this.model };
        modelStatus = 'ready';
        broadcastStatus('ready');
        return this.instance;
    } catch (error) {
        modelStatus = 'error';
        broadcastStatus('error', error.message);
        throw error;
    }
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

    console.log('Starting model generation...');
    const { sequences } = await model.generate({
      ...inputs,
      do_sample: false,
      max_new_tokens: 512,
      stopping_criteria,
      return_dict_in_generate: true,
    });

    console.log('Decoding generated sequences...');
    const decoded = tokenizer.batch_decode(sequences, {
      skip_special_tokens: true,
    });

    console.log('Generation complete:', decoded[0]);
    return decoded[0];
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
