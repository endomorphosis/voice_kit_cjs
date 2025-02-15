// ASR Worker for handling speech recognition
// Import transformers as ES module
import { pipeline } from '@xenova/transformers';

const SAMPLE_RATE = 16000;
let transcriber;

// Wait for initialization message with WASM path
self.onmessage = async (event) => {
    const { type, wasmPath, buffer } = event.data;
    
    if (type === 'init') {
        // Set the base URL for WASM files
        self.wasmPath = new URL(wasmPath, self.location.href).href;
        await initializeASR();
        return;
    }

    // Handle audio transcription requests
    if (!buffer || !(buffer instanceof Float32Array)) {
        self.postMessage({ 
            type: "error", 
            error: `Invalid buffer format: ${buffer ? typeof buffer : 'undefined'}` 
        });
        return;
    }
    
    try {
        const { text } = await transcriber(buffer);
        self.postMessage({ type: "transcription", text });
    } catch (error) {
        console.error('Transcription error:', error);
        self.postMessage({ 
            type: "error", 
            error: error.toString(),
            details: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
    }
};

async function initializeASR() {
    try {
        console.log('Initializing ASR model...');
        transcriber = await loadModel();
        console.log('Successfully initialized ASR');
        self.postMessage({ type: "ready" });
    } catch (error) {
        console.error('Failed to initialize ASR model:', error);
        self.postMessage({ 
            type: "error", 
            error: error.toString(),
            details: {
                name: error.name,
                message: error.message,
                stack: error.stack
            }
        });
        throw error;
    }
}

async function loadModel() {
    try {
        // Set WASM path before loading model
        pipeline.setConfig({
            wasmPath: self.wasmPath
        });

        // Load the model with WebGPU
        const model = await pipeline('automatic-speech-recognition', 'openai/whisper-tiny.en', {
            quantized: false,
            progress_callback: (x) => {
                self.postMessage({ type: 'loading', data: x });
            }
        });
        
        console.log('Model loaded successfully');
        return model;
    } catch (error) {
        console.error('Failed to load model:', error);
        throw error;
    }
}