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
        const workerUrl = chrome.runtime.getURL('asr-worker.js');
        console.log('Creating worker with URL:', workerUrl);
        
        asrWorker = new Worker(workerUrl, { 
            type: 'module'
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0EsVUFBVTtBQUNWO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQSxDQUFDIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGFsbHVjaW5hdGUtZXh0ZW5zaW9uLy4vc3JjL2NvbnN0YW50cy5qcyIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vaGFsbHVjaW5hdGUtZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vLi9zcmMvcG9wdXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IENPTlRFWFRfTUVOVV9JVEVNX0lEID0gXCJnZW5lcmF0ZS1mcm9tLXNlbGVjdGlvblwiO1xyXG5leHBvcnQgY29uc3QgQUNUSU9OX05BTUUgPSBcImdlbmVyYXRlXCI7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gcG9wdXAuanMgLSBoYW5kbGVzIGludGVyYWN0aW9uIHdpdGggdGhlIGV4dGVuc2lvbidzIHBvcHVwLCBzZW5kcyByZXF1ZXN0cyB0byB0aGVcclxuLy8gc2VydmljZSB3b3JrZXIgKGJhY2tncm91bmQuanMpLCBhbmQgdXBkYXRlcyB0aGUgcG9wdXAncyBVSSAocG9wdXAuaHRtbCkgb24gY29tcGxldGlvbi5cclxuXHJcbmltcG9ydCB7IEFDVElPTl9OQU1FIH0gZnJvbSBcIi4vY29uc3RhbnRzLmpzXCI7XHJcblxyXG4vLyBJbXBvcnQgb25seSB3aGF0IHdlIG5lZWRcclxuY29uc3Qgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0cHV0XCIpO1xyXG5cclxuLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdFxyXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnUG9wdXAgcmVjZWl2ZWQgbWVzc2FnZTonLCBtZXNzYWdlKTtcclxuICAgIGlmIChtZXNzYWdlLnN0YXR1cykge1xyXG4gICAgICAgIHVwZGF0ZVN0YXR1cyhtZXNzYWdlKTtcclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAndG9rZW4nKSB7XHJcbiAgICAgICAgLy8gSGFuZGxlIHN0cmVhbWluZyB0b2tlbiB1cGRhdGVzXHJcbiAgICAgICAgY29uc3QgY3VycmVudE1lc3NhZ2UgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcubWVzc2FnZS5hc3Npc3RhbnQ6bGFzdC1jaGlsZCcpO1xyXG4gICAgICAgIGlmIChjdXJyZW50TWVzc2FnZSkge1xyXG4gICAgICAgICAgICBjdXJyZW50TWVzc2FnZS50ZXh0Q29udGVudCArPSBtZXNzYWdlLnRva2VuO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFkZE1lc3NhZ2UobWVzc2FnZS50b2tlbiwgZmFsc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS50eXBlID09PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgLy8gR2VuZXJhdGlvbiBpcyBjb21wbGV0ZSAtIGVuc3VyZSBmaW5hbCB0ZXh0IGlzIGNvcnJlY3RcclxuICAgICAgICBjb25zdCBjdXJyZW50TWVzc2FnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlLmFzc2lzdGFudDpsYXN0LWNoaWxkJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRNZXNzYWdlLnRleHRDb250ZW50ID0gbWVzc2FnZS5mdWxsVGV4dDtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gdXBkYXRlU3RhdHVzKG1lc3NhZ2UpIHtcclxuICAgIGNvbnN0IHN0YXR1c0VsID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cycpO1xyXG4gICAgY29uc3Qgc3RhdHVzSW5kaWNhdG9yID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXR1cy1pbmRpY2F0b3InKTtcclxuICAgIGNvbnN0IHByb2dyZXNzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9hZGluZy1wcm9ncmVzcycpO1xyXG4gICAgXHJcbiAgICBpZiAoIXN0YXR1c0VsIHx8ICFzdGF0dXNJbmRpY2F0b3IpIHJldHVybjtcclxuXHJcbiAgICBzdGF0dXNJbmRpY2F0b3IuY2xhc3NOYW1lID0gbWVzc2FnZS5zdGF0dXM7XHJcbiAgICBcclxuICAgIGlmIChtZXNzYWdlLnN0YXR1cyA9PT0gJ2xvYWRpbmcnKSB7XHJcbiAgICAgICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSAnTG9hZGluZyBtb2RlbC4uLic7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UucHJvZ3Jlc3MpIHtcclxuICAgICAgICAgICAgcHJvZ3Jlc3NFbC50ZXh0Q29udGVudCA9IGAke21lc3NhZ2UucHJvZ3Jlc3MudG9GaXhlZCgxKX0lYDtcclxuICAgICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAnZXJyb3InKSB7XHJcbiAgICAgICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSBgRXJyb3I6ICR7bWVzc2FnZS5kYXRhfWA7XHJcbiAgICAgICAgc3RhdHVzSW5kaWNhdG9yLmNsYXNzTmFtZSA9ICdlcnJvcic7XHJcbiAgICAgICAgcHJvZ3Jlc3NFbC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXR1cyA9PT0gJ3JlYWR5Jykge1xyXG4gICAgICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gJ01vZGVsIHJlYWR5JztcclxuICAgICAgICBzdGF0dXNJbmRpY2F0b3IuY2xhc3NOYW1lID0gJ3JlYWR5JztcclxuICAgICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIENoZWNrIGluaXRpYWwgc3RhdHVzIHdoZW4gcG9wdXAgb3BlbnNcclxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsICgpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdQb3B1cCBvcGVuZWQnKTtcclxuICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ2NoZWNrX3N0YXR1cycgfSk7XHJcbn0pO1xyXG5cclxuLy8gQ29uc29sZSBsb2dnaW5nIG92ZXJyaWRlXHJcbmNvbnN0IGxvZ01lc3NhZ2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2xvZy1tZXNzYWdlcycpO1xyXG5jb25zdCBvcmlnaW5hbENvbnNvbGUgPSB7XHJcbiAgICBsb2c6IGNvbnNvbGUubG9nLFxyXG4gICAgZXJyb3I6IGNvbnNvbGUuZXJyb3IsXHJcbiAgICBpbmZvOiBjb25zb2xlLmluZm9cclxufTtcclxuXHJcbmZ1bmN0aW9uIGFkZExvZ0VudHJ5KHR5cGUsIC4uLmFyZ3MpIHtcclxuICAgIGNvbnN0IGVudHJ5ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBlbnRyeS5jbGFzc05hbWUgPSBgbG9nLWVudHJ5ICR7dHlwZX1gO1xyXG4gICAgZW50cnkudGV4dENvbnRlbnQgPSBhcmdzLm1hcChhcmcgPT4gXHJcbiAgICAgICAgdHlwZW9mIGFyZyA9PT0gJ29iamVjdCcgPyBKU09OLnN0cmluZ2lmeShhcmcpIDogYXJnXHJcbiAgICApLmpvaW4oJyAnKTtcclxuICAgIGxvZ01lc3NhZ2VzPy5hcHBlbmRDaGlsZChlbnRyeSk7XHJcbiAgICBsb2dNZXNzYWdlcz8uc2Nyb2xsVG8oMCwgbG9nTWVzc2FnZXMuc2Nyb2xsSGVpZ2h0KTtcclxuICAgIHJldHVybiBvcmlnaW5hbENvbnNvbGVbdHlwZV0oLi4uYXJncyk7XHJcbn1cclxuXHJcbmNvbnNvbGUubG9nID0gKC4uLmFyZ3MpID0+IGFkZExvZ0VudHJ5KCdpbmZvJywgLi4uYXJncyk7XHJcbmNvbnNvbGUuZXJyb3IgPSAoLi4uYXJncykgPT4gYWRkTG9nRW50cnkoJ2Vycm9yJywgLi4uYXJncyk7XHJcbmNvbnNvbGUuaW5mbyA9ICguLi5hcmdzKSA9PiBhZGRMb2dFbnRyeSgnaW5mbycsIC4uLmFyZ3MpO1xyXG5cclxuLy8gQ2hhdCBmdW5jdGlvbmFsaXR5XHJcbmNvbnN0IGNoYXRJbnB1dCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGF0LWlucHV0Jyk7XHJcbmNvbnN0IHNlbmRCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc2VuZC1idXR0b24nKTtcclxuY29uc3QgY2hhdE1lc3NhZ2VzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXQtbWVzc2FnZXMnKTtcclxuXHJcbmZ1bmN0aW9uIGFkZE1lc3NhZ2UoY29udGVudCwgaXNVc2VyID0gZmFsc2UpIHtcclxuICAgIGNvbnN0IG1lc3NhZ2VEaXYgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIG1lc3NhZ2VEaXYuY2xhc3NOYW1lID0gYG1lc3NhZ2UgJHtpc1VzZXIgPyAndXNlcicgOiAnYXNzaXN0YW50J31gO1xyXG4gICAgbWVzc2FnZURpdi50ZXh0Q29udGVudCA9IGNvbnRlbnQ7XHJcbiAgICBjaGF0TWVzc2FnZXMuYXBwZW5kQ2hpbGQobWVzc2FnZURpdik7XHJcbiAgICBjaGF0TWVzc2FnZXMuc2Nyb2xsVG8oMCwgY2hhdE1lc3NhZ2VzLnNjcm9sbEhlaWdodCk7XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHNlbmRNZXNzYWdlKCkge1xyXG4gICAgY29uc3QgdGV4dCA9IGNoYXRJbnB1dC52YWx1ZS50cmltKCk7XHJcbiAgICBpZiAoIXRleHQpIHJldHVybjtcclxuXHJcbiAgICBhZGRNZXNzYWdlKHRleHQsIHRydWUpO1xyXG4gICAgY2hhdElucHV0LnZhbHVlID0gJyc7XHJcbiAgICBcclxuICAgIC8vIENyZWF0ZSBlbXB0eSBhc3Npc3RhbnQgbWVzc2FnZSBmb3Igc3RyZWFtaW5nXHJcbiAgICBhZGRNZXNzYWdlKCcnLCBmYWxzZSk7XHJcbiAgICBcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7XHJcbiAgICAgICAgICAgIGFjdGlvbjogJ2dlbmVyYXRlJyxcclxuICAgICAgICAgICAgdGV4dDogdGV4dFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGlmIChyZXNwb25zZS5lcnJvcikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3BvbnNlLmVycm9yKTtcclxuICAgICAgICAgICAgYWRkTWVzc2FnZSgnRXJyb3I6ICcgKyByZXNwb25zZS5lcnJvcik7XHJcbiAgICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzZW5kaW5nIG1lc3NhZ2U6JywgZXJyb3IpO1xyXG4gICAgICAgIGFkZE1lc3NhZ2UoJ0Vycm9yOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbnNlbmRCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBzZW5kTWVzc2FnZSk7XHJcbmNoYXRJbnB1dC5hZGRFdmVudExpc3RlbmVyKCdrZXlwcmVzcycsIChlKSA9PiB7XHJcbiAgICBpZiAoZS5rZXkgPT09ICdFbnRlcicgJiYgIWUuc2hpZnRLZXkpIHtcclxuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XHJcbiAgICAgICAgc2VuZE1lc3NhZ2UoKTtcclxuICAgIH1cclxufSk7XHJcblxyXG4vLyBTcGVlY2ggcmVjb2duaXRpb24gc2V0dXBcclxuY29uc3QgbWljQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ21pYy1idXR0b24nKTtcclxubGV0IG1lZGlhUmVjb3JkZXIgPSBudWxsO1xyXG5sZXQgcmVjb3JkZWRDaHVua3MgPSBbXTtcclxubGV0IGFzcldvcmtlciA9IG51bGw7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBpbml0QVNSKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zb2xlLmxvZygnSW5pdGlhbGl6aW5nIEFTUiB3b3JrZXIuLi4nKTtcclxuICAgICAgICBjb25zdCB3b3JrZXJVcmwgPSBjaHJvbWUucnVudGltZS5nZXRVUkwoJ2Fzci13b3JrZXIuanMnKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnQ3JlYXRpbmcgd29ya2VyIHdpdGggVVJMOicsIHdvcmtlclVybCk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXNyV29ya2VyID0gbmV3IFdvcmtlcih3b3JrZXJVcmwsIHsgXHJcbiAgICAgICAgICAgIHR5cGU6ICdtb2R1bGUnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgYXNyV29ya2VyLm9uZXJyb3IgPSAoZXJyb3IpID0+IHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignQVNSIHdvcmtlciBlcnJvcjonLCB7XHJcbiAgICAgICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICAgICAgZmlsZW5hbWU6IGVycm9yLmZpbGVuYW1lLFxyXG4gICAgICAgICAgICAgICAgbGluZW5vOiBlcnJvci5saW5lbm8sXHJcbiAgICAgICAgICAgICAgICBjb2xubzogZXJyb3IuY29sbm9cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdBU1Igd29ya2VyIGVycm9yOicsIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcclxuICAgICAgICAgICAgY29uc3QgdGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmVqZWN0KG5ldyBFcnJvcignQVNSIHdvcmtlciBpbml0aWFsaXphdGlvbiB0aW1lZCBvdXQnKSk7XHJcbiAgICAgICAgICAgIH0sIDMwMDAwKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGFzcldvcmtlci5vbm1lc3NhZ2UgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IHsgdHlwZSwgdGV4dCwgZXJyb3IsIG1lc3NhZ2UsIHByb2dyZXNzLCBzdGFnZSwgZGV0YWlscyB9ID0gZXZlbnQuZGF0YTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncmVhZHknOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQVNSIHdvcmtlciByZWFkeScpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGltZW91dCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1pY0J1dHRvbi5kaXNhYmxlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRMb2dFbnRyeSgnaW5mbycsICdBU1IgaW5pdGlhbGl6YXRpb24gY29tcGxldGUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAnZXJyb3InOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBU1IgZXJyb3I6Jywge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGV4dDogZXZlbnQuZGF0YS5jb250ZXh0LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGV0YWlsczogZGV0YWlsc1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgYEFTUiBlcnJvciAoJHtldmVudC5kYXRhLmNvbnRleHR9KTpgLCBlcnJvcik7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZXRhaWxzPy5jYXVzZSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgJ0NhdXNlOicsIGRldGFpbHMuY2F1c2UubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgJ3N0YXR1cyc6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBU1Igc3RhdHVzOicsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZGRMb2dFbnRyeSgnaW5mbycsIG1lc3NhZ2UpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAncHJvZ3Jlc3MnOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgQVNSICR7c3RhZ2V9OmAsIE1hdGgucm91bmQocHJvZ3Jlc3MgKiAxMDApICsgJyUnKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2luZm8nLCBgJHtzdGFnZX06ICR7TWF0aC5yb3VuZChwcm9ncmVzcyAqIDEwMCl9JWApO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgY2FzZSAndHJhbnNjcmlwdGlvbic6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXRJbnB1dC52YWx1ZSA9IChjaGF0SW5wdXQudmFsdWUgKyAnICcgKyB0ZXh0KS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zdCBlcnJvckRldGFpbHMgPSB7XHJcbiAgICAgICAgICAgIG1lc3NhZ2U6IGVycm9yLm1lc3NhZ2UsXHJcbiAgICAgICAgICAgIG5hbWU6IGVycm9yLm5hbWUsXHJcbiAgICAgICAgICAgIHN0YWNrOiBlcnJvci5zdGFjayxcclxuICAgICAgICAgICAgd2ViZ3B1U3VwcG9ydDogJ25hdmlnYXRvcicgaW4gZ2xvYmFsVGhpcyAmJiAnZ3B1JyBpbiBuYXZpZ2F0b3IsXHJcbiAgICAgICAgICAgIHdvcmtlclN1cHBvcnQ6ICdXb3JrZXInIGluIHdpbmRvd1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgaW5pdGlhbGl6aW5nIEFTUjonLCBlcnJvckRldGFpbHMpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdGYWlsZWQgdG8gaW5pdGlhbGl6ZSBBU1Igd29ya2VyJyk7XHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgYEVycm9yOiAke2Vycm9yLm1lc3NhZ2V9YCk7XHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgYFdlYkdQVSBTdXBwb3J0OiAke2Vycm9yRGV0YWlscy53ZWJncHVTdXBwb3J0ID8gJ1llcycgOiAnTm8nfWApO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGBXb3JrZXIgU3VwcG9ydDogJHtlcnJvckRldGFpbHMud29ya2VyU3VwcG9ydCA/ICdZZXMnIDogJ05vJ31gKTtcclxuICAgICAgICBcclxuICAgICAgICAvLyBTaG93IFdlYkdQVSBpbnN0cnVjdGlvbnMgaWYgbm90IHN1cHBvcnRlZFxyXG4gICAgICAgIGlmICghZXJyb3JEZXRhaWxzLndlYmdwdVN1cHBvcnQpIHtcclxuICAgICAgICAgICAgY29uc3QgaW5zdHJ1Y3Rpb25zID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgICAgIGluc3RydWN0aW9ucy5jbGFzc05hbWUgPSAnbG9nLWVudHJ5IGluZm8nO1xyXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuaW5uZXJIVE1MID0gYFxyXG4gICAgICAgICAgICAgICAgV2ViR1BVIGlzIHJlcXVpcmVkIGZvciBzcGVlY2ggcmVjb2duaXRpb246XHJcbiAgICAgICAgICAgICAgICA8b2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlVzZSBDaHJvbWUgQ2FuYXJ5IG9yIENocm9tZSBEZXYgKHZlcnNpb24gMTEzKyk8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5FbmFibGUgV2ViR1BVIGluIGNocm9tZTovL2ZsYWdzPC9saT5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+UmVzdGFydCB0aGUgYnJvd3NlcjwvbGk+XHJcbiAgICAgICAgICAgICAgICA8L29sPlxyXG4gICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICBsb2dNZXNzYWdlcz8uYXBwZW5kQ2hpbGQoaW5zdHJ1Y3Rpb25zKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWljQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufVxyXG5cclxuLy8gRGlzYWJsZSBtaWMgYnV0dG9uIGluaXRpYWxseVxyXG5taWNCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cclxuLy8gRG93bmxvYWQgYW5kIGNhY2hlIHRoZSBDb3BpbG90IGF2YXRhclxyXG5hc3luYyBmdW5jdGlvbiBjYWNoZUljb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb20vdS8xMjMyNjU5MzQnKTtcclxuICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xyXG4gICAgICAgIGNvbnN0IGljb25VcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGNvbnN0IGxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbGlua1tyZWwqPVwiaWNvblwiXScpO1xyXG4gICAgICAgIGxpbmtzLmZvckVhY2gobGluayA9PiB7XHJcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IGljb25Vcmw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjYWNoZSBpY29uOicsIGVycm9yKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSB3aGVuIHBvcHVwIGxvYWRzXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcclxuICAgICAgICAgICAgaW5pdEFTUigpLFxyXG4gICAgICAgICAgICBjYWNoZUljb24oKVxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsaXphdGlvbiBjb21wbGV0ZScpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbml0aWFsaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdGYWlsZWQgdG8gaW5pdGlhbGl6ZTogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RNaWNyb3Bob25lUGVybWlzc2lvbnMoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHBlcm1pc3Npb25zIGFyZSBhbHJlYWR5IGdyYW50ZWRcclxuICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IGF3YWl0IG5hdmlnYXRvci5wZXJtaXNzaW9ucy5xdWVyeSh7IG5hbWU6ICdtaWNyb3Bob25lJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdncmFudGVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHBlcm1pc3Npb25zLnN0YXRlID09PSAncHJvbXB0Jykge1xyXG4gICAgICAgICAgICAvLyBTaG93IGluc3RydWN0aW9ucyB0byB1c2VyIGJlZm9yZSByZXF1ZXN0aW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdpbmZvJywgJ1BsZWFzZSBhbGxvdyBtaWNyb3Bob25lIGFjY2VzcyBpbiB0aGUgYnJvd3NlciBwcm9tcHQnKTtcclxuICAgICAgICAgICAgLy8gUmVxdWVzdCBwZXJtaXNzaW9ucyBleHBsaWNpdGx5XHJcbiAgICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSk7XHJcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnN0b3AoKSk7IC8vIENsZWFuIHVwIHRlc3Qgc3RyZWFtXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdkZW5pZWQnKSB7XHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdNaWNyb3Bob25lIGFjY2VzcyBpcyBibG9ja2VkLiBQbGVhc2UgYWxsb3cgYWNjZXNzIGluIHlvdXIgYnJvd3NlciBzZXR0aW5ncy4nKTtcclxuICAgICAgICAgICAgLy8gU2hvdyBpbnN0cnVjdGlvbnMgZm9yIGVuYWJsaW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuY2xhc3NOYW1lID0gJ2xvZy1lbnRyeSBpbmZvJztcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIFRvIGVuYWJsZSBtaWNyb3Bob25lIGFjY2VzczpcclxuICAgICAgICAgICAgICAgIDxvbD5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+Q2xpY2sgdGhlIGNhbWVyYS9taWNyb3Bob25lIGljb24gaW4geW91ciBicm93c2VyJ3MgYWRkcmVzcyBiYXI8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5TZWxlY3QgXCJBbGxvd1wiIGZvciBtaWNyb3Bob25lIGFjY2VzczwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlJlZnJlc2ggdGhpcyBwYWdlPC9saT5cclxuICAgICAgICAgICAgICAgIDwvb2w+XHJcbiAgICAgICAgICAgIGA7XHJcbiAgICAgICAgICAgIGxvZ01lc3NhZ2VzLmFwcGVuZENoaWxkKGluc3RydWN0aW9ucyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHBlcm1pc3Npb25zOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0UmVjb3JkaW5nKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBDaGVjayBwZXJtaXNzaW9ucyBmaXJzdFxyXG4gICAgICAgIGNvbnN0IGhhc1Blcm1pc3Npb24gPSBhd2FpdCByZXF1ZXN0TWljcm9waG9uZVBlcm1pc3Npb25zKCk7XHJcbiAgICAgICAgaWYgKCFoYXNQZXJtaXNzaW9uKSB7XHJcbiAgICAgICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcXVlc3RpbmcgbWljcm9waG9uZSBhY2Nlc3MuLi4nKTtcclxuICAgICAgICBjb25zdCBjb25zdHJhaW50cyA9IHsgXHJcbiAgICAgICAgICAgIGF1ZGlvOiB7XHJcbiAgICAgICAgICAgICAgICBjaGFubmVsQ291bnQ6IDEsXHJcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlOiAxNjAwMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShjb25zdHJhaW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01pY3JvcGhvbmUgYWNjZXNzIGdyYW50ZWQ6Jywgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKClbMF0uZ2V0U2V0dGluZ3MoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwge1xyXG4gICAgICAgICAgICBtaW1lVHlwZTogJ2F1ZGlvL3dlYm07Y29kZWNzPW9wdXMnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01lZGlhUmVjb3JkZXIgY3JlYXRlZCB3aXRoIHNldHRpbmdzOicsIG1lZGlhUmVjb3JkZXIubWltZVR5cGUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZWNvcmRlZENodW5rcy5wdXNoKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZGVkIGNodW5rIHNpemU6JywgZXZlbnQuZGF0YS5zaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01lZGlhUmVjb3JkZXIgZXJyb3I6JywgZXZlbnQuZXJyb3IpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnN0b3AgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIHN0b3BwZWQsIHByb2Nlc3NpbmcgYXVkaW8uLi4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvQmxvYiA9IG5ldyBCbG9iKHJlY29yZGVkQ2h1bmtzLCB7IHR5cGU6ICdhdWRpby93ZWJtJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBibG9iIGNyZWF0ZWQsIHNpemU6JywgYXVkaW9CbG9iLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MgPSBbXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCBhdWRpbyB0byBwcm9wZXIgZm9ybWF0IGZvciBXaGlzcGVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KHsgc2FtcGxlUmF0ZTogMTYwMDAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0RhdGEgPSBhd2FpdCBhdWRpb0Jsb2IuYXJyYXlCdWZmZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkYXRhIHNpemU6JywgYXVkaW9EYXRhLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0J1ZmZlciA9IGF3YWl0IGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkZWNvZGVkLCBkdXJhdGlvbjonLCBhdWRpb0J1ZmZlci5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdldCBhdWRpbyBkYXRhIGFzIEZsb2F0MzJBcnJheVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSBhdWRpb0J1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBjb252ZXJ0ZWQgdG8gRmxvYXQzMkFycmF5LCBsZW5ndGg6JywgYXVkaW8ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCB0byB3b3JrZXIgZm9yIHRyYW5zY3JpcHRpb25cclxuICAgICAgICAgICAgICAgIGlmIChhc3JXb3JrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhc3JXb3JrZXIucG9zdE1lc3NhZ2UoeyBidWZmZXI6IGF1ZGlvIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBzZW50IHRvIEFTUiB3b3JrZXInKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQVNSIHdvcmtlciBub3QgaW5pdGlhbGl6ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXBcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjay5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1ZGlvIHRyYWNrIHN0b3BwZWQ6JywgdHJhY2subGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgcmVjb3JkZWQgYXVkaW86JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdJbnZhbGlkU3RhdGVFcnJvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBdWRpbyBjb250ZXh0IGVycm9yIC0gcG9zc2libGUgc2FtcGxlIHJhdGUgb3IgZm9ybWF0IGlzc3VlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRXJyb3IgcHJvY2Vzc2luZyBhdWRpbzonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTsgLy8gQ29sbGVjdCBkYXRhIGluIDEtc2Vjb25kIGNodW5rc1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNvcmRpbmcgc3RhcnRlZCcpO1xyXG4gICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QuYWRkKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhcnRpbmcgcmVjb3JkaW5nOicsIHtcclxuICAgICAgICAgICAgbmFtZTogZXJyb3IubmFtZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgY29uc3RyYWludDogZXJyb3IuY29uc3RyYWludCxcclxuICAgICAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9ICdDb3VsZCBub3Qgc3RhcnQgcmVjb3JkaW5nOiAnO1xyXG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnTm90QWxsb3dlZEVycm9yJykge1xyXG4gICAgICAgICAgICAvLyBEb24ndCBzaG93IHRoaXMgbWVzc2FnZSBzaW5jZSB3ZSBoYW5kbGUgaXQgaW4gcmVxdWVzdE1pY3JvcGhvbmVQZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdObyBtaWNyb3Bob25lIHdhcyBmb3VuZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90UmVhZGFibGVFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdNaWNyb3Bob25lIGlzIGFscmVhZHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwbGljYXRpb24nO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBlcnJvci5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3BSZWNvcmRpbmcoKSB7XHJcbiAgICBpZiAobWVkaWFSZWNvcmRlciAmJiBtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncmVjb3JkaW5nJykge1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBJbml0aWFsaXplIEFTUiB3aGVuIHBvcHVwIGlzIGxvYWRlZFxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBpbml0QVNSKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0FTUiBpbml0aWFsaXphdGlvbiBjb21wbGV0ZScpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdBU1IgaW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemUgQVNSOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gQWRkIGNsaWNrIGhhbmRsZXIgZm9yIG1pYyBidXR0b25cclxubWljQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgaWYgKCFtZWRpYVJlY29yZGVyIHx8IG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdpbmFjdGl2ZScpIHtcclxuICAgICAgICBzdGFydFJlY29yZGluZygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzdG9wUmVjb3JkaW5nKCk7XHJcbiAgICB9XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=