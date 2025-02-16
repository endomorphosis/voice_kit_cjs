// Feature extractor configuration and setup
import { AutoProcessor, env } from '@xenova/transformers';

const WHISPER_CONFIG = {
  feature_extractor_type: "WhisperFeatureExtractor",
  do_normalize: true,
  max_length_seconds: 30,
  return_attention_mask: true,
  sampling_rate: 16000,
  padding: true,
  chunk_length: 30,
  stride_length_s: 5,
  model_max_length: 448
};

class FeatureExtractor {
  static instance = null;

  static async getInstance() {
    if (!this.instance) {
      try {
        // Initialize with specific config to avoid undefined type
        const processor = await AutoProcessor.from_pretrained('Xenova/whisper-small', {
          local: true,
          cache_dir: env.cacheDir,
          quantized: false,
          config: WHISPER_CONFIG
        });

        if (!processor) {
          throw new Error('Failed to initialize feature extractor');
        }

        this.instance = processor;
      } catch (error) {
        console.error('Feature extractor initialization failed:', error);
        throw error;
      }
    }
    return this.instance;
  }

  static async processAudio(audioData) {
    const processor = await this.getInstance();
    try {
      // Process audio with explicit configuration
      const features = await processor(audioData, {
        sampling_rate: WHISPER_CONFIG.sampling_rate,
        chunk_length: WHISPER_CONFIG.chunk_length,
        stride_length_s: WHISPER_CONFIG.stride_length_s
      });
      
      return features;
    } catch (error) {
      console.error('Audio processing failed:', error);
      throw error;
    }
  }

  static async cleanup() {
    if (this.instance?.destroy) {
      await this.instance.destroy();
      this.instance = null;
    }
  }
}

export { FeatureExtractor, WHISPER_CONFIG };