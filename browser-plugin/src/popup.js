// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTION_NAME } from "./constants.js";

// Import only what we need
const outputElement = document.getElementById("output");

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Popup received message:', message);
    if (message.status) {
        updateStatus(message);
    } else if (message.type === 'token') {
        // Handle streaming token updates
        const currentMessage = document.querySelector('.message.assistant:last-child');
        if (currentMessage) {
            currentMessage.textContent += message.token;
        } else {
            addMessage(message.token, false);
        }
    } else if (message.type === 'complete') {
        // Generation is complete - ensure final text is correct
        const currentMessage = document.querySelector('.message.assistant:last-child');
        if (currentMessage) {
            currentMessage.textContent = message.fullText;
        }
    }
});

function updateStatus(message) {
    const statusEl = document.getElementById('status');
    const statusIndicator = document.getElementById('status-indicator');
    const progressEl = document.getElementById('loading-progress');
    const progressFill = document.getElementById('progress-fill');
    const statusDetails = document.getElementById('status-details');
    
    if (!statusEl || !statusIndicator) return;

    statusIndicator.className = message.status;
    
    if (message.status === 'loading') {
        statusEl.textContent = 'Loading model...';
        if (message.data?.progress !== undefined) {
            const progress = message.data.progress;
            progressFill.style.width = `${progress}%`;
            progressEl.textContent = `${progress.toFixed(1)}%`;
            
            // Add detailed status information
            if (message.data.file) {
                statusDetails.textContent = `Downloading: ${message.data.file}`;
            } else if (message.data.status) {
                statusDetails.textContent = message.data.status;
            }
        }
        if (message.data?.status) {
            statusDetails.textContent = message.data.status;
        }
    } else if (message.status === 'error') {
        statusEl.textContent = 'Error loading model';
        statusIndicator.className = 'error';
        progressFill.classList.add('error');
        progressEl.textContent = '';
        statusDetails.textContent = message.data || 'Unknown error occurred';
    } else if (message.status === 'ready') {
        statusEl.textContent = 'Model ready';
        statusIndicator.className = 'ready';
        progressFill.style.width = '100%';
        progressEl.textContent = '100%';
        statusDetails.textContent = 'Model loaded and ready to use';
    } else if (message.status === 'uninitialized') {
        statusEl.textContent = 'Initializing...';
        progressFill.style.width = '0%';
        progressEl.textContent = '';
        statusDetails.textContent = 'Preparing to load model...';
    }
}

// Check initial status when popup opens
document.addEventListener('DOMContentLoaded', () => {
    console.log('Popup opened');
    chrome.runtime.sendMessage({ type: 'check_status' });
});

// Console logging override
const logMessages = document.getElementById('log-messages');
const originalConsole = {
    log: console.log,
    error: console.error,
    info: console.info
};

function addLogEntry(type, ...args) {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.textContent = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    logMessages?.appendChild(entry);
    logMessages?.scrollTo(0, logMessages.scrollHeight);
    return originalConsole[type](...args);
}

console.log = (...args) => addLogEntry('info', ...args);
console.error = (...args) => addLogEntry('error', ...args);
console.info = (...args) => addLogEntry('info', ...args);

// Chat functionality
const chatInput = document.getElementById('chat-input');
const sendButton = document.getElementById('send-button');
const chatMessages = document.getElementById('chat-messages');

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

    addMessage(text, true);
    chatInput.value = '';
    
    // Create empty assistant message for streaming
    addMessage('', false);
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'generate',
            text: text
        });
        
        if (response.error) {
            console.error(response.error);
            addMessage('Error: ' + response.error);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('Error: ' + error.message);
    }
}

sendButton.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Speech recognition setup
const micButton = document.getElementById('mic-button');
let mediaRecorder = null;
let recordedChunks = [];
let asrWorker = null;

// Enable mic button but show it's waiting for permissions
micButton.disabled = false;
micButton.title = "Click to enable speech recognition";

async function checkMicrophonePermission() {
    try {
        // Send message to background script to handle permission check
        const response = await chrome.runtime.sendMessage({ type: 'request_microphone' });
        if (response.success) {
            micButton.title = "Start recording";
            return true;
        }
        
        addLogEntry('error', 'Microphone access denied: ' + (response?.error || 'Permission not granted'));
        return false;
    } catch (error) {
        console.error('Error checking microphone permission:', error);
        addLogEntry('error', 'Error checking microphone permission: ' + error.message);
        return false;
    }
}

async function requestMicrophonePermissions() {
    try {
        const hasPermission = await checkMicrophonePermission();
        if (!hasPermission) {
            const instructions = document.createElement('div');
            instructions.className = 'log-entry info';
            instructions.innerHTML = `
                To enable microphone access:
                <ol>
                    <li>Click "Allow" when prompted for microphone access</li>
                    <li>Make sure microphone permissions are enabled in site settings</li>
                    <li>Refresh this page after enabling permissions</li>
                </ol>
            `;
            logMessages.appendChild(instructions);
            return false;
        }
        return true;
    } catch (error) {
        console.error('Error requesting microphone permissions:', error);
        addLogEntry('error', 'Error requesting permissions: ' + error.message);
        return false;
    }
}

// Rest of ASR functionality temporarily disabled
/*
async function initASR() {
// ...existing code... 
}
*/

// Disable mic button initially
micButton.disabled = true;

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

// Initialize when popup loads
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await Promise.all([
            // initASR(), // Temporarily disabled
            cacheIcon()
        ]);
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization failed:', error);
        addLogEntry('error', 'Failed to initialize: ' + error.message);
    }
});

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
        
        // Request microphone access through content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tabs[0].id },
                function: async (constraints) => {
                    try {
                        return await navigator.mediaDevices.getUserMedia(constraints);
                    } catch (error) {
                        throw new Error('Failed to access microphone: ' + error.message);
                    }
                },
                args: [constraints]
            }).then(([result]) => {
                if (result.error) {
                    throw new Error(result.error);
                }
                const stream = result;
                setupMediaRecorder(stream);
            }).catch(error => {
                console.error('Failed to get microphone access:', error);
                addLogEntry('error', error.message);
                micButton.classList.remove('recording');
            });
        });
        
    } catch (error) {
        console.error('Error starting recording:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        
        let errorMessage = 'Could not start recording: ' + (error.message || 'Unknown error');
        addLogEntry('error', errorMessage);
        micButton.classList.remove('recording');
    }
}

function setupMediaRecorder(stream) {
    mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
    });
    
    mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };
    
    mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
    };
    
    mediaRecorder.onstop = async () => {
        try {
            const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
            recordedChunks = [];
            
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const audioData = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(audioData);
            const audio = audioBuffer.getChannelData(0);
            
            if (asrWorker) {
                asrWorker.postMessage({ buffer: audio });
            } else {
                console.error('ASR worker not initialized');
            }
            
            stream.getTracks().forEach(track => track.stop());
            micButton.classList.remove('recording');
            
        } catch (error) {
            console.error('Error processing recorded audio:', error);
            addLogEntry('error', 'Error processing audio: ' + error.message);
        }
    };
    
    mediaRecorder.start(1000);
    console.log('Recording started');
    micButton.classList.add('recording');
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
    }
}

// Initialize ASR when popup is loaded
// Temporarily disabled ASR initialization
/*document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initASR();
        console.log('ASR initialization complete');
    } catch (error) {
        console.error('ASR initialization failed:', error);
        addLogEntry('error', 'Failed to initialize ASR: ' + error.message);
    }
});*/

// Add click handler for mic button
micButton.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});
