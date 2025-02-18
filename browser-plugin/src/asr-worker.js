// ESM imports for worker
import { pipeline, env } from '@xenova/transformers';

// Configure environment with proper paths
env.useBrowserCache = false;
env.useCustomCache = true;
env.localModelPath = chrome.runtime.getURL('models');
env.backends = ['wasm'];  // Ensure WASM backend for worker context
env.wasmRoot = chrome.runtime.getURL('wasm/');

let recognizer = null;
let port = null;

// Safe message sending with connection check
function sendMessage(message) {
  try {
    if (port) {
      port.postMessage(message);
    } else {
      self.postMessage(message);
    }
  } catch (error) {
    console.error('Failed to send message:', error);
  }
}

// Initialize ASR pipeline
async function initializeASR() {
  if (recognizer) return;

  try {
    recognizer = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small', {
      quantized: true,
      chunk_length_s: 30,
      stride_length_s: 5,
      revision: 'main'
    });
    sendMessage({ type: 'ready' });
  } catch (error) {
    sendMessage({ type: 'error', error: String(error) });
    throw error;
  }
}

// Handle audio transcription
async function handleTranscription(audio) {
  if (!recognizer) {
    await initializeASR();
  }

  try {
    const result = await recognizer(audio);
    return result.text;
  } catch (error) {
    throw new Error(`Transcription failed: ${error.message}`);
  }
}

// Message handler
self.addEventListener('message', async (event) => {
  const { data } = event;

  try {
    // Handle port transfer for stable communication
    if (data.action === 'initializeASR') {
      if (event.ports && event.ports[0]) {
        port = event.ports[0];
        port.onmessage = async (e) => await handleMessage(e.data);
      }
      await initializeASR();
      return;
    }

    await handleMessage(data);
  } catch (error) {
    sendMessage({ type: 'error', error: String(error) });
  }
});

// Message handling logic
async function handleMessage(data) {
  try {
    if (!data || !data.type) {
      throw new Error('Invalid message format');
    }

    switch (data.type) {
      case 'transcribe':
        if (!data.audio) {
          throw new Error('No audio data provided');
        }
        const text = await handleTranscription(data.audio);
        sendMessage({ type: 'result', text });
        break;

      default:
        throw new Error(`Unknown message type: ${data.type}`);
    }
  } catch (error) {
    sendMessage({ type: 'error', error: String(error) });
  }
}

// Initialize immediately
initializeASR().catch(error => {
  sendMessage({ type: 'error', error: String(error) });
});