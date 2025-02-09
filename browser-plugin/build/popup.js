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
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
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
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/base uri */
/******/ 	(() => {
/******/ 		__webpack_require__.b = undefined;
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
    
    try {
        const response = await chrome.runtime.sendMessage({
            action: 'generate',
            text: text
        });
        
        if (response.error) {
            console.error(response.error);
            addMessage('Error: ' + response.error);
        } else {
            addMessage(response);
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
        asrWorker = new Worker(new URL(/* worker import */ __webpack_require__.p + __webpack_require__.u("src_asr-worker_js"), __webpack_require__.b), { type: undefined });
        
        asrWorker.onerror = (error) => {
            console.error('ASR worker error:', error);
            addLogEntry('error', 'ASR worker error:', error.message);
        };
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('ASR worker initialization timed out'));
            }, 30000); // 30 second timeout
            
            asrWorker.onmessage = (event) => {
                const { type, text, error } = event.data;
                
                if (type === 'ready') {
                    console.log('ASR worker ready');
                    clearTimeout(timeout);
                    micButton.disabled = false;
                    resolve();
                } else if (type === 'transcription') {
                    chatInput.value = (chatInput.value + ' ' + text).trim();
                } else if (type === 'error') {
                    console.error('ASR error:', error);
                    addLogEntry('error', 'ASR error:', error);
                }
            };
        });
    } catch (error) {
        console.error('Error initializing ASR:', error);
        addLogEntry('error', 'Failed to initialize speech recognition');
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
document.addEventListener('DOMContentLoaded', () => {
    initASR();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Y2s6Ly9icm93c2VyLWV4dGVuc2lvbi8uL3NyYy9jb25zdGFudHMuanMiLCJ3ZWJwYWNrOi8vYnJvd3Nlci1leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vYnJvd3Nlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2RlZmluZSBwcm9wZXJ0eSBnZXR0ZXJzIiwid2VicGFjazovL2Jyb3dzZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9nZXQgamF2YXNjcmlwdCBjaHVuayBmaWxlbmFtZSIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvZ2xvYmFsIiwid2VicGFjazovL2Jyb3dzZXItZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9oYXNPd25Qcm9wZXJ0eSBzaG9ydGhhbmQiLCJ3ZWJwYWNrOi8vYnJvd3Nlci1leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvcHVibGljUGF0aCIsIndlYnBhY2s6Ly9icm93c2VyLWV4dGVuc2lvbi93ZWJwYWNrL3J1bnRpbWUvYmFzZSB1cmkiLCJ3ZWJwYWNrOi8vYnJvd3Nlci1leHRlbnNpb24vLi9zcmMvcG9wdXAuanMiXSwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IENPTlRFWFRfTUVOVV9JVEVNX0lEID0gXCJnZW5lcmF0ZS1mcm9tLXNlbGVjdGlvblwiO1xyXG5leHBvcnQgY29uc3QgQUNUSU9OX05BTUUgPSBcImdlbmVyYXRlXCI7XHJcbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCIvLyBUaGlzIGZ1bmN0aW9uIGFsbG93IHRvIHJlZmVyZW5jZSBhc3luYyBjaHVua3Ncbl9fd2VicGFja19yZXF1aXJlX18udSA9IChjaHVua0lkKSA9PiB7XG5cdC8vIHJldHVybiB1cmwgZm9yIGZpbGVuYW1lcyBiYXNlZCBvbiB0ZW1wbGF0ZVxuXHRyZXR1cm4gXCJcIiArIGNodW5rSWQgKyBcIi5qc1wiO1xufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmcgPSAoZnVuY3Rpb24oKSB7XG5cdGlmICh0eXBlb2YgZ2xvYmFsVGhpcyA9PT0gJ29iamVjdCcpIHJldHVybiBnbG9iYWxUaGlzO1xuXHR0cnkge1xuXHRcdHJldHVybiB0aGlzIHx8IG5ldyBGdW5jdGlvbigncmV0dXJuIHRoaXMnKSgpO1xuXHR9IGNhdGNoIChlKSB7XG5cdFx0aWYgKHR5cGVvZiB3aW5kb3cgPT09ICdvYmplY3QnKSByZXR1cm4gd2luZG93O1xuXHR9XG59KSgpOyIsIl9fd2VicGFja19yZXF1aXJlX18ubyA9IChvYmosIHByb3ApID0+IChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqLCBwcm9wKSkiLCIvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSAoZXhwb3J0cykgPT4ge1xuXHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcblx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcblx0fVxuXHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xufTsiLCJ2YXIgc2NyaXB0VXJsO1xuaWYgKF9fd2VicGFja19yZXF1aXJlX18uZy5pbXBvcnRTY3JpcHRzKSBzY3JpcHRVcmwgPSBfX3dlYnBhY2tfcmVxdWlyZV9fLmcubG9jYXRpb24gKyBcIlwiO1xudmFyIGRvY3VtZW50ID0gX193ZWJwYWNrX3JlcXVpcmVfXy5nLmRvY3VtZW50O1xuaWYgKCFzY3JpcHRVcmwgJiYgZG9jdW1lbnQpIHtcblx0aWYgKGRvY3VtZW50LmN1cnJlbnRTY3JpcHQgJiYgZG9jdW1lbnQuY3VycmVudFNjcmlwdC50YWdOYW1lLnRvVXBwZXJDYXNlKCkgPT09ICdTQ1JJUFQnKVxuXHRcdHNjcmlwdFVybCA9IGRvY3VtZW50LmN1cnJlbnRTY3JpcHQuc3JjO1xuXHRpZiAoIXNjcmlwdFVybCkge1xuXHRcdHZhciBzY3JpcHRzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoXCJzY3JpcHRcIik7XG5cdFx0aWYoc2NyaXB0cy5sZW5ndGgpIHtcblx0XHRcdHZhciBpID0gc2NyaXB0cy5sZW5ndGggLSAxO1xuXHRcdFx0d2hpbGUgKGkgPiAtMSAmJiAoIXNjcmlwdFVybCB8fCAhL15odHRwKHM/KTovLnRlc3Qoc2NyaXB0VXJsKSkpIHNjcmlwdFVybCA9IHNjcmlwdHNbaS0tXS5zcmM7XG5cdFx0fVxuXHR9XG59XG4vLyBXaGVuIHN1cHBvcnRpbmcgYnJvd3NlcnMgd2hlcmUgYW4gYXV0b21hdGljIHB1YmxpY1BhdGggaXMgbm90IHN1cHBvcnRlZCB5b3UgbXVzdCBzcGVjaWZ5IGFuIG91dHB1dC5wdWJsaWNQYXRoIG1hbnVhbGx5IHZpYSBjb25maWd1cmF0aW9uXG4vLyBvciBwYXNzIGFuIGVtcHR5IHN0cmluZyAoXCJcIikgYW5kIHNldCB0aGUgX193ZWJwYWNrX3B1YmxpY19wYXRoX18gdmFyaWFibGUgZnJvbSB5b3VyIGNvZGUgdG8gdXNlIHlvdXIgb3duIGxvZ2ljLlxuaWYgKCFzY3JpcHRVcmwpIHRocm93IG5ldyBFcnJvcihcIkF1dG9tYXRpYyBwdWJsaWNQYXRoIGlzIG5vdCBzdXBwb3J0ZWQgaW4gdGhpcyBicm93c2VyXCIpO1xuc2NyaXB0VXJsID0gc2NyaXB0VXJsLnJlcGxhY2UoLyMuKiQvLCBcIlwiKS5yZXBsYWNlKC9cXD8uKiQvLCBcIlwiKS5yZXBsYWNlKC9cXC9bXlxcL10rJC8sIFwiL1wiKTtcbl9fd2VicGFja19yZXF1aXJlX18ucCA9IHNjcmlwdFVybDsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLmIgPSB1bmRlZmluZWQ7IiwiLy8gcG9wdXAuanMgLSBoYW5kbGVzIGludGVyYWN0aW9uIHdpdGggdGhlIGV4dGVuc2lvbidzIHBvcHVwLCBzZW5kcyByZXF1ZXN0cyB0byB0aGVcclxuLy8gc2VydmljZSB3b3JrZXIgKGJhY2tncm91bmQuanMpLCBhbmQgdXBkYXRlcyB0aGUgcG9wdXAncyBVSSAocG9wdXAuaHRtbCkgb24gY29tcGxldGlvbi5cclxuXHJcbmltcG9ydCB7IEFDVElPTl9OQU1FIH0gZnJvbSBcIi4vY29uc3RhbnRzLmpzXCI7XHJcblxyXG4vLyBJbXBvcnQgb25seSB3aGF0IHdlIG5lZWRcclxuY29uc3Qgb3V0cHV0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwib3V0cHV0XCIpO1xyXG5cclxuLy8gTGlzdGVuIGZvciBtZXNzYWdlcyBmcm9tIHRoZSBiYWNrZ3JvdW5kIHNjcmlwdFxyXG5jaHJvbWUucnVudGltZS5vbk1lc3NhZ2UuYWRkTGlzdGVuZXIoKG1lc3NhZ2UsIHNlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XHJcbiAgICBjb25zb2xlLmxvZygnUG9wdXAgcmVjZWl2ZWQgbWVzc2FnZTonLCBtZXNzYWdlKTtcclxuICAgIHVwZGF0ZVN0YXR1cyhtZXNzYWdlKTtcclxufSk7XHJcblxyXG5mdW5jdGlvbiB1cGRhdGVTdGF0dXMobWVzc2FnZSkge1xyXG4gICAgY29uc3Qgc3RhdHVzRWwgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJyk7XHJcbiAgICBjb25zdCBzdGF0dXNJbmRpY2F0b3IgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzLWluZGljYXRvcicpO1xyXG4gICAgY29uc3QgcHJvZ3Jlc3NFbCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdsb2FkaW5nLXByb2dyZXNzJyk7XHJcbiAgICBcclxuICAgIGlmICghc3RhdHVzRWwgfHwgIXN0YXR1c0luZGljYXRvcikgcmV0dXJuO1xyXG5cclxuICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSBtZXNzYWdlLnN0YXR1cztcclxuICAgIFxyXG4gICAgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAnbG9hZGluZycpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9ICdMb2FkaW5nIG1vZGVsLi4uJztcclxuICAgICAgICBpZiAobWVzc2FnZS5wcm9ncmVzcykge1xyXG4gICAgICAgICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gYCR7bWVzc2FnZS5wcm9ncmVzcy50b0ZpeGVkKDEpfSVgO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAobWVzc2FnZS5zdGF0dXMgPT09ICdlcnJvcicpIHtcclxuICAgICAgICBzdGF0dXNFbC50ZXh0Q29udGVudCA9IGBFcnJvcjogJHttZXNzYWdlLmRhdGF9YDtcclxuICAgICAgICBzdGF0dXNJbmRpY2F0b3IuY2xhc3NOYW1lID0gJ2Vycm9yJztcclxuICAgICAgICBwcm9ncmVzc0VsLnRleHRDb250ZW50ID0gJyc7XHJcbiAgICB9IGVsc2UgaWYgKG1lc3NhZ2Uuc3RhdHVzID09PSAncmVhZHknKSB7XHJcbiAgICAgICAgc3RhdHVzRWwudGV4dENvbnRlbnQgPSAnTW9kZWwgcmVhZHknO1xyXG4gICAgICAgIHN0YXR1c0luZGljYXRvci5jbGFzc05hbWUgPSAncmVhZHknO1xyXG4gICAgICAgIHByb2dyZXNzRWwudGV4dENvbnRlbnQgPSAnJztcclxuICAgIH1cclxufVxyXG5cclxuLy8gQ2hlY2sgaW5pdGlhbCBzdGF0dXMgd2hlbiBwb3B1cCBvcGVuc1xyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgY29uc29sZS5sb2coJ1BvcHVwIG9wZW5lZCcpO1xyXG4gICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2UoeyB0eXBlOiAnY2hlY2tfc3RhdHVzJyB9KTtcclxufSk7XHJcblxyXG4vLyBDb25zb2xlIGxvZ2dpbmcgb3ZlcnJpZGVcclxuY29uc3QgbG9nTWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbG9nLW1lc3NhZ2VzJyk7XHJcbmNvbnN0IG9yaWdpbmFsQ29uc29sZSA9IHtcclxuICAgIGxvZzogY29uc29sZS5sb2csXHJcbiAgICBlcnJvcjogY29uc29sZS5lcnJvcixcclxuICAgIGluZm86IGNvbnNvbGUuaW5mb1xyXG59O1xyXG5cclxuZnVuY3Rpb24gYWRkTG9nRW50cnkodHlwZSwgLi4uYXJncykge1xyXG4gICAgY29uc3QgZW50cnkgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTtcclxuICAgIGVudHJ5LmNsYXNzTmFtZSA9IGBsb2ctZW50cnkgJHt0eXBlfWA7XHJcbiAgICBlbnRyeS50ZXh0Q29udGVudCA9IGFyZ3MubWFwKGFyZyA9PiBcclxuICAgICAgICB0eXBlb2YgYXJnID09PSAnb2JqZWN0JyA/IEpTT04uc3RyaW5naWZ5KGFyZykgOiBhcmdcclxuICAgICkuam9pbignICcpO1xyXG4gICAgbG9nTWVzc2FnZXM/LmFwcGVuZENoaWxkKGVudHJ5KTtcclxuICAgIGxvZ01lc3NhZ2VzPy5zY3JvbGxUbygwLCBsb2dNZXNzYWdlcy5zY3JvbGxIZWlnaHQpO1xyXG4gICAgcmV0dXJuIG9yaWdpbmFsQ29uc29sZVt0eXBlXSguLi5hcmdzKTtcclxufVxyXG5cclxuY29uc29sZS5sb2cgPSAoLi4uYXJncykgPT4gYWRkTG9nRW50cnkoJ2luZm8nLCAuLi5hcmdzKTtcclxuY29uc29sZS5lcnJvciA9ICguLi5hcmdzKSA9PiBhZGRMb2dFbnRyeSgnZXJyb3InLCAuLi5hcmdzKTtcclxuY29uc29sZS5pbmZvID0gKC4uLmFyZ3MpID0+IGFkZExvZ0VudHJ5KCdpbmZvJywgLi4uYXJncyk7XHJcblxyXG4vLyBDaGF0IGZ1bmN0aW9uYWxpdHlcclxuY29uc3QgY2hhdElucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NoYXQtaW5wdXQnKTtcclxuY29uc3Qgc2VuZEJ1dHRvbiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdzZW5kLWJ1dHRvbicpO1xyXG5jb25zdCBjaGF0TWVzc2FnZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2hhdC1tZXNzYWdlcycpO1xyXG5cclxuZnVuY3Rpb24gYWRkTWVzc2FnZShjb250ZW50LCBpc1VzZXIgPSBmYWxzZSkge1xyXG4gICAgY29uc3QgbWVzc2FnZURpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgbWVzc2FnZURpdi5jbGFzc05hbWUgPSBgbWVzc2FnZSAke2lzVXNlciA/ICd1c2VyJyA6ICdhc3Npc3RhbnQnfWA7XHJcbiAgICBtZXNzYWdlRGl2LnRleHRDb250ZW50ID0gY29udGVudDtcclxuICAgIGNoYXRNZXNzYWdlcy5hcHBlbmRDaGlsZChtZXNzYWdlRGl2KTtcclxuICAgIGNoYXRNZXNzYWdlcy5zY3JvbGxUbygwLCBjaGF0TWVzc2FnZXMuc2Nyb2xsSGVpZ2h0KTtcclxufVxyXG5cclxuYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2UoKSB7XHJcbiAgICBjb25zdCB0ZXh0ID0gY2hhdElucHV0LnZhbHVlLnRyaW0oKTtcclxuICAgIGlmICghdGV4dCkgcmV0dXJuO1xyXG5cclxuICAgIGFkZE1lc3NhZ2UodGV4dCwgdHJ1ZSk7XHJcbiAgICBjaGF0SW5wdXQudmFsdWUgPSAnJztcclxuICAgIFxyXG4gICAgdHJ5IHtcclxuICAgICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHtcclxuICAgICAgICAgICAgYWN0aW9uOiAnZ2VuZXJhdGUnLFxyXG4gICAgICAgICAgICB0ZXh0OiB0ZXh0XHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcG9uc2UuZXJyb3IpO1xyXG4gICAgICAgICAgICBhZGRNZXNzYWdlKCdFcnJvcjogJyArIHJlc3BvbnNlLmVycm9yKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBhZGRNZXNzYWdlKHJlc3BvbnNlKTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHNlbmRpbmcgbWVzc2FnZTonLCBlcnJvcik7XHJcbiAgICAgICAgYWRkTWVzc2FnZSgnRXJyb3I6ICcgKyBlcnJvci5tZXNzYWdlKTtcclxuICAgIH1cclxufVxyXG5cclxuc2VuZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIHNlbmRNZXNzYWdlKTtcclxuY2hhdElucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXByZXNzJywgKGUpID0+IHtcclxuICAgIGlmIChlLmtleSA9PT0gJ0VudGVyJyAmJiAhZS5zaGlmdEtleSkge1xyXG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcclxuICAgICAgICBzZW5kTWVzc2FnZSgpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbi8vIFNwZWVjaCByZWNvZ25pdGlvbiBzZXR1cFxyXG5jb25zdCBtaWNCdXR0b24gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnbWljLWJ1dHRvbicpO1xyXG5sZXQgbWVkaWFSZWNvcmRlciA9IG51bGw7XHJcbmxldCByZWNvcmRlZENodW5rcyA9IFtdO1xyXG5sZXQgYXNyV29ya2VyID0gbnVsbDtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIGluaXRBU1IoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsaXppbmcgQVNSIHdvcmtlci4uLicpO1xyXG4gICAgICAgIGFzcldvcmtlciA9IG5ldyBXb3JrZXIobmV3IFVSTCgnLi9hc3Itd29ya2VyLmpzJywgaW1wb3J0Lm1ldGEudXJsKSwgeyB0eXBlOiAnbW9kdWxlJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICBhc3JXb3JrZXIub25lcnJvciA9IChlcnJvcikgPT4ge1xyXG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBU1Igd29ya2VyIGVycm9yOicsIGVycm9yKTtcclxuICAgICAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgJ0FTUiB3b3JrZXIgZXJyb3I6JywgZXJyb3IubWVzc2FnZSk7XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCB0aW1lb3V0ID0gc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgICAgICAgICByZWplY3QobmV3IEVycm9yKCdBU1Igd29ya2VyIGluaXRpYWxpemF0aW9uIHRpbWVkIG91dCcpKTtcclxuICAgICAgICAgICAgfSwgMzAwMDApOyAvLyAzMCBzZWNvbmQgdGltZW91dFxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgYXNyV29ya2VyLm9ubWVzc2FnZSA9IChldmVudCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgeyB0eXBlLCB0ZXh0LCBlcnJvciB9ID0gZXZlbnQuZGF0YTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgaWYgKHR5cGUgPT09ICdyZWFkeScpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQVNSIHdvcmtlciByZWFkeScpO1xyXG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0KTtcclxuICAgICAgICAgICAgICAgICAgICBtaWNCdXR0b24uZGlzYWJsZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICd0cmFuc2NyaXB0aW9uJykge1xyXG4gICAgICAgICAgICAgICAgICAgIGNoYXRJbnB1dC52YWx1ZSA9IChjaGF0SW5wdXQudmFsdWUgKyAnICcgKyB0ZXh0KS50cmltKCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBU1IgZXJyb3I6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdBU1IgZXJyb3I6JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgIH0pO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdFcnJvciBpbml0aWFsaXppbmcgQVNSOicsIGVycm9yKTtcclxuICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRmFpbGVkIHRvIGluaXRpYWxpemUgc3BlZWNoIHJlY29nbml0aW9uJyk7XHJcbiAgICAgICAgbWljQnV0dG9uLmRpc2FibGVkID0gdHJ1ZTtcclxuICAgICAgICB0aHJvdyBlcnJvcjtcclxuICAgIH1cclxufVxyXG5cclxuLy8gRGlzYWJsZSBtaWMgYnV0dG9uIGluaXRpYWxseVxyXG5taWNCdXR0b24uZGlzYWJsZWQgPSB0cnVlO1xyXG5cclxuLy8gRG93bmxvYWQgYW5kIGNhY2hlIHRoZSBDb3BpbG90IGF2YXRhclxyXG5hc3luYyBmdW5jdGlvbiBjYWNoZUljb24oKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goJ2h0dHBzOi8vYXZhdGFycy5naXRodWJ1c2VyY29udGVudC5jb20vdS8xMjMyNjU5MzQnKTtcclxuICAgICAgICBjb25zdCBibG9iID0gYXdhaXQgcmVzcG9uc2UuYmxvYigpO1xyXG4gICAgICAgIGNvbnN0IGljb25VcmwgPSBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGNvbnN0IGxpbmtzID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnbGlua1tyZWwqPVwiaWNvblwiXScpO1xyXG4gICAgICAgIGxpbmtzLmZvckVhY2gobGluayA9PiB7XHJcbiAgICAgICAgICAgIGxpbmsuaHJlZiA9IGljb25Vcmw7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0ZhaWxlZCB0byBjYWNoZSBpY29uOicsIGVycm9yKTtcclxuICAgIH1cclxufVxyXG5cclxuLy8gSW5pdGlhbGl6ZSB3aGVuIHBvcHVwIGxvYWRzXHJcbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ0RPTUNvbnRlbnRMb2FkZWQnLCBhc3luYyAoKSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKFtcclxuICAgICAgICAgICAgaW5pdEFTUigpLFxyXG4gICAgICAgICAgICBjYWNoZUljb24oKVxyXG4gICAgICAgIF0pO1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdJbml0aWFsaXphdGlvbiBjb21wbGV0ZScpO1xyXG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmVycm9yKCdJbml0aWFsaXphdGlvbiBmYWlsZWQ6JywgZXJyb3IpO1xyXG4gICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdGYWlsZWQgdG8gaW5pdGlhbGl6ZTogJyArIGVycm9yLm1lc3NhZ2UpO1xyXG4gICAgfVxyXG59KTtcclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHJlcXVlc3RNaWNyb3Bob25lUGVybWlzc2lvbnMoKSB7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIC8vIENoZWNrIGlmIHBlcm1pc3Npb25zIGFyZSBhbHJlYWR5IGdyYW50ZWRcclxuICAgICAgICBjb25zdCBwZXJtaXNzaW9ucyA9IGF3YWl0IG5hdmlnYXRvci5wZXJtaXNzaW9ucy5xdWVyeSh7IG5hbWU6ICdtaWNyb3Bob25lJyB9KTtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdncmFudGVkJykge1xyXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHBlcm1pc3Npb25zLnN0YXRlID09PSAncHJvbXB0Jykge1xyXG4gICAgICAgICAgICAvLyBTaG93IGluc3RydWN0aW9ucyB0byB1c2VyIGJlZm9yZSByZXF1ZXN0aW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdpbmZvJywgJ1BsZWFzZSBhbGxvdyBtaWNyb3Bob25lIGFjY2VzcyBpbiB0aGUgYnJvd3NlciBwcm9tcHQnKTtcclxuICAgICAgICAgICAgLy8gUmVxdWVzdCBwZXJtaXNzaW9ucyBleHBsaWNpdGx5XHJcbiAgICAgICAgICAgIGNvbnN0IHN0cmVhbSA9IGF3YWl0IG5hdmlnYXRvci5tZWRpYURldmljZXMuZ2V0VXNlck1lZGlhKHsgYXVkaW86IHRydWUgfSk7XHJcbiAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHRyYWNrLnN0b3AoKSk7IC8vIENsZWFuIHVwIHRlc3Qgc3RyZWFtXHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH0gZWxzZSBpZiAocGVybWlzc2lvbnMuc3RhdGUgPT09ICdkZW5pZWQnKSB7XHJcbiAgICAgICAgICAgIGFkZExvZ0VudHJ5KCdlcnJvcicsICdNaWNyb3Bob25lIGFjY2VzcyBpcyBibG9ja2VkLiBQbGVhc2UgYWxsb3cgYWNjZXNzIGluIHlvdXIgYnJvd3NlciBzZXR0aW5ncy4nKTtcclxuICAgICAgICAgICAgLy8gU2hvdyBpbnN0cnVjdGlvbnMgZm9yIGVuYWJsaW5nIHBlcm1pc3Npb25zXHJcbiAgICAgICAgICAgIGNvbnN0IGluc3RydWN0aW9ucyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgICAgICBpbnN0cnVjdGlvbnMuY2xhc3NOYW1lID0gJ2xvZy1lbnRyeSBpbmZvJztcclxuICAgICAgICAgICAgaW5zdHJ1Y3Rpb25zLmlubmVySFRNTCA9IGBcclxuICAgICAgICAgICAgICAgIFRvIGVuYWJsZSBtaWNyb3Bob25lIGFjY2VzczpcclxuICAgICAgICAgICAgICAgIDxvbD5cclxuICAgICAgICAgICAgICAgICAgICA8bGk+Q2xpY2sgdGhlIGNhbWVyYS9taWNyb3Bob25lIGljb24gaW4geW91ciBicm93c2VyJ3MgYWRkcmVzcyBiYXI8L2xpPlxyXG4gICAgICAgICAgICAgICAgICAgIDxsaT5TZWxlY3QgXCJBbGxvd1wiIGZvciBtaWNyb3Bob25lIGFjY2VzczwvbGk+XHJcbiAgICAgICAgICAgICAgICAgICAgPGxpPlJlZnJlc2ggdGhpcyBwYWdlPC9saT5cclxuICAgICAgICAgICAgICAgIDwvb2w+XHJcbiAgICAgICAgICAgIGA7XHJcbiAgICAgICAgICAgIGxvZ01lc3NhZ2VzLmFwcGVuZENoaWxkKGluc3RydWN0aW9ucyk7XHJcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIHBlcm1pc3Npb25zOicsIGVycm9yKTtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn1cclxuXHJcbmFzeW5jIGZ1bmN0aW9uIHN0YXJ0UmVjb3JkaW5nKCkge1xyXG4gICAgdHJ5IHtcclxuICAgICAgICAvLyBDaGVjayBwZXJtaXNzaW9ucyBmaXJzdFxyXG4gICAgICAgIGNvbnN0IGhhc1Blcm1pc3Npb24gPSBhd2FpdCByZXF1ZXN0TWljcm9waG9uZVBlcm1pc3Npb25zKCk7XHJcbiAgICAgICAgaWYgKCFoYXNQZXJtaXNzaW9uKSB7XHJcbiAgICAgICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc29sZS5sb2coJ1JlcXVlc3RpbmcgbWljcm9waG9uZSBhY2Nlc3MuLi4nKTtcclxuICAgICAgICBjb25zdCBjb25zdHJhaW50cyA9IHsgXHJcbiAgICAgICAgICAgIGF1ZGlvOiB7XHJcbiAgICAgICAgICAgICAgICBjaGFubmVsQ291bnQ6IDEsXHJcbiAgICAgICAgICAgICAgICBzYW1wbGVSYXRlOiAxNjAwMFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzdHJlYW0gPSBhd2FpdCBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShjb25zdHJhaW50cyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01pY3JvcGhvbmUgYWNjZXNzIGdyYW50ZWQ6Jywgc3RyZWFtLmdldEF1ZGlvVHJhY2tzKClbMF0uZ2V0U2V0dGluZ3MoKSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlciA9IG5ldyBNZWRpYVJlY29yZGVyKHN0cmVhbSwge1xyXG4gICAgICAgICAgICBtaW1lVHlwZTogJ2F1ZGlvL3dlYm07Y29kZWNzPW9wdXMnXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ01lZGlhUmVjb3JkZXIgY3JlYXRlZCB3aXRoIHNldHRpbmdzOicsIG1lZGlhUmVjb3JkZXIubWltZVR5cGUpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIub25kYXRhYXZhaWxhYmxlID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGlmIChldmVudC5kYXRhLnNpemUgPiAwKSB7XHJcbiAgICAgICAgICAgICAgICByZWNvcmRlZENodW5rcy5wdXNoKGV2ZW50LmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1JlY29yZGVkIGNodW5rIHNpemU6JywgZXZlbnQuZGF0YS5zaXplKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbmVycm9yID0gKGV2ZW50KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ01lZGlhUmVjb3JkZXIgZXJyb3I6JywgZXZlbnQuZXJyb3IpO1xyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5vbnN0b3AgPSBhc3luYyAoKSA9PiB7XHJcbiAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnUmVjb3JkaW5nIHN0b3BwZWQsIHByb2Nlc3NpbmcgYXVkaW8uLi4nKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGF1ZGlvQmxvYiA9IG5ldyBCbG9iKHJlY29yZGVkQ2h1bmtzLCB7IHR5cGU6ICdhdWRpby93ZWJtJyB9KTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBibG9iIGNyZWF0ZWQsIHNpemU6JywgYXVkaW9CbG9iLnNpemUpO1xyXG4gICAgICAgICAgICAgICAgcmVjb3JkZWRDaHVua3MgPSBbXTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ29udmVydCBhdWRpbyB0byBwcm9wZXIgZm9ybWF0IGZvciBXaGlzcGVyXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KHsgc2FtcGxlUmF0ZTogMTYwMDAgfSk7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0RhdGEgPSBhd2FpdCBhdWRpb0Jsb2IuYXJyYXlCdWZmZXIoKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkYXRhIHNpemU6JywgYXVkaW9EYXRhLmJ5dGVMZW5ndGgpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBjb25zdCBhdWRpb0J1ZmZlciA9IGF3YWl0IGF1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoYXVkaW9EYXRhKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBkZWNvZGVkLCBkdXJhdGlvbjonLCBhdWRpb0J1ZmZlci5kdXJhdGlvbik7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vIEdldCBhdWRpbyBkYXRhIGFzIEZsb2F0MzJBcnJheVxyXG4gICAgICAgICAgICAgICAgY29uc3QgYXVkaW8gPSBhdWRpb0J1ZmZlci5nZXRDaGFubmVsRGF0YSgwKTtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBjb252ZXJ0ZWQgdG8gRmxvYXQzMkFycmF5LCBsZW5ndGg6JywgYXVkaW8ubGVuZ3RoKTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gU2VuZCB0byB3b3JrZXIgZm9yIHRyYW5zY3JpcHRpb25cclxuICAgICAgICAgICAgICAgIGlmIChhc3JXb3JrZXIpIHtcclxuICAgICAgICAgICAgICAgICAgICBhc3JXb3JrZXIucG9zdE1lc3NhZ2UoeyBidWZmZXI6IGF1ZGlvIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdBdWRpbyBzZW50IHRvIEFTUiB3b3JrZXInKTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcignQVNSIHdvcmtlciBub3QgaW5pdGlhbGl6ZWQnKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8gQ2xlYW4gdXBcclxuICAgICAgICAgICAgICAgIHN0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKHRyYWNrID0+IHtcclxuICAgICAgICAgICAgICAgICAgICB0cmFjay5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0F1ZGlvIHRyYWNrIHN0b3BwZWQ6JywgdHJhY2subGFiZWwpO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIHByb2Nlc3NpbmcgcmVjb3JkZWQgYXVkaW86JywgZXJyb3IpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGVycm9yLm5hbWUgPT09ICdJbnZhbGlkU3RhdGVFcnJvcicpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKCdBdWRpbyBjb250ZXh0IGVycm9yIC0gcG9zc2libGUgc2FtcGxlIHJhdGUgb3IgZm9ybWF0IGlzc3VlJyk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBhZGRMb2dFbnRyeSgnZXJyb3InLCAnRXJyb3IgcHJvY2Vzc2luZyBhdWRpbzonLCBlcnJvci5tZXNzYWdlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcbiAgICAgICAgXHJcbiAgICAgICAgbWVkaWFSZWNvcmRlci5zdGFydCgxMDAwKTsgLy8gQ29sbGVjdCBkYXRhIGluIDEtc2Vjb25kIGNodW5rc1xyXG4gICAgICAgIGNvbnNvbGUubG9nKCdSZWNvcmRpbmcgc3RhcnRlZCcpO1xyXG4gICAgICAgIG1pY0J1dHRvbi5jbGFzc0xpc3QuYWRkKCdyZWNvcmRpbmcnKTtcclxuICAgICAgICBcclxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3Igc3RhcnRpbmcgcmVjb3JkaW5nOicsIHtcclxuICAgICAgICAgICAgbmFtZTogZXJyb3IubmFtZSxcclxuICAgICAgICAgICAgbWVzc2FnZTogZXJyb3IubWVzc2FnZSxcclxuICAgICAgICAgICAgY29uc3RyYWludDogZXJyb3IuY29uc3RyYWludCxcclxuICAgICAgICAgICAgc3RhY2s6IGVycm9yLnN0YWNrXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9ICdDb3VsZCBub3Qgc3RhcnQgcmVjb3JkaW5nOiAnO1xyXG4gICAgICAgIGlmIChlcnJvci5uYW1lID09PSAnTm90QWxsb3dlZEVycm9yJykge1xyXG4gICAgICAgICAgICAvLyBEb24ndCBzaG93IHRoaXMgbWVzc2FnZSBzaW5jZSB3ZSBoYW5kbGUgaXQgaW4gcmVxdWVzdE1pY3JvcGhvbmVQZXJtaXNzaW9uc1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90Rm91bmRFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdObyBtaWNyb3Bob25lIHdhcyBmb3VuZCc7XHJcbiAgICAgICAgfSBlbHNlIGlmIChlcnJvci5uYW1lID09PSAnTm90UmVhZGFibGVFcnJvcicpIHtcclxuICAgICAgICAgICAgZXJyb3JNZXNzYWdlICs9ICdNaWNyb3Bob25lIGlzIGFscmVhZHkgaW4gdXNlIGJ5IGFub3RoZXIgYXBwbGljYXRpb24nO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGVycm9yTWVzc2FnZSArPSBlcnJvci5tZXNzYWdlIHx8ICdVbmtub3duIGVycm9yJztcclxuICAgICAgICB9XHJcbiAgICAgICAgXHJcbiAgICAgICAgYWRkTG9nRW50cnkoJ2Vycm9yJywgZXJyb3JNZXNzYWdlKTtcclxuICAgICAgICBtaWNCdXR0b24uY2xhc3NMaXN0LnJlbW92ZSgncmVjb3JkaW5nJyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0b3BSZWNvcmRpbmcoKSB7XHJcbiAgICBpZiAobWVkaWFSZWNvcmRlciAmJiBtZWRpYVJlY29yZGVyLnN0YXRlID09PSAncmVjb3JkaW5nJykge1xyXG4gICAgICAgIG1lZGlhUmVjb3JkZXIuc3RvcCgpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vLyBJbml0aWFsaXplIEFTUiB3aGVuIHBvcHVwIGlzIGxvYWRlZFxyXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdET01Db250ZW50TG9hZGVkJywgKCkgPT4ge1xyXG4gICAgaW5pdEFTUigpO1xyXG59KTtcclxuXHJcbi8vIEFkZCBjbGljayBoYW5kbGVyIGZvciBtaWMgYnV0dG9uXHJcbm1pY0J1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcclxuICAgIGlmICghbWVkaWFSZWNvcmRlciB8fCBtZWRpYVJlY29yZGVyLnN0YXRlID09PSAnaW5hY3RpdmUnKSB7XHJcbiAgICAgICAgc3RhcnRSZWNvcmRpbmcoKTtcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc3RvcFJlY29yZGluZygpO1xyXG4gICAgfVxyXG59KTtcclxuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9