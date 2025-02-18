// Initialize and manage transformer pipelines
import { pipeline, env } from '@xenova/transformers';
import { WasmLoader } from './wasm-loader.js';

class TransformerPipelineManager {
  static pipelines = new Map();
  static modelConfigs = {
    'text-generation': {
      model: 'Xenova/gpt2-small',
      quantized: true
    },
    'automatic-speech-recognition': {
      model: 'Xenova/whisper-small',
      quantized: true
    }
  };

  static async initializePipeline(type, progressCallback = null) {
    // Initialize WASM first if not already done
    await WasmLoader.init();

    // Check if pipeline already exists
    if (this.pipelines.has(type)) {
      return this.pipelines.get(type);
    }

    const config = this.modelConfigs[type];
    if (!config) {
      throw new Error(`Unknown pipeline type: ${type}`);
    }

    try {
      const pipelineInstance = await pipeline(type, config.model, {
        quantized: config.quantized,
        progress_callback: progressCallback,
        cache_dir: env.cacheDir,
        local_files_only: false,
        revision: 'main'
      });

      this.pipelines.set(type, pipelineInstance);
      return pipelineInstance;
    } catch (error) {
      console.error(`Failed to initialize ${type} pipeline:`, error);
      throw error;
    }
  }

  static async runPipeline(type, input, options = {}) {
    const pipelineInstance = await this.initializePipeline(type);
    return pipelineInstance(input, options);
  }

  static clearPipelines() {
    this.pipelines.clear();
  }
}

export { TransformerPipelineManager };