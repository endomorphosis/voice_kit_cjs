// popup.js - handles interaction with the extension's popup UI

// Global state management
const state = {
  isConnected: false,
  reconnectAttempts: 0,
  mediaRecorder: null,
  audioChunks: [],
  worker: null,
  elements: null,
  recording: false,
  wasmPath: chrome.runtime.getURL('wasm/'),
  audioContext: null,
  audioWorklet: null
};

// String handling utilities
const safeString = input => {
  if (input === null || input === undefined) return '';
  return String(input);
};

// Safe DOM access after ensuring document is ready
const documentReady = () => new Promise(resolve => {
  if (!document || document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', () => resolve(document));
  } else {
    resolve(document);
  }
});

// Initialize UI only after document is ready
async function initializeUI() {
  const doc = await documentReady();
  
  try {
    state.elements = {
      chatInput: doc.getElementById('chat-input'),
      sendButton: doc.getElementById('send-button'),
      chatMessages: doc.getElementById('chat-messages'),
      recordButton: doc.getElementById('recordButton'),
      statusDiv: doc.getElementById('status'),
      transcriptionDiv: doc.getElementById('transcriptionDiv'),
      logMessages: doc.getElementById('log-messages')
    };

    // Validate all elements exist
    const missingElements = Object.entries(state.elements)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missingElements.length > 0) {
      throw new Error(`Missing UI elements: ${JSON.stringify(missingElements)}`);
    }

    // Add event listeners with error handling
    state.elements.recordButton?.addEventListener('click', handleRecordClick);
    state.elements.sendButton?.addEventListener('click', handleSendClick);
    state.elements.chatInput?.addEventListener('input', handleInputChange);
    
    return true;
  } catch (error) {
    console.error('UI initialization failed:', error);
    return false;
  }
}

// Event handlers with proper error handling
function handleRecordClick() {
  if (!state.elements?.recordButton) return;
  toggleRecording().catch(error => {
    console.error('Recording error:', error);
    updateStatus(`Error: ${safeString(error.message)}`);
  });
}

function handleSendClick() {
  if (!state.elements?.chatInput) return;
  const text = state.elements.chatInput.value.trim();
  if (!text) return;
  
  sendMessage(text).catch(error => {
    console.error('Send error:', error);
    addMessage(`Error: ${safeString(error.message)}`, false);
  });
}

function handleInputChange() {
  if (!state.elements?.sendButton || !state.elements?.chatInput) return;
  state.elements.sendButton.disabled = !state.elements.chatInput.value.trim();
}

// Console logging with safe string handling
function addLogEntry(type, ...args) {
  if (!state.elements?.logMessages) return;
  
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  
  const safeArgs = args.map(arg => {
    if (arg === null) return 'null';
    if (arg === undefined) return 'undefined';
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Object]';
      }
    }
    return safeString(arg);
  });
  
  entry.textContent = safeArgs.join(' ');
  state.elements.logMessages.appendChild(entry);
  state.elements.logMessages.scrollTo(0, state.elements.logMessages.scrollHeight);
}

// Initialize after DOM is ready
documentReady().then(() => {
  console.log('Initializing popup...');
  initializeUI()
    .then(() => Promise.all([
      initASR(),
      checkConnection()
    ]))
    .then(() => {
      console.log('Initialization complete');
      checkModelStatus();
    })
    .catch(error => {
      console.error('Initialization failed:', error);
      addLogEntry('error', 'Failed to initialize:', error.message);
    });
});

// Clean up
window.addEventListener('unload', cleanup);

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== 'object') return;

  const { type, text, error } = message;
  
  switch (type) {
    case 'transcription':
      if (text) updateTranscription(text);
      break;
    case 'error':
      updateStatus(`Error: ${safeString(error)}`);
      break;
  }
});

// Override console methods for logging
const originalConsole = {
  log: console.log,
  error: console.error,
  info: console.info
};

console.log = (...args) => {
  addLogEntry('info', ...args);
  originalConsole.log(...args);
};

console.error = (...args) => {
  addLogEntry('error', ...args);
  originalConsole.error(...args);
};

console.info = (...args) => {
  addLogEntry('info', ...args);
  originalConsole.info(...args);
};

// UI update functions
function updateStatus(message) {
  if (!state.elements?.statusDiv) return;
  state.elements.statusDiv.textContent = safeString(message);
}

function updateTranscription(text) {
  if (!state.elements?.transcriptionDiv || !state.elements?.chatInput) return;
  const safeText = safeString(text);
  state.elements.transcriptionDiv.textContent = safeText;
  const currentInput = state.elements.chatInput.value;
  state.elements.chatInput.value = currentInput ? `${currentInput.trim()} ${safeText}` : safeText;
}

function addMessage(content, isUser = false) {
  if (!state.elements?.chatMessages || !content) return;
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  messageDiv.textContent = safeString(content);
  state.elements.chatMessages.appendChild(messageDiv);
  state.elements.chatMessages.scrollTo(0, state.elements.chatMessages.scrollHeight);
}

