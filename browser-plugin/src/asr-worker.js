import { pipeline } from "@huggingface/transformers";

const SAMPLE_RATE = 16000;

// Initialize whisper model for speech recognition
console.log('Loading ASR model...');
let transcriber;

try {
    transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-tiny.en",
        {
            device: "webgpu",
            quantized: true,
        }
    );

    // Compile shaders
    console.log('Compiling shaders...');
    await transcriber(new Float32Array(SAMPLE_RATE));
    self.postMessage({ type: "ready" });
} catch (error) {
    console.error('Failed to initialize ASR model:', error);
    self.postMessage({ type: "error", error: error.toString() });
    throw error;
}

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