import math
import wave

SAMPLE_RATE = 44100
TONE_DURATION = 0.5   # Duration for confidence tones
AUDIO_DURATION = 1    # Duration for each MIDI note

def generate_sine_wave(frequency, amplitude, duration, fade_duration=0.1):
    num_samples = int(SAMPLE_RATE * duration)
    fade_samples = int(SAMPLE_RATE * fade_duration)
    wave_data = []
    for i in range(num_samples):
        sample = amplitude * math.sin(2 * math.pi * frequency * i / SAMPLE_RATE)
        # Apply fade-in
        if i < fade_samples:
            sample *= (i / fade_samples)
        # Apply fade-out
        elif i >= num_samples - fade_samples:
            sample *= ((num_samples - i) / fade_samples)
        sample_int = int(sample * 32767)
        wave_data.append(sample_int.to_bytes(2, byteorder='little', signed=True))
    return b"".join(wave_data)

def generate_confidence_tone(confidence_level, output_wav_file):
    if confidence_level == "low":
        frequency = 220
    elif confidence_level == "medium":
        frequency = 440
    elif confidence_level == "high":
        frequency = 880
    else:
        return  # do nothing

    amplitude = 0.5  # Constant amplitude
    wave_data = generate_sine_wave(frequency, amplitude, TONE_DURATION)

    with wave.open(output_wav_file, 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 16-bit samples
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(wave_data)

def midi_to_frequency(note):
    return 440 * math.pow(2, (note - 69) / 12)

def parse_midi_file(midi_file):
    midi_events = []
    with open(midi_file, 'r') as f:
        for line in f:
            parts = line.strip().split()
            if len(parts) == 3:
                try:
                    command = int(parts[0], 16)
                    note = int(parts[1], 16)
                    velocity = int(parts[2], 16)
                    midi_events.append((command, note, velocity))
                except ValueError:
                  pass # ignore bad lines
    return midi_events

def generate_audio_from_midi(midi_file, output_wav_file):
  midi_events = parse_midi_file(midi_file)
  all_wave_data = b""
  for event in midi_events:
      command, note, velocity = event
      if command == 0x90 and velocity > 0:  # Note On
          frequency = midi_to_frequency(note)
          amplitude = velocity / 127   # Scale velocity to amplitude
          wave_data = generate_sine_wave(frequency, amplitude, AUDIO_DURATION)
          all_wave_data += wave_data
      elif command == 0x80 or (command == 0x90 and velocity == 0):  # Note Off
         pass # for now do nothing

  with wave.open(output_wav_file, 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 16-bit samples
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(all_wave_data)

def generate_beautiful_tone(output_wav_file):
    # Define the tone parameters for a "beautiful tone"
    frequency = 440         # For example, A4 note
    amplitude = 0.5         # A suitable amplitude
    duration = 2.0          # Ensure the tone is at least 2 seconds long
    tone_data = generate_sine_wave(frequency, amplitude, duration)
    with wave.open(output_wav_file, 'wb') as wf:
        wf.setnchannels(1)   # Mono
        wf.setsampwidth(2)   # 16-bit samples (2 bytes)
        wf.setframerate(SAMPLE_RATE)
        wf.writeframes(tone_data)
    # Example: generate confidence tones
    generate_confidence_tone("low", '/path/to/low.wav')
    generate_confidence_tone("medium", '/path/to/medium.wav')
    generate_confidence_tone("high", '/path/to/high.wav')

    # Example: generate audio from MIDI
    generate_audio_from_midi('/path/to/midi_input.txt', '/path/to/output.wav')
