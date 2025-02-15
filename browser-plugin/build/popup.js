// popup.js - handles interaction with the extension's popup UI


// Initialize required globals as soon as module loads
// Remove importScripts usage since it's not available in main context
globalThis.__TRANSFORMER_WORKER_WASM_PATH__ = chrome.runtime.getURL('wasm/');
globalThis.wasmEvalSupported = true;

// Keep track of connection status
let isConnected = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

// UI element references
let chatInput, sendButton, chatMessages, micButton, logMessages;

// Initialize all UI references and handlers
function initializeUI() {
  chatInput = document.getElementById('chat-input');
  sendButton = document.getElementById('send-button');
  chatMessages = document.getElementById('chat-messages');
  micButton = document.getElementById('mic-button');
  logMessages = document.getElementById('log-messages');
  if (sendButton) {
    sendButton.disabled = false;
    sendButton.addEventListener('click', sendMessage);
  }
  if (chatInput) {
    chatInput.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }
  if (micButton) {
    micButton.disabled = true; // Initially disable mic button
    micButton.addEventListener('click', () => {
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
      } else {
        stopRecording();
      }
    });
  }
}

// Function to check connection with background script
async function checkConnection() {
  try {
    await chrome.runtime.sendMessage({
      type: 'check_status'
    });
    isConnected = true;
    reconnectAttempts = 0;
    return true;
  } catch (error) {
    console.warn('Connection error:', error);
    isConnected = false;
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Retrying connection... Attempt ${reconnectAttempts}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * reconnectAttempts));
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
  isConnected = true;
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
  initializeUI();

  // Initial connection check
  if (await checkConnection()) {
    console.log('Connected to extension');
  }

  // Set up periodic connection checks
  setInterval(checkConnection, 5000);
  try {
    await Promise.all([initASR(), cacheIcon()]);
    console.log('Initialization complete');
  } catch (error) {
    console.error('Initialization failed:', error);
    addLogEntry('error', 'Failed to initialize: ' + error.message);
  }
});

// Console logging override
const originalConsole = {
  log: console.log,
  error: console.error,
  info: console.info
};
function addLogEntry(type, ...args) {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  logMessages?.appendChild(entry);
  logMessages?.scrollTo(0, logMessages.scrollHeight);
  return originalConsole[type](...args);
}
console.log = (...args) => addLogEntry('info', ...args);
console.error = (...args) => addLogEntry('error', ...args);
console.info = (...args) => addLogEntry('info', ...args);

// Chat functionality
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  messageDiv.textContent = content;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTo(0, chatMessages.scrollHeight);
}
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Check connection first
  if (!isConnected && !(await checkConnection())) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant error-message';
    errorDiv.textContent = 'Not connected to extension. Please reload the popup.';
    chatMessages.appendChild(errorDiv);
    return;
  }

  // Show loading state
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user';
  messageDiv.textContent = text;
  chatMessages.appendChild(messageDiv);

  // Clear input and add loading indicator
  chatInput.value = '';
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'message assistant';
  loadingDiv.innerHTML = '<span class="loading-spinner"></span> Generating response...';
  chatMessages.appendChild(loadingDiv);
  chatMessages.scrollTo(0, chatMessages.scrollHeight);
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
      chatMessages.appendChild(errorDiv);

      // Add memory usage warning if relevant
      if (response.error.includes('memory')) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'memory-warning';
        warningDiv.textContent = 'Tip: Keep messages under 2000 characters for best performance.';
        chatMessages.appendChild(warningDiv);
      }
    } else {
      const responseDiv = document.createElement('div');
      responseDiv.className = 'message assistant';
      responseDiv.textContent = response;
      chatMessages.appendChild(responseDiv);
    }
  } catch (error) {
    // Remove loading indicator
    loadingDiv.remove();
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message assistant error-message';
    errorDiv.textContent = 'Error: ' + (error.message || 'Could not connect to extension. Please try reloading.');
    chatMessages.appendChild(errorDiv);
    console.error('Error sending message:', error);

    // Try to reconnect
    checkConnection();
  }
  chatMessages.scrollTo(0, chatMessages.scrollHeight);
}

// Speech recognition setup
let worker = null;
let mediaRecorder = null;
let recordedChunks = [];

