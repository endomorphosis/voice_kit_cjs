/**
 * Model Initialization Tester
 * Tests loading models with detailed logging of each step
 */
import { getLogger } from './logger.js';
import * as transformers from '@xenova/transformers';

const logger = getLogger('ModelTester');

export class ModelTester {
  /**
   * Create a model initialization tester
   * @param {Object} options Configuration options
   */
  constructor(options = {}) {
    this.models = {
      asr: options.asrModel || 'Xenova/whisper-small',
      llm: options.llmModel || 'Xenova/gpt2-small',
      tts: options.ttsModel || 'Xenova/speecht5_tts'
    };
    
    this.quantized = options.quantized !== false;
    this.device = options.device || 'auto';
    this.results = {
      asr: null,
      llm: null,
      tts: null
    };
    this.progressCallbacks = options.progressCallbacks || {};
  }

  /**
   * Test initialization of all models
   * @returns {Promise<Object>} Results from all tests
   */
  async testAll() {
    logger.info('Starting initialization tests for all models');
    logger.info(`Device: ${this.device}, Quantized: ${this.quantized}`);
    
    const startTime = performance.now();
    
    // Configure transformers environment
    this._configureEnvironment();
    
    // Test each model type sequentially for better diagnostics
    try {
      await this.testASR();
      await this.testLLM();
      await this.testTTS();
      
      const totalTime = performance.now() - startTime;
      logger.info(`All model tests completed in ${totalTime.toFixed(2)}ms`);
      
      return {
        success: true,
        asr: this.results.asr,
        llm: this.results.llm, 
        tts: this.results.tts,
        totalTime
      };
    } catch (error) {
      logger.error('Model testing failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Test ASR model initialization
   * @returns {Promise<Object>} Test results
   */
  async testASR() {
    const modelId = this.models.asr;
    logger.info(`Testing ASR model initialization: ${modelId}`);
    
    const startTime = performance.now();
    let pipeline = null;
    let testResult = null;
    
    try {
      // Create pipeline with progress tracking
      pipeline = await transformers.pipeline('automatic-speech-recognition', modelId, {
        quantized: this.quantized,
        progress_callback: this._createProgressCallback('asr'),
        revision: 'main'
      });
      
      // Validate pipeline
      if (!pipeline) {
        throw new Error('ASR pipeline creation returned null');
      }
      
      logger.info('ASR pipeline created successfully, running test inference');
      
      // Run a small test inference
      const dummyAudio = new Float32Array(16000).fill(0.01);
      const inferenceStart = performance.now();
      
      testResult = await pipeline(dummyAudio);
      
      const inferenceTime = performance.now() - inferenceStart;
      const totalTime = performance.now() - startTime;
      
      logger.info(`ASR test inference completed in ${inferenceTime.toFixed(2)}ms`);
      logger.info(`Total ASR initialization time: ${totalTime.toFixed(2)}ms`);
      
      // Store results
      this.results.asr = {
        success: true,
        modelId,
        loadTime: totalTime,
        inferenceTime,
        testOutput: testResult?.text || 'No text output'
      };
      
      return this.results.asr;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      logger.error(`ASR initialization failed after ${totalTime.toFixed(2)}ms:`, error);
      
      this.results.asr = {
        success: false,
        modelId,
        loadTime: totalTime,
        error: error.message,
        stack: error.stack
      };
      
      // Don't stop testing other models
      return this.results.asr;
    }
  }

  /**
   * Test LLM model initialization
   * @returns {Promise<Object>} Test results
   */
  async testLLM() {
    const modelId = this.models.llm;
    logger.info(`Testing LLM model initialization: ${modelId}`);
    
    const startTime = performance.now();
    let pipeline = null;
    let testResult = null;
    
    try {
      // Create pipeline with progress tracking
      pipeline = await transformers.pipeline('text-generation', modelId, {
        quantized: this.quantized,
        progress_callback: this._createProgressCallback('llm'),
        revision: 'main'
      });
      
      // Validate pipeline
      if (!pipeline) {
        throw new Error('LLM pipeline creation returned null');
      }
      
      logger.info('LLM pipeline created successfully, running test inference');
      
      // Run a small test inference
      const inferenceStart = performance.now();
      
      testResult = await pipeline('Hello', { max_new_tokens: 5 });
      
      const inferenceTime = performance.now() - inferenceStart;
      const totalTime = performance.now() - startTime;
      
      logger.info(`LLM test inference completed in ${inferenceTime.toFixed(2)}ms`);
      logger.info(`Total LLM initialization time: ${totalTime.toFixed(2)}ms`);
      
      // Store results
      this.results.llm = {
        success: true,
        modelId,
        loadTime: totalTime,
        inferenceTime,
        testOutput: testResult?.[0]?.generated_text || 'No text output'
      };
      
      return this.results.llm;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      logger.error(`LLM initialization failed after ${totalTime.toFixed(2)}ms:`, error);
      
      this.results.llm = {
        success: false,
        modelId,
        loadTime: totalTime,
        error: error.message,
        stack: error.stack
      };
      
      // Don't stop testing other models
      return this.results.llm;
    }
  }

  /**
   * Test TTS model initialization
   * @returns {Promise<Object>} Test results
   */
  async testTTS() {
    const modelId = this.models.tts;
    logger.info(`Testing TTS model initialization: ${modelId}`);
    
    const startTime = performance.now();
    let pipeline = null;
    let testResult = null;
    
    try {
      // Create pipeline with progress tracking
      pipeline = await transformers.pipeline('text-to-speech', modelId, {
        quantized: this.quantized,
        progress_callback: this._createProgressCallback('tts'),
        revision: 'main'
      });
      
      // Validate pipeline
      if (!pipeline) {
        throw new Error('TTS pipeline creation returned null');
      }
      
      logger.info('TTS pipeline created successfully, running test inference');
      
      // Run a small test inference
      const inferenceStart = performance.now();
      
      testResult = await pipeline('Hello', { voice_preset: 'en_speaker_1' });
      
      const inferenceTime = performance.now() - inferenceStart;
      const totalTime = performance.now() - startTime;
      
      logger.info(`TTS test inference completed in ${inferenceTime.toFixed(2)}ms`);
      logger.info(`Total TTS initialization time: ${totalTime.toFixed(2)}ms`);
      
      // Store results
      this.results.tts = {
        success: true,
        modelId,
        loadTime: totalTime,
        inferenceTime,
        audioSamples: testResult?.audio?.data?.length || 0
      };
      
      return this.results.tts;
    } catch (error) {
      const totalTime = performance.now() - startTime;
      logger.error(`TTS initialization failed after ${totalTime.toFixed(2)}ms:`, error);
      
      this.results.tts = {
        success: false,
        modelId,
        loadTime: totalTime,
        error: error.message,
        stack: error.stack
      };
      
      // Don't stop testing other models
      return this.results.tts;
    }
  }

  /**
   * Configure the transformers.js environment
   * @private
   */
  _configureEnvironment() {
    logger.info('Configuring transformers environment');
    
    // Set appropriate backends based on device setting
    if (this.device === 'webgpu') {
      transformers.env.backends = ['webgpu'];
      logger.info('Using WebGPU backend');
    } else if (this.device === 'wasm') {
      transformers.env.backends = ['wasm'];
      logger.info('Using WASM backend');
    } else if (this.device === 'cpu') {
      transformers.env.backends = ['cpu'];
      logger.info('Using CPU backend');
    } else {
      logger.info('Using auto backend selection');
    }
    
    // Set other environment settings
    transformers.env.useBrowserCache = true;
    transformers.env.useCustomCache = true;
    transformers.env.cacheDir = 'transformers-cache';
    
    // Log the current environment configuration
    logger.info('Environment configured:', {
      backends: transformers.env.backends,
      useBrowserCache: transformers.env.useBrowserCache,
      useCustomCache: transformers.env.useCustomCache, 
      cacheDir: transformers.env.cacheDir
    });
  }

  /**
   * Create a progress callback for a specific model type
   * @private
   * @param {string} modelType Model type (asr, llm, tts)
   * @returns {Function} Progress callback function
   */
  _createProgressCallback(modelType) {
    return (progress) => {
      const { file, progress: percent, status } = progress;
      const message = `Model ${modelType.toUpperCase()} [${file}]: ${percent?.toFixed(1) || 0}% - ${status || 'downloading'}`;
      
      logger.debug(message);
      
      // Call custom progress callback if provided
      if (this.progressCallbacks[modelType]) {
        this.progressCallbacks[modelType](progress);
      }
    };
  }
  
  /**
   * Get a summary of all test results
   * @returns {Object} Summary of test results
   */
  getSummary() {
    const successful = [];
    const failed = [];
    
    Object.entries(this.results).forEach(([modelType, result]) => {
      if (result?.success) {
        successful.push(modelType);
      } else if (result) {
        failed.push({
          type: modelType,
          error: result.error
        });
      }
    });
    
    return {
      successful,
      failed,
      allSucceeded: failed.length === 0 && successful.length === 3
    };
  }
}