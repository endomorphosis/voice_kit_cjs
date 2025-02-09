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

async function initASR() {
    try {
        console.log('Initializing ASR worker...');
        
        // Use current extension's origin for worker
        const extensionOrigin = new URL(chrome.runtime.getURL('')).origin;
        const workerUrl = new URL('asr-worker.js', extensionOrigin).href;
        console.log('Creating worker with URL:', workerUrl);
        
        asrWorker = new Worker(workerUrl, { 
            type: 'module',
            credentials: 'same-origin'
        });
        
        asrWorker.onerror = (error) => {
            console.error('ASR worker error:', {
                message: error.message,
                filename: error.filename,
                lineno: error.lineno,
                colno: error.colno
            });
            addLogEntry('error', 'ASR worker error:', error.message);
        };
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('ASR worker initialization timed out'));
            }, 30000);
            
            asrWorker.onmessage = (event) => {
                const { type, text, error, message, progress, stage, details } = event.data;
                
                switch (type) {
                    case 'ready':
                        console.log('ASR worker ready');
                        clearTimeout(timeout);
                        micButton.disabled = false;
                        addLogEntry('info', 'ASR initialization complete');
                        resolve();
                        break;
                        
                    case 'error':
                        console.error('ASR error:', {
                            context: event.data.context,
                            details: details
                        });
                        addLogEntry('error', `ASR error (${event.data.context}):`, error);
                        if (details?.cause) {
                            addLogEntry('error', 'Cause:', details.cause.message);
                        }
                        break;
                        
                    case 'status':
                        console.log('ASR status:', message);
                        addLogEntry('info', message);
                        break;
                        
                    case 'progress':
                        console.log(`ASR ${stage}:`, Math.round(progress * 100) + '%');
                        addLogEntry('info', `${stage}: ${Math.round(progress * 100)}%`);
                        break;
                        
                    case 'transcription':
                        chatInput.value = (chatInput.value + ' ' + text).trim();
                        break;
                }
            };
        });
    } catch (error) {
        const errorDetails = {
            message: error.message,
            name: error.name,
            stack: error.stack,
            webgpuSupport: 'navigator' in globalThis && 'gpu' in navigator,
            workerSupport: 'Worker' in window
        };
        
        console.error('Error initializing ASR:', errorDetails);
        addLogEntry('error', 'Failed to initialize ASR worker');
        addLogEntry('error', `Error: ${error.message}`);
        addLogEntry('error', `WebGPU Support: ${errorDetails.webgpuSupport ? 'Yes' : 'No'}`);
        addLogEntry('error', `Worker Support: ${errorDetails.workerSupport ? 'Yes' : 'No'}`);
        
        // Show WebGPU instructions if not supported
        if (!errorDetails.webgpuSupport) {
            const instructions = document.createElement('div');
            instructions.className = 'log-entry info';
            instructions.innerHTML = `
                WebGPU is required for speech recognition:
                <ol>
                    <li>Use Chrome Canary or Chrome Dev (version 113+)</li>
                    <li>Enable WebGPU in chrome://flags</li>
                    <li>Restart the browser</li>
                </ol>
            `;
            logMessages?.appendChild(instructions);
        }
        
        micButton.disabled = true;
        throw error;
    }
}

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
            initASR(),
            cacheIcon()
        ]);
        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization failed:', error);
        addLogEntry('error', 'Failed to initialize: ' + error.message);
    }
});

async function requestMicrophonePermissions() {
    try {
        // Check if permissions are already granted
        const permissions = await navigator.permissions.query({ name: 'microphone' });
        
        if (permissions.state === 'granted') {
            return true;
        } else if (permissions.state === 'prompt') {
            // Show instructions to user before requesting permissions
            addLogEntry('info', 'Please allow microphone access in the browser prompt');
            // Request permissions explicitly
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop()); // Clean up test stream
            return true;
        } else if (permissions.state === 'denied') {
            addLogEntry('error', 'Microphone access is blocked. Please allow access in your browser settings.');
            // Show instructions for enabling permissions
            const instructions = document.createElement('div');
            instructions.className = 'log-entry info';
            instructions.innerHTML = `
                To enable microphone access:
                <ol>
                    <li>Click the camera/microphone icon in your browser's address bar</li>
                    <li>Select "Allow" for microphone access</li>
                    <li>Refresh this page</li>
                </ol>
            `;
            logMessages.appendChild(instructions);
            return false;
        }
    } catch (error) {
        console.error('Error checking permissions:', error);
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
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
                console.log('Recorded chunk size:', event.data.size);
            }
        };
        
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
        };
        
        mediaRecorder.onstop = async () => {
            try {
                console.log('Recording stopped, processing audio...');
                const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                console.log('Audio blob created, size:', audioBlob.size);
                recordedChunks = [];
                
                // Convert audio to proper format for Whisper
                const audioContext = new AudioContext({ sampleRate: 16000 });
                const audioData = await audioBlob.arrayBuffer();
                console.log('Audio data size:', audioData.byteLength);
                
                const audioBuffer = await audioContext.decodeAudioData(audioData);
                console.log('Audio decoded, duration:', audioBuffer.duration);
                
                // Get audio data as Float32Array
                const audio = audioBuffer.getChannelData(0);
                console.log('Audio converted to Float32Array, length:', audio.length);
                
                // Send to worker for transcription
                if (asrWorker) {
                    asrWorker.postMessage({ buffer: audio });
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
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initASR();
        console.log('ASR initialization complete');
    } catch (error) {
        console.error('ASR initialization failed:', error);
        addLogEntry('error', 'Failed to initialize ASR: ' + error.message);
    }
});

// Add click handler for mic button
micButton.addEventListener('click', () => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        startRecording();
    } else {
        stopRecording();
    }
});