// Initialize ASR when needed
async function initASR() {
  if (worker) return; // Don't initialize if already running

  try {
    // Set the correct base URL for loading WASM files 
    const wasmBase = chrome.runtime.getURL('');
    const wasmPath = chrome.runtime.getURL('wasm/');
    worker = new Worker(new URL('asr-worker.js', wasmBase), {
      type: 'module',
      name: 'asr-worker'
    });

    // Send WASM path to worker
    worker.postMessage({
      type: 'init',
      wasmPath
    });
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanupWorker();
        reject(new Error('ASR worker initialization timed out'));
      }, 30000);
      worker.onmessage = event => {
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
            updateChatInput(text);
            break;
          case 'loading':
            console.log('ASR loading progress:', data);
            break;
          case 'error':
            console.error('ASR error:', error);
            addLogEntry('error', 'ASR error: ' + error);
            break;
        }
      };
      worker.onerror = error => {
        console.error('ASR worker error:', error);
        addLogEntry('error', 'ASR worker error: ' + error.message);
        clearTimeout(timeout);
        cleanupWorker();
        reject(error);
      };
    });
  } catch (error) {
    console.error('Error initializing ASR:', error);
    addLogEntry('error', 'Failed to initialize speech recognition: ' + error.message);
    disableMicButton();
    throw error;
  }
}
function cleanupWorker() {
  if (worker) {
    worker.terminate();
    worker = null;
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
async function requestMicrophonePermissions() {
  try {
    // Request audioCapture permission using Chrome extension API
    const granted = await chrome.permissions.request({
      permissions: ['audioCapture']
    });
    if (granted) {
      // After permission is granted, test the microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
      stream.getTracks().forEach(track => track.stop()); // Clean up test stream
      return true;
    } else {
      addLogEntry('error', 'Microphone access was denied');
      const instructions = document.createElement('div');
      instructions.className = 'log-entry info';
      instructions.innerHTML = `
                To enable microphone access:
                <ol>
                    <li>Click the extension icon</li>
                    <li>Click "Manage" (3-dot menu)</li>
                    <li>Click "Extension options"</li>
                    <li>Enable microphone access</li>
                    <li>Refresh this page</li>
                </ol>
            `;
      logMessages.appendChild(instructions);
      return false;
    }
  } catch (error) {
    console.error('Error checking permissions:', error);
    addLogEntry('error', 'Failed to request microphone access: ' + error.message);
    return false;
  }
}
async function startRecording() {
  try {
    // Check permissions first
    const hasPermission = await requestMicrophonePermissions();
    if (!hasPermission) {
      micButton.classList.remove('recording');
      return;
    }
    console.log('Requesting microphone access...');
    const constraints = {
      audio: {
        channelCount: 1,
        sampleRate: 16000
      }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('Microphone access granted:', stream.getAudioTracks()[0].getSettings());
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });
    console.log('MediaRecorder created with settings:', mediaRecorder.mimeType);
    mediaRecorder.ondataavailable = event => {
      if (event.data.size > 0) {
        recordedChunks.push(event.data);
        console.log('Recorded chunk size:', event.data.size);
      }
    };
    mediaRecorder.onerror = event => {
      console.error('MediaRecorder error:', event.error);
    };
    mediaRecorder.onstop = async () => {
      try {
        console.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(recordedChunks, {
          type: 'audio/webm'
        });
        console.log('Audio blob created, size:', audioBlob.size);
        recordedChunks = [];

        // Convert audio to proper format for Whisper
        const audioContext = new AudioContext({
          sampleRate: 16000
        });
        const audioData = await audioBlob.arrayBuffer();
        console.log('Audio data size:', audioData.byteLength);
        const audioBuffer = await audioContext.decodeAudioData(audioData);
        console.log('Audio decoded, duration:', audioBuffer.duration);

        // Get audio data as Float32Array
        const audio = audioBuffer.getChannelData(0);
        console.log('Audio converted to Float32Array, length:', audio.length);

        // Send to worker for transcription
        if (worker) {
          worker.postMessage({
            buffer: audio
          });
          console.log('Audio sent to ASR worker');
        } else {
          console.error('ASR worker not initialized');
        }

        // Clean up
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('Audio track stopped:', track.label);
        });
        micButton.classList.remove('recording');
      } catch (error) {
        console.error('Error processing recorded audio:', error);
        if (error.name === 'InvalidStateError') {
          console.error('Audio context error - possible sample rate or format issue');
        }
        addLogEntry('error', 'Error processing audio:', error.message);
      }
    };
    mediaRecorder.start(1000); // Collect data in 1-second chunks
    console.log('Recording started');
    micButton.classList.add('recording');
  } catch (error) {
    console.error('Error starting recording:', {
      name: error.name,
      message: error.message,
      constraint: error.constraint,
      stack: error.stack
    });
    let errorMessage = 'Could not start recording: ';
    if (error.name === 'NotAllowedError') {
      // Don't show this message since we handle it in requestMicrophonePermissions
      return;
    } else if (error.name === 'NotFoundError') {
      errorMessage += 'No microphone was found';
    } else if (error.name === 'NotReadableError') {
      errorMessage += 'Microphone is already in use by another application';
    } else {
      errorMessage += error.message || 'Unknown error';
    }
    addLogEntry('error', errorMessage);
    micButton.classList.remove('recording');
  }
}
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

// Initialize ASR when popup is loaded
document.addEventListener('DOMContentLoaded', () => {
  initASR();
});

//# sourceMappingURL=popup.js.map