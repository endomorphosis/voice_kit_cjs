/**
 * Utility class for audio processing operations
 * Handles audio conversion, resampling, and feature extraction
 */
export class AudioProcessor {
  /**
   * @param {Object} options - Configuration options
   * @param {number} options.targetSampleRate - Target sample rate for processing (default: 16000Hz for Whisper)
   * @param {boolean} options.normalization - Whether to apply audio normalization
   */
  constructor(options = {}) {
    this.targetSampleRate = options.targetSampleRate || 16000;
    this.normalization = options.normalization !== false;
    this.audioContext = null;
  }

  /**
   * Initialize the audio processor
   * @returns {Promise<void>}
   */
  async initialize() {
    // Check if AudioContext is available in this environment
    if (typeof window !== 'undefined' && window.AudioContext) {
      this.audioContext = new AudioContext({
        sampleRate: this.targetSampleRate
      });
    }
  }

  /**
   * Convert a Blob of audio data to a Float32Array
   * @param {Blob} blob - Audio blob (e.g., from MediaRecorder)
   * @returns {Promise<Float32Array>} - Audio data as Float32Array
   */
  async blobToFloat32Array(blob) {
    if (!blob) {
      throw new Error('No audio blob provided');
    }

    try {
      const arrayBuffer = await blob.arrayBuffer();
      return this.arrayBufferToFloat32Array(arrayBuffer);
    } catch (error) {
      throw new Error(`Failed to convert audio blob: ${error.message}`);
    }
  }

  /**
   * Convert an ArrayBuffer of audio data to a Float32Array
   * @param {ArrayBuffer} buffer - Audio data as ArrayBuffer
   * @returns {Promise<Float32Array>} - Audio data as Float32Array
   */
  async arrayBufferToFloat32Array(buffer) {
    if (!buffer) {
      throw new Error('No audio buffer provided');
    }

    try {
      // Ensure we have an AudioContext
      if (!this.audioContext) {
        await this.initialize();
        if (!this.audioContext) {
          throw new Error('AudioContext not available');
        }
      }

      // Decode the audio data
      const audioBuffer = await this.audioContext.decodeAudioData(buffer);
      
      // Get the first channel of audio data
      const audioData = audioBuffer.getChannelData(0);
      
      // Resample if needed
      if (audioBuffer.sampleRate !== this.targetSampleRate) {
        return this.resampleAudio(audioData, audioBuffer.sampleRate, this.targetSampleRate);
      }
      
      // Apply normalization if enabled
      if (this.normalization) {
        return this.normalizeAudio(audioData);
      }
      
      return audioData;
    } catch (error) {
      throw new Error(`Failed to process audio buffer: ${error.message}`);
    }
  }

  /**
   * Resample audio to a different sample rate
   * @param {Float32Array} audioData - Original audio data
   * @param {number} originalSampleRate - Original sample rate
   * @param {number} targetSampleRate - Target sample rate
   * @returns {Float32Array} - Resampled audio data
   */
  resampleAudio(audioData, originalSampleRate, targetSampleRate) {
    if (originalSampleRate === targetSampleRate) {
      return audioData;
    }

    const ratio = targetSampleRate / originalSampleRate;
    const newLength = Math.round(audioData.length * ratio);
    const result = new Float32Array(newLength);
    
    // Basic linear interpolation resampler
    for (let i = 0; i < newLength; i++) {
      const originalIndex = i / ratio;
      const index1 = Math.floor(originalIndex);
      const index2 = Math.min(index1 + 1, audioData.length - 1);
      const alpha = originalIndex - index1;
      
      result[i] = (1 - alpha) * audioData[index1] + alpha * audioData[index2];
    }
    
    return result;
  }

  /**
   * Normalize audio to have values between -1 and 1
   * @param {Float32Array} audioData - Audio data to normalize
   * @returns {Float32Array} - Normalized audio data
   */
  normalizeAudio(audioData) {
    // Find the maximum absolute value
    let maxValue = 0;
    for (let i = 0; i < audioData.length; i++) {
      const absValue = Math.abs(audioData[i]);
      if (absValue > maxValue) {
        maxValue = absValue;
      }
    }
    
    // No need to normalize if max value is already <= 1
    if (maxValue <= 1 && maxValue > 0.1) {
      return audioData;
    }
    
    // Create a new array with normalized values
    const normalizedData = new Float32Array(audioData.length);
    
    if (maxValue < 0.001) {
      // Audio is essentially silent, don't normalize to avoid amplifying noise
      return audioData;
    }
    
    const normalizationFactor = 0.95 / maxValue;
    for (let i = 0; i < audioData.length; i++) {
      normalizedData[i] = audioData[i] * normalizationFactor;
    }
    
    return normalizedData;
  }

  /**
   * Extract features from audio data (for ASR)
   * @param {Float32Array} audioData - Processed audio data
   * @returns {Object} - Features object that can be passed to the ASR model
   */
  extractFeatures(audioData) {
    // This is a simplified version - in a real implementation,
    // you might compute mel spectrograms or other features here.
    // For Whisper, the pipeline often takes care of feature extraction.
    return {
      input_features: audioData,
      sampling_rate: this.targetSampleRate
    };
  }

  /**
   * Clean up resources
   */
  cleanup() {
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(error => {
        console.warn('Error closing AudioContext:', error);
      });
    }
    this.audioContext = null;
  }
}