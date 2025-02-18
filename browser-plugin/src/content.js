// IIFE to avoid global scope pollution and ensure proper module isolation
(() => {
  const state = {
    isInitialized: false,
    elements: new Map()
  };

  // Safe DOM access utility
  const DOM = {
    ready: () => {
      return new Promise(resolve => {
        if (document.readyState !== 'loading') resolve();
        else document.addEventListener('DOMContentLoaded', resolve);
      });
    },
    safeCreateElement: (tagName, options = {}) => {
      try {
        const element = document.createElement(tagName);
        if (options.id) element.id = options.id;
        if (options.className) element.className = options.className;
        if (options.text) element.textContent = DOM.sanitize(options.text);
        if (options.styles) Object.assign(element.style, options.styles);
        return element;
      } catch (error) {
        console.error('Failed to create element:', error);
        return null;
      }
    },
    sanitize: (text) => {
      if (!text) return '';
      return String(text).replace(/[<>&"']/g, c => ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#39;'
      }[c] || c));
    }
  };

  // Message handling with proper type checking
  class MessageHandler {
    static send(message) {
      if (!message || typeof message !== 'object') {
        return Promise.reject(new Error('Invalid message format'));
      }
      return chrome.runtime.sendMessage(message);
    }

    static listen() {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message?.action) {
          sendResponse({ error: 'Invalid message format' });
          return true;
        }

        this.handleMessage(message, sender)
          .then(response => sendResponse(response))
          .catch(error => sendResponse({ error: error.message }));

        return true; // Will respond asynchronously
      });
    }

    static async handleMessage(message, sender) {
      switch (message.action) {
        case 'showResult':
          if (!message.result) throw new Error('No result provided');
          UI.showResult(message.result, message.userText);
          return { success: true };

        case 'showError':
          UI.showError(message.error);
          return { success: true };

        default:
          throw new Error(`Unknown action: ${message.action}`);
      }
    }
  }

  // UI management
  const UI = {
    containers: new Map(),

    createContainer(id, options = {}) {
      try {
        let container = this.containers.get(id);
        if (container?.isConnected) return container;

        container = DOM.safeCreateElement('div', {
          id,
          styles: {
            position: 'fixed',
            zIndex: '10000',
            padding: '15px',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            ...options.styles
          }
        });

        if (!container) throw new Error('Failed to create container');

        document.body.appendChild(container);
        this.containers.set(id, container);
        return container;
      } catch (error) {
        console.error('Error creating container:', error);
        return null;
      }
    },

    showResult(result, userText) {
      const container = this.createContainer('extension-result', {
        styles: {
          bottom: '20px',
          right: '20px',
          maxWidth: '400px',
          background: 'white'
        }
      });

      if (!container) return;

      const content = DOM.safeCreateElement('div');
      if (!content) return;

      content.innerHTML = `
        <div style="margin-bottom: 10px; color: #666;">${DOM.sanitize(userText || '')}</div>
        <div style="margin-bottom: 15px;">${DOM.sanitize(result)}</div>
      `;

      const closeButton = DOM.safeCreateElement('button', {
        text: 'Close',
        styles: {
          padding: '5px 10px',
          border: 'none',
          background: '#f0f0f0',
          borderRadius: '4px',
          cursor: 'pointer'
        }
      });

      if (closeButton) {
        closeButton.onclick = () => container.remove();
        content.appendChild(closeButton);
      }

      container.innerHTML = '';
      container.appendChild(content);
    },

    showError(error) {
      const container = this.createContainer('extension-error', {
        styles: {
          top: '20px',
          right: '20px',
          background: '#ffebee',
          border: '1px solid #ffcdd2'
        }
      });

      if (!container) return;

      container.textContent = DOM.sanitize(error || 'Unknown error occurred');

      setTimeout(() => container.remove(), 5000);
    }
  };

  // Initialize safely
  async function initialize() {
    if (state.isInitialized) return;

    try {
      await DOM.ready();
      MessageHandler.listen();
      state.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize content script:', error);
    }
  }

  // Start initialization
  initialize();
})();

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

const RESULT_CONTAINER_ID = 'transformers-js-result-container';

// Create styled container for results
function createResultContainer() {
  const container = document.createElement('div');
  container.id = RESULT_CONTAINER_ID;
  container.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    max-width: 400px;
    padding: 15px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
  `;
  return container;
}

// Show result in a floating container
function showResult(result, userText) {
  let container = document.getElementById(RESULT_CONTAINER_ID);
  if (!container) {
    container = createResultContainer();
    document.body.appendChild(container);
  }

  container.innerHTML = `
    <div style="margin-bottom: 10px; color: #666;">Input: ${userText}</div>
    <div style="margin-bottom: 15px;">${result}</div>
    <button onclick="this.parentElement.remove()" style="
      padding: 5px 10px;
      border: none;
      background: #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
    ">Close</button>
  `;
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return;

  try {
    switch (message.action) {
      case 'showResult':
        if (message.result && message.userText) {
          showResult(message.result, message.userText);
        }
        break;
      
      case 'showError':
        console.error('Error from extension:', message.error);
        showResult(`Error: ${message.error}`, 'Failed operation');
        break;
    }
  } catch (error) {
    console.error('Error handling message:', error);
  }
});
