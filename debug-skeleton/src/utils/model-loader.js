/**
 * Model Loader Utility
 * Handles loading models with detailed diagnostics and progress tracking
 */
import { getLogger } from './logger.js';

const logger = getLogger('ModelLoader');

export class ModelLoader {
  /**
   * Create a model loader
   * @param {Object} options Configuration options
   * @param {Object} options.transformers Transformers.js instance
   * @param {string} options.modelId Model identifier
   * @param {string} options.task Task type (e.g., 'automatic-speech-recognition', 'text-generation', 'text-to-speech')
   * @param {boolean} options.quantized Whether to use quantized models
   * @param {string} options.device Device to use ('webgpu', 'wasm', 'cpu', or 'auto')
   * @param {Function} options.statusCallback Callback for loading progress
   */
  constructor(options) {
    this.transformers = options.transformers;
    this.modelId = options.modelId;
    this.task = options.task;
    this.quantized = options.quantized !== false;
    this.device = options.device || 'auto';
    this.statusCallback = options.statusCallback || (() => {});

    this.pipeline = null;
    this.isLoaded = false;
    this.isLoading = false;
    this.loadError = null;
    this.loadTime = 0;
    this.progressInfo = {};
    this.config = null;
    
    logger.info(`ModelLoader created for ${this.task} using ${this.modelId} (quantized: ${this.quantized})`);
  }

  /**
   * Load the model
   * @returns {Promise<Object>} The model pipeline
   */
  async load() {
    if (this.isLoaded && this.pipeline) {
      logger.info('Model already loaded');
      return this.pipeline;
    }
    
    if (this.isLoading) {
      logger.warn('Model is already loading');
      throw new Error('Model is already loading');
    }
    
    this.isLoading = true;
    this.loadError = null;
    
    const startTime = performance.now();
    logger.info(`Loading ${this.task} model: ${this.modelId}`);
    
    try {
      // Configure environment if needed
      if (this.device !== 'auto') {
        logger.info(`Setting transformers backend to ${this.device}`);
        this.transformers.env.backends = [this.device];
      }
      
      // Create pipeline with detailed progress tracking
      this.pipeline = await this.transformers.pipeline(this.task, this.modelId, {
        quantized: this.quantized,
        progress_callback: (progress) => this._trackProgress(progress),
        revision: 'main' // Specify main revision to avoid version issues
      });
      
      if (!this.pipeline) {
        throw new Error(`Failed to create pipeline for ${this.modelId}`);
      }
      
      // Calculate load time
      this.loadTime = performance.now() - startTime;
      this.isLoaded = true;
      this.isLoading = false;
      
      // Try to get model configuration
      try {
        this.config = await this._getModelConfig();
      } catch (configError) {
        logger.warn('Could not retrieve model configuration:', configError);
      }
      
      logger.info(`Model ${this.modelId} loaded successfully in ${this.loadTime.toFixed(2)}ms`);
      
      return this.pipeline;
    } catch (error) {
      this.loadTime = performance.now() - startTime;
      this.isLoading = false;
      this.loadError = error.message;
      
      // Log detailed error information
      logger.error(`Failed to load model ${this.modelId} after ${this.loadTime.toFixed(2)}ms:`, error);
      logger.error(`Error stack:`, error.stack);
      
      // Check for common errors and provide more specific diagnostics
      if (error.message.includes('Response body is not a ReadableStream')) {
        logger.error('This error often occurs due to CORS issues with model downloads');
      } else if (error.message.includes('Out of memory')) {
        logger.error('The browser ran out of memory while loading the model. Try a smaller model or quantized version.');
      } else if (error.message.includes('SharedArrayBuffer')) {
        logger.error('SharedArrayBuffer is required but not available. The page must be cross-origin isolated.');
      }
      
      throw error;
    }
  }

