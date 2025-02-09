const SAMPLE_RATE = 24000;

/**
 * A class to handle raw audio data with a specific sample rate.
 */
export class RawAudio {
  /**
   * Create a new RawAudio instance.
   * @param {Float32Array} data The raw audio data
   * @param {number} [sampleRate=24000] The sample rate in Hz
   */
  constructor(data, sampleRate = SAMPLE_RATE) {
    this.data = data;
    this.sampleRate = sampleRate;
  }

  /**
   * Get the duration of the audio in seconds
   * @returns {number}
   */
  get duration() {
    return this.data.length / this.sampleRate;
  }

  /**
   * Convert the raw audio data to an AudioBuffer that can be played
   * @returns {Promise<AudioBuffer>}
   */
  async toAudioBuffer() {
    const ctx = new AudioContext();
    const buffer = ctx.createBuffer(1, this.data.length, this.sampleRate);
    buffer.copyToChannel(this.data, 0);
    return buffer;
  }

  /**
   * Play the audio using Web Audio API
   * @returns {Promise<void>}
   */
  async play() {
    const buffer = await this.toAudioBuffer();
    const ctx = new AudioContext();
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  }

  /**
   * Convert the raw audio to a Blob that can be downloaded
   * @returns {Blob}
   */
  toBlob() {
    const wavBuffer = this._encodeWAV();
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }

  /**
   * Encode the raw audio data as a WAV file
   * @returns {ArrayBuffer}
   * @private
   */
  _encodeWAV() {
    const buffer = new ArrayBuffer(44 + this.data.length * 2);
    const view = new DataView(buffer);

    // Write WAV header
    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + this.data.length * 2, true);
    this._writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, this.sampleRate, true);
    view.setUint32(28, this.sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    
    // data sub-chunk
    this._writeString(view, 36, 'data');
    view.setUint32(40, this.data.length * 2, true);

    // Write audio data
    this._floatTo16BitPCM(view, 44, this.data);

    return buffer;
  }

  /**
   * Write a string to a DataView
   * @private
   */
  _writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * Convert Float32Array audio data to 16-bit PCM
   * @private
   */
  _floatTo16BitPCM(output, offset, input) {
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }
}