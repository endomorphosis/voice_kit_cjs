import os
import google.generativeai as genai

# Configure gemini using the API key from environment variables.
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Set up the generation configuration.
generation_config = {
  "temperature": 1,
  "top_p": 0.95,
  "top_k": 40,
  "max_output_tokens": 8192,
  "response_mime_type": "text/plain",
}

# Create the model with a system instruction.
model = genai.GenerativeModel(
  model_name="gemini-2.0-flash-exp",
  generation_config=generation_config,
  system_instruction="You are now chatting with the gemini conversation assistant.",
)

# Start a new chat session.
chat_session = model.start_chat(history=[])

def main():
    print("Welcome to the Gemini interactive chat. Type 'exit' to quit.")
    while True:
        user_input = input("You: ").strip()
        if user_input.lower() in ("exit", "quit"):
            print("Exiting chat. Goodbye!")
            break
        if user_input == "":
            print("Please enter a non-empty message.")
            continue

        # Send the message via the chat session and print the response.
        response = chat_session.send_message(user_input)
        print("Gemini:", response.text)

if __name__ == "__main__":
    main()
