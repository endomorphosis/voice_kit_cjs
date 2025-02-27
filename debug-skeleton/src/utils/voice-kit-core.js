/**
 * Voice Kit Core
 * Integrates ASR, LLM, and TTS components with comprehensive logging and error tracking
 */
import { getLogger } from './logger.js';
import { ModelLoader } from './model-loader.js';

const logger = getLogger('VoiceKitCore');

export class VoiceKitCore {
  /**
   * Create a new Voice Kit Core
   * @param {Object} options Configuration options
   * @param {Object} options.transformers Transformers.js instance
   * @param {Function} options.progressCallback Progress callback function
   * @param {Object} options.environment Environment configuration
   * @param {Object} options.asrOptions ASR model options
   * @param {Object} options.llmOptions LLM model options
   * @param {Object} options.ttsOptions TTS model options
   */
  constructor(options) {
    this.transformers = options.transformers;
    this.progressCallback = options.progressCallback;
    this.environment = options.environment || {};
    
    this.asrOptions = options.asrOptions || { modelId: 'Xenova/whisper-small' };
    this.llmOptions = options.llmOptions || { modelId: 'Xenova/gpt2-small' };
    this.ttsOptions = options.ttsOptions || { modelId: 'Xenova/speecht5_tts' };
    
    // Component instances
    this.asr = null;
    this.llm = null;
    this.tts = null;
    
    this.isInitialized = false;
    this.activeBackend = null;
    
    logger.info('Voice Kit Core created');
    logger.debug('Environment:', this.environment);
    logger.debug('ASR options:', this.asrOptions);
    logger.debug('LLM options:', this.llmOptions);
    logger.debug('TTS options:', this.ttsOptions);
    
    // Configure environment
    this._configureEnvironment();
  }

