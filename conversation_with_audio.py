import os
import google.generativeai as genai
from examples.audio_tone_generator import generate_confidence_tone

genai.configure(api_key=os.environ["GEMINI_API_KEY"])

model = genai.GenerativeModel(
  model_name="gemini-2.0-flash-exp",
  generation_config={
      "temperature": 1,
      "top_p": 0.95,
      "top_k": 40,
      "max_output_tokens": 8192,
      "response_mime_type": "text/plain",
  },
  system_instruction="test system message",
)

def main():
    chat_session = model.start_chat(history=[])
    while True:
        user_input = input("You: ")
        if not user_input.strip():
            print("Exiting.")
            break
        response = chat_session.send_message(user_input)
        print("AI:", response.text)
        generate_confidence_tone("medium", "temp.wav")
        os.system("play temp.wav")  # or 'afplay', etc., depending on your system

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1].lower() == "beautiful":
        from examples.audio_tone_generator import generate_beautiful_tone
        output_file = "beautiful_tone.wav"
        generate_beautiful_tone(output_file)
        print("Playing beautiful tone...")
        os.system("play " + output_file)   # Adjust command as needed for your OS (e.g., afplay on macOS)
    else:
        main()
