// Import transformers as a module
import { pipeline } from "@huggingface/transformers";

const SAMPLE_RATE = 16000;
let transcriber = null;

// Handle initialization message first
self.onmessage = async (event) => {
    const { type, wasmPath, ortPath } = event.data;
    
    if (type === 'init') {
        try {
            self.postMessage({ 
                type: 'progress', 
                progress: 0,
                status: 'Initializing ASR system...'
            });
            
            // Initialize the transcriber
            self.postMessage({ 
                type: 'progress', 
                progress: 20,
                status: 'Loading ASR model...'
            });

            transcriber = await pipeline(
                "automatic-speech-recognition",
                "onnx-community/whisper-tiny.en",
                {
                    device: "webgpu",
                    quantized: true,
                    progress_callback: (data) => {
                        // Scale progress from 20-80%
                        const scaledProgress = 20 + (data.progress || 0) * 0.6;
                        self.postMessage({ 
                            type: 'progress',
                            progress: scaledProgress,
                            status: data.status || 'Downloading model files...',
                            file: data.file,
                            total: data.total,
                            loaded: data.loaded
                        });
                    }
                }
            );

            // Compile shaders
            self.postMessage({ 
                type: 'progress', 
                progress: 80,
                status: 'Compiling WebGPU shaders...'
            });

            await transcriber(new Float32Array(SAMPLE_RATE));
            
            self.postMessage({ 
                type: 'progress', 
                progress: 100,
                status: 'ASR system ready'
            });
            
            self.postMessage({ type: "ready" });

            // Update message handler for transcription requests
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
        }
    }
};