import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js to use WASM files from extension
// Note: In the worker context, paths are relative to the extension root
env.backends.onnx.wasm.wasmPaths = {
    'ort-wasm.wasm': './ort-wasm.wasm',
    'ort-wasm-simd.wasm': './ort-wasm-simd.wasm',
    'ort-wasm-threaded.wasm': './ort-wasm-threaded.wasm',
    'ort-wasm-simd-threaded.wasm': './ort-wasm-simd-threaded.wasm',
    'ort.wasm': './ort.wasm',
    'ort-wasm-simd-threaded.jsep.wasm': './ort-wasm-simd-threaded.jsep.wasm'
};

// Set preferred backend order with fallbacks
env.backends.onnx.preferredBackendOrder = ["webgpu", "wasm", "cpu"];
env.backends.onnx.initTimeout = 30000; // Increase timeout for initialization

const SAMPLE_RATE = 16000;

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
    
    console.error(`ASR Error in ${context}:`, errorDetails);
    self.postMessage({ 
        type: "error", 
        error: error.toString(),
        context: context,
        details: errorDetails
    });
    return errorDetails;
}

async function checkWebGPUSupport() {
    try {
        if (!('gpu' in navigator)) {
            throw new Error('WebGPU is not available - Please enable WebGPU in chrome://flags');
        }
        
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
            throw new Error('Failed to get WebGPU adapter - GPU might not be compatible');
        }
        
        const device = await adapter.requestDevice();
        if (!device) {
            throw new Error('Failed to get WebGPU device - Driver issues might exist');
        }
        
        return {
            supported: true,
            adapterInfo: {
                name: adapter.name,
                vendor: adapter.name?.split(' ')[0],
                architecture: adapter.name?.split(' ').slice(1).join(' ')
            }
        };
    } catch (error) {
        return {
            supported: false,
            error: error.message
        };
    }
}

// Initialize whisper model for speech recognition
console.log('Loading ASR model with following configuration:', {
    model: "onnx-community/whisper-tiny.en",
    device: "webgpu",
    quantized: true,
    sampleRate: SAMPLE_RATE
});

let transcriber;

async function initializeASR() {
    try {
        // Check WebGPU support first
        const gpuSupport = await checkWebGPUSupport();
        self.postMessage({ 
            type: "status", 
            message: "Checking WebGPU support...",
            details: gpuSupport
        });

        if (!gpuSupport.supported) {
            throw new Error(`WebGPU not available: ${gpuSupport.error}`);
        }

        self.postMessage({ 
            type: "status", 
            message: `WebGPU ready: ${gpuSupport.adapterInfo.name}` 
        });

        self.postMessage({ type: "status", message: "Creating ASR pipeline..." });
        transcriber = await pipeline(
            "automatic-speech-recognition",
            "onnx-community/whisper-tiny.en",
            {
                device: "webgpu",
                quantized: true,
                progress_callback: (progress) => {
                    self.postMessage({ 
                        type: "progress", 
                        progress: progress,
                        stage: "model_loading"
                    });
                }
            }
        );
        
        self.postMessage({ type: "status", message: "Testing ASR pipeline..." });
        
        // Test pipeline with sample data
        try {
            console.log('Compiling shaders and testing pipeline...');
            const testBuffer = new Float32Array(SAMPLE_RATE).fill(0);
            self.postMessage({ type: "status", message: "Compiling WebGPU shaders..." });
            
            const testResult = await transcriber(testBuffer);
            console.log('Pipeline test successful:', testResult);
            self.postMessage({ type: "ready" });
            return true;
        } catch (error) {
            const details = await logDetailedError(error, 'pipeline_test');
            self.postMessage({ 
                type: "error", 
                error: "ASR pipeline test failed",
                stage: "pipeline_test",
                details: details
            });
            throw error;
        }
    } catch (error) {
        const details = await logDetailedError(error, 'initialization');
        self.postMessage({ 
            type: "error", 
            error: "ASR initialization failed",
            stage: "initialization",
            details: {
                ...details,
                webgpu: await checkWebGPUSupport()
            }
        });
        throw error;
    }
}

// Start initialization
initializeASR().catch(error => {
    console.error("Failed to initialize ASR:", error);
});

self.onmessage = async (event) => {
    const { buffer } = event.data;
    
    if (!transcriber) {
        await logDetailedError(
            new Error("ASR not initialized - try reloading the extension"),
            'transcription_request'
        );
        return;
    }
    
    if (!buffer || !(buffer instanceof Float32Array)) {
        await logDetailedError(
            new Error(`Invalid buffer format: ${buffer ? typeof buffer : 'undefined'}`),
            'buffer_validation'
        );
        return;
    }
    
    try {
        console.log('Starting transcription of audio buffer:', {
            length: buffer.length,
            sampleRate: SAMPLE_RATE,
            duration: `${(buffer.length / SAMPLE_RATE).toFixed(2)}s`
        });
        
        self.postMessage({ type: "status", message: "Transcribing audio..." });
        const { text } = await transcriber(buffer);
        console.log('Transcription completed successfully:', { text });
        self.postMessage({ type: "transcription", text });
    } catch (error) {
        await logDetailedError(error, 'transcription');
    }
};