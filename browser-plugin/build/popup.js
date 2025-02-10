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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXAuanMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQU87QUFDQTs7Ozs7OztVQ0RQO1VBQ0E7O1VBRUE7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7O1VBRUE7VUFDQTs7VUFFQTtVQUNBO1VBQ0E7Ozs7O1dDdEJBO1dBQ0E7V0FDQTtXQUNBO1dBQ0EseUNBQXlDLHdDQUF3QztXQUNqRjtXQUNBO1dBQ0E7Ozs7O1dDUEE7Ozs7O1dDQUE7V0FDQTtXQUNBO1dBQ0EsdURBQXVELGlCQUFpQjtXQUN4RTtXQUNBLGdEQUFnRCxhQUFhO1dBQzdEOzs7Ozs7Ozs7Ozs7QUNOQTtBQUNBO0FBQ0E7QUFDNkM7QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMENBQTBDLFNBQVM7QUFDbkQsd0NBQXdDLG9CQUFvQjtBQUM1RDtBQUNBO0FBQ0E7QUFDQSw0REFBNEQsa0JBQWtCO0FBQzlFLGNBQWM7QUFDZDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsaUNBQWlDLHNCQUFzQjtBQUN2RCxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLG1DQUFtQyxLQUFLO0FBQ3hDO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLDhCQUE4QjtBQUNwRTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDREQUE0RCw0QkFBNEI7QUFDeEY7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE1BQU07QUFDTjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsMkJBQTJCLGtDQUFrQztBQUM3RDtBQUNBLDBCQUEwQixtQkFBbUI7QUFDN0M7QUFDQTtBQUNBO0FBQ0Esc0JBQXNCO0FBQ3RCO0FBQ0E7QUFDQSxpQkFBaUI7QUFDakI7QUFDQSxhQUFhO0FBQ2I7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQWE7QUFDYjtBQUNBO0FBQ0E7QUFDQSxhQUFhO0FBQ2IsU0FBUztBQUNUO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNUO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLDhCQUE4QjtBQUM5QixLQUFLO0FBQ0w7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx5REFBeUQsb0JBQW9CO0FBQzdFO0FBQ0E7QUFDQSxvREFBb0QsbUJBQW1CO0FBQ3ZFO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx3Q0FBd0MsZUFBZTtBQUN2RCxjQUFjO0FBQ2Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsVUFBVTtBQUNWO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUNOO0FBQ0E7QUFDQTtBQUNBLENBQUMsRUFBRTtBQUNIO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxNQUFNO0FBQ047QUFDQTtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vLi9zcmMvY29uc3RhbnRzLmpzIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL2Jvb3RzdHJhcCIsIndlYnBhY2s6Ly9oYWxsdWNpbmF0ZS1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvbWFrZSBuYW1lc3BhY2Ugb2JqZWN0Iiwid2VicGFjazovL2hhbGx1Y2luYXRlLWV4dGVuc2lvbi8uL3NyYy9wb3B1cC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgY29uc3QgQ09OVEVYVF9NRU5VX0lURU1fSUQgPSBcImdlbmVyYXRlLWZyb20tc2VsZWN0aW9uXCI7XHJcbmV4cG9ydCBjb25zdCBBQ1RJT05fTkFNRSA9IFwiZ2VuZXJhdGVcIjtcclxuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXShtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb25zIGZvciBoYXJtb255IGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uZCA9IChleHBvcnRzLCBkZWZpbml0aW9uKSA9PiB7XG5cdGZvcih2YXIga2V5IGluIGRlZmluaXRpb24pIHtcblx0XHRpZihfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZGVmaW5pdGlvbiwga2V5KSAmJiAhX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIGtleSkpIHtcblx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBrZXksIHsgZW51bWVyYWJsZTogdHJ1ZSwgZ2V0OiBkZWZpbml0aW9uW2tleV0gfSk7XG5cdFx0fVxuXHR9XG59OyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCIvLyBwb3B1cC5qcyAtIGhhbmRsZXMgaW50ZXJhY3Rpb24gd2l0aCB0aGUgZXh0ZW5zaW9uJ3MgcG9wdXAsIHNlbmRzIHJlcXVlc3RzIHRvIHRoZVxyXG4vLyBzZXJ2aWNlIHdvcmtlciAoYmFja2dyb3VuZC5qcyksIGFuZCB1cGRhdGVzIHRoZSBwb3B1cCdzIFVJIChwb3B1cC5odG1sKSBvbiBjb21wbGV0aW9uLlxyXG5cclxuaW1wb3J0IHsgQUNUSU9OX05BTUUgfSBmcm9tIFwiLi9jb25zdGFudHMuanNcIjtcclxuXHJcbi8vIEltcG9ydCBvbmx5IHdoYXQgd2UgbmVlZFxyXG5jb25zdCBvdXRwdXRFbGVtZW50ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJvdXRwdXRcIik7XHJcblxyXG4vLyBMaXN0ZW4gZm9yIG1lc3NhZ2VzIGZyb20gdGhlIGJhY2tncm91bmQgc2NyaXB0XHJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcclxuICAgIGNvbnNvbGUubG9nKCdQb3B1cCByZWNlaXZlZCBtZXNzYWdlOicsIG1lc3NhZ2UpO1xyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhdHVzKSB7XHJcbiAgICAgICAgdXBkYXRlU3RhdHVzKG1lc3NhZ2UpO1xyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICd0b2tlbicpIHtcclxuICAgICAgICAvLyBIYW5kbGUgc3RyZWFtaW5nIHRva2VuIHVwZGF0ZXNcclxuICAgICAgICBjb25zdCBjdXJyZW50TWVzc2FnZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5tZXNzYWdlLmFzc2lzdGFudDpsYXN0LWNoaWxkJyk7XHJcbiAgICAgICAgaWYgKGN1cnJlbnRNZXNzYWdlKSB7XHJcbiAgICAgICAgICAgIGN1cnJlbnRNZXNzYWdlLnRleHRDb250ZW50ICs9IG1lc3NhZ2UudG9rZW47XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgYWRkTWVzc2FnZShtZXNzYWdlLnRva2VuLCBmYWxzZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnR5cGUgPT09ICdjb21wbGV0ZScpIHtcclxuICAgICAgICAvLyBHZW5lcmF0aW9uIGlzIGNvbXBsZXRlIC0gZW5zdXJlIGZpbmFsIHRleHQgaXMgY29ycmVjdFxyXG4gICAgICAgIGNvbnN0IGN1cnJlbnRNZXNzYWdlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLm1lc3NhZ2UuYXNzaXN0YW50Omxhc3QtY2hpbGQnKTtcclxuICAgICAgICBpZiAoY3VycmVudE1lc3NhZ2UpIHtcclxuICAgICAgICAgICAgY3VycmVudE1lc3NhZ2UudGV4dENvbnRlbnQgPSBtZXNzYWdlLmZ1bGxUZXh0O1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufSk7XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0dXMobWVzc2FnZSkge1xyXG4gICAgY29uc3Qgc3RhdHVzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJyk7XHJcbiAgICBjb25zdCBzdGF0dXNJbmRpY2F0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzLWluZGljYXRvcicpO1xyXG4gICAgY29uc3QgcHJvZ3Jlc3NFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nLXByb2dyZXNzJyk7XHJcbiAgICBjb25zdCBwcm9ncmVzc0ZpbGwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncHJvZ3Jlc3MtZmlsbCcpO1xyXG4gICAgY29uc3Qgc3RhdHVzRGV0YWlscyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzdGF0dXMtZGV0YWlscycpO1xyXG4gICAgXHJcbiAgICBpZiAoIXN0YXR1c0VsIHx8ICFzdGF0dXNJbmRpY2F0b3IpIHJldHVybjtcclxuXHJcbiAgICBzdGF0dXNJbmRpY2F0b3IuY2xhc3NOYW1lID0gbWVzc2FnZS5zdGF0dXM7XHJcbiAgICBcclxuICAgIGlmIChtZXNzYWdlLnN0YXR1cyA9PT0gJ2xvYWRpbmcnKSB7XHJcbiAgICAgICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSAnTG9hZGluZyBtb2RlbC4uLic7XHJcbiAgICAgICAgaWYgKG1lc3NhZ2UuZGF0YT8ucHJvZ3Jlc3MgIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjb25zdCBwcm9ncmVzcyA9IG1lc3NhZ2UuZGF0YS5wcm9ncmVzcztcclxuICAgICAgICAgICAgcHJvZ3Jlc3NGaWxsLnN0eWxlLndpZHRoID0gYCR7cHJvZ3Jlc3N9JWA7XHJcbiAgICAgICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSBgJHtwcm9ncmVzcy50b0ZpeGVkKDEpfSVgO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgLy8gQWRkIGRldGFpbGVkIHN0YXR1cyBpbmZvcm1hdGlvblxyXG4gICAgICAgICAgICBpZiAobWVzc2FnZS5kYXRhLmZpbGUpIHtcclxuICAgICAgICAgICAgICAgIHN0YXR1c0RldGFpbHMudGV4dENvbnRlbnQgPSBgRG93bmxvYWRpbmc6ICR7bWVzc2FnZS5kYXRhLmZpbGV9YDtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChtZXNzYWdlLmRhdGEuc3RhdHVzKSB7XHJcbiAgICAgICAgICAgICAgICBzdGF0dXNEZXRhaWxzLnRleHRDb250ZW50ID0gbWVzc2FnZS5kYXRhLnN0YXR1cztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAobWVzc2FnZS5kYXRhPy5zdGF0dXMpIHtcclxuICAgICAgICAgICAgc3RhdHVzRGV0YWlscy50ZXh0Q29udGVudCA9IG1lc3NhZ2UuZGF0YS5zdGF0dXM7XHJcbiAgICAgICAgfVxyXG4gICAgfSBlbHNlIGlmIChtZXNzYWdlLnN0YXR1cyA9PT0gJ2Vycm9yJykge1xyXG4gICAgICAgIHN0YXR1c0VsLnRleHRDb250ZW50ID0gJ0Vycm9yIGxvYWRpbmcgbW9kZWwnO1xyXG4gICAgICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSAnZXJyb3InO1xyXG4gICAgICAgIHByb2dyZXNzRmlsbC5jbGFzc0xpc3QuYWRkKCdlcnJvcicpO1xyXG4gICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSAnJztcclxuICAgICAgICBzdGF0dXNEZXRhaWxzLnRleHRDb250ZW50ID0gbWVzc2FnZS5kYXRhIHx8ICdVbmtub3duIGVycm9yIG9jY3VycmVkJztcclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGF0dXMgPT09ICdyZWFkeScpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9ICdNb2RlbCByZWFkeSc7XHJcbiAgICAgICAgc3RhdHVzSW5kaWNhdG9yLmNsYXNzTmFtZSA9ICdyZWFkeSc7XHJcbiAgICAgICAgcHJvZ3Jlc3NGaWxsLnN0eWxlLndpZHRoID0gJzEwMCUnO1xyXG4gICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSAnMTAwJSc7XHJcbiAgICAgICAgc3RhdHVzRGV0YWlscy50ZXh0Q29udGVudCA9ICdNb2RlbCBsb2FkZWQgYW5kIHJlYWR5IHRvIHVzZSc7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAndW5pbml0aWFsaXplZCcpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9ICdJbml0aWFsaXppbmcuLi4nO1xyXG4gICAgICAgIHByb2dyZXNzRmlsbC5zdHlsZS53aWR0aCA9ICcwJSc7XHJcbiAgICAgICAgcHJvZ3Jlc3NFbC50ZXh0Q29udGVudCA9ICcnO1xyXG4gICAgICAgIHN0YXR1c0RldGFpbHMudGV4dENvbnRlbnQgPSAnUHJlcGFyaW5nIHRvIGxvYWQgbW9kZWwuLi4nO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBDaGVjayBpbml0aWFsIHN0YXR1cyB3aGVuIHBvcHVwIG9wZW5zXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCAoKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnUG9wdXAgb3BlbmVkJyk7XHJcbiAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IHR5cGU6ICdjaGVja19zdGF0dXMnIH0pO1xyXG59KTtcclxuXHJcbi8vIENvbnNvbGUgbG9nZ2luZyBvdmVycmlkZVxyXG5jb25zdCBsb2dNZXNzYWdlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2ctbWVzc2FnZXMnKTtcclxuY29uc3Qgb3JpZ2luYWxDb25zb2xlID0ge1xyXG4gICAgbG9nOiBjb25zb2xlLmxvZyxcclxuICAgIGVycm9yOiBjb25zb2xlLmVycm9yLFxyXG4gICAgaW5mbzogY29uc29sZS5pbmZvXHJcbn07XHJcblxyXG5mdW5jdGlvbiBhZGRMb2dFbnRyeSh0eXBlLCAuLi5hcmdzKSB7XHJcbiAgICBjb25zdCBlbnRyeSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgZW50cnkuY2xhc3NOYW1lID0gYGxvZy1lbnRyeSAke3R5cGV9YDtcclxuICAgIGVudHJ5LnRleHRDb250ZW50ID0gYXJncy5tYXAoYXJnID0+IFxyXG4gICAgICAgIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnID8gSlNPTi5zdHJpbmdpZnkoYXJnKSA6IGFyZ1xyXG4gICAgKS5qb2luKCcgJyk7XHJcbiAgICBsb2dNZXNzYWdlcz8uYXBwZW5kQ2hpbGQoZW50cnkpO1xyXG4gICAgbG9nTWVzc2FnZXM/LnNjcm9sbFRvKDAsIGxvZ01lc3NhZ2VzLnNjcm9sbEhlaWdodCk7XHJcbiAgICByZXR1cm4gb3JpZ2luYWxDb25zb2xlW3R5cGVdKC4uLmFyZ3MpO1xyXG59XHJcblxyXG5jb25zb2xlLmxvZyA9ICguLi5hcmdzKSA9PiBhZGRMb2dFbnRyeSgnaW5mbycsIC4uLmFyZ3MpO1xyXG5jb25zb2xlLmVycm9yID0gKC4uLmFyZ3MpID0+IGFkZExvZ0VudHJ5KCdlcnJvcicsIC4uLmFyZ3MpO1xyXG5jb25zb2xlLmluZm8gPSAoLi4uYXJncykgPT4gYWRkTG9nRW50cnkoJ2luZm8nLCAuLi5hcmdzKTtcclxuXHJcbi8vIENoYXQgZnVuY3Rpb25hbGl0eVxyXG5jb25zdCBjaGF0SW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhdC1pbnB1dCcpO1xyXG5jb25zdCBzZW5kQnV0dG9uID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3NlbmQtYnV0dG9uJyk7XHJcbmNvbnN0IGNoYXRNZXNzYWdlcyA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjaGF0LW1lc3NhZ2VzJyk7XHJcblxyXG5mdW5jdGlvbiBhZGRNZXNzYWdlKGNvbnRlbnQsIGlzVXNlciA9IGZhbHNlKSB7XHJcbiAgICBjb25zdCBtZXNzYWdlRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICBtZXNzYWdlRGl2LmNsYXNzTmFtZSA9IGBtZXNzYWdlICR7aXNVc2VyID8gJ3VzZXInIDogJ2Fzc2lzdGFudCd9YDtcclxuICAgIG1lc3NhZ2VEaXYudGV4dENvbnRlbnQgPSBjb250ZW50O1xyXG4gICAgY2hhdE1lc3NhZ2VzLmFwcGVuZENoaWxkKG1lc3NhZ2VEaXYpO1xyXG4gICAgY2hhdE1lc3NhZ2VzLnNjcm9sbFRvKDAsIGNoYXRNZXNzYWdlcy5zY3JvbGxIZWlnaHQpO1xyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzZW5kTWVzc2FnZSgpIHtcclxuICAgIGNvbnN0IHRleHQgPSBjaGF0SW5wdXQudmFsdWUudHJpbSgpO1xyXG4gICAgaWYgKCF0ZXh0KSByZXR1cm47XHJcblxyXG4gICAgYWRkTWVzc2FnZSh0ZXh0LCB0cnVlKTtcclxuICAgIGNoYXRJbnB1dC52YWx1ZSA9ICcnO1xyXG4gICAgXHJcbiAgICAvLyBDcmVhdGUgZW1wdHkgYXNzaXN0YW50IG1lc3NhZ2UgZm9yIHN0cmVhbWluZ1xyXG4gICAgYWRkTWVzc2FnZSgnJywgZmFsc2UpO1xyXG4gICAgXHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe1xyXG4gICAgICAgICAgICBhY3Rpb246ICdnZW5lcmF0ZScsXHJcbiAgICAgICAgICAgIHRleHQ6IHRleHRcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwb25zZS5lcnJvcik7XHJcbiAgICAgICAgICAgIGFkZE1lc3NhZ2UoJ0Vycm9yOiAnICsgcmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc2VuZGluZyBtZXNzYWdlOicsIGVycm9yKTtcclxuICAgICAgICBhZGRNZXNzYWdlKCdFcnJvcjogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59XHJcblxyXG5zZW5kQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgc2VuZE1lc3NhZ2UpO1xyXG5jaGF0SW5wdXQuYWRkRXZlbnRMaXN0ZW5lcigna2V5cHJlc3MnLCAoZSkgPT4ge1xyXG4gICAgaWYgKGUua2V5ID09PSAnRW50ZXInICYmICFlLnNoaWZ0S2V5KSB7XHJcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgIHNlbmRNZXNzYWdlKCk7XHJcbiAgICB9XHJcbn0pO1xyXG5cclxuLy8gU3BlZWNoIHJlY29nbml0aW9uIHNldHVwXHJcbmNvbnN0IG1pY0J1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdtaWMtYnV0dG9uJyk7XHJcbmxldCBtZWRpYVJlY29yZGVyID0gbnVsbDtcclxubGV0IHJlY29yZGVkQ2h1bmtzID0gW107XHJcbmxldCBhc3JXb3JrZXIgPSBudWxsO1xyXG5cclxuLy8gRW5hYmxlIG1pYyBidXR0b24gYnV0IHNob3cgaXQncyB3YWl0aW5nIGZvciBwZXJtaXNzaW9uc1xyXG5taWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxubWljQnV0dG9uLnRpdGxlID0gXCJDbGljayB0byBlbmFibGUgc3BlZWNoIHJlY29nbml0aW9uXCI7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBjaGVja01pY3JvcGhvbmVQZXJtaXNzaW9uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBTZW5kIG1lc3NhZ2UgdG8gYmFja2dyb3VuZCBzY3JpcHQgdG8gaGFuZGxlIHBlcm1pc3Npb24gY2hlY2tcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHsgdHlwZTogJ3JlcXVlc3RfbWljcm9waG9uZScgfSk7XHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLnN1Y2Nlc3MpIHtcclxuICAgICAgICAgICAgbWljQnV0dG9uLnRpdGxlID0gXCJTdGFydCByZWNvcmRpbmdcIjtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdNaWNyb3Bob25lIGFjY2VzcyBkZW5pZWQ6ICcgKyAocmVzcG9uc2U/LmVycm9yIHx8ICdQZXJtaXNzaW9uIG5vdCBncmFudGVkJykpO1xyXG4gICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgY2hlY2tpbmcgbWljcm9waG9uZSBwZXJtaXNzaW9uOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRXJyb3IgY2hlY2tpbmcgbWljcm9waG9uZSBwZXJtaXNzaW9uOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG5hc3luYyBmdW5jdGlvbiByZXF1ZXN0TWljcm9waG9uZVBlcm1pc3Npb25zKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBoYXNQZXJtaXNzaW9uID0gYXdhaXQgY2hlY2tNaWNyb3Bob25lUGVybWlzc2lvbigpO1xyXG4gICAgICAgIGlmICghaGFzUGVybWlzc2lvbikge1xyXG4gICAgICAgICAgICBjb25zdCBpbnN0cnVjdGlvbnMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmNsYXNzTmFtZSA9ICdsb2ctZW50cnkgaW5mbyc7XHJcbiAgICAgICAgICAgIGluc3RydWN0aW9ucy5pbm5lckhUTUwgPSBgXHJcbiAgICAgICAgICAgICAgICBUbyBlbmFibGUgbWljcm9waG9uZSBhY2Nlc3M6XHJcbiAgICAgICAgICAgICAgICA8b2w+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPkNsaWNrIFwiQWxsb3dcIiB3aGVuIHByb21wdGVkIGZvciBtaWNyb3Bob25lIGFjY2VzczwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPk1ha2Ugc3VyZSBtaWNyb3Bob25lIHBlcm1pc3Npb25zIGFyZSBlbmFibGVkIGluIHNpdGUgc2V0dGluZ3M8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5SZWZyZXNoIHRoaXMgcGFnZSBhZnRlciBlbmFibGluZyBwZXJtaXNzaW9uczwvbGk+XHJcbiAgICAgICAgICAgICAgICA8L29sPlxyXG4gICAgICAgICAgICBgO1xyXG4gICAgICAgICAgICBsb2dNZXNzYWdlcy5hcHBlbmRDaGlsZChpbnN0cnVjdGlvbnMpO1xyXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciByZXF1ZXN0aW5nIG1pY3JvcGhvbmUgcGVybWlzc2lvbnM6JywgZXJyb3IpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdFcnJvciByZXF1ZXN0aW5nIHBlcm1pc3Npb25zOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBSZXN0IG9mIEFTUiBmdW5jdGlvbmFsaXR5IHRlbXBvcmFyaWx5IGRpc2FibGVkXHJcbi8qXHJcbmFzeW5jIGZ1bmN0aW9uIGluaXRBU1IoKSB7XHJcbi8vIC4uLmV4aXN0aW5nIGNvZGUuLi4gXHJcbn1cclxuKi9cclxuXHJcbi8vIERpc2FibGUgbWljIGJ1dHRvbiBpbml0aWFsbHlcclxubWljQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuXHJcbi8vIERvd25sb2FkIGFuZCBjYWNoZSB0aGUgQ29waWxvdCBhdmF0YXJcclxuYXN5bmMgZnVuY3Rpb24gY2FjaGVJY29uKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGZldGNoKCdodHRwczovL2F2YXRhcnMuZ2l0aHVidXNlcmNvbnRlbnQuY29tL3UvMTIzMjY1OTM0Jyk7XHJcbiAgICAgICAgY29uc3QgYmxvYiA9IGF3YWl0IHJlc3BvbnNlLmJsb2IoKTtcclxuICAgICAgICBjb25zdCBpY29uVXJsID0gVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBjb25zdCBsaW5rcyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2xpbmtbcmVsKj1cImljb25cIl0nKTtcclxuICAgICAgICBsaW5rcy5mb3JFYWNoKGxpbmsgPT4ge1xyXG4gICAgICAgICAgICBsaW5rLmhyZWYgPSBpY29uVXJsO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdGYWlsZWQgdG8gY2FjaGUgaWNvbjonLCBlcnJvcik7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8vIEluaXRpYWxpemUgd2hlbiBwb3B1cCBsb2Fkc1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgYXN5bmMgKCkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbChbXHJcbiAgICAgICAgICAgIC8vIGluaXRBU1IoKSwgLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWRcclxuICAgICAgICAgICAgY2FjaGVJY29uKClcclxuICAgICAgICBdKTtcclxuICAgICAgICBjb25zb2xlLmxvZygnSW5pdGlhbGl6YXRpb24gY29tcGxldGUnKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignSW5pdGlhbGl6YXRpb24gZmFpbGVkOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemU6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxufSk7XHJcblxyXG5hc3luYyBmdW5jdGlvbiBzdGFydFJlY29yZGluZygpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgLy8gQ2hlY2sgcGVybWlzc2lvbnMgZmlyc3RcclxuICAgICAgICBjb25zdCBoYXNQZXJtaXNzaW9uID0gYXdhaXQgcmVxdWVzdE1pY3JvcGhvbmVQZXJtaXNzaW9ucygpO1xyXG4gICAgICAgIGlmICghaGFzUGVybWlzc2lvbikge1xyXG4gICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZXF1ZXN0aW5nIG1pY3JvcGhvbmUgYWNjZXNzLi4uJyk7XHJcbiAgICAgICAgY29uc3QgY29uc3RyYWludHMgPSB7IFxyXG4gICAgICAgICAgICBhdWRpbzoge1xyXG4gICAgICAgICAgICAgICAgY2hhbm5lbENvdW50OiAxLFxyXG4gICAgICAgICAgICAgICAgc2FtcGxlUmF0ZTogMTYwMDBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gUmVxdWVzdCBtaWNyb3Bob25lIGFjY2VzcyB0aHJvdWdoIGNvbnRlbnQgc2NyaXB0XHJcbiAgICAgICAgY2hyb21lLnRhYnMucXVlcnkoe2FjdGl2ZTogdHJ1ZSwgY3VycmVudFdpbmRvdzogdHJ1ZX0sIGZ1bmN0aW9uKHRhYnMpIHtcclxuICAgICAgICAgICAgY2hyb21lLnNjcmlwdGluZy5leGVjdXRlU2NyaXB0KHtcclxuICAgICAgICAgICAgICAgIHRhcmdldDogeyB0YWJJZDogdGFic1swXS5pZCB9LFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb246IGFzeW5jIChjb25zdHJhaW50cykgPT4ge1xyXG4gICAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShjb25zdHJhaW50cyk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gYWNjZXNzIG1pY3JvcGhvbmU6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgYXJnczogW2NvbnN0cmFpbnRzXVxyXG4gICAgICAgICAgICB9KS50aGVuKChbcmVzdWx0XSkgPT4ge1xyXG4gICAgICAgICAgICAgICAgaWYgKHJlc3VsdC5lcnJvcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihyZXN1bHQuZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgc3RyZWFtID0gcmVzdWx0O1xyXG4gICAgICAgICAgICAgICAgc2V0dXBNZWRpYVJlY29yZGVyKHN0cmVhbSk7XHJcbiAgICAgICAgICAgIH0pLmNhdGNoKGVycm9yID0+IHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBnZXQgbWljcm9waG9uZSBhY2Nlc3M6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIFxyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBzdGFydGluZyByZWNvcmRpbmc6Jywge1xyXG4gICAgICAgICAgICBuYW1lOiBlcnJvci5uYW1lLFxyXG4gICAgICAgICAgICBtZXNzYWdlOiBlcnJvci5tZXNzYWdlLFxyXG4gICAgICAgICAgICBzdGFjazogZXJyb3Iuc3RhY2tcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gJ0NvdWxkIG5vdCBzdGFydCByZWNvcmRpbmc6ICcgKyAoZXJyb3IubWVzc2FnZSB8fCAnVW5rbm93biBlcnJvcicpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsIGVycm9yTWVzc2FnZSk7XHJcbiAgICAgICAgbWljQnV0dG9uLmNsYXNzTGlzdC5yZW1vdmUoJ3JlY29yZGluZycpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBzZXR1cE1lZGlhUmVjb3JkZXIoc3RyZWFtKSB7XHJcbiAgICBtZWRpYVJlY29yZGVyID0gbmV3IE1lZGlhUmVjb3JkZXIoc3RyZWFtLCB7XHJcbiAgICAgICAgbWltZVR5cGU6ICdhdWRpby93ZWJtO2NvZGVjcz1vcHVzJ1xyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgaWYgKGV2ZW50LmRhdGEuc2l6ZSA+IDApIHtcclxuICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MucHVzaChldmVudC5kYXRhKTtcclxuICAgICAgICB9XHJcbiAgICB9O1xyXG4gICAgXHJcbiAgICBtZWRpYVJlY29yZGVyLm9uZXJyb3IgPSAoZXZlbnQpID0+IHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdNZWRpYVJlY29yZGVyIGVycm9yOicsIGV2ZW50LmVycm9yKTtcclxuICAgIH07XHJcbiAgICBcclxuICAgIG1lZGlhUmVjb3JkZXIub25zdG9wID0gYXN5bmMgKCkgPT4ge1xyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ZGlvQmxvYiA9IG5ldyBCbG9iKHJlY29yZGVkQ2h1bmtzLCB7IHR5cGU6ICdhdWRpby93ZWJtJyB9KTtcclxuICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MgPSBbXTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIGNvbnN0IGF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoeyBzYW1wbGVSYXRlOiAxNjAwMCB9KTtcclxuICAgICAgICAgICAgY29uc3QgYXVkaW9EYXRhID0gYXdhaXQgYXVkaW9CbG9iLmFycmF5QnVmZmVyKCk7XHJcbiAgICAgICAgICAgIGNvbnN0IGF1ZGlvQnVmZmVyID0gYXdhaXQgYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShhdWRpb0RhdGEpO1xyXG4gICAgICAgICAgICBjb25zdCBhdWRpbyA9IGF1ZGlvQnVmZmVyLmdldENoYW5uZWxEYXRhKDApO1xyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgaWYgKGFzcldvcmtlcikge1xyXG4gICAgICAgICAgICAgICAgYXNyV29ya2VyLnBvc3RNZXNzYWdlKHsgYnVmZmVyOiBhdWRpbyB9KTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0FTUiB3b3JrZXIgbm90IGluaXRpYWxpemVkJyk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnN0b3AoKSk7XHJcbiAgICAgICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3IgcHJvY2Vzc2luZyByZWNvcmRlZCBhdWRpbzonLCBlcnJvcik7XHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdFcnJvciBwcm9jZXNzaW5nIGF1ZGlvOiAnICsgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgbWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTtcclxuICAgIGNvbnNvbGUubG9nKCdSZWNvcmRpbmcgc3RhcnRlZCcpO1xyXG4gICAgbWljQnV0dG9uLmNsYXNzTGlzdC5hZGQoJ3JlY29yZGluZycpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdG9wUmVjb3JkaW5nKCkge1xyXG4gICAgaWYgKG1lZGlhUmVjb3JkZXIgJiYgbWVkaWFSZWNvcmRlci5zdGF0ZSA9PT0gJ3JlY29yZGluZycpIHtcclxuICAgICAgICBtZWRpYVJlY29yZGVyLnN0b3AoKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSBBU1Igd2hlbiBwb3B1cCBpcyBsb2FkZWRcclxuLy8gVGVtcG9yYXJpbHkgZGlzYWJsZWQgQVNSIGluaXRpYWxpemF0aW9uXHJcbi8qZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jICgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgYXdhaXQgaW5pdEFTUigpO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdBU1IgaW5pdGlhbGl6YXRpb24gY29tcGxldGUnKTtcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignQVNSIGluaXRpYWxpemF0aW9uIGZhaWxlZDonLCBlcnJvcik7XHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgJ0ZhaWxlZCB0byBpbml0aWFsaXplIEFTUjogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59KTsqL1xyXG5cclxuLy8gQWRkIGNsaWNrIGhhbmRsZXIgZm9yIG1pYyBidXR0b25cclxubWljQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xyXG4gICAgaWYgKCFtZWRpYVJlY29yZGVyIHx8IG1lZGlhUmVjb3JkZXIuc3RhdGUgPT09ICdpbmFjdGl2ZScpIHtcclxuICAgICAgICBzdGFydFJlY29yZGluZygpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgICBzdG9wUmVjb3JkaW5nKCk7XHJcbiAgICB9XHJcbn0pO1xyXG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=