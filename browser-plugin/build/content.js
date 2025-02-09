// content.js - the content script which runs in the context of web pages, and has access
// to the DOM and other web APIs.

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'display_result') {
        displayChatUI(message.selectedText, message.result);
    } else if (message.type === 'display_error') {
        alert('Error: ' + message.error);
    }
});

function displayChatUI(userText, aiResponse) {
    // Create a floating div to show the result
    const chatContainer = document.createElement('div');
    chatContainer.id = 'copilot-chat-container';
    chatContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        width: 400px;
        max-height: 80vh;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        display: flex;
        flex-direction: column;
    `;

    // Add header with title and close button
    const header = document.createElement('div');
    header.style.cssText = `
        padding: 12px;
        border-bottom: 1px solid #eee;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `;
    header.innerHTML = '<span style="font-weight: bold;">AI Response</span>';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        border: none;
        background: none;
        cursor: pointer;
        font-size: 20px;
        padding: 0 4px;
    `;
    closeBtn.onclick = () => chatContainer.remove();
    header.appendChild(closeBtn);

    // Add chat content
    const content = document.createElement('div');
    content.style.cssText = `
        padding: 16px;
        overflow-y: auto;
        font-size: 14px;
        line-height: 1.5;
    `;

    // Add user message
    const userMessage = document.createElement('div');
    userMessage.style.cssText = `
        margin-bottom: 12px;
        padding: 8px 12px;
        background: #f0f0f0;
        border-radius: 8px;
    `;
    userMessage.textContent = userText;

    // Add AI response
    const aiResponseDiv = document.createElement('div');
    aiResponseDiv.style.cssText = `
        padding: 8px 12px;
        background: #e3f2fd;
        border-radius: 8px;
        white-space: pre-wrap;
    `;
    aiResponseDiv.textContent = aiResponse;

    content.appendChild(userMessage);
    content.appendChild(aiResponseDiv);

    chatContainer.appendChild(header);
    chatContainer.appendChild(content);
    document.body.appendChild(chatContainer);
}

// Example usage:
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
