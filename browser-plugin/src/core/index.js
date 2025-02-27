/**
 * Main entry point for the browser extension core functionality
 * This exports all the necessary components for ASR, LLM, and TTS
 */
import { WasmLoader } from './utils/wasm-loader.js';
import { ModelCache } from './utils/model-cache.js';
import { WhisperManager } from './asr/whisper-manager.js';
import { AudioProcessor } from './asr/audio-processor.js';
import { TextGenerator } from './llm/text-generator.js';
import { TTSManager } from './tts/tts-manager.js';
import { env } from '@xenova/transformers';

/**
 * Core functionality for the Voice Kit
 * Initializes and manages all components
 */
export class VoiceKitCore {
  /**
   * @param {Object} options - Configuration options
   * @param {Function} options.progressCallback - Progress callback for loading
   * @param {Object} options.wasmOptions - WASM loader options
   * @param {Object} options.cacheOptions - Model cache options
   * @param {Object} options.asrOptions - ASR options
   * @param {Object} options.llmOptions - LLM options
   * @param {Object} options.ttsOptions - TTS options
   */
  constructor(options = {}) {
    // Configure environment before initializing components
    this._configureEnvironment(options.environment || {});
    
    // Set up callbacks
    this.progressCallback = options.progressCallback || null;
    
    // Initialize components
    this.wasmLoader = new WasmLoader(options.wasmOptions || {
      wasmFiles: [
        'ort-wasm-simd-threaded.wasm',
        'ort-wasm-simd.wasm',
        'ort-wasm-threaded.wasm',
        'ort-wasm.wasm'
      ]
    });
    
    this.modelCache = new ModelCache(options.cacheOptions || {});
    
    this.audioProcessor = new AudioProcessor(options.audioOptions || {
      targetSampleRate: 16000,
      normalization: true
    });
    
    this.asr = new WhisperManager({
      ...options.asrOptions,
      progressCallback: this._wrapProgressCallback('asr')
    });
    
    this.llm = new TextGenerator({
      ...options.llmOptions,
      progressCallback: this._wrapProgressCallback('llm')
    });
    
    this.tts = new TTSManager({
      ...options.ttsOptions,
      progressCallback: this._wrapProgressCallback('tts')
    });
    
    this.isInitialized = false;
    this.isInitializing = false;
  }

  /**
   * Configure the transformers.js environment
   * @private
   * @param {Object} config - Environment configuration
   */
  _configureEnvironment(config) {
    // Apply environment configuration with careful defaults
    env.useBrowserCache = config.useBrowserCache !== false;
    env.useCustomCache = config.useCustomCache !== false;
    
    // Set proper paths for browser extension if needed
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      env.localModelPath = chrome.runtime.getURL('models');
      env.wasmPaths = {
        'ort-wasm-simd-threaded.wasm': chrome.runtime.getURL('wasm/ort-wasm-simd-threaded.wasm'),
        'ort-wasm-simd.wasm': chrome.runtime.getURL('wasm/ort-wasm-simd.wasm'),
        'ort-wasm-threaded.wasm': chrome.runtime.getURL('wasm/ort-wasm-threaded.wasm'),
        'ort-wasm.wasm': chrome.runtime.getURL('wasm/ort-wasm.wasm')
      };
    } else if (config.localModelPath) {
      env.localModelPath = config.localModelPath;
    }
    
    // Configure backend and quantization
    if (config.backends && Array.isArray(config.backends)) {
      env.backends = config.backends;
    }
    
    if (config.quantized !== undefined) {
      env.quantized = config.quantized;
    } else {
      env.quantized = true; // Default to quantized models
    }
    
