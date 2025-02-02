#!/usr/bin/env python
import subprocess
from examples.audio_tone_generator import generate_beautiful_tone

def main():
    output_file = "beautiful_tone.wav"
    generate_beautiful_tone(output_file)
    print(f"Generated a beautiful tone at {output_file}")
    subprocess.run(["aplay", output_file])

if __name__ == "__main__":
    main()
