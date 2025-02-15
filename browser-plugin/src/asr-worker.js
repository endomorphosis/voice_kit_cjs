// ASR Worker for handling speech recognition
// Import transformers as ES module
import { pipeline } from '@huggingface/transformers';

const SAMPLE_RATE = 16000;
let transcriber;

// Wait for initialization message with WASM path
self.onmessage = async (event) => {
    const { type, wasmPath, buffer } = event.data;
    
    if (type === 'init') {
        // Set WASM path from initialization message
        self.__TRANSFORMER_WORKER_WASM_PATH__ = wasmPath;
        console.log('ASR Worker initialized with WASM path:', wasmPath);
        
        try {
            await initializeASR();
        } catch (error) {
            console.error('ASR initialization failed:', error);
        }
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
        console.log('Initializing WASM backend...');
        
        transcriber = await loadModel();
        
        console.log('Successfully initialized ASR on WASM');

        // Test the pipeline
        console.log('Testing ASR pipeline...');
        const testResult = await transcriber(new Float32Array(SAMPLE_RATE));
        console.log('ASR test successful:', testResult);
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
        // Attempt to load the model using WebGPU
        const model = await pipeline('automatic-speech-recognition', {
            model: 'openai/whisper-tiny.en',
            device: 'gpu'
        });
        console.log('Model loaded using WebGPU');
        return model;
    } catch (error) {
        console.error('Failed to load model using WebGPU:', error);
        // Fallback to CPU if WebGPU fails
        const model = await pipeline('automatic-speech-recognition', {
            model: 'openai/whisper-tiny.en',
            device: 'cpu'
        });
        console.log('Model loaded using CPU');
        return model;
    }
}