    console.log('Environment configured:', {
      modelPath: env.localModelPath,
      backends: env.backends,
      quantized: env.quantized
    });
  }

  /**
   * Wrap progress callback with component context
   * @private
   * @param {string} component - Component name
   * @returns {Function} - Wrapped callback
   */
  _wrapProgressCallback(component) {
    return this.progressCallback 
      ? (progress) => {
          this.progressCallback({
            component,
            ...progress
          });
        }
      : null;
  }

  /**
   * Initialize all components
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.isInitializing) {
      throw new Error('Already initializing');
    }
    
    this.isInitializing = true;
    let initError = null;
    
    try {
      console.log('Initializing VoiceKit core components...');
      
      // Initialize WASM loader first
      await this.wasmLoader.initialize(this._wrapProgressCallback('wasm'));
      console.log('WASM loader initialized');
      
      // Initialize model cache
      await this.modelCache.initialize();
      console.log('Model cache initialized');
      
      // Initialize audio processor
      await this.audioProcessor.initialize();
      console.log('Audio processor initialized');
      
      // Initialize models in parallel
      await Promise.all([
        this.asr.initialize(),
        this.llm.initialize(),
        this.tts.initialize()
      ]);
      
      console.log('All components initialized successfully');
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize VoiceKit core:', error);
      initError = error;
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get initialization status
   * @returns {Object} - Initialization status
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isInitializing: this.isInitializing,
      components: {
        wasm: this.wasmLoader.isReady(),
        cache: this.modelCache.isInitialized,
        asr: this.asr.isReady(),
        llm: this.llm.isReady(),
        tts: this.tts.isReady()
      }
    };
  }

  /**
   * Process audio through the entire pipeline
   * @param {Float32Array|ArrayBuffer|Blob} audio - Audio data
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Results from all pipeline stages
   */
  async processAudio(audio, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Normalize audio to Float32Array
    let audioData;
    if (audio instanceof Float32Array) {
      audioData = audio;
    } else if (audio instanceof ArrayBuffer) {
      audioData = await this.audioProcessor.arrayBufferToFloat32Array(audio);
    } else if (audio instanceof Blob) {
      audioData = await this.audioProcessor.blobToFloat32Array(audio);
    } else {
      throw new Error('Invalid audio format');
    }
    
    // Track timing
    const start = performance.now();
    
    try {
      // Step 1: Transcribe audio with ASR
      const asrStart = performance.now();
      const transcription = await this.asr.transcribe(audioData, options.asr);
      const asrTime = performance.now() - asrStart;
      console.log(`ASR completed in ${asrTime}ms: "${transcription.text}"`);
      
      // Step 2: Process transcription with LLM
      const llmStart = performance.now();
      const response = await this.llm.generate(transcription.text, options.llm);
      const llmTime = performance.now() - llmStart;
      console.log(`LLM completed in ${llmTime}ms, generated ${response.text.length} chars`);
      
      // Step 3: Synthesize response with TTS
      const ttsStart = performance.now();
      const speech = await this.tts.synthesize(response.text, options.tts);
      const ttsTime = performance.now() - ttsStart;
      console.log(`TTS completed in ${ttsTime}ms, generated ${speech.audio.length} samples`);
      
      const totalTime = performance.now() - start;
      
      return {
        transcription: transcription.text,
        response: response.text,
        audio: speech.audio,
        blob: speech.blob,
        timing: {
          total: totalTime,
          asr: asrTime,
          llm: llmTime,
          tts: ttsTime
        }
      };
    } catch (error) {
      console.error('Error processing audio through pipeline:', error);
      throw error;
    }
  }

  /**
   * Clean up all resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    await Promise.all([
      this.asr.cleanup(),
      this.llm.cleanup(),
      this.tts.cleanup(),
      this.audioProcessor.cleanup()
    ]);
    
    this.wasmLoader.cleanup();
    this.modelCache.close();
    
    this.isInitialized = false;
    console.log('VoiceKit core resources cleaned up');
  }
}

// Export all components for individual use
export {
  WasmLoader,
  ModelCache,
  WhisperManager,
  AudioProcessor,
  TextGenerator,
  TTSManager
};