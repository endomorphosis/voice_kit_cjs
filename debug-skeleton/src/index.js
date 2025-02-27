/**
 * Voice Kit Diagnostic App
 * Main entry point with comprehensive logging and component testing
 */
import { getLogger, enableVerboseLogging } from './utils/logger.js';
import { featureDetector } from './utils/feature-detector.js';
import { ModelLoader } from './utils/model-loader.js';
import { VoiceKitCore } from '../../browser-plugin/src/core/index.js';
import * as transformers from '@xenova/transformers';

// Create root logger
const logger = getLogger('DiagnosticApp');
logger.info('Voice Kit Diagnostic Application starting');

// Enable verbose logging immediately
enableVerboseLogging();

// State management
const state = {
  features: null,
  components: {
    asr: {
      isInitialized: false,
      isLoading: false,
      error: null,
      model: null,
      progress: 0
    },
    llm: {
      isInitialized: false,
      isLoading: false,
      error: null,
      model: null,
      progress: 0
    },
    tts: {
      isInitialized: false,
      isLoading: false,
      error: null,
      model: null,
      progress: 0
    },
    audio: {
      isInitialized: false,
      isLoading: false,
      error: null,
      recorder: null
    }
  },
  core: null,
  performance: {
    initTimes: {},
    runTimes: {}
  }
};

// Configuration options
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
  }
};

// Initialize UI elements
function initializeUI() {
  logger.info('Initializing UI elements');
  
  // Setup tab navigation
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });
  
  // Setup button event handlers
  document.getElementById('detect-features').addEventListener('click', detectFeatures);
  document.getElementById('initialize-all').addEventListener('click', initializeAll);
  document.getElementById('run-complete-pipeline').addEventListener('click', runCompletePipeline);
  document.getElementById('clear-logs').addEventListener('click', clearLogs);
  document.getElementById('reset-system').addEventListener('click', resetSystem);
  
  document.getElementById('enable-verbose').addEventListener('click', () => {
    enableVerboseLogging();
    logger.info('Verbose logging enabled for all components');
    updateLogUI('System', 'info', 'Verbose logging enabled for all components');
  });
  
  document.getElementById('disable-debug').addEventListener('click', () => {
    logger.disableLevels('debug', 'trace');
    logger.info('Debug and trace logs disabled');
    updateLogUI('System', 'info', 'Debug and trace logs disabled');
  });
  
  // Component-specific buttons
  document.getElementById('initialize-asr').addEventListener('click', () => initializeComponent('asr'));
  document.getElementById('test-asr').addEventListener('click', testASR);
  document.getElementById('initialize-llm').addEventListener('click', () => initializeComponent('llm'));
  document.getElementById('test-llm').addEventListener('click', testLLM);
  document.getElementById('initialize-tts').addEventListener('click', () => initializeComponent('tts'));
  document.getElementById('test-tts').addEventListener('click', testTTS);
  document.getElementById('play-tts').addEventListener('click', playTTSAudio);
  
  // Initialize status display
  updateStatusUI();
  
  logger.info('UI initialization complete');
}

// Feature detection
async function detectFeatures() {
  logger.info('Starting feature detection...');
  updateOverallStatus('loading', 'Detecting features');
  
  try {
    state.features = await featureDetector.detectAll();
    
    // Update UI with feature detection results
    const featuresContainer = document.getElementById('browser-features');
    featuresContainer.innerHTML = '';
    
    Object.entries(state.features).forEach(([name, supported]) => {
      const statusClass = supported ? 'status-success' : 'status-error';
      const statusText = supported ? 'Supported' : 'Not supported';
      
      featuresContainer.innerHTML += `
        <div class="status-item ${statusClass}">
          <div class="status-name">${formatFeatureName(name)}</div>
          <div class="status-value">${statusText}</div>
        </div>
      `;
    });
    
    // Check if minimum requirements are met
    const meetsMinimum = featureDetector.meetsMinimumRequirements();
    const meetsOptimal = featureDetector.meetsOptimalRequirements();
    
    if (meetsOptimal) {
      updateOverallStatus('success', 'All features available');
    } else if (meetsMinimum) {
      updateOverallStatus('warning', 'Minimum requirements met');
    } else {
      updateOverallStatus('error', 'Missing required features');
    }
    
    // Get and display WebGPU info if available
    if (state.features.webGPU) {
      displayWebGPUInfo();
    }
    
    logger.info('Feature detection complete');
  } catch (error) {
    logger.error('Feature detection failed:', error);
    updateOverallStatus('error', 'Feature detection failed');
  }
}

