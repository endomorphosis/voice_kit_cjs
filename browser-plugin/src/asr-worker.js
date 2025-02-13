// ASR worker for speech recognition
import "@huggingface/transformers";
import { pipeline } from "@huggingface/transformers";

const SAMPLE_RATE = 16000;

// Set WASM path for workers
globalThis.__TRANSFORMER_WORKER_WASM_PATH__ = '/wasm/';

// Initialize whisper model for speech recognition
console.log('Loading ASR model...');
let transcriber;

async function initializeASR() {
    try {
        // First try with WebGPU
        try {
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

            console.log('Using WebGPU adapter:', {
                name: adapter.name,
                features: Array.from(adapter.features),
                platform: navigator.platform
            });

            // Base config for ONNX Runtime
            const onnxConfig = {
                execution_provider: ["WebGPU", "CPU"],
                optimization_level: 99,
                gpu_adapter: adapter,
                gpu_device: device,
                fallback_to_cpu: true
            };

            // Add f16 settings only if supported
            if (features.includes('shader-f16')) {
                onnxConfig.webgpu_options = {
                    shader_features: ['f16']
                };
            }

            transcriber = await pipeline(
                "automatic-speech-recognition",
                "onnx-community/whisper-tiny.en",
                {
                    device: "webgpu",
                    quantized: true,
                    model_kwargs: {
                        encoder_config: onnxConfig,
                        decoder_config: onnxConfig,
                        decoder_merged_config: onnxConfig
                    }
                }
            );

        } catch (gpuError) {
            // If WebGPU fails, fall back to WASM
            console.warn('WebGPU initialization failed, falling back to WASM:', gpuError);
            
            transcriber = await pipeline(
                "automatic-speech-recognition",
                "onnx-community/whisper-tiny.en",
                {
                    device: "wasm",
                    quantized: true
                }
            );
            
            console.log('Successfully initialized ASR on WASM');
        }

        // Test the pipeline with empty audio to compile shaders/warm up
        console.log('Testing ASR pipeline...');
        await transcriber(new Float32Array(SAMPLE_RATE));
        self.postMessage({ type: "ready" });

    } catch (error) {
        console.error('Failed to initialize ASR model:', error);
        const errorMessage = error.message.includes('WebGPU') ? 
            `WebGPU error: ${error.message}. Try updating your browser or graphics drivers.` :
            error.message;
        self.postMessage({ type: "error", error: errorMessage });
        throw new Error(errorMessage);
    }
}

// Initialize the ASR pipeline
initializeASR();

// Handle audio transcription requests
self.onmessage = async (event) => {
    const { buffer } = event.data;
    
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