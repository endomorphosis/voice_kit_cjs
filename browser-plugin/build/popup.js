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

// Disable mic button permanently while ASR is disabled
micButton.disabled = true;
micButton.title = "Speech recognition temporarily disabled";

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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQU87QUFDQTs7Ozs7OztVQ0RQO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0NBQXdDLDRCQUE0QjtBQUNwRTtBQUNBLE1BQU07QUFDTix5Q0FBeUMsYUFBYTtBQUN0RDtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlDQUFpQyxzQkFBc0I7QUFDdkQsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUMsS0FBSztBQUN4QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLHNDQUFzQyw4QkFBOEI7QUFDcEU7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBLGdFQUFnRSxvQkFBb0I7QUFDcEY7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBLHVFQUF1RSxhQUFhO0FBQ3BGLCtEQUErRDtBQUMvRDtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtDQUFrQztBQUNsQyxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw2REFBNkQsb0JBQW9CO0FBQ2pGO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esd0RBQXdELG1CQUFtQjtBQUMzRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSw0Q0FBNEMsZUFBZTtBQUMzRDtBQUNBLGtCQUFrQjtBQUNsQjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGlCQUFpQjtBQUNqQjtBQUNBO0FBQ0EsY0FBYztBQUNkO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBbUM7QUFDbkM7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBLFVBQVU7QUFDVjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLENBQUMsRUFBRTtBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vLi9zcmMvY29uc3RhbnRzLmpzIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQ09OVEVYVF9NRU5VX0lURU1fSUQgPSBcImdlbmVyYXRlLWZyb20tc2VsZWN0aW9uXCI7XHJcbmV4cG9ydCBjb25zdCBBQ1RJT05fTkFNRSA9IFwiZ2VuZXJhdGVcIjtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBwb3B1cC5qcyAtIGhhbmRsZXMgaW50ZXJhY3Rpb24gd2l0aCB0aGUgZXh0ZW5zaW9uJ3MgcG9wdXAsIHNlbmRzIHJlcXVlc3RzIHRvIHRoZVxyXG4vLyBzZXJ2aWNlIHdvcmtlciAoYmFja2dyb3VuZC5qcyksIGFuZCB1cGRhdGVzIHRoZSBwb3B1cCdzIFVJIChwb3B1cC5odG1sKSBvbiBjb21wbGV0aW9uLlxyXG5cclxuaW1wb3J0IHsgQUNUSU9OX05BTUUgfSBmcm9tIFwiLi9jb25zdGFudHMuanNcIjtcclxuXHJcbi8vIEltcG9ydCBvbmx5IHdoYXQgd2UgbmVlZFxyXG5jb25zdCBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRwdXRcIik7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0XHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdQb3B1cCByZWNlaXZlZCBtZXNzYWdlOicsIG1lc3NhZ2UpO1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhdHVzKSB7XHJcbiAgICAgICAgdXBkYXRlU3RhdHVzKG1lc3NhZ2UpO1xyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICd0b2tlbicpIHtcclxuICAgICAgICAvLyBIYW5kbGUgc3RyZWFtaW5nIHRva2VuIHVwZGF0ZXNcclxuICAgICAgICBjb25zdCBjdXJyZW50TWVzc2FnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlLmFzc2lzdGFudDpsYXN0LWNoaWxkJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRNZXNzYWdlLnRleHRDb250ZW50ICs9IG1lc3NhZ2UudG9rZW47XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkTWVzc2FnZShtZXNzYWdlLnRva2VuLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICAvLyBHZW5lcmF0aW9uIGlzIGNvbXBsZXRlIC0gZW5zdXJlIGZpbmFsIHRleHQgaXMgY29ycmVjdFxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRNZXNzYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2UuYXNzaXN0YW50Omxhc3QtY2hpbGQnKTtcclxuICAgICAgICBpZiAoY3VycmVudE1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgY3VycmVudE1lc3NhZ2UudGV4dENvbnRlbnQgPSBtZXNzYWdlLmZ1bGxUZXh0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0dXMobWVzc2FnZSkge1xyXG4gICAgY29uc3Qgc3RhdHVzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJyk7XHJcbiAgICBjb25zdCBzdGF0dXNJbmRpY2F0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzLWluZGljYXRvcicpO1xyXG4gICAgY29uc3QgcHJvZ3Jlc3NFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nLXByb2dyZXNzJyk7XHJcbiAgICBcclxuICAgIGlmICghc3RhdHVzRWwgfHwgIXN0YXR1c0luZGljYXRvcikgcmV0dXJuO1xyXG5cclxuICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSBtZXNzYWdlLnN0YXR1cztcclxuICAgIFxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAnbG9hZGluZycpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9ICdMb2FkaW5nIG1vZGVsLi4uJztcclxuICAgICAgICBpZiAobWVzc2FnZS5wcm9ncmVzcykge1xyXG4gICAgICAgICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gYCR7bWVzc2FnZS5wcm9ncmVzcy50b0ZpeGVkKDEpfSVgO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGF0dXMgPT09ICdlcnJvcicpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IGBFcnJvcjogJHttZXNzYWdlLmRhdGF9YDtcclxuICAgICAgICBzdGF0dXNJbmRpY2F0b3IuY2xhc3NOYW1lID0gJ2Vycm9yJztcclxuICAgICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAncmVhZHknKSB7XHJcbiAgICAgICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSAnTW9kZWwgcmVhZHknO1xyXG4gICAgICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSAncmVhZHknO1xyXG4gICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSAnJztcclxuICAgIH1cclxufVxyXG5cclxuLy8gQ2hlY2sgaW5pdGlhbCBzdGF0dXMgd2hlbiBwb3B1cCBvcGVuc1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ1BvcHVwIG9wZW5lZCcpO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiAnY2hlY2tfc3RhdHVzJyB9KTtcclxufSk7XHJcblxyXG4vLyBDb25zb2xlIGxvZ2dpbmcgb3ZlcnJpZGVcclxuY29uc3QgbG9nTWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nLW1lc3NhZ2VzJyk7XHJcbmNvbnN0IG9yaWdpbmFsQ29uc29sZSA9IHtcclxuICAgIGxvZzogY29uc29sZS5sb2csXHJcbiAgICBlcnJvcjogY29uc29sZS5lcnJvcixcclxuICAgIGluZm86IGNvbnNvbGUuaW5mb1xyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkTG9nRW50cnkodHlwZSwgLi4uYXJncykge1xyXG4gICAgY29uc3QgZW50cnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGVudHJ5LmNsYXNzTmFtZSA9IGBsb2ctZW50cnkgJHt0eXBlfWA7XHJcbiAgICBlbnRyeS50ZXh0Q29udGVudCA9IGFyZ3MubWFwKGFyZyA9PiBcclxuICAgICAgICB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KGFyZykgOiBhcmdcclxuICAgICkuam9pbignICcpO1xyXG4gICAgbG9nTWVzc2FnZXM/LmFwcGVuZENoaWxkKGVudHJ5KTtcclxuICAgIGxvZ01lc3NhZ2VzPy5zY3JvbGxUbygwLCBsb2dNZXNzYWdlcy5zY3JvbGxIZWlnaHQpO1xyXG4gICAgcmV0dXJuIG9yaWdpbmFsQ29uc29sZVt0eXBlXSguLi5hcmdzKTtcclxufVxyXG5cclxuY29uc29sZS5sb2cgPSAoLi4uYXJncykgPT4gYWRkTG9nRW50cnkoJ2luZm8nLCAuLi5hcmdzKTtcclxuY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiBhZGRMb2dFbnRyeSgnZXJyb3InLCAuLi5hcmdzKTtcclxuY29uc29sZS5pbmZvID0gKC4uLmFyZ3MpID0+IGFkZExvZ0VudHJ5KCdpbmZvJywgLi4uYXJncyk7XHJcblxyXG4vLyBDaGF0IGZ1bmN0aW9uYWxpdHlcclxuY29uc3QgY2hhdElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXQtaW5wdXQnKTtcclxuY29uc3Qgc2VuZEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZW5kLWJ1dHRvbicpO1xyXG5jb25zdCBjaGF0TWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhdC1tZXNzYWdlcycpO1xyXG5cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShjb250ZW50LCBpc1VzZXIgPSBmYWxzZSkge1xyXG4gICAgY29uc3QgbWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgbWVzc2FnZURpdi5jbGFzc05hbWUgPSBgbWVzc2FnZSAke2lzVXNlciA/ICd1c2VyJyA6ICdhc3Npc3RhbnQnfWA7XHJcbiAgICBtZXNzYWdlRGl2LnRleHRDb250ZW50ID0gY29udGVudDtcclxuICAgIGNoYXRNZXNzYWdlcy5hcHBlbmRDaGlsZChtZXNzYWdlRGl2KTtcclxuICAgIGNoYXRNZXNzYWdlcy5zY3JvbGxUbygwLCBjaGF0TWVzc2FnZXMuc2Nyb2xsSGVpZ2h0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKSB7XHJcbiAgICBjb25zdCB0ZXh0ID0gY2hhdElucHV0LnZhbHVlLnRyaW0oKTtcclxuICAgIGlmICghdGV4dCkgcmV0dXJuO1xyXG5cclxuICAgIGFkZE1lc3NhZ2UodGV4dCwgdHJ1ZSk7XHJcbiAgICBjaGF0SW5wdXQudmFsdWUgPSAnJztcclxuICAgIFxyXG4gICAgLy8gQ3JlYXRlIGVtcHR5IGFzc2lzdGFudCBtZXNzYWdlIGZvciBzdHJlYW1pbmdcclxuICAgIGFkZE1lc3NhZ2UoJycsIGZhbHNlKTtcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGUnLFxyXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgICAgICBhZGRNZXNzYWdlKCdFcnJvcjogJyArIHJlc3BvbnNlLmVycm9yKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZTonLCBlcnJvcik7XHJcbiAgICAgICAgYWRkTWVzc2FnZSgnRXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbmRNZXNzYWdlKTtcclxuY2hhdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgKGUpID0+IHtcclxuICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZW5kTWVzc2FnZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFNwZWVjaCByZWNvZ25pdGlvbiBzZXR1cFxyXG5jb25zdCBtaWNCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWljLWJ1dHRvbicpO1xyXG5sZXQgbWVkaWFSZWNvcmRlciA9IG51bGw7XHJcbmxldCByZWNvcmRlZENodW5rcyA9IFtdO1xyXG5sZXQgYXNyV29ya2VyID0gbnVsbDtcclxuXHJcbi8vIERpc2FibGUgbWljIGJ1dHRvbiBwZXJtYW5lbnRseSB3aGlsZSBBU1IgaXMgZGlzYWJsZWRcclxubWljQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxubWljQnV0dG9uLnRpdGxlID0gXCJTcGVlY2ggcmVjb2duaXRpb24gdGVtcG9yYXJpbHkgZGlzYWJsZWRcIjtcclxuXHJcbi8vIFJlc3Qgb2YgQVNSIGZ1bmN0aW9uYWxpdHkgdGVtcG9yYXJpbHkgZGlzYWJsZWRcclxuLypcclxuYXN5bmMgZnVuY3Rpb24gaW5pdEFTUigpIHtcclxuLy8gLi4uZXhpc3RpbmcgY29kZS4uLiBcclxufVxyXG4qL1xyXG5cclxuLy8gRGlzYWJsZSBtaWMgYnV0dG9uIGluaXRpYWxseVxyXG5taWNCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cclxuLy8gRG93bmxvYWQgYW5kIGNhY2hlIHRoZSBDb3BpbG90IGF2YXRhclxyXG5hc3luYyBmdW5jdGlvbiBjYWNoZUljb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb20vdS8xMjMyNjU5MzQnKTtcclxuICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xyXG4gICAgICAgIGNvbnN0IGljb25VcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGNvbnN0IGxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbGlua1tyZWwqPVwiaWNvblwiXScpO1xyXG4gICAgICAgIGxpbmtzLmZvckVhY2gobGluayA9PiB7XHJcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IGljb25Vcmw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjYWNoZSBpY29uOicsIGVycm9yKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSB3aGVuIHBvcHVwIGxvYWRzXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcclxuICAgICAgICAgICAgLy8gaW5pdEFTUigpLCAvLyBUZW1wb3JhcmlseSBkaXNhYmxlZFxyXG4gICAgICAgICAgICBjYWNoZUljb24oKVxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsaXphdGlvbiBjb21wbGV0ZScpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbml0aWFsaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdGYWlsZWQgdG8gaW5pdGlhbGl6ZTogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RNaWNyb3Bob25lUGVybWlzc2lvbnMoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHBlcm1pc3Npb25zIGFyZSBhbHJlYWR5IGdyYW50ZWRcclxuICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IGF3YWl0IG5hdmlnYXRvci5wZXJtaXNzaW9ucy5xdWVyeSh7IG5hbWU6ICdtaWNyb3Bob25lJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdncmFudGVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHBlcm1pc3Npb25zLnN0YXRlID09PSAncHJvbXB0Jykge1xyXG4gICAgICAgICAgICAvLyBTaG93IGluc3RydWN0aW9ucyB0byB1c2VyIGJlZm9yZSByZXF1ZXN0aW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdpbmZvJywgJ1BsZWFzZSBhbGxvdyBtaWNyb3Bob25lIGFjY2VzcyBpbiB0aGUgYnJvd3NlciBwcm9tcHQnKTtcclxuICAgICAgICAgICAgLy8gUmVxdWVzdCBwZXJtaXNzaW9ucyBleHBsaWNpdGx5XHJcbiAgICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSk7XHJcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnN0b3AoKSk7IC8vIENsZWFuIHVwIHRlc3Qgc3RyZWFtXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdkZW5pZWQnKSB7XHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdNaWNyb3Bob25lIGFjY2VzcyBpcyBibG9ja2VkLiBQbGVhc2UgYWxsb3cgYWNjZXNzIGluIHlvdXIgYnJvd3NlciBzZXR0aW5ncy4nKTtcclxuICAgICAgICAgICAgLy8gU2hvdyBpbnN0cnVjdGlvbnMgZm9yIGVuYWJsaW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuY2xhc3NOYW1lID0gJ2xvZy1lbnRyeSBpbmZvJztcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIFRvIGVuYWJsZSBtaWNyb3Bob25lIGFjY2VzczpcclxuICAgICAgICAgICAgICAgIDxvbD5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+Q2xpY2sgdGhlIGNhbWVyYS9taWNyb3Bob25lIGljb24gaW4geW91ciBicm93c2VyJ3MgYWRkcmVzcyBiYXI8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5TZWxlY3QgXCJBbGxvd1wiIGZvciBtaWNyb3Bob25lIGFjY2VzczwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlJlZnJlc2ggdGhpcyBwYWdlPC9saT5cclxuICAgICAgICAgICAgICAgIDwvb2w+XHJcbiAgICAgICAgICAgIGA7XHJcbiAgICAgICAgICAgIGxvZ01lc3NhZ2VzLmFwcGVuZENoaWxkKGluc3RydWN0aW9ucyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHBlcm1pc3Npb25zOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0UmVjb3JkaW5nKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBDaGVjayBwZXJtaXNzaW9ucyBmaXJzdFxyXG4gICAgICAgIGNvbnN0IGhhc1Blcm1pc3Npb24gPSBhd2FpdCByZXF1ZXN0TWljcm9waG9uZVBlcm1pc3Npb25zKCk7XHJcbiAgICAgICAgaWYgKCFoYXNQZXJtaXNzaW9uKSB7XHJcbiAgICAgICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcXVlc3RpbmcgbWljcm9waG9uZSBhY2Nlc3MuLi4nKTtcclxuICAgICAgICBjb25zdCBjb25zdHJhaW50cyA9IHsgXHJcbiAgICAgICAgICAgIGF1ZGlvOiB7XHJcbiAgICAgICAgICAgICAgICBjaGFubmVsQ291bnQ6IDEsXHJcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlOiAxNjAwMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShjb25zdHJhaW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01pY3JvcGhvbmUgYWNjZXNzIGdyYW50ZWQ6Jywgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKClbMF0uZ2V0U2V0dGluZ3MoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwge1xyXG4gICAgICAgICAgICBtaW1lVHlwZTogJ2F1ZGlvL3dlYm07Y29kZWNzPW9wdXMnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01lZGlhUmVjb3JkZXIgY3JlYXRlZCB3aXRoIHNldHRpbmdzOicsIG1lZGlhUmVjb3JkZXIubWltZVR5cGUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZWNvcmRlZENodW5rcy5wdXNoKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZGVkIGNodW5rIHNpemU6JywgZXZlbnQuZGF0YS5zaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01lZGlhUmVjb3JkZXIgZXJyb3I6JywgZXZlbnQuZXJyb3IpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnN0b3AgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIHN0b3BwZWQsIHByb2Nlc3NpbmcgYXVkaW8uLi4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvQmxvYiA9IG5ldyBCbG9iKHJlY29yZGVkQ2h1bmtzLCB7IHR5cGU6ICdhdWRpby93ZWJtJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBibG9iIGNyZWF0ZWQsIHNpemU6JywgYXVkaW9CbG9iLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MgPSBbXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCBhdWRpbyB0byBwcm9wZXIgZm9ybWF0IGZvciBXaGlzcGVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KHsgc2FtcGxlUmF0ZTogMTYwMDAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0RhdGEgPSBhd2FpdCBhdWRpb0Jsb2IuYXJyYXlCdWZmZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkYXRhIHNpemU6JywgYXVkaW9EYXRhLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0J1ZmZlciA9IGF3YWl0IGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkZWNvZGVkLCBkdXJhdGlvbjonLCBhdWRpb0J1ZmZlci5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdldCBhdWRpbyBkYXRhIGFzIEZsb2F0MzJBcnJheVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSBhdWRpb0J1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBjb252ZXJ0ZWQgdG8gRmxvYXQzMkFycmF5LCBsZW5ndGg6JywgYXVkaW8ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCB0byB3b3JrZXIgZm9yIHRyYW5zY3JpcHRpb25cclxuICAgICAgICAgICAgICAgIGlmIChhc3JXb3JrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhc3JXb3JrZXIucG9zdE1lc3NhZ2UoeyBidWZmZXI6IGF1ZGlvIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBzZW50IHRvIEFTUiB3b3JrZXInKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQVNSIHdvcmtlciBub3QgaW5pdGlhbGl6ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXBcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjay5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1ZGlvIHRyYWNrIHN0b3BwZWQ6JywgdHJhY2subGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgcmVjb3JkZWQgYXVkaW86JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdJbnZhbGlkU3RhdGVFcnJvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBdWRpbyBjb250ZXh0IGVycm9yIC0gcG9zc2libGUgc2FtcGxlIHJhdGUgb3IgZm9ybWF0IGlzc3VlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRXJyb3IgcHJvY2Vzc2luZyBhdWRpbzonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTsgLy8gQ29sbGVjdCBkYXRhIGluIDEtc2Vjb25kIGNodW5rc1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNvcmRpbmcgc3RhcnRlZCcpO1xyXG4gICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QuYWRkKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhcnRpbmcgcmVjb3JkaW5nOicsIHtcclxuICAgICAgICAgICAgbmFtZTogZXJyb3IubmFtZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgY29uc3RyYWludDogZXJyb3IuY29uc3RyYWludCxcclxuICAgICAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9ICdDb3VsZCBub3Qgc3RhcnQgcmVjb3JkaW5nOiAnO1xyXG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnTm90QWxsb3dlZEVycm9yJykge1xyXG4gICAgICAgICAgICAvLyBEb24ndCBzaG93IHRoaXMgbWVzc2FnZSBzaW5jZSB3ZSBoYW5kbGUgaXQgaW4gcmVxdWVzdE1pY3JvcGhvbmVQZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdObyBtaWNyb3Bob25lIHdhcyBmb3VuZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90UmVhZGFibGVFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdNaWNyb3Bob25lIGlzIGFscmVhZHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwbGljYXRpb24nO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBlcnJvci5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3BSZWNvcmRpbmcoKSB7XHJcbiAgICBpZiAobWVkaWFSZWNvcmRlciAmJiBtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncmVjb3JkaW5nJykge1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBJbml0aWFsaXplIEFTUiB3aGVuIHBvcHVwIGlzIGxvYWRlZFxyXG4vLyBUZW1wb3JhcmlseSBkaXNhYmxlZCBBU1IgaW5pdGlhbGl6YXRpb25cclxuLypkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBpbml0QVNSKCk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ0FTUiBpbml0aWFsaXphdGlvbiBjb21wbGV0ZScpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdBU1IgaW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemUgQVNSOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICB9XHJcbn0pOyovXHJcblxyXG4vLyBBZGQgY2xpY2sgaGFuZGxlciBmb3IgbWljIGJ1dHRvblxyXG5taWNCdXR0b24uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XHJcbiAgICBpZiAoIW1lZGlhUmVjb3JkZXIgfHwgbWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ2luYWN0aXZlJykge1xyXG4gICAgICAgIHN0YXJ0UmVjb3JkaW5nKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHN0b3BSZWNvcmRpbmcoKTtcclxuICAgIH1cclxufSk7XHJcbiJdLCJuYW1lcyI6W10sInNvdXJjZVJvb3QiOiIifQ==