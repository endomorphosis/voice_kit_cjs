/**
 * Voice Kit Debug Skeleton - Main Entry Point
 * 
 * This file serves as the entry point for the debugging skeleton application,
 * providing comprehensive logging and testing capabilities for the voice kit components.
 */

import { getLogger, enableVerboseLogging } from './utils/logger.js';
import { featureDetector } from './utils/feature-detector.js';
import { ModelLoader } from './utils/model-loader.js';
import { WebGPUDiagnostics } from './utils/webgpu-diagnostics.js';
import * as transformers from '@xenova/transformers';

// Initialize the root logger and enable verbose logging immediately
const logger = getLogger('Main');
enableVerboseLogging();

// Application state
const state = {
  isInitialized: false,
  isLoading: false,
  diagnosticsComplete: false,
  features: null,
  webgpuInfo: null,
  components: {
    asr: {
      isReady: false,
      isLoading: false,
      error: null,
      model: null,
      pipeline: null,
      progress: 0
    },
    llm: {
      isReady: false,
      isLoading: false,
      error: null,
      model: null,
      pipeline: null,
      progress: 0
    },
    tts: {
      isReady: false,
      isLoading: false,
      error: null,
      model: null,
      pipeline: null,
      progress: 0
    }
  },
  timings: {
    initialization: {},
    inference: {}
  },
  audioContext: null,
  audioProcessor: null,
  audioStream: null,
  lastTranscription: null,
  lastLLMOutput: null,
  lastTTSOutput: null
};

// Configuration
const config = {
  asr: {
    modelId: 'Xenova/whisper-small',
    quantized: true
  },
  llm: {
    modelId: 'Xenova/gpt2-small',
    quantized: true
  },
  tts: {
    modelId: 'Xenova/speecht5_tts',
    quantized: true
  },
  environment: {
    useWebGPU: true,
    useWasm: true,
    useBrowserCache: true,
    quantized: true
  }
};

/**
 * Initialize the application
 */
