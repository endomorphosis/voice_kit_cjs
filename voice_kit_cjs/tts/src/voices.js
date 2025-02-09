import path from "path";
import fs from "fs/promises";

export const VOICES = {
  "af_heart": { name: "Heart", language: "English", gender: "Female", style: "Warm and caring" },
  "af_nova": { name: "Nova", language: "English", gender: "Female", style: "Professional and clear" },
  "af_star": { name: "Star", language: "English", gender: "Female", style: "Bright and energetic" },
  "af_crystal": { name: "Crystal", language: "English", gender: "Female", style: "Soft and gentle" },
  "bf_rock": { name: "Rock", language: "English", gender: "Male", style: "Deep and strong" },
  "bf_storm": { name: "Storm", language: "English", gender: "Male", style: "Dynamic and powerful" }
};

// Cache for loaded voice embeddings
const voiceCache = new Map();

/**
 * Get the voice embedding data for a specific voice
 * @param {keyof typeof VOICES} voice The voice ID
 * @returns {Promise<Float32Array>} The voice embedding
 */
export async function getVoiceData(voice) {
  if (!voiceCache.has(voice)) {
    // Load the voice embedding from a CDN or local storage
    const response = await fetch(`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/main/voices/${voice}.bin`);
    const buffer = await response.arrayBuffer();
    voiceCache.set(voice, new Float32Array(buffer));
  }
  return voiceCache.get(voice);
}
