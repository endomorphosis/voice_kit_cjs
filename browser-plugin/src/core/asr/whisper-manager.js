import { TransformerBase } from '../utils/transformer-base.js';
import { pipeline, env } from '@xenova/transformers';

/**
 * Manager for Whisper ASR functionality
 * Handles initialization, transcription, and cleanup of ASR models
 */
export class WhisperManager extends TransformerBase {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.modelId - The model ID (e.g., 'Xenova/whisper-small')
   * @param {boolean} options.quantized - Whether to use quantized models
   * @param {Function} options.progressCallback - Callback for loading progress
   * @param {number} options.chunkLengthS - Chunk length in seconds for processing
   * @param {number} options.strideLengthS - Stride length in seconds for processing
   */
  constructor(options = {}) {
    super({
      ...options,
      modelType: 'asr'
    });
    
    // ASR-specific options
    this.modelId = options.modelId || 'Xenova/whisper-small';
    this.chunkLengthS = options.chunkLengthS || 30;
    this.strideLengthS = options.strideLengthS || 5;
    this.samplingRate = options.samplingRate || 16000;
  }

  /**
   * Load and initialize the Whisper model
   * @private
   * @returns {Promise<void>}
   */
  async _loadModel() {
    try {
      const pipelineConfig = {
        quantized: this.quantized,
        progress_callback: this.progressCallback,
        chunk_length_s: this.chunkLengthS,
        stride_length_s: this.strideLengthS,
        sampling_rate: this.samplingRate,
        revision: 'main'
      };
      
      console.log(`Loading ASR model: ${this.modelId}`);
      this.model = await pipeline('automatic-speech-recognition', this.modelId, pipelineConfig);
      
      if (!this.model) {
        throw new Error(`Failed to initialize ASR model: ${this.modelId}`);
      }
      
      console.log(`ASR model loaded successfully: ${this.modelId}`);
    } catch (error) {
      console.error('Error loading ASR model:', error);
      throw error;
    }
  }

  /**
   * Transcribe audio data to text
   * @param {Float32Array|Array<number>} audioData - Audio data to transcribe
   * @param {Object} options - Transcription options
   * @returns {Promise<Object>} - Transcription result
   */
  async transcribe(audioData, options = {}) {
    if (!this.isReady()) {
      await this.initialize();
    }

    // Validate audio data
    const validatedAudio = this._validateAndPrepareAudio(audioData);
    
    try {
      // Process transcription with proper options
      const transcriptionOptions = {
        chunk_length_s: options.chunkLengthS || this.chunkLengthS,
        stride_length_s: options.strideLengthS || this.strideLengthS,
        sampling_rate: options.samplingRate || this.samplingRate,
        return_timestamps: options.returnTimestamps || false,
        ...options
      };
      
      const result = await this.model(validatedAudio, transcriptionOptions);
      return {
        text: result.text,
        chunks: result.chunks,
        timing: {
          processingTimeMs: performance.now() - this._startTime
        }
      };
    } catch (error) {
      console.error('Transcription error:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Validate and prepare audio data for processing
   * @private
   * @param {Float32Array|Array<number>} audioData - Audio data to validate
   * @returns {Float32Array} - Validated audio data
   */
  _validateAndPrepareAudio(audioData) {
    this._startTime = performance.now();
    
    // Handle different input types
    if (!audioData) {
      throw new Error('No audio data provided');
    }
    
    let audioArray;
    try {
      if (audioData instanceof Float32Array) {
        audioArray = audioData;
      } else if (ArrayBuffer.isView(audioData)) {
        audioArray = new Float32Array(audioData.buffer);
      } else if (Array.isArray(audioData)) {
        if (!audioData.every(x => typeof x === 'number' && !isNaN(x))) {
          throw new Error('Invalid audio data - must contain only valid numbers');
        }
        audioArray = Float32Array.from(audioData);
      } else {
        throw new Error('Invalid audio data format');
      }
      
      // Verify audio has valid data
      if (audioArray.length === 0) {
        throw new Error('Audio data is empty');
      }
      
      // Check for invalid values
      const hasInvalid = audioArray.some(val => isNaN(val) || !isFinite(val));
      if (hasInvalid) {
        throw new Error('Audio data contains invalid values (NaN or Infinity)');
      }
      
      return audioArray;
    } catch (error) {
      throw new Error(`Failed to process audio data: ${error.message}`);
    }
  }
}