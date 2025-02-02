const perfectInterface = require('../path/to/perfectInterface'); // adjust the path as needed

describe('Perfect Interface Integration Tests', () => {
  beforeEach(async () => {
    // Reset conversation state before each test if available
    await perfectInterface.clearConversation();  
  });

  test('should allow the user to send a message and receive an AI response', async () => {
    const userMessage = "Hello, AI!";
    const response = await perfectInterface.sendMessage(userMessage);
    expect(response).toBeDefined();
    expect(typeof response).toBe("string");
    // Optionally check for a non-empty response or specific content patterns:
    expect(response.length).toBeGreaterThan(0);
  });

  test('should maintain conversation history correctly', async () => {
    // Send two messages that create at least one AI response each 
    const firstResponse = await perfectInterface.sendMessage("Hello");
    await perfectInterface.sendMessage("How are you?");
    const history = perfectInterface.getConversationHistory();
    // Expect conversation history to include the proper ordering of messages.
    // For example: user message, ai response, user message, ai response
    expect(history.length).toBe(4);
    expect(history[0].sender).toBe("user");
    expect(history[0].message).toBe("Hello");
    expect(history[1].sender).toBe("ai");
    expect(typeof history[1].message).toBe("string");
    expect(history[2].sender).toBe("user");
    expect(history[2].message).toBe("How are you?");
    expect(history[3].sender).toBe("ai");
    expect(typeof history[3].message).toBe("string");
  });

  test('should reject sending an empty message', async () => {
    await expect(perfectInterface.sendMessage("")).rejects.toThrow();
  });

  // Optionally, you might want a test for resetting the conversation.
  test('should clear the conversation history when requested', async () => {
    await perfectInterface.sendMessage("Hello");
    let history = perfectInterface.getConversationHistory();
    expect(history.length).toBeGreaterThan(0);
    await perfectInterface.clearConversation();
    history = perfectInterface.getConversationHistory();
    expect(history.length).toBe(0);
  });
});
