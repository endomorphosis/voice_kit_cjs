// content.js - runs in page context with safe document handling
(() => {
  const state = {
    elements: new Map(),
    isInitialized: false
  };

  // Safe document access
  const whenDocumentReady = () => new Promise(resolve => {
    if (!document || document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve(document));
    } else {
      resolve(document);
    }
  });

  // Safe string handling
  const safeString = input => input == null ? '' : String(input);

  // Safe element creation
  const createUIElement = (id, config) => {
    try {
      const element = document.createElement(config.tag || 'div');
      element.id = id;
      
      if (config.text) {
        element.textContent = safeString(config.text);
      }
      
      if (config.styles) {
        Object.assign(element.style, config.styles);
      }
      
      if (config.parent) {
        config.parent.appendChild(element);
      }
      
      state.elements.set(id, element);
      return element;
    } catch (error) {
      console.error('Failed to create UI element:', error);
      return null;
    }
  };

  // Initialize content script safely
  async function initializeContent() {
    try {
      await whenDocumentReady();
      if (state.isInitialized) return;
      
      // WebGPU support check
      const hasWebGPU = await checkWebGPU();
      console.log('WebGPU support:', hasWebGPU);
      
      // Message handling
      chrome.runtime.onMessage.addListener((message) => {
        if (!message || typeof message !== 'object') return;
        
        try {
          switch (message.action) {
            case 'showLoading':
              showLoading();
              break;
            case 'hideLoading':
              hideLoading();
              break;
            case 'showResult':
              showResult(message);
              break;
            case 'showError':
              showError(message.error);
              break;
          }
        } catch (error) {
          console.error('Error handling message:', error);
          showError(error.message);
        }
      });

      state.isInitialized = true;
    } catch (error) {
      console.error('Content script initialization failed:', error);
    }
  }

  // Utility functions with proper error handling
  async function checkWebGPU() {
    if (!navigator.gpu) return false;
    try {
      const adapter = await navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  function showLoading() {
    createUIElement('extension-loading', {
      text: 'Fetching content...',
      styles: {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '10px',
        background: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        zIndex: '10000'
      },
      parent: document.body
    });
  }

  function hideLoading() {
    const element = state.elements.get('extension-loading');
    if (element?.parentNode) {
      element.parentNode.removeChild(element);
      state.elements.delete('extension-loading');
    }
  }

  function showResult({ result, userText }) {
    const container = createUIElement('copilot-chat-container', {
      styles: {
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
      },
      parent: document.body
    });

    if (!container) return;

    const header = createUIElement('chat-header', {
      styles: {
        padding: '12px',
        borderBottom: '1px solid #eee',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      },
      parent: container
    });

    createUIElement('chat-title', {
      tag: 'span',
      text: 'AI Response',
      styles: {
        fontWeight: 'bold'
      },
      parent: header
    });

    const closeBtn = createUIElement('chat-close', {
      tag: 'button',
      text: '×',
      styles: {
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        fontSize: '20px',
        padding: '0 4px'
      },
      parent: header
    });

    if (closeBtn) {
      closeBtn.onclick = () => {
        container.remove();
        state.elements.clear();
      };
    }

    const content = createUIElement('chat-content', {
      styles: {
        padding: '16px',
        overflowY: 'auto',
        fontSize: '14px',
        lineHeight: '1.5'
      },
      parent: container
    });

    if (content) {
      createUIElement('user-message', {
        text: userText,
        styles: {
          marginBottom: '12px',
          padding: '8px 12px',
          background: '#f0f0f0',
          borderRadius: '8px'
        },
        parent: content
      });

      createUIElement('ai-response', {
        text: result,
        styles: {
          padding: '8px 12px',
          background: '#e3f2fd',
          borderRadius: '8px',
          whiteSpace: 'pre-wrap'
        },
        parent: content
      });
    }
  }

  function showError(error) {
    const errorText = safeString(error || 'Unknown error occurred');
    alert(errorText);
  }

  // Start initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeContent);
  } else {
    initializeContent();
  }
})();

function handleTranscription(text) {
  // Only modify the page if we have access to the document
  if (document && document.body) {
    // Handle the transcription result
    console.log('Received transcription:', text);
  }
}

// Send audio data to background script
function sendAudioData(audioData) {
  chrome.runtime.sendMessage({
    type: 'transcribe',
    audio: audioData
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
