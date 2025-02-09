/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/constants.js":
/*!**************************!*\
  !*** ./src/constants.js ***!
  \**************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ACTION_NAME: () => (/* binding */ ACTION_NAME),
/* harmony export */   CONTEXT_MENU_ITEM_ID: () => (/* binding */ CONTEXT_MENU_ITEM_ID)
/* harmony export */ });
const CONTEXT_MENU_ITEM_ID = "generate-from-selection";
const ACTION_NAME = "generate";


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _constants_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants.js */ "./src/constants.js");
// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.



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
        // Get the full URL to the worker
        const workerUrl = chrome.runtime.getURL('asr-worker.js');
        console.log('Creating worker with URL:', workerUrl);
        
        if (!workerUrl) {
            throw new Error('Could not get worker URL - check manifest.json web_accessible_resources');
        }
        
        asrWorker = new Worker(workerUrl);
        
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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TTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2Jyb3dzZXItZXh0ZW5zaW9uLy4vc3JjL2NvbnN0YW50cy5qcyIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvZGVmaW5lIHByb3BlcnR5IGdldHRlcnMiLCJ3ZWJwYWNrOi8vYnJvd3Nlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2Jyb3dzZXItZXh0ZW5zaW9uLy4vc3JjL3BvcHVwLmpzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBjb25zdCBDT05URVhUX01FTlVfSVRFTV9JRCA9IFwiZ2VuZXJhdGUtZnJvbS1zZWxlY3Rpb25cIjtcclxuZXhwb3J0IGNvbnN0IEFDVElPTl9OQU1FID0gXCJnZW5lcmF0ZVwiO1xyXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsIi8vIHBvcHVwLmpzIC0gaGFuZGxlcyBpbnRlcmFjdGlvbiB3aXRoIHRoZSBleHRlbnNpb24ncyBwb3B1cCwgc2VuZHMgcmVxdWVzdHMgdG8gdGhlXHJcbi8vIHNlcnZpY2Ugd29ya2VyIChiYWNrZ3JvdW5kLmpzKSwgYW5kIHVwZGF0ZXMgdGhlIHBvcHVwJ3MgVUkgKHBvcHVwLmh0bWwpIG9uIGNvbXBsZXRpb24uXHJcblxyXG5pbXBvcnQgeyBBQ1RJT05fTkFNRSB9IGZyb20gXCIuL2NvbnN0YW50cy5qc1wiO1xyXG5cclxuLy8gSW1wb3J0IG9ubHkgd2hhdCB3ZSBuZWVkXHJcbmNvbnN0IG91dHB1dEVsZW1lbnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcIm91dHB1dFwiKTtcclxuXHJcbi8vIExpc3RlbiBmb3IgbWVzc2FnZXMgZnJvbSB0aGUgYmFja2dyb3VuZCBzY3JpcHRcclxuY2hyb21lLnJ1bnRpbWUub25NZXNzYWdlLmFkZExpc3RlbmVyKChtZXNzYWdlLCBzZW5kZXIsIHNlbmRSZXNwb25zZSkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ1BvcHVwIHJlY2VpdmVkIG1lc3NhZ2U6JywgbWVzc2FnZSk7XHJcbiAgICBpZiAobWVzc2FnZS5zdGF0dXMpIHtcclxuICAgICAgICB1cGRhdGVTdGF0dXMobWVzc2FnZSk7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ3Rva2VuJykge1xyXG4gICAgICAgIC8vIEhhbmRsZSBzdHJlYW1pbmcgdG9rZW4gdXBkYXRlc1xyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRNZXNzYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2UuYXNzaXN0YW50Omxhc3QtY2hpbGQnKTtcclxuICAgICAgICBpZiAoY3VycmVudE1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgY3VycmVudE1lc3NhZ2UudGV4dENvbnRlbnQgKz0gbWVzc2FnZS50b2tlbjtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhZGRNZXNzYWdlKG1lc3NhZ2UudG9rZW4sIGZhbHNlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2UudHlwZSA9PT0gJ2NvbXBsZXRlJykge1xyXG4gICAgICAgIC8vIEdlbmVyYXRpb24gaXMgY29tcGxldGUgLSBlbnN1cmUgZmluYWwgdGV4dCBpcyBjb3JyZWN0XHJcbiAgICAgICAgY29uc3QgY3VycmVudE1lc3NhZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZS5hc3Npc3RhbnQ6bGFzdC1jaGlsZCcpO1xyXG4gICAgICAgIGlmIChjdXJyZW50TWVzc2FnZSkge1xyXG4gICAgICAgICAgICBjdXJyZW50TWVzc2FnZS50ZXh0Q29udGVudCA9IG1lc3NhZ2UuZnVsbFRleHQ7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIHVwZGF0ZVN0YXR1cyhtZXNzYWdlKSB7XHJcbiAgICBjb25zdCBzdGF0dXNFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMnKTtcclxuICAgIGNvbnN0IHN0YXR1c0luZGljYXRvciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMtaW5kaWNhdG9yJyk7XHJcbiAgICBjb25zdCBwcm9ncmVzc0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvYWRpbmctcHJvZ3Jlc3MnKTtcclxuICAgIFxyXG4gICAgaWYgKCFzdGF0dXNFbCB8fCAhc3RhdHVzSW5kaWNhdG9yKSByZXR1cm47XHJcblxyXG4gICAgc3RhdHVzSW5kaWNhdG9yLmNsYXNzTmFtZSA9IG1lc3NhZ2Uuc3RhdHVzO1xyXG4gICAgXHJcbiAgICBpZiAobWVzc2FnZS5zdGF0dXMgPT09ICdsb2FkaW5nJykge1xyXG4gICAgICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gJ0xvYWRpbmcgbW9kZWwuLi4nO1xyXG4gICAgICAgIGlmIChtZXNzYWdlLnByb2dyZXNzKSB7XHJcbiAgICAgICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSBgJHttZXNzYWdlLnByb2dyZXNzLnRvRml4ZWQoMSl9JWA7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXR1cyA9PT0gJ2Vycm9yJykge1xyXG4gICAgICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gYEVycm9yOiAke21lc3NhZ2UuZGF0YX1gO1xyXG4gICAgICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSAnZXJyb3InO1xyXG4gICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSAnJztcclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGF0dXMgPT09ICdyZWFkeScpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9ICdNb2RlbCByZWFkeSc7XHJcbiAgICAgICAgc3RhdHVzSW5kaWNhdG9yLmNsYXNzTmFtZSA9ICdyZWFkeSc7XHJcbiAgICAgICAgcHJvZ3Jlc3NFbC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBDaGVjayBpbml0aWFsIHN0YXR1cyB3aGVuIHBvcHVwIG9wZW5zXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnUG9wdXAgb3BlbmVkJyk7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdjaGVja19zdGF0dXMnIH0pO1xyXG59KTtcclxuXHJcbi8vIENvbnNvbGUgbG9nZ2luZyBvdmVycmlkZVxyXG5jb25zdCBsb2dNZXNzYWdlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2ctbWVzc2FnZXMnKTtcclxuY29uc3Qgb3JpZ2luYWxDb25zb2xlID0ge1xyXG4gICAgbG9nOiBjb25zb2xlLmxvZyxcclxuICAgIGVycm9yOiBjb25zb2xlLmVycm9yLFxyXG4gICAgaW5mbzogY29uc29sZS5pbmZvXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRMb2dFbnRyeSh0eXBlLCAuLi5hcmdzKSB7XHJcbiAgICBjb25zdCBlbnRyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZW50cnkuY2xhc3NOYW1lID0gYGxvZy1lbnRyeSAke3R5cGV9YDtcclxuICAgIGVudHJ5LnRleHRDb250ZW50ID0gYXJncy5tYXAoYXJnID0+IFxyXG4gICAgICAgIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYXJnKSA6IGFyZ1xyXG4gICAgKS5qb2luKCcgJyk7XHJcbiAgICBsb2dNZXNzYWdlcz8uYXBwZW5kQ2hpbGQoZW50cnkpO1xyXG4gICAgbG9nTWVzc2FnZXM/LnNjcm9sbFRvKDAsIGxvZ01lc3NhZ2VzLnNjcm9sbEhlaWdodCk7XHJcbiAgICByZXR1cm4gb3JpZ2luYWxDb25zb2xlW3R5cGVdKC4uLmFyZ3MpO1xyXG59XHJcblxyXG5jb25zb2xlLmxvZyA9ICguLi5hcmdzKSA9PiBhZGRMb2dFbnRyeSgnaW5mbycsIC4uLmFyZ3MpO1xyXG5jb25zb2xlLmVycm9yID0gKC4uLmFyZ3MpID0+IGFkZExvZ0VudHJ5KCdlcnJvcicsIC4uLmFyZ3MpO1xyXG5jb25zb2xlLmluZm8gPSAoLi4uYXJncykgPT4gYWRkTG9nRW50cnkoJ2luZm8nLCAuLi5hcmdzKTtcclxuXHJcbi8vIENoYXQgZnVuY3Rpb25hbGl0eVxyXG5jb25zdCBjaGF0SW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhdC1pbnB1dCcpO1xyXG5jb25zdCBzZW5kQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbmQtYnV0dG9uJyk7XHJcbmNvbnN0IGNoYXRNZXNzYWdlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKGNvbnRlbnQsIGlzVXNlciA9IGZhbHNlKSB7XHJcbiAgICBjb25zdCBtZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBtZXNzYWdlRGl2LmNsYXNzTmFtZSA9IGBtZXNzYWdlICR7aXNVc2VyID8gJ3VzZXInIDogJ2Fzc2lzdGFudCd9YDtcclxuICAgIG1lc3NhZ2VEaXYudGV4dENvbnRlbnQgPSBjb250ZW50O1xyXG4gICAgY2hhdE1lc3NhZ2VzLmFwcGVuZENoaWxkKG1lc3NhZ2VEaXYpO1xyXG4gICAgY2hhdE1lc3NhZ2VzLnNjcm9sbFRvKDAsIGNoYXRNZXNzYWdlcy5zY3JvbGxIZWlnaHQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuICAgIGNvbnN0IHRleHQgPSBjaGF0SW5wdXQudmFsdWUudHJpbSgpO1xyXG4gICAgaWYgKCF0ZXh0KSByZXR1cm47XHJcblxyXG4gICAgYWRkTWVzc2FnZSh0ZXh0LCB0cnVlKTtcclxuICAgIGNoYXRJbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgZW1wdHkgYXNzaXN0YW50IG1lc3NhZ2UgZm9yIHN0cmVhbWluZ1xyXG4gICAgYWRkTWVzc2FnZSgnJywgZmFsc2UpO1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZW5lcmF0ZScsXHJcbiAgICAgICAgICAgIHRleHQ6IHRleHRcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwb25zZS5lcnJvcik7XHJcbiAgICAgICAgICAgIGFkZE1lc3NhZ2UoJ0Vycm9yOiAnICsgcmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBtZXNzYWdlOicsIGVycm9yKTtcclxuICAgICAgICBhZGRNZXNzYWdlKCdFcnJvcjogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG5zZW5kQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VuZE1lc3NhZ2UpO1xyXG5jaGF0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCAoZSkgPT4ge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNlbmRNZXNzYWdlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gU3BlZWNoIHJlY29nbml0aW9uIHNldHVwXHJcbmNvbnN0IG1pY0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtaWMtYnV0dG9uJyk7XHJcbmxldCBtZWRpYVJlY29yZGVyID0gbnVsbDtcclxubGV0IHJlY29yZGVkQ2h1bmtzID0gW107XHJcbmxldCBhc3JXb3JrZXIgPSBudWxsO1xyXG5cclxuYXN5bmMgZnVuY3Rpb24gaW5pdEFTUigpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0luaXRpYWxpemluZyBBU1Igd29ya2VyLi4uJyk7XHJcbiAgICAgICAgLy8gR2V0IHRoZSBmdWxsIFVSTCB0byB0aGUgd29ya2VyXHJcbiAgICAgICAgY29uc3Qgd29ya2VyVXJsID0gY2hyb21lLnJ1bnRpbWUuZ2V0VVJMKCdhc3Itd29ya2VyLmpzJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0NyZWF0aW5nIHdvcmtlciB3aXRoIFVSTDonLCB3b3JrZXJVcmwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmICghd29ya2VyVXJsKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcignQ291bGQgbm90IGdldCB3b3JrZXIgVVJMIC0gY2hlY2sgbWFuaWZlc3QuanNvbiB3ZWJfYWNjZXNzaWJsZV9yZXNvdXJjZXMnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXNyV29ya2VyID0gbmV3IFdvcmtlcih3b3JrZXJVcmwpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGFzcldvcmtlci5vbmVycm9yID0gKGVycm9yKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FTUiB3b3JrZXIgZXJyb3I6Jywge1xyXG4gICAgICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgICAgIGZpbGVuYW1lOiBlcnJvci5maWxlbmFtZSxcclxuICAgICAgICAgICAgICAgIGxpbmVubzogZXJyb3IubGluZW5vLFxyXG4gICAgICAgICAgICAgICAgY29sbm86IGVycm9yLmNvbG5vXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnQVNSIHdvcmtlciBlcnJvcjonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHRpbWVvdXQgPSBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoJ0FTUiB3b3JrZXIgaW5pdGlhbGl6YXRpb24gdGltZWQgb3V0JykpO1xyXG4gICAgICAgICAgICB9LCAzMDAwMCk7XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgICAgICBhc3JXb3JrZXIub25tZXNzYWdlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCB7IHR5cGUsIHRleHQsIGVycm9yLCBtZXNzYWdlLCBwcm9ncmVzcywgc3RhZ2UsIGRldGFpbHMgfSA9IGV2ZW50LmRhdGE7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIHN3aXRjaCAodHlwZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3JlYWR5JzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0FTUiB3b3JrZXIgcmVhZHknKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXQpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2luZm8nLCAnQVNSIGluaXRpYWxpemF0aW9uIGNvbXBsZXRlJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ2Vycm9yJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQVNSIGVycm9yOicsIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRleHQ6IGV2ZW50LmRhdGEuY29udGV4dCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRldGFpbHM6IGRldGFpbHNcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGBBU1IgZXJyb3IgKCR7ZXZlbnQuZGF0YS5jb250ZXh0fSk6YCwgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGV0YWlscz8uY2F1c2UpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdDYXVzZTonLCBkZXRhaWxzLmNhdXNlLm1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgICAgICBjYXNlICdzdGF0dXMnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQVNSIHN0YXR1czonLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2luZm8nLCBtZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3Byb2dyZXNzJzpcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coYEFTUiAke3N0YWdlfTpgLCBNYXRoLnJvdW5kKHByb2dyZXNzICogMTAwKSArICclJyk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdpbmZvJywgYCR7c3RhZ2V9OiAke01hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApfSVgKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3RyYW5zY3JpcHRpb24nOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjaGF0SW5wdXQudmFsdWUgPSAoY2hhdElucHV0LnZhbHVlICsgJyAnICsgdGV4dCkudHJpbSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfTtcclxuICAgICAgICB9KTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc3QgZXJyb3JEZXRhaWxzID0ge1xyXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICBuYW1lOiBlcnJvci5uYW1lLFxyXG4gICAgICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2ssXHJcbiAgICAgICAgICAgIHdlYmdwdVN1cHBvcnQ6ICduYXZpZ2F0b3InIGluIGdsb2JhbFRoaXMgJiYgJ2dwdScgaW4gbmF2aWdhdG9yLFxyXG4gICAgICAgICAgICB3b3JrZXJTdXBwb3J0OiAnV29ya2VyJyBpbiB3aW5kb3dcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGluaXRpYWxpemluZyBBU1I6JywgZXJyb3JEZXRhaWxzKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemUgQVNSIHdvcmtlcicpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGBFcnJvcjogJHtlcnJvci5tZXNzYWdlfWApO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGBXZWJHUFUgU3VwcG9ydDogJHtlcnJvckRldGFpbHMud2ViZ3B1U3VwcG9ydCA/ICdZZXMnIDogJ05vJ31gKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCBgV29ya2VyIFN1cHBvcnQ6ICR7ZXJyb3JEZXRhaWxzLndvcmtlclN1cHBvcnQgPyAnWWVzJyA6ICdObyd9YCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gU2hvdyBXZWJHUFUgaW5zdHJ1Y3Rpb25zIGlmIG5vdCBzdXBwb3J0ZWRcclxuICAgICAgICBpZiAoIWVycm9yRGV0YWlscy53ZWJncHVTdXBwb3J0KSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuY2xhc3NOYW1lID0gJ2xvZy1lbnRyeSBpbmZvJztcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIFdlYkdQVSBpcyByZXF1aXJlZCBmb3Igc3BlZWNoIHJlY29nbml0aW9uOlxyXG4gICAgICAgICAgICAgICAgPG9sPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5Vc2UgQ2hyb21lIENhbmFyeSBvciBDaHJvbWUgRGV2ICh2ZXJzaW9uIDExMyspPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+RW5hYmxlIFdlYkdQVSBpbiBjaHJvbWU6Ly9mbGFnczwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlJlc3RhcnQgdGhlIGJyb3dzZXI8L2xpPlxyXG4gICAgICAgICAgICAgICAgPC9vbD5cclxuICAgICAgICAgICAgYDtcclxuICAgICAgICAgICAgbG9nTWVzc2FnZXM/LmFwcGVuZENoaWxkKGluc3RydWN0aW9ucyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IHRydWU7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIERpc2FibGUgbWljIGJ1dHRvbiBpbml0aWFsbHlcclxubWljQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcbi8vIERvd25sb2FkIGFuZCBjYWNoZSB0aGUgQ29waWxvdCBhdmF0YXJcclxuYXN5bmMgZnVuY3Rpb24gY2FjaGVJY29uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMTIzMjY1OTM0Jyk7XHJcbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcclxuICAgICAgICBjb25zdCBpY29uVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBjb25zdCBsaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbmtbcmVsKj1cImljb25cIl0nKTtcclxuICAgICAgICBsaW5rcy5mb3JFYWNoKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICBsaW5rLmhyZWYgPSBpY29uVXJsO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY2FjaGUgaWNvbjonLCBlcnJvcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEluaXRpYWxpemUgd2hlbiBwb3B1cCBsb2Fkc1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgICAgIGluaXRBU1IoKSxcclxuICAgICAgICAgICAgY2FjaGVJY29uKClcclxuICAgICAgICBdKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnSW5pdGlhbGl6YXRpb24gY29tcGxldGUnKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignSW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemU6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0TWljcm9waG9uZVBlcm1pc3Npb25zKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBDaGVjayBpZiBwZXJtaXNzaW9ucyBhcmUgYWxyZWFkeSBncmFudGVkXHJcbiAgICAgICAgY29uc3QgcGVybWlzc2lvbnMgPSBhd2FpdCBuYXZpZ2F0b3IucGVybWlzc2lvbnMucXVlcnkoeyBuYW1lOiAnbWljcm9waG9uZScgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHBlcm1pc3Npb25zLnN0YXRlID09PSAnZ3JhbnRlZCcpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChwZXJtaXNzaW9ucy5zdGF0ZSA9PT0gJ3Byb21wdCcpIHtcclxuICAgICAgICAgICAgLy8gU2hvdyBpbnN0cnVjdGlvbnMgdG8gdXNlciBiZWZvcmUgcmVxdWVzdGluZyBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICBhZGRMb2dFbnRyeSgnaW5mbycsICdQbGVhc2UgYWxsb3cgbWljcm9waG9uZSBhY2Nlc3MgaW4gdGhlIGJyb3dzZXIgcHJvbXB0Jyk7XHJcbiAgICAgICAgICAgIC8vIFJlcXVlc3QgcGVybWlzc2lvbnMgZXhwbGljaXRseVxyXG4gICAgICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYSh7IGF1ZGlvOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB0cmFjay5zdG9wKCkpOyAvLyBDbGVhbiB1cCB0ZXN0IHN0cmVhbVxyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHBlcm1pc3Npb25zLnN0YXRlID09PSAnZGVuaWVkJykge1xyXG4gICAgICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnTWljcm9waG9uZSBhY2Nlc3MgaXMgYmxvY2tlZC4gUGxlYXNlIGFsbG93IGFjY2VzcyBpbiB5b3VyIGJyb3dzZXIgc2V0dGluZ3MuJyk7XHJcbiAgICAgICAgICAgIC8vIFNob3cgaW5zdHJ1Y3Rpb25zIGZvciBlbmFibGluZyBwZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmNsYXNzTmFtZSA9ICdsb2ctZW50cnkgaW5mbyc7XHJcbiAgICAgICAgICAgIGluc3RydWN0aW9ucy5pbm5lckhUTUwgPSBgXHJcbiAgICAgICAgICAgICAgICBUbyBlbmFibGUgbWljcm9waG9uZSBhY2Nlc3M6XHJcbiAgICAgICAgICAgICAgICA8b2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPkNsaWNrIHRoZSBjYW1lcmEvbWljcm9waG9uZSBpY29uIGluIHlvdXIgYnJvd3NlcidzIGFkZHJlc3MgYmFyPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+U2VsZWN0IFwiQWxsb3dcIiBmb3IgbWljcm9waG9uZSBhY2Nlc3M8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5SZWZyZXNoIHRoaXMgcGFnZTwvbGk+XHJcbiAgICAgICAgICAgICAgICA8L29sPlxyXG4gICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICBsb2dNZXNzYWdlcy5hcHBlbmRDaGlsZChpbnN0cnVjdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBjaGVja2luZyBwZXJtaXNzaW9uczonLCBlcnJvcik7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzdGFydFJlY29yZGluZygpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgcGVybWlzc2lvbnMgZmlyc3RcclxuICAgICAgICBjb25zdCBoYXNQZXJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdE1pY3JvcGhvbmVQZXJtaXNzaW9ucygpO1xyXG4gICAgICAgIGlmICghaGFzUGVybWlzc2lvbikge1xyXG4gICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXF1ZXN0aW5nIG1pY3JvcGhvbmUgYWNjZXNzLi4uJyk7XHJcbiAgICAgICAgY29uc3QgY29uc3RyYWludHMgPSB7IFxyXG4gICAgICAgICAgICBhdWRpbzoge1xyXG4gICAgICAgICAgICAgICAgY2hhbm5lbENvdW50OiAxLFxyXG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZTogMTYwMDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3Qgc3RyZWFtID0gYXdhaXQgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEoY29uc3RyYWludHMpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdNaWNyb3Bob25lIGFjY2VzcyBncmFudGVkOicsIHN0cmVhbS5nZXRBdWRpb1RyYWNrcygpWzBdLmdldFNldHRpbmdzKCkpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIgPSBuZXcgTWVkaWFSZWNvcmRlcihzdHJlYW0sIHtcclxuICAgICAgICAgICAgbWltZVR5cGU6ICdhdWRpby93ZWJtO2NvZGVjcz1vcHVzJ1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdNZWRpYVJlY29yZGVyIGNyZWF0ZWQgd2l0aCBzZXR0aW5nczonLCBtZWRpYVJlY29yZGVyLm1pbWVUeXBlKTtcclxuICAgICAgICBcclxuICAgICAgICBtZWRpYVJlY29yZGVyLm9uZGF0YWF2YWlsYWJsZSA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBpZiAoZXZlbnQuZGF0YS5zaXplID4gMCkge1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MucHVzaChldmVudC5kYXRhKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWNvcmRlZCBjaHVuayBzaXplOicsIGV2ZW50LmRhdGEuc2l6ZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25lcnJvciA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdNZWRpYVJlY29yZGVyIGVycm9yOicsIGV2ZW50LmVycm9yKTtcclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25zdG9wID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZGluZyBzdG9wcGVkLCBwcm9jZXNzaW5nIGF1ZGlvLi4uJyk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0Jsb2IgPSBuZXcgQmxvYihyZWNvcmRlZENodW5rcywgeyB0eXBlOiAnYXVkaW8vd2VibScgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXVkaW8gYmxvYiBjcmVhdGVkLCBzaXplOicsIGF1ZGlvQmxvYi5zaXplKTtcclxuICAgICAgICAgICAgICAgIHJlY29yZGVkQ2h1bmtzID0gW107XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENvbnZlcnQgYXVkaW8gdG8gcHJvcGVyIGZvcm1hdCBmb3IgV2hpc3BlclxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCh7IHNhbXBsZVJhdGU6IDE2MDAwIH0pO1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW9EYXRhID0gYXdhaXQgYXVkaW9CbG9iLmFycmF5QnVmZmVyKCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXVkaW8gZGF0YSBzaXplOicsIGF1ZGlvRGF0YS5ieXRlTGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW9CdWZmZXIgPSBhd2FpdCBhdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKGF1ZGlvRGF0YSk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXVkaW8gZGVjb2RlZCwgZHVyYXRpb246JywgYXVkaW9CdWZmZXIuZHVyYXRpb24pO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLyBHZXQgYXVkaW8gZGF0YSBhcyBGbG9hdDMyQXJyYXlcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvID0gYXVkaW9CdWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCk7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXVkaW8gY29udmVydGVkIHRvIEZsb2F0MzJBcnJheSwgbGVuZ3RoOicsIGF1ZGlvLmxlbmd0aCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIFNlbmQgdG8gd29ya2VyIGZvciB0cmFuc2NyaXB0aW9uXHJcbiAgICAgICAgICAgICAgICBpZiAoYXNyV29ya2VyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXNyV29ya2VyLnBvc3RNZXNzYWdlKHsgYnVmZmVyOiBhdWRpbyB9KTtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQXVkaW8gc2VudCB0byBBU1Igd29ya2VyJyk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FTUiB3b3JrZXIgbm90IGluaXRpYWxpemVkJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIENsZWFuIHVwXHJcbiAgICAgICAgICAgICAgICBzdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaCh0cmFjayA9PiB7XHJcbiAgICAgICAgICAgICAgICAgICAgdHJhY2suc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyB0cmFjayBzdG9wcGVkOicsIHRyYWNrLmxhYmVsKTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgbWljQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3JlY29yZGluZycpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBwcm9jZXNzaW5nIHJlY29yZGVkIGF1ZGlvOicsIGVycm9yKTtcclxuICAgICAgICAgICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnSW52YWxpZFN0YXRlRXJyb3InKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQXVkaW8gY29udGV4dCBlcnJvciAtIHBvc3NpYmxlIHNhbXBsZSByYXRlIG9yIGZvcm1hdCBpc3N1ZScpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgJ0Vycm9yIHByb2Nlc3NpbmcgYXVkaW86JywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RhcnQoMTAwMCk7IC8vIENvbGxlY3QgZGF0YSBpbiAxLXNlY29uZCBjaHVua3NcclxuICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIHN0YXJ0ZWQnKTtcclxuICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LmFkZCgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgXHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHN0YXJ0aW5nIHJlY29yZGluZzonLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IGVycm9yLm5hbWUsXHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIGNvbnN0cmFpbnQ6IGVycm9yLmNvbnN0cmFpbnQsXHJcbiAgICAgICAgICAgIHN0YWNrOiBlcnJvci5zdGFja1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSAnQ291bGQgbm90IHN0YXJ0IHJlY29yZGluZzogJztcclxuICAgICAgICBpZiAoZXJyb3IubmFtZSA9PT0gJ05vdEFsbG93ZWRFcnJvcicpIHtcclxuICAgICAgICAgICAgLy8gRG9uJ3Qgc2hvdyB0aGlzIG1lc3NhZ2Ugc2luY2Ugd2UgaGFuZGxlIGl0IGluIHJlcXVlc3RNaWNyb3Bob25lUGVybWlzc2lvbnNcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ05vdEZvdW5kRXJyb3InKSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSAnTm8gbWljcm9waG9uZSB3YXMgZm91bmQnO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoZXJyb3IubmFtZSA9PT0gJ05vdFJlYWRhYmxlRXJyb3InKSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSAnTWljcm9waG9uZSBpcyBhbHJlYWR5IGluIHVzZSBieSBhbm90aGVyIGFwcGxpY2F0aW9uJztcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBlcnJvck1lc3NhZ2UgKz0gZXJyb3IubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcic7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgbWljQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3JlY29yZGluZycpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzdG9wUmVjb3JkaW5nKCkge1xyXG4gICAgaWYgKG1lZGlhUmVjb3JkZXIgJiYgbWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ3JlY29yZGluZycpIHtcclxuICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSBBU1Igd2hlbiBwb3B1cCBpcyBsb2FkZWRcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgaW5pdEFTUigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdBU1IgaW5pdGlhbGl6YXRpb24gY29tcGxldGUnKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQVNSIGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvcik7XHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgJ0ZhaWxlZCB0byBpbml0aWFsaXplIEFTUjogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIEFkZCBjbGljayBoYW5kbGVyIGZvciBtaWMgYnV0dG9uXHJcbm1pY0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGlmICghbWVkaWFSZWNvcmRlciB8fCBtZWRpYVJlY29yZGVyLnN0YXRlID09PSAnaW5hY3RpdmUnKSB7XHJcbiAgICAgICAgc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc3RvcFJlY29yZGluZygpO1xyXG4gICAgfVxyXG59KTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9