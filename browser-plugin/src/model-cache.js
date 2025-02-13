// model-cache.js - Handles caching and pre-downloading of models
import { pipeline } from "@huggingface/transformers";

const MODELS = {
    TEXT: "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX",
    ASR: "onnx-community/whisper-tiny.en"
};

export async function preDownloadModels(progressCallback) {
    const cache = await caches.open('model-cache-v1');
    
    for (const [type, modelId] of Object.entries(MODELS)) {
        try {
            console.log(`Pre-downloading ${type} model: ${modelId}`);
            
            // Download model files to cache
            const modelFiles = await pipeline(
                type === 'ASR' ? "automatic-speech-recognition" : "text-generation",
                modelId,
                {
                    cache_dir: 'models',
                    local_files_only: false,
                    progress_callback: (data) => {
                        if (progressCallback) {
                            progressCallback({
                                model: type,
                                ...data
                            });
                        }
                    }
                }
            );
            
            console.log(`Successfully cached ${type} model`);
            
        } catch (error) {
            console.error(`Error pre-downloading ${type} model:`, error);
        }
    }
}

// Function to check if models are cached
export async function areModelsCached() {
    try {
        const cache = await caches.open('model-cache-v1');
        const cached = await Promise.all(
            Object.values(MODELS).map(async (modelId) => {
                const files = await cache.keys(`models/${modelId}/*`);
                return files.length > 0;
            })
        );
        return cached.every(Boolean);
    } catch (error) {
        console.error('Error checking model cache:', error);
        return false;
    }
}