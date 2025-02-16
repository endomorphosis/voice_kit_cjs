// popup.js - handles interaction with the extension's popup UI

// Ensure WASM path is set correctly
const wasmPath = chrome.runtime.getURL('wasm/');

// Global state management
const state = {
  isConnected: false,
  reconnectAttempts: 0,
  mediaRecorder: null,
  audioChunks: [],
  worker: null,
  elements: null,
  recording: false
};
const MAX_RECONNECT_ATTEMPTS = 3;

// Utility functions
function addLogEntry(type, ...args) {
  if (!state.elements?.logMessages) return;
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  state.elements.logMessages.appendChild(entry);
  state.elements.logMessages.scrollTo(0, state.elements.logMessages.scrollHeight);
}

// Initialize UI only after DOM is fully loaded
function initializeUI() {
  return new Promise((resolve, reject) => {
    if (!document || !document.getElementById) {
      reject(new Error('Document not ready'));
      return;
    }
    state.elements = {
      chatInput: document.getElementById('chat-input'),
      sendButton: document.getElementById('send-button'),
      chatMessages: document.getElementById('chat-messages'),
      recordButton: document.getElementById('recordButton'),
      statusDiv: document.getElementById('status'),
      transcriptionDiv: document.getElementById('transcriptionDiv'),
      logMessages: document.getElementById('log-messages')
    };

    // Validate all elements exist
    const missingElements = Object.entries(state.elements).filter(([key, value]) => !value).map(([key]) => key);
    if (missingElements.length > 0) {
      reject(new Error(`Missing UI elements: ${JSON.stringify(missingElements)}`));
      return;
    }

    // Add event listeners
    state.elements.recordButton?.addEventListener('click', toggleRecording);
    state.elements.sendButton?.addEventListener('click', handleSendButton);
    resolve(true);
  });
}

// Single ASR initialization function
async function initASR() {
  if (state.worker) {
    console.log('ASR worker already initialized');
    return;
  }
  try {
    // Set the correct base URL for loading WASM files 
    const wasmBase = chrome.runtime.getURL('');
    const workerURL = chrome.runtime.getURL('asr-worker.js');
    state.worker = new Worker(workerURL, {
      type: 'module',
      name: 'asr-worker'
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanupWorker();
        reject(new Error('ASR worker initialization timed out'));
      }, 30000);
      state.worker.onmessage = event => {
        const {
          type,
          text,
          error,
          data
        } = event.data;
        switch (type) {
          case 'ready':
            console.log('ASR worker ready');
            clearTimeout(timeout);
            enableMicButton();
            resolve();
            break;
          case 'transcription':
            updateTranscription(text);
            break;
          case 'loading':
            updateStatus({
              status: 'loading',
              progress: data
            });
            break;
          case 'error':
            console.error('ASR error:', error);
            addLogEntry('error', 'ASR error: ' + error);
            break;
        }
      };
      state.worker.onerror = error => {
        console.error('ASR worker error:', error);
        addLogEntry('error', 'ASR worker error: ' + error.message);
        clearTimeout(timeout);
        cleanupWorker();
        reject(error);
      };

      // Send initialization message with WASM path
      state.worker.postMessage({
        type: 'init',
        wasmPath
      });
    });
  } catch (error) {
    console.error('Error initializing ASR:', error);
    addLogEntry('error', 'Failed to initialize speech recognition: ' + error.message);
    disableMicButton();
    throw error;
  }
}

