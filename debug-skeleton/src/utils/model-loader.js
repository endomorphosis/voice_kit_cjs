/**
 * Model loader utility with detailed diagnostics
 */
import { getLogger } from './logger.js';
import { featureDetector } from './feature-detector.js';

const logger = getLogger('ModelLoader');

export class ModelLoader {
  constructor(options = {}) {
    this.transformers = options.transformers || null;
    this.modelId = options.modelId || null;
    this.task = options.task || null;
    this.quantized = options.quantized !== false;
    this.device = options.device || 'auto'; // 'auto', 'cpu', 'webgpu', 'wasm'
    this.revision = options.revision || 'main';
    this.loadStartTime = null;
    this.loadEndTime = null;
    this.model = null;
    this.error = null;
    this.statusCallback = options.statusCallback || null;
  }

  /**
   * Report status update
   */
  reportStatus(status, details = {}) {
    logger.info(`Status update: ${status}`, details);
    if (this.statusCallback) {
      this.statusCallback({
        status,
        modelId: this.modelId,
        task: this.task,
        ...details
      });
    }
  }

  /**
   * Load the model with detailed diagnostics
   */
  async load() {
    if (!this.transformers) {
      const errorMsg = 'Transformers.js library not provided';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    if (!this.modelId || !this.task) {
      const errorMsg = 'Model ID or task not specified';
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    // Check if WebGPU is available when device is webgpu
    if (this.device === 'webgpu') {
      const hasWebGPU = await featureDetector.detectWebGPU();
      if (!hasWebGPU) {
        const errorMsg = 'WebGPU requested but not available';
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }

    logger.info(`Starting to load model: ${this.modelId} for task: ${this.task}`);
    logger.info(`Configuration: device=${this.device}, quantized=${this.quantized}, revision=${this.revision}`);
    
    this.loadStartTime = performance.now();
    this.reportStatus('loading', { startTime: this.loadStartTime });

    try {
      // Configure environment if needed
      this._configureEnvironment();
      
      // Create a wrapped progress callback for detailed logging
      const progressCallback = (progress) => {
        const { file, progress: percent, status } = progress;
        logger.debug(`Loading ${file}: ${percent?.toFixed(2) || 0}%, status: ${status || 'downloading'}`);
        this.reportStatus('progress', { file, progress: percent, status });
      };

      // Prepare pipeline options
      const pipelineOptions = {
        quantized: this.quantized,
        revision: this.revision,
        progress_callback: progressCallback
      };

      // Add device specific options
      if (this.device !== 'auto') {
        pipelineOptions.device = this.device;
      }

      // Log the start of the actual model loading
      logger.info(`Creating pipeline for ${this.task} with model ${this.modelId}`);
      const pipelineStartTime = performance.now();
      
      // Load the model via pipeline
      this.model = await this.transformers.pipeline(this.task, this.modelId, pipelineOptions);
      
      const pipelineTime = performance.now() - pipelineStartTime;
      logger.info(`Pipeline created in ${pipelineTime.toFixed(2)}ms`);
      
      // Attempt a small inference to verify the model works and warm up
      logger.info('Running test inference to warm up model...');
      const warmupStartTime = performance.now();
      
      await this._runTestInference();
      
      const warmupTime = performance.now() - warmupStartTime;
      logger.info(`Test inference completed in ${warmupTime.toFixed(2)}ms`);

      this.loadEndTime = performance.now();
      const totalLoadTime = this.loadEndTime - this.loadStartTime;
      
      logger.info(`Model loaded successfully in ${totalLoadTime.toFixed(2)}ms`);
      this.reportStatus('loaded', { 
        loadTime: totalLoadTime,
        pipelineTime,
        warmupTime
      });
      
      return this.model;
    } catch (error) {
      this.loadEndTime = performance.now();
      const failTime = this.loadEndTime - this.loadStartTime;
      
      this.error = error;
      logger.error(`Failed to load model after ${failTime.toFixed(2)}ms:`, error);
      this.reportStatus('error', { error: error.message, loadTime: failTime });
      
      throw error;
    }
  }

  /**
   * Configure the transformers.js environment
   */
  _configureEnvironment() {
    if (!this.transformers.env) {
      logger.warn('Transformers.js environment not available');
      return;
    }
    
    logger.debug('Configuring transformers.js environment');
    
    // Set backends based on device setting
    if (this.device === 'webgpu') {
      this.transformers.env.backends = ['webgpu'];
      logger.debug('Set backend to WebGPU');
    } else if (this.device === 'wasm') {
      this.transformers.env.backends = ['wasm'];
      logger.debug('Set backend to WASM');
    } else if (this.device === 'cpu') {
      this.transformers.env.backends = ['cpu'];
      logger.debug('Set backend to CPU');
    }
    
    // Other environment settings
    this.transformers.env.useBrowserCache = true;
    this.transformers.env.returnTensors = false;
    
    logger.debug('Environment configuration complete');
  }

  /**
   * Run a test inference to warmup the model
   */
  async _runTestInference() {
    if (!this.model) {
      logger.warn('Cannot run test inference - model not loaded');
      return;
    }
    
    try {
      switch (this.task) {
        case 'text-generation':
          await this.model('Hello', { max_new_tokens: 1 });
          break;
          
        case 'automatic-speech-recognition':
          // Create a small dummy audio input (1 second of silence)
          const dummyAudio = new Float32Array(16000).fill(0);
          await this.model(dummyAudio);
          break;
          
        case 'text-to-speech':
          await this.model('Hello', { voice_preset: 'en_speaker_1' });
          break;
          
        default:
          logger.warn(`No test inference implemented for task: ${this.task}`);
          break;
      }
    } catch (error) {
      logger.error('Test inference failed:', error);
      // Don't throw here - we still consider the model loaded even if warmup fails
    }
  }

  /**
   * Get the loaded model
   */
  getModel() {
    return this.model;
  }

  /**
   * Get load time metrics
   */
  getLoadMetrics() {
    if (!this.loadStartTime || !this.loadEndTime) {
      return null;
    }
    
    return {
      startTime: this.loadStartTime,
      endTime: this.loadEndTime,
      totalLoadTimeMs: this.loadEndTime - this.loadStartTime
    };
  }
}