// Initialize all components
async function initializeAll() {
  logger.info('Starting initialization of all components');
  updateOverallStatus('loading', 'Initializing components');
  
  try {
    // Create core instance with verbose progress reporting
    const startTime = performance.now();
    
    if (!state.core) {
      logger.info('Creating VoiceKitCore instance');
      
      state.core = new VoiceKitCore({
        progressCallback: (progress) => {
          logger.debug(`Progress update for ${progress.component}:`, progress);
          
          if (state.components[progress.component]) {
            state.components[progress.component].progress = progress.progress || 0;
          }
          
          updateProgressUI(progress.component, progress.progress || 0);
        },
        environment: {
          useBrowserCache: true,
          useCustomCache: true,
          backends: ['webgpu', 'wasm'],
          quantized: true
        },
        asrOptions: config.asr,
        llmOptions: config.llm,
        ttsOptions: config.tts
      });
    }
    
    // Initialize the core
    await state.core.initialize();
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Update state
    state.components.asr.isInitialized = true;
    state.components.llm.isInitialized = true;
    state.components.tts.isInitialized = true;
    state.performance.initTimes.all = totalTime;
    
    // Update UI
    updateStatusUI();
    document.getElementById('run-complete-pipeline').disabled = false;
    document.getElementById('test-asr').disabled = false;
    document.getElementById('test-llm').disabled = false;
    document.getElementById('test-tts').disabled = false;
    
    logger.info(`All components initialized successfully in ${totalTime.toFixed(2)}ms`);
    updateOverallStatus('success', 'All components ready');
    
    // Display performance metrics
    updatePerformanceUI();
  } catch (error) {
    logger.error('Initialization failed:', error);
    updateOverallStatus('error', 'Initialization failed');
    
    // Try to determine which component failed
    let failedComponent = 'unknown';
    if (error.message.includes('ASR') || error.message.includes('Whisper')) {
      failedComponent = 'asr';
    } else if (error.message.includes('LLM') || error.message.includes('GPT')) {
      failedComponent = 'llm';
    } else if (error.message.includes('TTS') || error.message.includes('speech')) {
      failedComponent = 'tts';
    }
    
    state.components[failedComponent].error = error.message;
    updateStatusUI();
  }
}

