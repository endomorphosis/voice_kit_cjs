import unittest
import os
import wave

# This import assumes that you plan to implement the generate_beautiful_tone function
from examples.audio_tone_generator import generate_beautiful_tone

class TestBeautifulToneGenerator(unittest.TestCase):

    def test_generate_beautiful_tone_creates_valid_wav(self):
        # The output filename for the generated tone
        output_wav = "test_beautiful_tone.wav"

        # Remove the file if it already exists to avoid false positives
        if os.path.exists(output_wav):
            os.remove(output_wav)

        # Call the function that should generate the beautiful tone
        # (The function does not exist yet, so this call will fail currently.)
        generate_beautiful_tone(output_wav)

        # Verify that the file was created
        self.assertTrue(os.path.exists(output_wav), "Output WAV file was not created.")

        # Open the WAV file and validate some properties
        with wave.open(output_wav, 'rb') as wav_file:
            n_channels = wav_file.getnchannels()
            framerate = wav_file.getframerate()
            n_frames = wav_file.getnframes()

        # For our definition of a "beautiful tone", we expect:
        # • The file to be mono (1 channel)
        # • A sample rate of 44100 Hz
        # • A duration of at least 2 seconds
        self.assertEqual(n_channels, 1, "Expected mono (1 channel) WAV file.")
        self.assertEqual(framerate, 44100, "Expected a sample rate of 44100 Hz.")
        duration = n_frames / float(framerate)
        self.assertGreaterEqual(duration, 2, "Tone duration should be at least 2 seconds.")

if __name__ == '__main__':
    unittest.main()
