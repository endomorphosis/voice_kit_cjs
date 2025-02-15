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

// Handles UI interactions and DOM manipulation
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'showLoading') {
    const div = document.createElement('div');
    div.id = 'extension-loading';
    div.textContent = 'Fetching content...';
    Object.assign(div.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '10px',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '4px',
      zIndex: '10000'
    });
    document.body.appendChild(div);
  }
  if (message.action === 'hideLoading') {
    document.getElementById('extension-loading')?.remove();
  }
  if (message.action === 'showResult') {
    const {
      result,
      userText
    } = message;
    const chatContainer = document.createElement('div');
    chatContainer.id = 'copilot-chat-container';
    Object.assign(chatContainer.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '80vh',
      background: 'white',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: '10000',
      display: 'flex',
      flexDirection: 'column'
    });
    const header = document.createElement('div');
    Object.assign(header.style, {
      padding: '12px',
      borderBottom: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    });
    header.innerHTML = '<span style="font-weight: bold;">AI Response</span>';
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    Object.assign(closeBtn.style, {
      border: 'none',
      background: 'none',
      cursor: 'pointer',
      fontSize: '20px',
      padding: '0 4px'
    });
    closeBtn.onclick = () => chatContainer.remove();
    header.appendChild(closeBtn);
    const content = document.createElement('div');
    Object.assign(content.style, {
      padding: '16px',
      overflowY: 'auto',
      fontSize: '14px',
      lineHeight: '1.5'
    });
    const userMessage = document.createElement('div');
    Object.assign(userMessage.style, {
      marginBottom: '12px',
      padding: '8px 12px',
      background: '#f0f0f0',
      borderRadius: '8px'
    });
    userMessage.textContent = userText;
    const aiResponse = document.createElement('div');
    Object.assign(aiResponse.style, {
      padding: '8px 12px',
      background: '#e3f2fd',
      borderRadius: '8px',
      whiteSpace: 'pre-wrap'
    });
    aiResponse.textContent = result;
    content.appendChild(userMessage);
    content.appendChild(aiResponse);
    chatContainer.appendChild(header);
    chatContainer.appendChild(content);
    document.body.appendChild(chatContainer);
  }
  if (message.action === 'showError') {
    alert('Error: ' + message.error);
  }
});

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

//# sourceMappingURL=content.js.map