// ASR functionality with proper initialization
async function initASR() {
  if (state.worker) {
    console.log('ASR worker already initialized');
    return;
  }

  try {
    const workerURL = chrome.runtime.getURL('asr-worker.js');
    
    // Create worker with module support
    state.worker = new Worker(workerURL, {
      type: 'module',
      name: 'asr-worker'
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanupWorker();
        reject(new Error('ASR worker initialization timed out'));
      }, 30000);

      state.worker.onmessage = (event) => {
        const { type, text, error } = event.data;
        switch (type) {
          case 'ready':
            clearTimeout(timeout);
            enableMicButton();
            resolve();
            break;
          case 'transcription':
            if (text) updateTranscription(text);
            break;
          case 'error':
            console.error('ASR error:', error);
            addLogEntry('error', 'ASR error: ' + safeString(error));
            updateStatus('ASR error: ' + safeString(error));
            break;
        }
      };

      state.worker.onerror = (error) => {
        console.error('ASR worker error:', error);
        addLogEntry('error', 'ASR worker error: ' + safeString(error.message));
        clearTimeout(timeout);
        cleanupWorker();
        reject(error);
      };

      // Initialize worker with proper paths
      state.worker.postMessage({
        type: 'init',
        wasmPath: state.wasmPath,
        modelPath: chrome.runtime.getURL('models/')
      });
    });

  } catch (error) {
    console.error('Error initializing ASR:', error);
    addLogEntry('error', 'Failed to initialize speech recognition: ' + safeString(error.message));
    disableMicButton();
    throw error;
  }
}

// Audio recording functionality with proper error handling
async function toggleRecording() {
  try {
    if (!state.mediaRecorder) {
      // Request microphone access with proper error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          autoGainControl: false,
          noiseSuppression: false,
          echoCancellation: false
        }
      }).catch(error => {
        if (error.name === 'NotAllowedError') {
          throw new Error('Microphone access denied. Please allow microphone access in your browser settings.');
        }
        throw error;
      });

      // Initialize audio context if needed
      if (!state.audioContext) {
        state.audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 16000
        });
      }

      // Create media recorder with proper MIME type checking
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      state.mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        audioBitsPerSecond: 16000
      });
      
      state.audioChunks = [];
      
      state.mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          state.audioChunks.push(event.data);
        }
      };

      state.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(state.audioChunks, { type: mimeType });
          
          // Convert blob to Float32Array properly
          const arrayBuffer = await audioBlob.arrayBuffer();
          const audioBuffer = await state.audioContext.decodeAudioData(arrayBuffer);
          const channelData = audioBuffer.getChannelData(0);
          
          // Ensure valid audio data
          if (!channelData || channelData.length === 0) {
            throw new Error('No audio data recorded');
          }

          // Validate audio data
          if (channelData.some(x => !isFinite(x))) {
            throw new Error('Invalid audio data detected');
          }
          
          state.worker?.postMessage({
            type: 'transcribe',
            audio: channelData
          });
          
          state.audioChunks = [];
        } catch (error) {
          console.error('Error processing audio:', error);
          updateStatus(`Error processing audio: ${safeString(error.message)}`);
        }
      };

      state.mediaRecorder.start(100); // Collect data every 100ms
      state.elements.recordButton.querySelector('span').textContent = 'Stop';
      updateStatus('Recording...');
      
      // Update UI
      state.elements.recordButton.classList.add('recording');
    } else {
      state.mediaRecorder.stop();
      const tracks = state.mediaRecorder.stream.getTracks();
      tracks.forEach(track => track.stop());
      state.mediaRecorder = null;
      
      // Update UI
      state.elements.recordButton.querySelector('span').textContent = 'Record';
      state.elements.recordButton.classList.remove('recording');
      updateStatus('Processing...');
    }
  } catch (error) {
    console.error('Recording error:', error);
    const errorMessage = error.name === 'NotAllowedError' 
      ? 'Microphone access denied. Please allow microphone access.'
      : `Recording error: ${error.message}`;
    updateStatus(errorMessage);
    throw error;
  }
}

// Utility functions
function cleanupWorker() {
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
}

function enableMicButton() {
  if (!state.elements?.recordButton) return;
  state.elements.recordButton.disabled = false;
}

function disableMicButton() {
  if (!state.elements?.recordButton) return;
  state.elements.recordButton.disabled = true;
}

async function checkConnection() {
  try {
    await chrome.runtime.sendMessage({ type: 'check_status' });
    state.isConnected = true;
    state.reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.warn('Connection error:', error);
    state.isConnected = false;
    updateStatus('Connection lost. Trying to reconnect...');
    return false;
  }
}

function cleanup() {
  cleanupWorker();
  if (state.mediaRecorder?.state === 'recording') {
    state.mediaRecorder.stop();
  }
}