// Initialize a specific component
async function initializeComponent(component) {
  if (!['asr', 'llm', 'tts'].includes(component)) {
    logger.error(`Invalid component: ${component}`);
    return;
  }
  
  logger.info(`Initializing ${component.toUpperCase()} component`);
  state.components[component].isLoading = true;
  state.components[component].error = null;
  updateStatusUI();
  
  const progressContainer = document.getElementById(`${component}-progress-container`);
  progressContainer.classList.remove('hidden');
  
  try {
    const startTime = performance.now();
    let model = null;
    
    // Create core if it doesn't exist
    if (!state.core) {
      state.core = new VoiceKitCore({
        progressCallback: (progress) => {
          if (progress.component === component) {
            state.components[component].progress = progress.progress || 0;
            updateProgressUI(component, progress.progress || 0);
          }
        },
        environment: {
          backends: ['webgpu', 'wasm'],
          quantized: true
        }
      });
    }
    
    // Initialize just this component
    switch (component) {
      case 'asr':
        if (!state.core.asr.isReady()) {
          await state.core.asr.initialize();
        }
        model = state.core.asr;
        break;
      case 'llm':
        if (!state.core.llm.isReady()) {
          await state.core.llm.initialize();
        }
        model = state.core.llm;
        break;
      case 'tts':
        if (!state.core.tts.isReady()) {
          await state.core.tts.initialize();
        }
        model = state.core.tts;
        break;
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Update state
    state.components[component].isInitialized = true;
    state.components[component].isLoading = false;
    state.components[component].model = model;
    state.performance.initTimes[component] = totalTime;
    
    // Update UI
    updateStatusUI();
    document.getElementById(`test-${component}`).disabled = false;
    if (component === 'tts') {
      document.getElementById('play-tts').disabled = false;
    }
    
    logger.info(`${component.toUpperCase()} initialized successfully in ${totalTime.toFixed(2)}ms`);
    
    // Update performance metrics
    updatePerformanceUI();
  } catch (error) {
    logger.error(`${component.toUpperCase()} initialization failed:`, error);
    state.components[component].isLoading = false;
    state.components[component].isInitialized = false;
    state.components[component].error = error.message;
    updateStatusUI();
  } finally {
    updateProgressUI(component, 100);
    // Hide progress bar after a delay
    setTimeout(() => {
      progressContainer.classList.add('hidden');
    }, 1000);
  }
}

// Run complete ASR → LLM → TTS pipeline
async function runCompletePipeline() {
  if (!state.core || !state.core.isInitialized) {
    logger.error('Cannot run pipeline - core not initialized');
    updateOverallStatus('error', 'Core not initialized');
    return;
  }
  
  logger.info('Starting complete voice pipeline execution');
  updateOverallStatus('loading', 'Running pipeline');
  
  try {
    // Create a simple audio input for testing
    // In a real scenario, we would get this from the microphone
    logger.info('Generating test audio data');
    const testAudioData = new Float32Array(16000).fill(0.01); // 1 second of near-silence
    
    const startTime = performance.now();
    
    // Process through the entire pipeline
    const result = await state.core.processAudio(testAudioData, {
      asr: { language: 'en' },
      llm: { max_new_tokens: 50 },
      tts: { voice_preset: 'en_speaker_1' }
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Store timing information
    state.performance.runTimes = {
      total: totalTime,
      asr: result.timing.asr,
      llm: result.timing.llm,
      tts: result.timing.tts
    };
    
    // Display results
    document.getElementById('transcription-output').value = result.transcription;
    document.getElementById('llm-output').value = result.response;
    
    // Play audio if available
    if (result.audio) {
      state.lastGeneratedAudio = result.audio;
      document.getElementById('play-tts').disabled = false;
    }
    
    logger.info(`Pipeline executed successfully in ${totalTime.toFixed(2)}ms`);
    logger.info(`Transcription: "${result.transcription}"`);
    logger.info(`Response: "${result.response}"`);
    
    updateOverallStatus('success', 'Pipeline complete');
    updatePerformanceUI();
  } catch (error) {
    logger.error('Pipeline execution failed:', error);
    updateOverallStatus('error', 'Pipeline failed');
  }
}

// Test ASR component
async function testASR() {
  if (!state.components.asr.isInitialized) {
    logger.error('Cannot test ASR - not initialized');
    return;
  }
  
  logger.info('Testing ASR component');
  
  try {
    // For simplicity, we'll use a test audio array rather than recording
    // In a real app, we would record from the microphone
    const testAudioData = new Float32Array(16000).fill(0.01);
    
    const startTime = performance.now();
    const result = await state.core.asr.transcribe(testAudioData);
    const endTime = performance.now();
    
    logger.info(`Transcription complete in ${(endTime - startTime).toFixed(2)}ms`);
    logger.info(`Transcription result: "${result.text}"`);
    
    document.getElementById('transcription-output').value = result.text;
    
    // Store timing information
    state.performance.runTimes.asr = endTime - startTime;
    updatePerformanceUI();
  } catch (error) {
    logger.error('ASR test failed:', error);
    document.getElementById('transcription-output').value = `Error: ${error.message}`;
  }
}

// Test LLM component
async function testLLM() {
  if (!state.components.llm.isInitialized) {
    logger.error('Cannot test LLM - not initialized');
    return;
  }
  
  const prompt = document.getElementById('llm-input').value.trim();
  if (!prompt) {
    logger.warn('No input text provided for LLM');
    document.getElementById('llm-input').value = 'Hello, how are you today?';
    return;
  }
  
  logger.info(`Testing LLM component with prompt: "${prompt}"`);
  
  try {
    const startTime = performance.now();
    const result = await state.core.llm.generate(prompt);
    const endTime = performance.now();
    
    logger.info(`Text generation complete in ${(endTime - startTime).toFixed(2)}ms`);
    logger.info(`Generated text: "${result.text}"`);
    
    document.getElementById('llm-output').value = result.text;
    
    // Store timing information
    state.performance.runTimes.llm = endTime - startTime;
    updatePerformanceUI();
  } catch (error) {
    logger.error('LLM test failed:', error);
    document.getElementById('llm-output').value = `Error: ${error.message}`;
  }
}

// Test TTS component
async function testTTS() {
  if (!state.components.tts.isInitialized) {
    logger.error('Cannot test TTS - not initialized');
    return;
  }
  
  const text = document.getElementById('tts-input').value.trim();
  if (!text) {
    logger.warn('No input text provided for TTS');
    document.getElementById('tts-input').value = 'This is a test of the speech synthesis system.';
    return;
  }
  
  logger.info(`Testing TTS component with text: "${text}"`);
  
  try {
    const startTime = performance.now();
    const result = await state.core.tts.synthesize(text, { returnBlob: true });
    const endTime = performance.now();
    
    logger.info(`Speech synthesis complete in ${(endTime - startTime).toFixed(2)}ms`);
    logger.info(`Generated ${result.audio.length} audio samples`);
    
    // Store the generated audio for later playback
    state.lastGeneratedAudio = result.audio;
    document.getElementById('play-tts').disabled = false;
    
    // Store timing information
    state.performance.runTimes.tts = endTime - startTime;
    updatePerformanceUI();
  } catch (error) {
    logger.error('TTS test failed:', error);
    alert(`Error: ${error.message}`);
  }
}

// Play the last generated TTS audio
async function playTTSAudio() {
  if (!state.lastGeneratedAudio) {
    logger.error('No audio available to play');
    return;
  }
  
  logger.info('Playing generated audio');
  
  try {
    await state.core.tts.playAudio(state.lastGeneratedAudio);
    logger.info('Audio playback complete');
  } catch (error) {
    logger.error('Audio playback failed:', error);
  }
}

// Utility functions for UI updates

function updateStatusUI() {
  const componentStatusEl = document.getElementById('component-status');
  componentStatusEl.innerHTML = '';
  
  // Update component status
  Object.entries(state.components).forEach(([name, component]) => {
    let statusClass = 'status-loading';
    let statusText = 'Not initialized';
    
    if (component.isInitialized) {
      statusClass = 'status-success';
      statusText = 'Ready';
    } else if (component.isLoading) {
      statusClass = 'status-loading';
      statusText = 'Initializing...';
    } else if (component.error) {
      statusClass = 'status-error';
      statusText = 'Error';
    }
    
    componentStatusEl.innerHTML += `
      <div class="status-item ${statusClass}">
        <div class="status-name">${name.toUpperCase()}</div>
        <div class="status-value">${statusText}</div>
        ${component.error ? `<div class="status-error">${component.error}</div>` : ''}
      </div>
    `;
  });
  
  // Update model status
  const modelStatusEl = document.getElementById('model-status');
  modelStatusEl.innerHTML = '';
  
  ['asr', 'llm', 'tts'].forEach(name => {
    const isLoaded = state.components[name].isInitialized;
    const modelId = config[name].modelId;
    
    modelStatusEl.innerHTML += `
      <div class="status-item ${isLoaded ? 'status-success' : 'status-loading'}">
        <div class="status-name">${name.toUpperCase()} Model</div>
        <div class="status-value">${modelId}</div>
        <div>${isLoaded ? 'Loaded' : 'Not loaded'}</div>
      </div>
    `;
  });
}

function updateProgressUI(component, progress) {
  const progressBar = document.getElementById(`${component}-progress`);
  if (progressBar) {
    progressBar.style.width = `${progress}%`;
  }
}

function updateOverallStatus(status, message) {
  const statusEl = document.getElementById('overall-status');
  statusEl.className = `badge badge-${status}`;
  statusEl.textContent = message;
}

function updateLogUI(context, level, message) {
  const logContainer = document.getElementById('log-container');
  const timestamp = new Date().toISOString().substr(11, 8);
  
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry level-${level}`;
  logEntry.innerHTML = `
    <span class="log-timestamp">${timestamp}</span>
    <span class="log-context">${context}</span>
    <span class="log-level">${level.toUpperCase()}</span>
    <span class="log-message">${message}</span>
  `;
  
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

function updatePerformanceUI() {
  const container = document.getElementById('performance-metrics');
  
  if (!Object.keys(state.performance.initTimes).length && 
      !Object.keys(state.performance.runTimes).length) {
    container.innerHTML = '<p>No performance data available yet</p>';
    return;
  }
  
  let html = '';
  
  // Initialization times
  if (Object.keys(state.performance.initTimes).length) {
    html += '<h3>Initialization Times</h3>';
    html += '<table style="width:100%; margin-bottom:20px;">';
    html += '<tr><th>Component</th><th>Time (ms)</th></tr>';
    
    Object.entries(state.performance.initTimes).forEach(([component, time]) => {
      html += `<tr><td>${component === 'all' ? 'All Components' : component.toUpperCase()}</td><td>${time.toFixed(2)}</td></tr>`;
    });
    
    html += '</table>';
  }
  
  // Execution times
  if (Object.keys(state.performance.runTimes).length) {
    html += '<h3>Execution Times</h3>';
    html += '<table style="width:100%; margin-bottom:20px;">';
    html += '<tr><th>Component</th><th>Time (ms)</th><th>Percentage</th></tr>';
    
    const total = state.performance.runTimes.total || 0;
    
    Object.entries(state.performance.runTimes).forEach(([component, time]) => {
      if (component === 'total') return;
      const percentage = total > 0 ? (time / total * 100).toFixed(1) : 'N/A';
      html += `<tr><td>${component.toUpperCase()}</td><td>${time.toFixed(2)}</td><td>${percentage}%</td></tr>`;
    });
    
    if (total) {
      html += `<tr><td><strong>Total</strong></td><td><strong>${total.toFixed(2)}</strong></td><td>100%</td></tr>`;
    }
    
    html += '</table>';
    
    // Add visual timing bar
    if (total && state.performance.runTimes.asr && state.performance.runTimes.llm && state.performance.runTimes.tts) {
      html += '<h3>Pipeline Breakdown</h3>';
      html += '<div class="timing-bar">';
      
      const asrWidth = (state.performance.runTimes.asr / total * 100).toFixed(1);
      const llmWidth = (state.performance.runTimes.llm / total * 100).toFixed(1);
      const ttsWidth = (state.performance.runTimes.tts / total * 100).toFixed(1);
      
      html += `<div class="timing-segment" style="width:${asrWidth}%; background-color:#4361ee;">ASR ${asrWidth}%</div>`;
      html += `<div class="timing-segment" style="width:${llmWidth}%; background-color:#3a0ca3;">LLM ${llmWidth}%</div>`;
      html += `<div class="timing-segment" style="width:${ttsWidth}%; background-color:#7209b7;">TTS ${ttsWidth}%</div>`;
      
      html += '</div>';
    }
  }
  
  container.innerHTML = html;
}

function displayWebGPUInfo() {
  if (!navigator.gpu) {
    document.getElementById('webgpu-info').innerHTML = '<p>WebGPU is not available in this browser</p>';
    return;
  }
  
  navigator.gpu.requestAdapter().then(async adapter => {
    if (!adapter) {
      document.getElementById('webgpu-info').innerHTML = '<p>No WebGPU adapters found</p>';
      return;
    }
    
    const info = await adapter.requestAdapterInfo();
    const features = Array.from(adapter.features.keys()).join(', ');
    
    const device = await adapter.requestDevice();
    const limits = {};
    
    for (const [key, value] of Object.entries(device.limits)) {
      limits[key] = value;
    }
    
    let html = `
      <div style="margin-bottom: 20px;">
        <div><strong>Vendor:</strong> ${info.vendor}</div>
        <div><strong>Architecture:</strong> ${info.architecture}</div>
        <div><strong>Device:</strong> ${info.device}</div>
        <div><strong>Description:</strong> ${info.description}</div>
        <div><strong>Features:</strong> ${features}</div>
      </div>
      
      <div>
        <h4>Device Limits</h4>
        <table style="width:100%;">
          <tr><th>Limit</th><th>Value</th></tr>
    `;
    
    Object.entries(limits).forEach(([limit, value]) => {
      html += `<tr><td>${limit}</td><td>${value}</td></tr>`;
    });
    
    html += '</table></div>';
    
    document.getElementById('webgpu-info').innerHTML = html;
  }).catch(error => {
    logger.error('Failed to get WebGPU adapter info:', error);
    document.getElementById('webgpu-info').innerHTML = `<p>Error getting WebGPU info: ${error.message}</p>`;
  });
}

function clearLogs() {
  document.getElementById('log-container').innerHTML = '';
  logger.info('Logs cleared');
  updateLogUI('System', 'info', 'Logs cleared');
}

function resetSystem() {
  if (state.core) {
    state.core.cleanup().catch(error => {
      logger.error('Error during cleanup:', error);
    });
    state.core = null;
  }
  
  // Reset state
  Object.keys(state.components).forEach(component => {
    state.components[component].isInitialized = false;
    state.components[component].isLoading = false;
    state.components[component].error = null;
    state.components[component].model = null;
    state.components[component].progress = 0;
  });
  
  // Reset UI
  updateStatusUI();
  updateOverallStatus('loading', 'System reset');
  
  document.getElementById('run-complete-pipeline').disabled = true;
  document.getElementById('test-asr').disabled = true;
  document.getElementById('test-llm').disabled = true;
  document.getElementById('test-tts').disabled = true;
  document.getElementById('play-tts').disabled = true;
  
  document.getElementById('transcription-output').value = '';
  document.getElementById('llm-output').value = '';
  
  logger.info('System reset complete');
  updateLogUI('System', 'info', 'System reset complete');
}

function formatFeatureName(name) {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .replace(/WebGPU/, 'WebGPU')
    .replace(/SharedArrayBuffer/, 'SharedArrayBuffer')
    .replace(/CrossOriginIsolation/, 'Cross-Origin Isolation');
}

// Hook up logger to UI
const originalConsole = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
  debug: console.debug
};

function setupConsoleOverride() {
  // Override console methods to display in UI
  ['log', 'info', 'warn', 'error', 'debug'].forEach(method => {
    console[method] = (...args) => {
      // Call original console method
      originalConsole[method](...args);
      
      // Try to extract context and message
      let context = 'Console';
      let message = args.map(arg => {
        if (typeof arg === 'object') {
          return JSON.stringify(arg);
        }
        return arg;
      }).join(' ');
      
      // Check if this is from our logger
      if (typeof args[0] === 'string' && args[0].includes('[') && args[0].includes(']')) {
        const match = args[0].match(/\[(.*?)\]/);
        if (match) {
          context = match[1];
          message = args.slice(1).map(arg => {
            if (typeof arg === 'object') {
              return JSON.stringify(arg);
            }
            return arg;
          }).join(' ');
        }
      }
      
      // Update log UI
      updateLogUI(context, method, message);
    };
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  setupConsoleOverride();
  initializeUI();
  logger.info('Diagnostic app loaded and ready');
});