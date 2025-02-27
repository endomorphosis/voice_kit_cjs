import { TransformerBase } from '../utils/transformer-base.js';
import { pipeline, env } from '@xenova/transformers';

/**
 * Manager for text-to-speech functionality
 * Handles initialization, text-to-speech synthesis, and cleanup of TTS models
 */
export class TTSManager extends TransformerBase {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.modelId - The model ID (e.g., 'Xenova/speecht5_tts')
   * @param {boolean} options.quantized - Whether to use quantized models
   * @param {Function} options.progressCallback - Callback for loading progress
   * @param {number} options.sampleRate - Audio sample rate (default: 16000)
   */
  constructor(options = {}) {
    super({
      ...options,
      modelType: 'tts'
    });
    
    // TTS-specific options
    this.modelId = options.modelId || 'Xenova/speecht5_tts';
    this.sampleRate = options.sampleRate || 16000;
    this.audioContext = null;
  }

  /**
   * Load and initialize the TTS model
   * @private
   * @returns {Promise<void>}
   */
  async _loadModel() {
    try {
      const pipelineConfig = {
        quantized: this.quantized,
        progress_callback: this.progressCallback,
        revision: 'main'
      };
      
      console.log(`Loading TTS model: ${this.modelId}`);
      this.model = await pipeline('text-to-speech', this.modelId, pipelineConfig);
      
      if (!this.model) {
        throw new Error(`Failed to initialize TTS model: ${this.modelId}`);
      }
      
      // Initialize audio context if we're in a browser environment
      if (typeof window !== 'undefined' && window.AudioContext) {
        this.audioContext = new AudioContext({
          sampleRate: this.sampleRate
        });
      }
      
      console.log(`TTS model loaded successfully: ${this.modelId}`);
    } catch (error) {
      console.error('Error loading TTS model:', error);
      throw error;
    }
  }

  /**
   * Convert text to speech
   * @param {string} text - The text to synthesize
   * @param {Object} options - Synthesis options
   * @returns {Promise<Object>} - The synthesized speech and metadata
   */
  async synthesize(text, options = {}) {
    if (!this.isReady()) {
      await this.initialize();
    }

    // Validate text
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text: must be a non-empty string');
    }

    const synthesisStart = performance.now();

    try {
      // Set default options
      const synthesisOptions = {
        voice_preset: options.voicePreset || 'female',
        rate: options.rate || 1.0,
        ...options
      };
      
      // Generate speech
      const result = await this.model(text, synthesisOptions);
      
      if (!result || !result.audio) {
        throw new Error('Model did not return audio data');
      }
      
      // Create audio blob
      const audioData = new Float32Array(result.audio.data);
      const synthesisTime = performance.now() - synthesisStart;
      
      // Convert to WAV format if requested
      let audioBlob = null;
      if (options.returnBlob) {
        audioBlob = await this._createAudioBlob(audioData, this.sampleRate);
      }
      
      return {
        audio: audioData,
        blob: audioBlob,
        sampleRate: this.sampleRate,
        timing: {
          synthesisTimeMs: synthesisTime,
          secondsPerCharacter: synthesisTime / (1000 * text.length)
        },
        metadata: result.metadata || {}
      };
    } catch (error) {
      console.error('Speech synthesis error:', error);
      throw new Error(`Speech synthesis failed: ${error.message}`);
    }
  }

  /**
   * Play synthesized audio (browser only)
   * @param {Float32Array} audioData - The audio data to play
   * @returns {Promise<void>}
   */
  async playAudio(audioData) {
    if (typeof window === 'undefined' || !window.AudioContext) {
      throw new Error('Audio playback is only available in browser environments');
    }

    try {
      // Initialize audio context if not already done
      if (!this.audioContext) {
        this.audioContext = new AudioContext({
          sampleRate: this.sampleRate
        });
      }

      // Create a buffer and source
      const audioBuffer = this.audioContext.createBuffer(
        1, // mono
        audioData.length,
        this.sampleRate
      );
      
      // Fill the buffer
      audioBuffer.getChannelData(0).set(audioData);
      
      // Create source and play
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.audioContext.destination);
      source.start();
      
      // Return a promise that resolves when audio finishes playing
      return new Promise(resolve => {
        source.onended = resolve;
      });
    } catch (error) {
      console.error('Audio playback error:', error);
      throw new Error(`Audio playback failed: ${error.message}`);
    }
  }

  /**
   * Create an audio blob from audio data
   * @private
   * @param {Float32Array} audioData - The audio data
   * @param {number} sampleRate - The sample rate
   * @returns {Promise<Blob>} - Audio blob in WAV format
   */
  async _createAudioBlob(audioData, sampleRate) {
    // Simple WAV encoder for Float32Array
    const createWAV = (data, sampleRate) => {
      const numChannels = 1; // mono
      const bitsPerSample = 16;
      const bytesPerSample = bitsPerSample / 8;
      
      // Convert float audio data to 16-bit PCM
      const pcmData = new Int16Array(data.length);
      for (let i = 0; i < data.length; i++) {
        // Convert Float32 to Int16
        const s = Math.max(-1, Math.min(1, data[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      const dataSize = pcmData.length * bytesPerSample;
      const headerSize = 44;
      const buffer = new ArrayBuffer(headerSize + dataSize);
      const view = new DataView(buffer);
      
      // Write WAV header
      // RIFF chunk descriptor
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + dataSize, true);
      writeString(view, 8, 'WAVE');
      
      // fmt sub-chunk
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true); // fmt chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, numChannels, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * numChannels * bytesPerSample, true); // byte rate
      view.setUint16(32, numChannels * bytesPerSample, true); // block align
      view.setUint16(34, bitsPerSample, true);
      
      // data sub-chunk
      writeString(view, 36, 'data');
      view.setUint32(40, dataSize, true);
      
      // Write PCM data
      const pcmBuffer = new Uint8Array(buffer, headerSize);
      const pcmView = new Uint8Array(pcmData.buffer);
      pcmBuffer.set(pcmView);
      
      function writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }
      
      return buffer;
    };
    
    const wavBuffer = createWAV(audioData, sampleRate);
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    await super.cleanup();
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        await this.audioContext.close();
      } catch (error) {
        console.warn('Error closing AudioContext:', error);
      }
    }
    this.audioContext = null;
  }
}