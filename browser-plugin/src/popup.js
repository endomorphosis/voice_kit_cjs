// popup.js - handles interaction with the extension's popup UI

// State management
const state = {
  worker: null,
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  elements: null
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

// Initialize DOM elements
function initElements() {
  state.elements = {
    micButton: document.getElementById('mic-button'),
    chatMessages: document.getElementById('chat-messages'),
    inputText: document.getElementById('input-text'),
    sendButton: document.getElementById('send-button'),
    statusDiv: document.getElementById('status')
  };

  // Validate all elements exist
  Object.entries(state.elements).forEach(([key, element]) => {
    if (!element) throw new Error(`Element ${key} not found`);
  });
}

// Add retry logic for message sending
async function sendMessageWithRetry(message, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response);
          }
        });
      });
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

// Initialize ASR worker with proper connection handling
async function initWorker() {
  if (state.worker) return;

  try {
    // Create a message channel for worker communication
    const { port1, port2 } = new MessageChannel();
    const workerUrl = chrome.runtime.getURL('asr-worker.js');
    
    // Create worker with type module
    state.worker = new Worker(workerUrl, { 
      type: 'module',
      credentials: 'same-origin'
    });

    // Set up worker message handling
    state.worker.onmessage = event => {
      const { type, text, error } = event.data;
      switch (type) {
        case 'ready':
          updateStatus('ASR ready');
          break;
        case 'result':
          if (text) {
            addMessage(text, 'user');
            generateResponse(text);
          }
          break;
        case 'error':
          showError(error);
          break;
      }
    };

    state.worker.onerror = error => {
      showError(`Worker error: ${error.message}`);
    };

    // Initialize worker with port transfer
    state.worker.postMessage({ action: 'initializeASR' }, [port2]);
    
    // Wait for ready message
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Worker initialization timeout'));
      }, 30000);

      const messageHandler = event => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout);
          state.worker.removeEventListener('message', messageHandler);
          resolve();
        }
      };

      state.worker.addEventListener('message', messageHandler);
    });

  } catch (error) {
    showError(`Worker initialization error: ${error.message}`);
    throw error;
  }
}

// Audio recording functions
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    state.mediaRecorder = new MediaRecorder(stream);
    state.audioChunks = [];

    state.mediaRecorder.ondataavailable = (event) => {
      state.audioChunks.push(event.data);
    };

    state.mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(state.audioChunks, { type: 'audio/wav' });
      const audioBuffer = await audioBlob.arrayBuffer();
      state.worker.postMessage({ 
        type: 'transcribe',
        audio: new Float32Array(await decodeAudioData(audioBuffer))
      });
    };

    state.mediaRecorder.start();
    state.isRecording = true;
    updateMicButton();
  } catch (error) {
    showError(`Microphone error: ${error.message}`);
  }
}

function stopRecording() {
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
    state.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    state.isRecording = false;
    updateMicButton();
  }
}

async function decodeAudioData(arrayBuffer) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
  const channelData = audioBuffer.getChannelData(0);
  return channelData;
}

// UI update functions
function updateMicButton() {
  if (!state.elements?.micButton) return;
  state.elements.micButton.classList.toggle('recording', state.isRecording);
}

function updateStatus(message) {
  if (!state.elements?.statusDiv) return;
  state.elements.statusDiv.textContent = message;
}

function showError(error) {
  updateStatus(`Error: ${error}`);
  console.error(error);
}

function addMessage(content, role = 'assistant') {
  if (!state.elements?.chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  messageDiv.textContent = content;
  state.elements.chatMessages.appendChild(messageDiv);
  state.elements.chatMessages.scrollTop = state.elements.chatMessages.scrollHeight;
}

// Text generation
async function generateResponse(text) {
  try {
    updateStatus('Generating response...');
    const response = await sendMessageWithRetry({
      action: 'generate',
      text
    });
    
    if (response.error) {
      throw new Error(response.error);
    }
    
    addMessage(response.text);
    updateStatus('Ready');
  } catch (error) {
    showError(`Generation error: ${error.message}`);
  }
}

// Event listeners
function setupEventListeners() {
  state.elements.micButton?.addEventListener('click', () => {
    if (state.isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  });

  state.elements.sendButton?.addEventListener('click', () => {
    const text = state.elements.inputText?.value.trim();
    if (text) {
      addMessage(text, 'user');
      generateResponse(text);
      state.elements.inputText.value = '';
    }
  });

  state.elements.inputText?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      state.elements.sendButton?.click();
    }
  });
}

// Initialization
window.addEventListener('DOMContentLoaded', async () => {
  try {
    // Initialize elements
    state.elements = {
      micButton: document.getElementById('mic-button'),
      chatMessages: document.getElementById('chat-messages'),
      inputText: document.getElementById('input-text'),
      sendButton: document.getElementById('send-button'),
      statusDiv: document.getElementById('status')
    };

    // Validate elements
    Object.entries(state.elements).forEach(([key, element]) => {
      if (!element) throw new Error(`Element ${key} not found`);
    });

    // Initialize worker
    await initWorker();

    // Set up event listeners
    setupEventListeners();
    updateStatus('Ready');
  } catch (error) {
    showError(`Initialization error: ${error.message}`);
  }
});

document.addEventListener('DOMContentLoaded', function() {
  // Ensure the document object is accessible
  const button = document.getElementById('myButton');
  if (button) {
    button.addEventListener('click', async () => {
      const { modelLoader } = await import('./local-model-loader.js');
      const model = await modelLoader.loadModel('Xenova/gpt2-small');
      console.log('Model loaded:', model);
    });
  }
});
