import { pipeline, env } from "@xenova/transformers";
import { cacheManager } from './cache-manager.js';

// Configure environment
env.useBrowserCache = false; // Disable browser cache to use our own caching
env.allowLocalModels = true;
env.useModelCaching = true;

// Model paths and configuration
const MODELS = {
  TEXT: "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX",
  ASR: "Xenova/whisper-small"
};

// Helper to get model files from HuggingFace
async function fetchModelFile(modelId, fileName) {
  const response = await fetch(`https://huggingface.co/${modelId}/resolve/main/${fileName}`);
  if (!response.ok) throw new Error(`Failed to fetch ${fileName}`);
  const data = await response.arrayBuffer();
  return new Uint8Array(data);
}

// Download and cache models
export const preDownloadModels = async (progressCallback) => {
  try {
    for (const [type, modelId] of Object.entries(MODELS)) {
      console.log(`Pre-downloading ${type} model: ${modelId}`);
      
      // Check cache first
      const cacheKey = `${type}_${modelId}`;
      if (await cacheManager.has(cacheKey)) {
        console.log(`Using cached model: ${modelId}`);
        continue;
      }

      const pipelineType = type === 'ASR' ? 
        'automatic-speech-recognition' : 
        'text-generation';

      // For ASR, ensure we have the feature extractor config
      if (type === 'ASR') {
        const configData = await fetchModelFile(modelId, 'preprocessor_config.json');
        await cacheManager.set(`${cacheKey}_config`, configData);
      }

      const pipelineConfig = {
        quantized: true,
        local: true,
        cache_dir: 'models',
        progress_callback: (data) => {
          if (progressCallback) {
            progressCallback({
              model: type,
              ...data
            });
          }
        }
      };

      if (type === 'ASR') {
        pipelineConfig.config = {
          model_type: 'whisper',
          feature_extractor_type: 'WhisperFeatureExtractor'
        };
      }

      const instance = await pipeline(pipelineType, modelId, pipelineConfig);
      
      // Cache model data
      await cacheManager.set(cacheKey, {
        type: pipelineType,
        modelId,
        timestamp: Date.now()
      });

      console.log(`Successfully cached ${type} model`);
    }
    return true;
  } catch (error) {
    console.error('Error pre-downloading models:', error);
    throw error;
  }
};

// Check cached models
export const areModelsCached = async () => {
  try {
    const results = await Promise.all(
      Object.entries(MODELS).map(async ([type, modelId]) => {
        const cacheKey = `${type}_${modelId}`;
        return await cacheManager.has(cacheKey);
      })
    );
    return results.every(Boolean);
  } catch (error) {
    console.error('Error checking model cache:', error);
    return false;
  }
};