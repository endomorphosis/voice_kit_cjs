// ASR Worker using ES modules
import { pipeline, env } from '@xenova/transformers';
import { FeatureExtractor, WHISPER_CONFIG } from './feature-extractor.js';

// Configure environment
env.backends.onnx.wasm.numThreads = 1;
env.useBrowserCache = true;
env.allowLocalModels = true;
env.cacheDir = 'models';

// State management
const state = {
  whisperPipeline: null,
  isInitialized: false
};

// Safe string handling
const safeString = input => input == null ? '' : String(input);

// Initialize ASR
async function initASR(wasmPath) {
  if (state.isInitialized) return;
  
  try {
    // Initialize feature extractor first
    await FeatureExtractor.getInstance();

    // Initialize pipeline with feature extractor config
    state.whisperPipeline = await pipeline(
      'automatic-speech-recognition',
      'Xenova/whisper-small',
      {
        revision: 'main',
        local: true,
        cache_dir: env.cacheDir,
        quantized: false,
        config: WHISPER_CONFIG
      }
    );
    
    state.isInitialized = true;
    self.postMessage({ type: 'ready' });
  } catch (error) {
    console.error('ASR Init Error:', error);
    self.postMessage({ 
      type: 'error', 
      error: safeString(error.message || 'Failed to initialize ASR')
    });
  }
}

// Handle messages
self.onmessage = async ({ data }) => {
  if (!data || typeof data !== 'object') return;
  
  const { type, audio, wasmPath } = data;
  
  try {
    switch (type) {
      case 'init':
        await initASR(wasmPath);
        break;
        
      case 'transcribe':
        if (!state.whisperPipeline) {
          throw new Error('ASR not initialized');
        }
        
        if (!audio) {
          throw new Error('No audio data provided');
        }

        // Convert and validate audio data
        let audioArray;
        if (audio instanceof Float32Array) {
          audioArray = audio;
        } else if (Array.isArray(audio)) {
          if (!audio.every(x => typeof x === 'number' && !isNaN(x))) {
            throw new Error('Invalid audio data - must contain only valid numbers');
          }
          audioArray = Float32Array.from(audio);
        } else {
          throw new Error('Invalid audio data format');
        }

        // Process audio using feature extractor
        const features = await FeatureExtractor.processAudio(audioArray);
        
        // Run inference
        const result = await state.whisperPipeline(features);
        
        if (!result?.text) {
          throw new Error('No transcription result');
        }
        
        self.postMessage({ 
          type: 'result', 
          text: safeString(result.text)
        });
        break;
        
      default:
        console.warn('Unknown message type:', type);
    }
  } catch (error) {
    console.error('ASR Error:', error);
    self.postMessage({ 
      type: 'error', 
      error: safeString(error.message || 'ASR processing failed')
    });
  }
};

// Cleanup
self.addEventListener('unload', () => {
  Promise.all([
    state.whisperPipeline?.destroy?.(),
    FeatureExtractor.cleanup()
  ]).catch(console.error);
});