  /**
   * Run the model with input
   * @param {*} input Input data for the model
   * @param {Object} options Additional options for the model
   * @returns {Promise<Object>} Model output
   */
  async run(input, options = {}) {
    if (!this.isLoaded || !this.pipeline) {
      throw new Error('Model not loaded');
    }
    
    logger.info(`Running ${this.task} inference`);
    const startTime = performance.now();
    
    try {
      // Execute the model
      const output = await this.pipeline(input, options);
      
      const inferenceTime = performance.now() - startTime;
      logger.info(`Inference completed in ${inferenceTime.toFixed(2)}ms`);
      
      // Log basic output info based on task type
      if (this.task === 'automatic-speech-recognition') {
        logger.debug(`ASR output: "${output.text || 'No text'}" (chunks: ${output.chunks?.length || 0})`);
      } else if (this.task === 'text-generation') {
        const text = output[0]?.generated_text || output?.generated_text || JSON.stringify(output);
        logger.debug(`LLM output: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);
      } else if (this.task === 'text-to-speech') {
        logger.debug(`TTS output: ${output.audio?.data?.length || 0} samples`);
      }
      
      return {
        output,
        inferenceTime
      };
    } catch (error) {
      const inferenceTime = performance.now() - startTime;
      logger.error(`Inference failed after ${inferenceTime.toFixed(2)}ms:`, error);
      
      throw error;
    }
  }

  /**
   * Unload the model and free resources
   */
  async unload() {
    if (!this.isLoaded) {
      return;
    }
    
    logger.info(`Unloading model ${this.modelId}`);
    
    try {
      // There's no explicit unload in transformers.js, so we just remove references
      this.pipeline = null;
      this.isLoaded = false;
      
      // Force garbage collection if possible
      if (typeof globalThis.gc === 'function') {
        globalThis.gc();
      }
      
      logger.info(`Model ${this.modelId} unloaded`);
    } catch (error) {
      logger.error(`Failed to unload model ${this.modelId}:`, error);
      throw error;
    }
  }

  /**
   * Track model loading progress
   * @private
   * @param {Object} progress Progress information
   */
  _trackProgress(progress) {
    // Update progress information
    this.progressInfo = {
      ...progress,
      timestamp: Date.now()
    };
    
    // Log progress updates
    const { file, status, progress: percent } = progress;
    logger.debug(`Model loading progress: ${file || 'unknown'} - ${status || 'loading'} - ${(percent || 0).toFixed(1)}%`);
    
    // Call status callback if provided
    if (this.statusCallback) {
      this.statusCallback(progress);
    }
  }

  /**
   * Get model configuration
   * @private
   * @returns {Promise<Object>} Model configuration
   */
  async _getModelConfig() {
    try {
      if (this.pipeline && this.pipeline.tokenizer) {
        return {
          vocabSize: this.pipeline.tokenizer.vocab_size || this.pipeline.tokenizer.model.vocab_size,
          modelType: this.pipeline.tokenizer.model_type || 'unknown',
          backendType: this.transformers.env.backends[0] || 'unknown'
        };
      } else if (this.pipeline && this.pipeline.processor) {
        return {
          modelType: this.pipeline.processor.model_type || 'unknown',
          backendType: this.transformers.env.backends[0] || 'unknown'
        };
      }
      
      return {
        backendType: this.transformers.env.backends[0] || 'unknown'
      };
    } catch (error) {
      logger.debug('Error getting model config:', error);
      return { error: error.message };
    }
  }

  /**
   * Get info about the loaded model
   * @returns {Object} Model information
   */
  getInfo() {
    return {
      modelId: this.modelId,
      task: this.task,
      quantized: this.quantized,
      device: this.device,
      isLoaded: this.isLoaded,
      loadTime: this.loadTime,
      loadError: this.loadError,
      config: this.config
    };
  }

  /**
   * Get current progress information
   * @returns {Object} Progress information
   */
  getProgress() {
    return this.progressInfo;
  }
}