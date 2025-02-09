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
let workerInstance = null;

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
            broadcastStatus('loading', { status: 'Initializing pipeline...' });

            const updateProgress = (data) => {
                if (data.progress !== undefined) {
                    loadingProgress = data.progress;
                    // Enhanced progress information
                    const progressData = {
                        progress: data.progress,
                        status: data.status || 'Loading model files...',
                        file: data.file,
                        total: data.total,
                        loaded: data.loaded
                    };
                    broadcastStatus('loading', progressData);
                }
                if (progress_callback) progress_callback(data);
            };

            broadcastStatus('loading', { status: 'Loading tokenizer...', progress: 0 });
            this.tokenizer = await AutoTokenizer.from_pretrained(this.model_id, {
                progress_callback: updateProgress,
            });

            broadcastStatus('loading', { status: 'Loading model...', progress: 50 });
            this.model = await AutoModelForCausalLM.from_pretrained(this.model_id, {
                dtype: "q4f16",
                device: "webgpu",
                progress_callback: updateProgress,
            });

            this.instance = { tokenizer: this.tokenizer, model: this.model };
            modelStatus = 'ready';
            broadcastStatus('ready', { status: 'Model loaded successfully!' });
            return this.instance;
        } catch (error) {
            modelStatus = 'error';
            broadcastStatus('error', error.message);
            throw error;
        }
    }
}

// Function to safely initialize worker
function initializeWorker() {
    if (workerInstance) {
        return workerInstance;
    }

    try {
        const workerUrl = chrome.runtime.getURL('asr-worker.js');
        
        workerInstance = new Worker(workerUrl, {
            type: 'module',
            name: 'asr-worker'
        });

        // Configure worker with proper paths
        workerInstance.postMessage({
            type: 'init',
            wasmPath: chrome.runtime.getURL('ort-wasm-simd-threaded.jsep.wasm'),
            ortPath: chrome.runtime.getURL('ort.bundle.min.mjs')
        });

        // Set up error handling
        workerInstance.onerror = (error) => {
            console.error('Worker error:', error);
            broadcastStatus('error', { 
                status: 'ASR worker error', 
                error: error.message 
            });
        };

        return workerInstance;
    } catch (error) {
        console.error('Failed to initialize worker:', error);
        throw error;
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

        // Send message to content script to display result
        chrome.tabs.sendMessage(tab.id, {
            type: 'display_result',
            result: result,
            selectedText: info.selectionText
        });

    } catch (error) {
        console.error('Error handling context menu click:', error);
        // Send error to content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'display_error',
            error: error.message
        });
    }
});

////////////////////// 2. Message Events /////////////////////
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'check_status') {
        broadcastStatus(modelStatus);
        return;
    }
    if (message.type === 'request_microphone') {
        // Request microphone permission via activeTab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {type: "request_microphone"})
                .then(response => sendResponse(response))
                .catch(error => sendResponse({error: error.message}));
        });
        return true;
    }
    if (message.type === 'init_worker') {
        try {
            initializeWorker();
            sendResponse({ success: true });
        } catch (error) {
            console.error('Worker initialization failed:', error);
            sendResponse({ error: error.message });
        }
        return true;
    }
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
