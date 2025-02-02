#!/usr/bin/env python3
import wave
import numpy as np
import matplotlib.pyplot as plt

def plot_waveform(wav_file):
    with wave.open(wav_file, 'rb') as wf:
        n_channels = wf.getnchannels()
        sampwidth = wf.getsampwidth()
        framerate = wf.getframerate()
        n_frames = wf.getnframes()
        frames = wf.readframes(n_frames)
    # convert to numpy array assuming 16-bit samples
    data = np.frombuffer(frames, dtype=np.int16)
    if n_channels > 1:
        data = data[::n_channels]
    time = np.linspace(0, n_frames / framerate, num=n_frames)
    plt.figure(figsize=(10, 4))
    plt.plot(time, data, label='Waveform')
    plt.xlabel('Time (s)')
    plt.ylabel('Amplitude')
    plt.title('Waveform of ' + wav_file)
    plt.legend()
    plt.tight_layout()
    plt.show()

def main():
    wav_file = "beautiful_tone.wav"
    plot_waveform(wav_file)

if __name__ == "__main__":
    main()
