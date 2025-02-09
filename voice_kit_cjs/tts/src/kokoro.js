import { pipeline } from "@huggingface/transformers";
import { phonemize } from "./phonemize.js";
import { getVoiceData, VOICES } from "./voices.js";

const STYLE_DIM = 256;
const SAMPLE_RATE = 24000;

export class KokoroTTS {
  constructor(model) {
    this.model = model;
  }

  /**
   * Load a KokoroTTS model from the Hugging Face Hub.
   * @param {string} model_id The model id 
   * @param {Object} options Additional options
   * @param {"fp32"|"fp16"|"q8"|"q4"|"q4f16"} [options.dtype="fp32"] The data type to use.
   * @param {"wasm"|"webgpu"|"cpu"|null} [options.device=null] The device to run the model on.
   * @param {import("@huggingface/transformers").ProgressCallback} [options.progress_callback=null] A callback function called with progress info.
   * @returns {Promise<KokoroTTS>} The loaded model
   */
  static async from_pretrained(model_id, { dtype = "fp32", device = null, progress_callback = null } = {}) {
    const ttsModel = await pipeline("text-to-speech", model_id, {
      dtype,
      device,
      progress_callback,
      quantized: dtype.startsWith("q"),
    });

    return new KokoroTTS(ttsModel); 
  }

  get voices() {
    return VOICES;
  }

  list_voices() {
    console.table(VOICES);
  }

  _validate_voice(voice) {
    if (!VOICES.hasOwnProperty(voice)) {
      console.error(`Voice "${voice}" not found. Available voices:`);
      console.table(VOICES);
      throw new Error(`Voice "${voice}" not found. Should be one of: ${Object.keys(VOICES).join(", ")}.`);
    }
  }

  /**
   * Generate audio from text.
   *
   * @param {string} text The input text
   * @param {Object} options Additional options  
   * @param {keyof typeof VOICES} [options.voice="af_heart"] The voice style to use
   * @param {number} [options.speed=1] The speaking speed
   * @returns {Promise<Float32Array>} The generated audio waveform
   */
  async generate(text, { voice = "af_heart", speed = 1 } = {}) {
    this._validate_voice(voice);

    const language = voice.at(0); // "a" or "b"
    const phonemes = await phonemize(text, language);

    // Load voice style
    const style = await getVoiceData(voice);
    
    // Generate audio using pipeline
    const output = await this.model(phonemes, {
      style,
      speed, 
    });

    return output.audio;
  }
}