// Function to check connection with background script
async function checkConnection() {
  try {
    await chrome.runtime.sendMessage({
      type: 'check_status'
    });
    state.isConnected = true;
    state.reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.warn('Connection error:', error);
    state.isConnected = false;
    if (state.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      state.reconnectAttempts++;
      console.log(`Retrying connection... Attempt ${state.reconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * state.reconnectAttempts));
      return checkConnection();
    } else {
      updateStatus({
        status: 'error',
        data: 'Could not connect to extension. Please try reloading.'
      });
      return false;
    }
  }
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Popup received message:', message);
  state.isConnected = true;
  updateStatus(message);
});
function updateStatus(message) {
  const statusEl = document.getElementById('status');
  const statusIndicator = document.getElementById('status-indicator');
  const progressEl = document.getElementById('loading-progress');
  if (!statusEl || !statusIndicator) return;
  statusIndicator.className = message.status;
  if (message.status === 'loading') {
    statusEl.textContent = 'Loading model...';
    if (message.progress) {
      progressEl.textContent = `${message.progress.toFixed(1)}%`;
    }
  } else if (message.status === 'error') {
    statusEl.textContent = `Error: ${message.data}`;
    statusIndicator.className = 'error';
    progressEl.textContent = '';
  } else if (message.status === 'ready') {
    statusEl.textContent = 'Model ready';
    statusIndicator.className = 'ready';
    progressEl.textContent = '';
  }
}

// Enhanced initialization
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup opened');
  try {
    await initializeUI();
    await Promise.all([initASR(), checkConnection()]);
    console.log('Initialization complete');

    // Check model status
    chrome.runtime.sendMessage({
      type: 'check_status'
    }, response => {
      if (chrome.runtime.lastError) {
        console.error('Error checking status:', chrome.runtime.lastError);
        return;
      }
      if (response?.status === 'ready') {
        state.elements.statusDiv.textContent = 'Ready';
      } else {
        state.elements.statusDiv.textContent = 'Initializing...';
      }
    });
  } catch (error) {
    console.error('Initialization failed:', error);
    addLogEntry('error', 'Failed to initialize: ' + error.message);
  }
});

// Clean up console logging override
const originalConsole = {
  log: console.log,
  error: console.error,
  info: console.info
};
console.log = (...args) => addLogEntry('info', ...args);
console.error = (...args) => addLogEntry('error', ...args);
console.info = (...args) => addLogEntry('info', ...args);

// Chat functionality
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  messageDiv.textContent = content;
  state.elements.chatMessages.appendChild(messageDiv);
  state.elements.chatMessages.scrollTo(0, state.elements.chatMessages.scrollHeight);
}
async function sendMessage() {
  const text = state.elements.chatInput.value.trim();
  if (!text) return;

  // Check connection first
  if (!state.isConnected && !(await checkConnection())) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant error-message';
    errorDiv.textContent = 'Not connected to extension. Please reload the popup.';
    state.elements.chatMessages.appendChild(errorDiv);
    return;
  }

  // Show loading state
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.textContent = text;
  state.elements.chatMessages.appendChild(messageDiv);

  // Clear input and add loading indicator
  state.elements.chatInput.value = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message assistant';
  loadingDiv.innerHTML = '<span class="loading-spinner"></span> Generating response...';
  state.elements.chatMessages.appendChild(loadingDiv);
  state.elements.chatMessages.scrollTo(0, state.elements.chatMessages.scrollHeight);
  try {
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'generate',
        text: text
      }, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });

    // Remove loading indicator
    loadingDiv.remove();
    if (response?.error) {
      const errorDiv = document.createElement('div');
      errorDiv.className = `message assistant error-message ${response.error.includes('memory') ? 'recoverable' : ''}`;

      // Format error message for users
      let errorMessage = response.error;
      if (response.error.includes('1879778072') || response.error.includes('memory')) {
        errorMessage = 'The message was too long to process. Try sending a shorter message or breaking it into smaller parts.';
      }
      errorDiv.textContent = errorMessage;
      state.elements.chatMessages.appendChild(errorDiv);

      // Add memory usage warning if relevant
      if (response.error.includes('memory')) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'memory-warning';
        warningDiv.textContent = 'Tip: Keep messages under 2000 characters for best performance.';
        state.elements.chatMessages.appendChild(warningDiv);
      }
    } else {
      const responseDiv = document.createElement('div');
      responseDiv.className = 'message assistant';
      responseDiv.textContent = response;
      state.elements.chatMessages.appendChild(responseDiv);
    }
  } catch (error) {
    // Remove loading indicator
    loadingDiv.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant error-message';
    errorDiv.textContent = 'Error: ' + (error.message || 'Could not connect to extension. Please try reloading.');
    state.elements.chatMessages.appendChild(errorDiv);
    console.error('Error sending message:', error);

    // Try to reconnect
    checkConnection();
  }
  state.elements.chatMessages.scrollTo(0, state.elements.chatMessages.scrollHeight);
}

// Speech recognition setup
let mediaRecorder = null;
let recordedChunks = (/* unused pure expression or super */ null && ([]));

// Function to toggle recording state
async function toggleRecording() {
  try {
    if (!state.mediaRecorder) {
      // Request microphone access directly without permissions API
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000
        }
      });
      state.mediaRecorder = new MediaRecorder(stream);
      state.mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          state.audioChunks.push(event.data);
        }
      };
      state.mediaRecorder.onstop = async () => {
        try {
          const audioBlob = new Blob(state.audioChunks, {
            type: 'audio/webm'
          });
          const audioBuffer = await audioBlob.arrayBuffer();
          const audioData = new Float32Array(audioBuffer);
          chrome.runtime.sendMessage({
            type: 'transcribe',
            audio: Array.from(audioData)
          });
          state.audioChunks = [];
        } catch (error) {
          console.error('Error processing audio:', error);
          state.elements.statusDiv.textContent = `Error processing audio: ${error.message}`;
        }
      };
      state.mediaRecorder.start();
      state.elements.recordButton.querySelector('span').textContent = 'Stop';
      state.elements.statusDiv.textContent = 'Recording...';
    } else {
      state.mediaRecorder.stop();
      state.mediaRecorder = null;
      state.elements.recordButton.querySelector('span').textContent = 'Record';
      state.elements.statusDiv.textContent = 'Processing...';
    }
  } catch (error) {
    console.error('Recording error:', error);
    state.elements.statusDiv.textContent = `Error: ${error.message}`;
  }
}
function cleanupWorker() {
  if (state.worker) {
    state.worker.terminate();
    state.worker = null;
  }
}
function enableMicButton() {
  const micButton = document.getElementById('mic-button');
  if (micButton) micButton.disabled = false;
}
function disableMicButton() {
  const micButton = document.getElementById('mic-button');
  if (micButton) micButton.disabled = true;
}
function updateChatInput(text) {
  const chatInput = document.getElementById('chat-input');
  if (chatInput) {
    chatInput.value = (chatInput.value + ' ' + text).trim();
  }
}
function updateTranscription(text) {
  if (state.elements.chatInput) {
    state.elements.chatInput.value = (state.elements.chatInput.value + ' ' + text).trim();
  }
  if (state.elements.transcriptionDiv) {
    state.elements.transcriptionDiv.textContent = text;
  }
}
function handleSendButton() {
  const input = state.elements.chatInput;
  if (!input || !input.value.trim()) return;
  const message = input.value.trim();
  chrome.runtime.sendMessage({
    type: 'send_message',
    message
  });
  input.value = '';
}

// Clean up resources when window closes
window.addEventListener('unload', cleanupWorker);

// Download and cache the Copilot avatar
async function cacheIcon() {
  try {
    const response = await fetch('https://avatars.githubusercontent.com/u/123265934');
    const blob = await response.blob();
    const iconUrl = URL.createObjectURL(blob);
    const links = document.querySelectorAll('link[rel*="icon"]');
    links.forEach(link => {
      link.href = iconUrl;
    });
  } catch (error) {
    console.error('Failed to cache icon:', error);
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'transcription') {
    state.elements.transcriptionDiv.textContent = message.text;
    state.elements.chatInput.value = message.text;
  } else if (message.type === 'error') {
    state.elements.statusDiv.textContent = `Error: ${message.error}`;
  }
});

//# sourceMappingURL=popup.js.map