export async function initialize() {
  logger.info('Initializing Voice Kit Debug Skeleton');
  logger.info('Configuration:', config);
  
  state.isLoading = true;
  updateUI('status', 'Initializing...');
  
  try {
    // Step 1: Feature detection
    logger.info('Running feature detection...');
    state.features = await runFeatureDetection();
    
    // Step 2: WebGPU diagnostics if available
    if (state.features.webGPU) {
      logger.info('Running WebGPU diagnostics...');
      state.webgpuInfo = await runWebGPUDiagnostics();
    }
    
    // Step 3: Configure transformers.js environment
    logger.info('Configuring transformers.js environment...');
    configureTransformersEnv();
    
    state.isInitialized = true;
    state.isLoading = false;
    state.diagnosticsComplete = true;
    
    logger.info('Initialization complete. Ready for component testing.');
    updateUI('status', 'Ready for testing');
    updateUI('featuresComplete', state.features);
    updateUI('diagnosticsComplete', state.webgpuInfo);
    
    return { success: true, features: state.features, webgpu: state.webgpuInfo };
  } catch (error) {
    state.isLoading = false;
    state.error = error.message;
    
    logger.error('Initialization failed:', error);
    updateUI('status', `Initialization failed: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

/**
 * Run feature detection
 */
async function runFeatureDetection() {
  logger.info('Starting feature detection');
  const startTime = performance.now();
  
  try {
    await featureDetector.detectAll();
    
    const endTime = performance.now();
    logger.info(`Feature detection completed in ${(endTime - startTime).toFixed(2)}ms`);
    
    // Check if minimum requirements are met
    const meetsMinimum = featureDetector.meetsMinimumRequirements();
    
    if (meetsMinimum) {
      logger.info('System meets minimum requirements');
    } else {
      logger.error('System does not meet minimum requirements');
    }
    
    return featureDetector.features;
  } catch (error) {
    logger.error('Feature detection failed:', error);
    throw error;
  }
}

/**
 * Run WebGPU diagnostics
 */
async function runWebGPUDiagnostics() {
  logger.info('Starting WebGPU diagnostics');
  const webgpuDiagnostics = new WebGPUDiagnostics();
  
  try {
    const diagnosticsResult = await webgpuDiagnostics.runDiagnostics();
    
    if (diagnosticsResult.supported) {
      logger.info('WebGPU is fully supported');
      logger.info(`Adapter: ${diagnosticsResult.adapterInfo.vendor} - ${diagnosticsResult.adapterInfo.architecture}`);
      logger.info(`Features: ${diagnosticsResult.features.join(', ')}`);
      
      // Log compute test results
      if (diagnosticsResult.computeTest.success) {
        logger.info('WebGPU compute test passed');
      } else {
        logger.warn('WebGPU compute test failed:', diagnosticsResult.computeTest.error);
      }
      
      return diagnosticsResult;
    } else {
      logger.warn('WebGPU diagnostics failed:', diagnosticsResult.error);
      return diagnosticsResult;
    }
  } catch (error) {
    logger.error('WebGPU diagnostics error:', error);
    throw error;
  }
}

/**
 * Configure transformers.js environment
 */
function configureTransformersEnv() {
  logger.info('Configuring Transformers.js environment');
  
  try {
    // Set backends based on feature detection
    const backends = [];
    
    if (config.environment.useWebGPU && state.features.webGPU) {
      backends.push('webgpu');
      logger.info('Adding WebGPU backend');
    }
    
    if (config.environment.useWasm) {
      backends.push('wasm');
      logger.info('Adding WASM backend');
    }
    
    // Add CPU as fallback
    backends.push('cpu');
    
    // Configure the transformers.js environment
    transformers.env.backends = backends;
    transformers.env.useBrowserCache = config.environment.useBrowserCache;
    
    logger.info('Transformers environment configured:', {
      backends: transformers.env.backends,
      useBrowserCache: transformers.env.useBrowserCache
    });
  } catch (error) {
    logger.error('Error configuring transformers environment:', error);
    throw error;
  }
}

/**
 * Initialize the ASR component
 */
export async function initializeASR() {
  if (state.components.asr.isLoading) {
    logger.warn('ASR initialization already in progress');
    return { success: false, error: 'Initialization already in progress' };
  }
  
  if (state.components.asr.isReady) {
    logger.warn('ASR already initialized');
    return { success: true, model: state.components.asr.model };
  }
  
  logger.info('Initializing ASR component...');
  logger.info('ASR configuration:', config.asr);
  
  state.components.asr.isLoading = true;
  state.components.asr.error = null;
  updateUI('asrStatus', 'Loading...');
  
  try {
    const startTime = performance.now();
    
    // Create model loader for ASR
    const modelLoader = new ModelLoader({
      transformers,
      modelId: config.asr.modelId,
      task: 'automatic-speech-recognition',
      quantized: config.asr.quantized,
      device: transformers.env.backends[0],
      statusCallback: (progress) => {
        state.components.asr.progress = progress.progress || 0;
        updateUI('asrProgress', progress);
      }
    });
    
    // Load the model
    state.components.asr.pipeline = await modelLoader.load();
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Store timing information
    state.timings.initialization.asr = loadTime;
    
    // Update state
    state.components.asr.isReady = true;
    state.components.asr.isLoading = false;
    state.components.asr.model = modelLoader;
    
    logger.info(`ASR initialized successfully in ${loadTime.toFixed(2)}ms`);
    updateUI('asrStatus', 'Ready');
    
    return { success: true, model: modelLoader, loadTime };
  } catch (error) {
    state.components.asr.isLoading = false;
    state.components.asr.error = error.message;
    
    logger.error('ASR initialization failed:', error);
    updateUI('asrStatus', `Failed: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

/**
 * Initialize the LLM component
 */
export async function initializeLLM() {
  if (state.components.llm.isLoading) {
    logger.warn('LLM initialization already in progress');
    return { success: false, error: 'Initialization already in progress' };
  }
  
  if (state.components.llm.isReady) {
    logger.warn('LLM already initialized');
    return { success: true, model: state.components.llm.model };
  }
  
  logger.info('Initializing LLM component...');
  logger.info('LLM configuration:', config.llm);
  
  state.components.llm.isLoading = true;
  state.components.llm.error = null;
  updateUI('llmStatus', 'Loading...');
  
  try {
    const startTime = performance.now();
    
    // Create model loader for LLM
    const modelLoader = new ModelLoader({
      transformers,
      modelId: config.llm.modelId,
      task: 'text-generation',
      quantized: config.llm.quantized,
      device: transformers.env.backends[0],
      statusCallback: (progress) => {
        state.components.llm.progress = progress.progress || 0;
        updateUI('llmProgress', progress);
      }
    });
    
    // Load the model
    state.components.llm.pipeline = await modelLoader.load();
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Store timing information
    state.timings.initialization.llm = loadTime;
    
    // Update state
    state.components.llm.isReady = true;
    state.components.llm.isLoading = false;
    state.components.llm.model = modelLoader;
    
    logger.info(`LLM initialized successfully in ${loadTime.toFixed(2)}ms`);
    updateUI('llmStatus', 'Ready');
    
    return { success: true, model: modelLoader, loadTime };
  } catch (error) {
    state.components.llm.isLoading = false;
    state.components.llm.error = error.message;
    
    logger.error('LLM initialization failed:', error);
    updateUI('llmStatus', `Failed: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

/**
 * Initialize the TTS component
 */
export async function initializeTTS() {
  if (state.components.tts.isLoading) {
    logger.warn('TTS initialization already in progress');
    return { success: false, error: 'Initialization already in progress' };
  }
  
  if (state.components.tts.isReady) {
    logger.warn('TTS already initialized');
    return { success: true, model: state.components.tts.model };
  }
  
  logger.info('Initializing TTS component...');
  logger.info('TTS configuration:', config.tts);
  
  state.components.tts.isLoading = true;
  state.components.tts.error = null;
  updateUI('ttsStatus', 'Loading...');
  
  try {
    const startTime = performance.now();
    
    // Create model loader for TTS
    const modelLoader = new ModelLoader({
      transformers,
      modelId: config.tts.modelId,
      task: 'text-to-speech',
      quantized: config.tts.quantized,
      device: transformers.env.backends[0],
      statusCallback: (progress) => {
        state.components.tts.progress = progress.progress || 0;
        updateUI('ttsProgress', progress);
      }
    });
    
    // Load the model
    state.components.tts.pipeline = await modelLoader.load();
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Store timing information
    state.timings.initialization.tts = loadTime;
    
    // Update state
    state.components.tts.isReady = true;
    state.components.tts.isLoading = false;
    state.components.tts.model = modelLoader;
    
    logger.info(`TTS initialized successfully in ${loadTime.toFixed(2)}ms`);
    updateUI('ttsStatus', 'Ready');
    
    return { success: true, model: modelLoader, loadTime };
  } catch (error) {
    state.components.tts.isLoading = false;
    state.components.tts.error = error.message;
    
    logger.error('TTS initialization failed:', error);
    updateUI('ttsStatus', `Failed: ${error.message}`);
    
    return { success: false, error: error.message };
  }
}

/**
 * Initialize audio context and microphone
 */
export async function initializeAudio() {
  logger.info('Initializing audio system...');
  
  try {
    // Check if audio system is already initialized
    if (state.audioContext && state.audioStream) {
      logger.warn('Audio system already initialized');
      return { success: true };
    }
    
    // Create audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    
    logger.info(`Audio context created with sample rate ${state.audioContext.sampleRate}Hz`);
    
    // Request microphone access
    logger.info('Requesting microphone access...');
    state.audioStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    logger.info('Microphone access granted');
    
    // Setup audio node for processing
    const source = state.audioContext.createMediaStreamSource(state.audioStream);
    state.audioProcessor = state.audioContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(state.audioProcessor);
    state.audioProcessor.connect(state.audioContext.destination);
    
    logger.info('Audio processing pipeline established');
    
    return { success: true };
  } catch (error) {
    logger.error('Audio initialization failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Test ASR transcription
 */
export async function testASRTranscription(audioData) {
  if (!state.components.asr.isReady) {
    logger.error('Cannot test ASR - not initialized');
    return { success: false, error: 'ASR not initialized' };
  }
  
  logger.info('Testing ASR transcription');
  
  try {
    const startTime = performance.now();
    
    // Use provided audio data or generate test data
    const inputAudio = audioData || new Float32Array(16000).fill(0.01); // 1 second of near-silence as test
    
    logger.info(`Processing audio data (${inputAudio.length} samples)`);
    
    // Run transcription
    const result = await state.components.asr.pipeline(inputAudio);
    
    const endTime = performance.now();
    const inferenceTime = endTime - startTime;
    
    // Store timing and result
    state.timings.inference.asr = inferenceTime;
    state.lastTranscription = result.text;
    
    logger.info(`ASR transcription completed in ${inferenceTime.toFixed(2)}ms`);
    logger.info(`Transcription result: "${result.text}"`);
    
    updateUI('asrResult', { text: result.text, time: inferenceTime });
    
    return { success: true, text: result.text, time: inferenceTime };
  } catch (error) {
    logger.error('ASR transcription failed:', error);
    updateUI('asrResult', { error: error.message });
    
    return { success: false, error: error.message };
  }
}

/**
 * Test LLM generation
 */
export async function testLLMGeneration(input) {
  if (!state.components.llm.isReady) {
    logger.error('Cannot test LLM - not initialized');
    return { success: false, error: 'LLM not initialized' };
  }
  
  // Use provided input or last transcription or default text
  const prompt = input || state.lastTranscription || 'Hello, how are you today?';
  
  logger.info(`Testing LLM generation with prompt: "${prompt}"`);
  
  try {
    const startTime = performance.now();
    
    // Run text generation
    const result = await state.components.llm.pipeline(prompt, {
      max_new_tokens: 50,
      temperature: 0.7
    });
    
    const endTime = performance.now();
    const inferenceTime = endTime - startTime;
    
    // Extract generated text (format depends on model)
    const generatedText = result[0]?.generated_text || 
                          result.generated_text || 
                          JSON.stringify(result);
    
    // Store timing and result
    state.timings.inference.llm = inferenceTime;
    state.lastLLMOutput = generatedText;
    
    logger.info(`LLM generation completed in ${inferenceTime.toFixed(2)}ms`);
    logger.info(`Generated text: "${generatedText}"`);
    
    updateUI('llmResult', { text: generatedText, time: inferenceTime });
    
    return { success: true, text: generatedText, time: inferenceTime };
  } catch (error) {
    logger.error('LLM generation failed:', error);
    updateUI('llmResult', { error: error.message });
    
    return { success: false, error: error.message };
  }
}

/**
 * Test TTS synthesis
 */
export async function testTTSSynthesis(input) {
  if (!state.components.tts.isReady) {
    logger.error('Cannot test TTS - not initialized');
    return { success: false, error: 'TTS not initialized' };
  }
  
  // Use provided input or last LLM output or default text
  const text = input || state.lastLLMOutput || 'This is a test of speech synthesis.';
  
  logger.info(`Testing TTS synthesis with text: "${text}"`);
  
  try {
    const startTime = performance.now();
    
    // Run speech synthesis
    const result = await state.components.tts.pipeline(text, {
      voice_preset: 'en_speaker_1'
    });
    
    const endTime = performance.now();
    const inferenceTime = endTime - startTime;
    
    // Store timing and result
    state.timings.inference.tts = inferenceTime;
    state.lastTTSOutput = result;
    
    logger.info(`TTS synthesis completed in ${inferenceTime.toFixed(2)}ms`);
    logger.info(`Generated ${result.audio?.data?.length || 0} audio samples`);
    
    // Play the audio
    await playAudio(result);
    
    updateUI('ttsResult', { time: inferenceTime, audioLength: result.audio?.data?.length || 0 });
    
    return { success: true, audio: result, time: inferenceTime };
  } catch (error) {
    logger.error('TTS synthesis failed:', error);
    updateUI('ttsResult', { error: error.message });
    
    return { success: false, error: error.message };
  }
}

/**
 * Play generated audio
 */
async function playAudio(audioData) {
  logger.info('Playing synthesized audio');
  
  try {
    if (!audioData || !audioData.audio) {
      logger.warn('No audio data to play');
      return false;
    }
    
    // Create audio context if needed
    if (!state.audioContext) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContext();
    }
    
    // Check if we need to resume audio context (browser autoplay policy)
    if (state.audioContext.state === 'suspended') {
      await state.audioContext.resume();
    }
    
    // Create audio buffer from raw data
    const audioBuffer = state.audioContext.createBuffer(
      1, // mono
      audioData.audio.data.length,
      audioData.audio.sampling_rate
    );
    
    // Fill the buffer with audio data
    audioBuffer.getChannelData(0).set(audioData.audio.data);
    
    // Create audio source
    const source = state.audioContext.createBufferSource();
    source.buffer = audioBuffer;
    
    // Connect to audio output and play
    source.connect(state.audioContext.destination);
    source.start(0);
    
    logger.info('Audio playback started');
    return true;
  } catch (error) {
    logger.error('Audio playback failed:', error);
    return false;
  }
}

/**
 * Run full ASR → LLM → TTS pipeline test
 */
export async function runFullPipeline(audioData) {
  logger.info('Running full ASR → LLM → TTS pipeline test');
  
  // Check if all components are ready
  if (!state.components.asr.isReady || !state.components.llm.isReady || !state.components.tts.isReady) {
    logger.error('Cannot run pipeline - not all components are initialized');
    return { success: false, error: 'Not all components are initialized' };
  }
  
  try {
    const startTime = performance.now();
    let currentStage = 'asr';
    updateUI('pipelineStatus', { status: 'running', stage: 'asr' });
    
    // Step 1: ASR
    logger.info('Pipeline stage 1: ASR transcription');
    const asrResult = await testASRTranscription(audioData);
    
    if (!asrResult.success) {
      logger.error('Pipeline failed at ASR stage:', asrResult.error);
      updateUI('pipelineStatus', { status: 'failed', stage: 'asr', error: asrResult.error });
      return { success: false, stage: 'asr', error: asrResult.error };
    }
    
    // Step 2: LLM
    currentStage = 'llm';
    updateUI('pipelineStatus', { status: 'running', stage: 'llm' });
    logger.info('Pipeline stage 2: LLM generation');
    
    const llmResult = await testLLMGeneration(asrResult.text);
    
    if (!llmResult.success) {
      logger.error('Pipeline failed at LLM stage:', llmResult.error);
      updateUI('pipelineStatus', { status: 'failed', stage: 'llm', error: llmResult.error });
      return { success: false, stage: 'llm', error: llmResult.error };
    }
    
    // Step 3: TTS
    currentStage = 'tts';
    updateUI('pipelineStatus', { status: 'running', stage: 'tts' });
    logger.info('Pipeline stage 3: TTS synthesis');
    
    const ttsResult = await testTTSSynthesis(llmResult.text);
    
    if (!ttsResult.success) {
      logger.error('Pipeline failed at TTS stage:', ttsResult.error);
      updateUI('pipelineStatus', { status: 'failed', stage: 'tts', error: ttsResult.error });
      return { success: false, stage: 'tts', error: ttsResult.error };
    }
    
    // Pipeline complete
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    logger.info(`Full pipeline completed successfully in ${totalTime.toFixed(2)}ms`);
    logger.info(`ASR: ${state.timings.inference.asr.toFixed(2)}ms, LLM: ${state.timings.inference.llm.toFixed(2)}ms, TTS: ${state.timings.inference.tts.toFixed(2)}ms`);
    
    updateUI('pipelineStatus', { 
      status: 'complete',
      totalTime,
      stages: {
        asr: { time: state.timings.inference.asr, text: asrResult.text },
        llm: { time: state.timings.inference.llm, text: llmResult.text },
        tts: { time: state.timings.inference.tts }
      }
    });
    
    return {
      success: true,
      totalTime,
      asr: asrResult,
      llm: llmResult,
      tts: ttsResult
    };
  } catch (error) {
    logger.error('Pipeline execution failed:', error);
    updateUI('pipelineStatus', { status: 'failed', error: error.message });
    
    return { success: false, error: error.message };
  }
}

/**
 * Record audio from microphone
 */
export async function recordAudio(durationMs = 5000) {
  logger.info(`Starting audio recording (${durationMs}ms)`);
  
  try {
    // Initialize audio if needed
    if (!state.audioContext || !state.audioStream) {
      await initializeAudio();
    }
    
    return new Promise((resolve, reject) => {
      // Sample rate from audio context
      const sampleRate = state.audioContext.sampleRate;
      
      // Buffer to store audio samples
      const audioBuffer = [];
      let recording = true;
      
      // Start recording
      state.audioProcessor.onaudioprocess = (e) => {
        if (!recording) return;
        
        // Get audio data from input channel
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Store a copy of the data
        const samples = new Float32Array(inputData.length);
        samples.set(inputData);
        audioBuffer.push(samples);
        
        // Log buffer size periodically
        if (audioBuffer.length % 10 === 0) {
          const totalSamples = audioBuffer.reduce((acc, buf) => acc + buf.length, 0);
          logger.debug(`Recording in progress: ${totalSamples} samples (${(totalSamples / sampleRate).toFixed(1)}s)`);
        }
        
        // Update UI
        updateUI('recordingStatus', {
          isRecording: true,
          samples: audioBuffer.reduce((acc, buf) => acc + buf.length, 0),
          duration: (audioBuffer.reduce((acc, buf) => acc + buf.length, 0) / sampleRate)
        });
      };
      
      // Stop recording after specified duration
      setTimeout(() => {
        recording = false;
        
        // Concatenate all audio chunks
        const totalLength = audioBuffer.reduce((acc, buf) => acc + buf.length, 0);
        const concatenatedBuffer = new Float32Array(totalLength);
        
        let offset = 0;
        for (const buffer of audioBuffer) {
          concatenatedBuffer.set(buffer, offset);
          offset += buffer.length;
        }
        
        logger.info(`Recording complete: ${concatenatedBuffer.length} samples (${(concatenatedBuffer.length / sampleRate).toFixed(2)}s)`);
        
        // Disconnect processor
        state.audioProcessor.onaudioprocess = null;
        
        // Update UI
        updateUI('recordingStatus', { isRecording: false });
        
        // Return the recorded audio
        resolve({
          audio: concatenatedBuffer,
          sampleRate,
          duration: concatenatedBuffer.length / sampleRate
        });
      }, durationMs);
    });
  } catch (error) {
    logger.error('Audio recording failed:', error);
    throw error;
  }
}

/**
 * Update the UI with new data
 * This is a placeholder that will be replaced by the actual UI update logic
 */
function updateUI(type, data) {
  // This function will be replaced by the actual UI implementation
  logger.debug(`UI update (${type}):`, data);
  
  // Dispatch custom event for UI updates
  const event = new CustomEvent('voicekit:ui-update', {
    detail: { type, data }
  });
  window.dispatchEvent(event);
}

// Export state for external access
export function getState() {
  return state;
}

// Export configuration
export function getConfig() {
  return config;
}

// Configure the application
export function configure(newConfig) {
  logger.info('Updating configuration:', newConfig);
  
  // Update configuration with provided values
  if (newConfig.asr) {
    Object.assign(config.asr, newConfig.asr);
  }
  
  if (newConfig.llm) {
    Object.assign(config.llm, newConfig.llm);
  }
  
  if (newConfig.tts) {
    Object.assign(config.tts, newConfig.tts);
  }
  
  if (newConfig.environment) {
    Object.assign(config.environment, newConfig.environment);
  }
  
  logger.info('Configuration updated:', config);
  return config;
}

// Initialize event listeners
function initEventListeners() {
  window.addEventListener('error', (event) => {
    logger.error('Uncaught error:', event.error);
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection:', event.reason);
  });
}

// Initialize event listeners when this module is loaded
initEventListeners();