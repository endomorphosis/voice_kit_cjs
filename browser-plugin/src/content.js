// content.js - the content script which runs in the context of web pages, and has access
// to the DOM and other web APIs.

// Check for WebGPU support
console.log('Checking WebGPU support...');
if (!navigator.gpu) {
    console.log('WebGPU not supported, will use WASM backend');
} else {
    // Test WebGPU capabilities without requiring f16
    navigator.gpu.requestAdapter().then(adapter => {
        if (adapter) {
            console.log('WebGPU supported with adapter:', {
                name: adapter.name,
                features: Array.from(adapter.features)
            });
        } else {
            console.log('WebGPU adapter not available, will use WASM backend');
        }
    }).catch(error => {
        console.log('WebGPU initialization failed:', error);
    });
}

// Example usage for text generation:
//
// import { ACTION_NAME } from "./constants.js";
// const message = {
//     action: ACTION_NAME,
//     text: 'Your input text here',
// }
// const response = await chrome.runtime.sendMessage(message);
// console.log('Generated text:', response)

// You can also add your own UI elements or handlers here to trigger text generation
// The context menu integration is handled by background.js
