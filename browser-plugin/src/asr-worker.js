import { pipeline } from "@huggingface/transformers";

const SAMPLE_RATE = 16000;

// Note: ONNX Runtime will show warnings about some operations being assigned to CPU.
// This is expected and optimal behavior - certain operations (especially shape-related ones) 
// are deliberately run on CPU as they perform better there, even when using WebGPU
// as the primary execution provider. You can safely ignore these warnings.

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

            // Check for f16 support
            const device = await adapter.requestDevice({
                requiredFeatures: ['shader-f16']
            });

            console.log('Using WebGPU adapter:', {
                name: adapter.name,
                fallbackAdapter: adapter !== await navigator.gpu.requestAdapter(),
                platform: navigator.platform
            });

            transcriber = await pipeline(
                "automatic-speech-recognition",
                "onnx-community/whisper-tiny.en",
                {
                    device: "webgpu",
                    quantized: true,
                    model_kwargs: {
                        encoder_config: { 
                            execution_provider: ["WebGPU", "CPU"],
                            optimization_level: 99,
                            gpu_adapter: adapter,
                            gpu_device: device,
                            fallback_to_cpu: true,
                            webgpu_options: {
                                shader_features: ['f16']
                            }
                        },
                        decoder_config: { 
                            execution_provider: ["WebGPU", "CPU"],
                            optimization_level: 99,
                            gpu_adapter: adapter,
                            gpu_device: device,
                            fallback_to_cpu: true,
                            webgpu_options: {
                                shader_features: ['f16']
                            }
                        },
                        decoder_merged_config: { 
                            execution_provider: ["WebGPU", "CPU"],
                            optimization_level: 99,
                            gpu_adapter: adapter,
                            gpu_device: device,
                            fallback_to_cpu: true,
                            webgpu_options: {
                                shader_features: ['f16']
                            }
                        }
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