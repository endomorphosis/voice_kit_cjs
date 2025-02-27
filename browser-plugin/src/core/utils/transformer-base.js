/**
 * Base class for all transformer model managers
 * Provides common functionality for loading, initializing and using transformer models
 */
export class TransformerBase {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.modelType - The type of model (e.g., 'asr', 'llm', 'tts')
   * @param {string} options.modelId - The model identifier (e.g., 'Xenova/whisper-small')
   * @param {boolean} options.quantized - Whether to use quantized models
   * @param {Function} options.progressCallback - Callback for loading progress
   */
  constructor(options = {}) {
    this.modelType = options.modelType || '';
    this.modelId = options.modelId || '';
    this.quantized = options.quantized !== false;
    this.progressCallback = options.progressCallback || null;
    this.model = null;
    this.tokenizer = null;
    this.processor = null;
    this.isInitialized = false;
    this.isInitializing = false;
    this.lastError = null;
  }

  /**
   * Initialize the model
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    if (this.isInitializing) {
      throw new Error(`${this.modelType} model is already being initialized`);
    }

    this.isInitializing = true;
    this.lastError = null;

    try {
      await this._loadModel();
      this.isInitialized = true;
      this.isInitializing = false;
      return true;
    } catch (error) {
      this.lastError = error;
      this.isInitializing = false;
      console.error(`Failed to initialize ${this.modelType} model:`, error);
      throw error;
    }
  }

  /**
   * Abstract method to load the model - must be implemented by subclasses
   * @private
   */
  async _loadModel() {
    throw new Error('_loadModel() must be implemented by subclass');
  }

  /**
   * Check if the model is ready
   * @returns {boolean} - Whether the model is initialized
   */
  isReady() {
    return this.isInitialized && !this.lastError;
  }

  /**
   * Get the last error
   * @returns {Error|null} - The last error that occurred
   */
  getLastError() {
    return this.lastError;
  }

  /**
   * Clean up resources
   * @returns {Promise<void>}
   */
  async cleanup() {
    this.isInitialized = false;
    this.lastError = null;
    
    // Cleanup model resources if available
    if (this.model && typeof this.model.destroy === 'function') {
      await this.model.destroy();
    }
    
    if (this.tokenizer && typeof this.tokenizer.destroy === 'function') {
      await this.tokenizer.destroy();
    }
    
    if (this.processor && typeof this.processor.destroy === 'function') {
      await this.processor.destroy();
    }
    
    this.model = null;
    this.tokenizer = null;
    this.processor = null;
  }
}