// ASR Worker for handling speech recognition
import { pipeline } from '@xenova/transformers';

let whisperPipeline = null;
let isInitialized = false;

async function initASR(wasmPath) {
  if (isInitialized) return;
  
  try {
    // Ensure wasmPath is a string
    const wasmPathStr = typeof wasmPath === 'string' ? wasmPath : '';
    
    whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
      revision: 'main',
      quantized: false,
      config: {
        wasmPath: wasmPathStr,
        type: 'wasm'
      }
    });
    
    isInitialized = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    console.error('ASR Init Error:', error);
    self.postMessage({ type: 'error', error: error.message });
  }
}

self.onmessage = async (event) => {
  const { type, data, wasmPath } = event.data;
  
  if (type === 'init') {
    await initASR(wasmPath);
  } else if (type === 'transcribe') {
    try {
      if (!whisperPipeline) {
        throw new Error('ASR pipeline not initialized');
      }
      
      // Validate audio data
      if (!data?.audio) {
        throw new Error('No audio data provided');
      }

      // Convert input to Float32Array if needed
      let audioArray;
      if (data.audio instanceof Float32Array) {
        audioArray = data.audio;
      } else if (Array.isArray(data.audio)) {
        // Ensure all elements are numbers
        if (!data.audio.every(x => typeof x === 'number')) {
          throw new Error('Invalid audio data - must contain only numbers');
        }
        audioArray = Float32Array.from(data.audio);
      } else {
        throw new Error('Invalid audio data format - must be Float32Array or array of numbers');
      }
      
      const result = await whisperPipeline(audioArray);
      
      // Validate result has text property
      if (!result || typeof result.text !== 'string') {
        throw new Error('Invalid transcription result');
      }
      
      self.postMessage({ type: 'result', text: result.text });
    } catch (error) {
      console.error('ASR Error:', error);
      self.postMessage({ type: 'error', error: error.message });
    }
  }
};