  /**
   * Initialize all components
   */
  async initialize() {
    logger.info('Initializing Voice Kit Core');
    
    try {
      // Detect best available backend
      await this._detectBackend();
      
      // Initialize components in sequence with detailed logging
      logger.info('Initializing ASR component');
      this.asr = await this._initializeComponent('asr');
      
      logger.info('Initializing LLM component');
      this.llm = await this._initializeComponent('llm');
      
      logger.info('Initializing TTS component');
      this.tts = await this._initializeComponent('tts');
      
      this.isInitialized = true;
      logger.info('Voice Kit Core initialized successfully');
      
      return {
        success: true,
        asr: this.asr.getInfo(),
        llm: this.llm.getInfo(),
        tts: this.tts.getInfo(),
        backend: this.activeBackend
      };
    } catch (error) {
      logger.error('Voice Kit Core initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize just the ASR component
   */
  async initializeASR() {
    logger.info('Initializing ASR component');
    
    try {
      await this._detectBackend();
      this.asr = await this._initializeComponent('asr');
      
      logger.info('ASR component initialized');
      return this.asr;
    } catch (error) {
      logger.error('ASR initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize just the LLM component
   */
  async initializeLLM() {
    logger.info('Initializing LLM component');
    
    try {
      await this._detectBackend();
      this.llm = await this._initializeComponent('llm');
      
      logger.info('LLM component initialized');
      return this.llm;
    } catch (error) {
      logger.error('LLM initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize just the TTS component
   */
  async initializeTTS() {
    logger.info('Initializing TTS component');
    
    try {
      await this._detectBackend();
      this.tts = await this._initializeComponent('tts');
      
      logger.info('TTS component initialized');
      return this.tts;
    } catch (error) {
      logger.error('TTS initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process audio through the entire ASR → LLM → TTS pipeline
   * @param {Float32Array} audioData Audio data
   * @param {Object} options Pipeline options
   * @returns {Promise<Object>} Pipeline result
   */
  async processAudio(audioData, options = {}) {
    logger.info('Starting audio processing pipeline');
    
    if (!this.isInitialized) {
      logger.error('Cannot process audio - Voice Kit not initialized');
      throw new Error('Voice Kit not initialized');
    }
    
    const startTime = performance.now();
    const timing = {};
    
    try {
      // Step 1: ASR
      logger.info('Pipeline step 1: ASR transcription');
      const asrStartTime = performance.now();
      
      const asrResult = await this.asr.run(audioData, options.asr || {});
      const transcription = asrResult.output.text || '';
      
      timing.asr = performance.now() - asrStartTime;
      logger.info(`ASR completed in ${timing.asr.toFixed(2)}ms`);
      logger.info(`Transcription: "${transcription}"`);
      
      // Step 2: LLM
      logger.info('Pipeline step 2: LLM generation');
      const llmStartTime = performance.now();
      
      const llmResult = await this.llm.run(transcription, options.llm || {});
      const response = llmResult.output[0]?.generated_text || '';
      
      timing.llm = performance.now() - llmStartTime;
      logger.info(`LLM completed in ${timing.llm.toFixed(2)}ms`);
      logger.info(`Response: "${response}"`);
      
      // Step 3: TTS
      logger.info('Pipeline step 3: TTS synthesis');
      const ttsStartTime = performance.now();
      
      const ttsResult = await this.tts.run(response, options.tts || {});
      
      timing.tts = performance.now() - ttsStartTime;
      logger.info(`TTS completed in ${timing.tts.toFixed(2)}ms`);
      
      // Calculate total time
      const totalTime = performance.now() - startTime;
      logger.info(`Full pipeline completed in ${totalTime.toFixed(2)}ms`);
      
      return {
        success: true,
        transcription,
        response,
        audio: ttsResult.output,
        timing: {
          total: totalTime,
          asr: timing.asr,
          llm: timing.llm,
          tts: timing.tts
        }
      };
    } catch (error) {
      const totalTime = performance.now() - startTime;
      logger.error(`Pipeline failed after ${totalTime.toFixed(2)}ms:`, error);
      
      return {
        success: false,
        error: error.message,
        timing
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    logger.info('Cleaning up Voice Kit Core');
    
    try {
      // Unload each component if it exists
      if (this.asr) {
        await this.asr.unload();
      }
      
      if (this.llm) {
        await this.llm.unload();
      }
      
      if (this.tts) {
        await this.tts.unload();
      }
      
      this.isInitialized = false;
      logger.info('Voice Kit Core cleaned up successfully');
    } catch (error) {
      logger.error('Error during cleanup:', error);
      throw error;
    }
  }

  /**
   * Play audio generated by TTS
   * @param {Object} audioData Audio data from TTS output
   */
  async playAudio(audioData) {
    logger.info('Playing audio');
    
    try {
      if (!audioData) {
        logger.warn('No audio data provided');
        return;
      }
      
      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      
      // Check if context is suspended (autoplay policy)
      if (audioContext.state === 'suspended') {
        logger.info('Audio context suspended, attempting to resume');
        await audioContext.resume();
      }
      
      // Create buffer from audio data
      const audioBuffer = audioContext.createBuffer(
        1, // mono
        audioData.length,
        22050 // sampling rate for TTS
      );
      
      // Fill buffer
      audioBuffer.getChannelData(0).set(audioData);
      
      // Create source and play
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start(0);
      
      logger.info('Audio playback started');
      
      // Return promise that resolves when audio finishes playing
      return new Promise((resolve) => {
        source.onended = () => {
          logger.info('Audio playback ended');
          resolve();
        };
      });
    } catch (error) {
      logger.error('Audio playback failed:', error);
      throw error;
    }
  }

  /**
   * Configure the transformers.js environment
   * @private
   */
  _configureEnvironment() {
    logger.info('Configuring transformers environment');
    
    // Set up available backends
    if (this.environment.backends) {
      this.transformers.env.backends = this.environment.backends;
      logger.info(`Using configured backends: ${this.environment.backends.join(', ')}`);
    }
    
    // Configure caching
    if (this.environment.useBrowserCache !== undefined) {
      this.transformers.env.useBrowserCache = this.environment.useBrowserCache;
    }
    
    if (this.environment.useCustomCache !== undefined) {
      this.transformers.env.useCustomCache = this.environment.useCustomCache;
    }
    
    logger.debug('Environment configuration complete:', {
      backends: this.transformers.env.backends,
      useBrowserCache: this.transformers.env.useBrowserCache,
      useCustomCache: this.transformers.env.useCustomCache
    });
  }

  /**
   * Detect the best available backend
   * @private
   */
  async _detectBackend() {
    logger.info('Detecting best available backend');
    
    try {
      // If WebGPU is the first choice, check if it's available
      if (this.transformers.env.backends[0] === 'webgpu') {
        if (!navigator.gpu) {
          logger.warn('WebGPU is not available, falling back to WASM');
          this.transformers.env.backends = ['wasm'];
          this.activeBackend = 'wasm';
          return;
        }
        
        // Try to get an adapter
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          logger.warn('No WebGPU adapter found, falling back to WASM');
          this.transformers.env.backends = ['wasm'];
          this.activeBackend = 'wasm';
          return;
        }
        
        // WebGPU is available
        logger.info('WebGPU is available and will be used');
        this.activeBackend = 'webgpu';
      } else {
        // Use the first configured backend
        this.activeBackend = this.transformers.env.backends[0];
        logger.info(`Using configured backend: ${this.activeBackend}`);
      }
    } catch (error) {
      logger.error('Error detecting backend:', error);
      logger.warn('Falling back to WASM backend');
      this.transformers.env.backends = ['wasm'];
      this.activeBackend = 'wasm';
    }
  }

  /**
   * Initialize a component
   * @private
   * @param {string} type Component type ('asr', 'llm', or 'tts')
   * @returns {Promise<ModelLoader>} Initialized model loader
   */
  async _initializeComponent(type) {
    const progressCallback = (progress) => {
      if (this.progressCallback) {
        this.progressCallback({
          component: type,
          ...progress
        });
      }
    };
    
    // Get options based on component type
    let options, modelId, task;
    
    switch (type) {
      case 'asr':
        options = this.asrOptions;
        modelId = options.modelId;
        task = 'automatic-speech-recognition';
        break;
      case 'llm':
        options = this.llmOptions;
        modelId = options.modelId;
        task = 'text-generation';
        break;
      case 'tts':
        options = this.ttsOptions;
        modelId = options.modelId;
        task = 'text-to-speech';
        break;
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
    
    // Create model loader
    const loader = new ModelLoader({
      transformers: this.transformers,
      modelId,
      task,
      quantized: options.quantized !== false,
      device: this.activeBackend,
      statusCallback: progressCallback
    });
    
    // Load the model
    try {
      await loader.load();
      return loader;
    } catch (error) {
      logger.error(`Failed to initialize ${type} component:`, error);
      throw error;
    }
  }
}