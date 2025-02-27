/**
 * Model Loader Utility
 * Provides a clean interface for loading and managing transformer models with detailed logging
 */
import { getLogger } from './logger.js';

// Create a dedicated logger for model loading
const logger = getLogger('ModelLoader');

export class ModelLoader {
  /**
   * Create a new model loader instance
   * @param {Object} options Configuration options
   * @param {Object} options.transformers The transformers.js instance
   * @param {string} options.modelId The model ID to load (e.g. 'Xenova/whisper-small')
   * @param {string} options.task The task type (e.g. 'automatic-speech-recognition', 'text-generation', 'text-to-speech')
   * @param {boolean} options.quantized Whether to use quantized models
   * @param {string} options.device The device to use ('webgpu', 'wasm', 'cpu', or 'auto')
   * @param {Function} options.statusCallback Callback function for progress updates
   */
  constructor(options) {
    this.transformers = options.transformers;
    this.modelId = options.modelId;
    this.task = options.task;
    this.quantized = options.quantized !== false;
    this.device = options.device || 'auto';
    this.statusCallback = options.statusCallback;
    
    this.pipeline = null;
    this.isLoaded = false;
    this.error = null;
    this.loadTime = null;
    
    // Create a task-specific logger
    this.logger = logger.child(this.task);
    this.logger.info(`Created model loader for ${this.task} using ${this.modelId}`);
    this.logger.info(`Configuration: quantized=${this.quantized}, device=${this.device}`);
  }

  /**
   * Load the model and create a pipeline
   * @returns {Promise<Object>} The loaded pipeline
   */
  async load() {
    this.logger.info(`Loading model: ${this.modelId}`);
    this.logger.time('model-loading');
    
    try {
      // Configure environment based on device setting
      this._configureEnvironment();
      
      // Create pipeline with detailed progress tracking
      this.pipeline = await this.transformers.pipeline(
        this.task,
        this.modelId,
        {
          quantized: this.quantized,
          progress_callback: this._handleProgress.bind(this),
          revision: 'main' // Use main branch
        }
      );
      
      const loadTime = this.logger.timeEnd('model-loading');
      this.loadTime = loadTime;
      this.isLoaded = true;
      
      this.logger.info(`Model loaded successfully in ${loadTime.toFixed(2)}ms`);
      return this.pipeline;
    } catch (error) {
      this.error = error;
      this.logger.error('Failed to load model:', error);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
  
  /**
   * Run inference on the loaded model
   * @param {*} input The input to the model
   * @param {Object} options Model-specific options
   * @returns {Promise<*>} The model output
   */
  async run(input, options = {}) {
    if (!this.isLoaded) {
      this.logger.error('Cannot run inference - model not loaded');
      throw new Error('Model not loaded');
    }
    
    this.logger.info('Running inference');
    this.logger.debug('Input:', input);
    this.logger.debug('Options:', options);
    this.logger.time('inference');
    
    try {
      const output = await this.pipeline(input, options);
      
      const inferenceTime = this.logger.timeEnd('inference');
      this.logger.info(`Inference completed in ${inferenceTime.toFixed(2)}ms`);
      this.logger.debug('Output:', output);
      
      return {
        output,
        timing: inferenceTime
      };
    } catch (error) {
      this.logger.error('Inference failed:', error);
      this.logger.error(`Stack trace: ${error.stack}`);
      throw error;
    }
  }
  
  /**
   * Clean up resources associated with this model
   */
  async unload() {
    this.logger.info('Unloading model');
    
    try {
      // Attempt to clean up resources
      if (this.pipeline && typeof this.pipeline.dispose === 'function') {
        await this.pipeline.dispose();
        this.logger.info('Model disposed successfully');
      }
      
      this.pipeline = null;
      this.isLoaded = false;
    } catch (error) {
      this.logger.error('Error unloading model:', error);
    }
  }
  
  /**
   * Configure the transformers.js environment based on device setting
   * @private
   */
  _configureEnvironment() {
    this.logger.debug(`Configuring environment for device: ${this.device}`);
    
    // Set appropriate backends based on device setting
    if (this.device === 'webgpu') {
      this.transformers.env.backends = ['webgpu'];
      this.logger.info('Using WebGPU backend exclusively');
    } else if (this.device === 'wasm') {
      this.transformers.env.backends = ['wasm'];
      this.logger.info('Using WASM backend exclusively');
    } else if (this.device === 'cpu') {
      this.transformers.env.backends = ['cpu'];
      this.logger.info('Using CPU backend exclusively');
    } else {
      // Keep whatever backends are already configured
      this.logger.info(`Using existing backend configuration: ${this.transformers.env.backends.join(', ')}`);
    }
    
    // Log current environment configuration
    this.logger.debug('Transformers environment:', {
      backends: this.transformers.env.backends,
      useBrowserCache: this.transformers.env.useBrowserCache,
      useCustomCache: this.transformers.env.useCustomCache,
      cacheDir: this.transformers.env.cacheDir
    });
  }
  
  /**
   * Handle progress updates during model loading
   * @private
   * @param {Object} progress The progress object from transformers.js
   */
  _handleProgress(progress) {
    // Log the progress
    const { status, file, progress: percent } = progress;
    
    // Detailed logging based on status
    if (status === 'init') {
      this.logger.info(`Starting to load ${file}`);
    } else if (status === 'download') {
      if (percent !== undefined) {
        this.logger.debug(`Downloading ${file}: ${percent.toFixed(1)}%`);
      } else {
        this.logger.debug(`Downloading ${file}`);
      }
    } else if (status === 'ready') {
      this.logger.info(`File ${file} is ready`);
    } else if (status === 'progress') {
      this.logger.debug(`Processing ${file}: ${percent?.toFixed(1) || 0}%`);
    } else {
      this.logger.debug(`Status update for ${file}: ${status}`);
    }
    
    // Call the status callback if provided
    if (this.statusCallback) {
      this.statusCallback(progress);
    }
  }
  
  /**
   * Get detailed information about the model
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
      error: this.error ? this.error.message : null,
      backend: this.transformers.env.backends[0]
    };
  }
  
  /**
   * Run a test inference to confirm the model works
   * @returns {Promise<Object>} Test results
   */
  async test() {
    this.logger.info('Running test inference');
    
    if (!this.isLoaded) {
      try {
        await this.load();
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }
    
    try {
      let testInput;
      
      // Create appropriate test input based on task
      switch (this.task) {
        case 'automatic-speech-recognition':
          // Create a simple test audio (1 second of silence)
          testInput = new Float32Array(16000).fill(0.01);
          break;
        case 'text-generation':
          testInput = 'Hello, how are you?';
          break;
        case 'text-to-speech':
          testInput = 'This is a test of speech synthesis.';
          break;
        default:
          testInput = 'Test input';
      }
      
      // Create appropriate test options
      const testOptions = {};
      if (this.task === 'text-generation') {
        testOptions.max_new_tokens = 5;
      } else if (this.task === 'text-to-speech') {
        testOptions.voice_preset = 'en_speaker_1';
      }
      
      // Run the test
      this.logger.time('test-inference');
      const result = await this.run(testInput, testOptions);
      const testTime = this.logger.timeEnd('test-inference');
      
      this.logger.info(`Test inference successful in ${testTime.toFixed(2)}ms`);
      
      return {
        success: true,
        time: testTime,
        result: result.output
      };
    } catch (error) {
      this.logger.error('Test inference failed:', error);
      
      return {
        success: false,
        error: error.message
      };
    }
  }
}