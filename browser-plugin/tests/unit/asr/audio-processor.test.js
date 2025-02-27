import { AudioProcessor } from '../../src/core/asr/audio-processor';

// Mock AudioContext and related audio APIs
class MockAudioContext {
  constructor(options) {
    this.sampleRate = options?.sampleRate || 44100;
    this.state = 'running';
  }
  
  decodeAudioData(buffer) {
    return Promise.resolve({
      sampleRate: this.sampleRate,
      getChannelData: () => new Float32Array(buffer.byteLength / 4).fill(0.1)
    });
  }
  
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

// Set up global mocks
global.AudioContext = MockAudioContext;
global.window = {
  AudioContext: MockAudioContext
};

describe('AudioProcessor', () => {
  let audioProcessor;
  
  beforeEach(() => {
    // Create a new instance for each test
    audioProcessor = new AudioProcessor({
      targetSampleRate: 16000,
      normalization: true
    });
  });
  
  afterEach(() => {
    // Clean up
    audioProcessor.cleanup();
  });
  
  test('should initialize with correct default values', () => {
    const processor = new AudioProcessor();
    expect(processor.targetSampleRate).toBe(16000);
    expect(processor.normalization).toBe(true);
  });
  
  test('should initialize with custom values', () => {
    const processor = new AudioProcessor({
      targetSampleRate: 22050,
      normalization: false
    });
    expect(processor.targetSampleRate).toBe(22050);
    expect(processor.normalization).toBe(false);
  });
  
  test('should initialize AudioContext', async () => {
    await audioProcessor.initialize();
    expect(audioProcessor.audioContext).toBeInstanceOf(MockAudioContext);
    expect(audioProcessor.audioContext.sampleRate).toBe(16000);
  });
  
  test('should convert blob to Float32Array', async () => {
    const mockBlob = {
      arrayBuffer: jest.fn(() => Promise.resolve(new ArrayBuffer(1000)))
    };
    
    await audioProcessor.initialize();
    const result = await audioProcessor.blobToFloat32Array(mockBlob);
    
    expect(mockBlob.arrayBuffer).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(250); // 1000 bytes / 4 bytes per float
  });
  
  test('should handle missing blob', async () => {
    await expect(audioProcessor.blobToFloat32Array(null)).rejects.toThrow('No audio blob provided');
  });
  
  test('should convert array buffer to Float32Array', async () => {
    const buffer = new ArrayBuffer(1000);
    
    await audioProcessor.initialize();
    const result = await audioProcessor.arrayBufferToFloat32Array(buffer);
    
    expect(result).toBeInstanceOf(Float32Array);
    expect(result.length).toBe(250); // 1000 bytes / 4 bytes per float
  });
  
  test('should handle missing array buffer', async () => {
    await expect(audioProcessor.arrayBufferToFloat32Array(null)).rejects.toThrow('No audio buffer provided');
  });
  
  test('should resample audio data', () => {
    // Create test audio data (1 second at 44.1kHz)
    const originalData = new Float32Array(44100).fill(0.5);
    
    // Resample to 16kHz
    const resampled = audioProcessor.resampleAudio(originalData, 44100, 16000);
    
    expect(resampled).toBeInstanceOf(Float32Array);
    expect(resampled.length).toBe(16000); // 16000 samples for 1 second
    expect(resampled[0]).toBeCloseTo(0.5); // Values should be preserved
  });
  
  test('should not resample when source and target rates match', () => {
    const originalData = new Float32Array(16000).fill(0.5);
    const resampled = audioProcessor.resampleAudio(originalData, 16000, 16000);
    
    expect(resampled).toBe(originalData); // Should return the same array
  });
  
  test('should normalize audio data', () => {
    // Create test audio data with values between -0.1 and 0.1
    const originalData = new Float32Array(1000).fill(0.1);
    
    // Normalize (should scale up to near -1.0 to 1.0)
    const normalized = audioProcessor.normalizeAudio(originalData);
    
    expect(normalized).toBeInstanceOf(Float32Array);
    expect(normalized[0]).toBeCloseTo(0.95); // Should be scaled to 0.95
  });
  
  test('should not normalize if already in appropriate range', () => {
    // Create test audio data with values between -0.5 and 0.5
    const originalData = new Float32Array(1000).fill(0.5);
    
    // Normalize (should not change much)
    const normalized = audioProcessor.normalizeAudio(originalData);
    
    expect(normalized).toBe(originalData); // Should return the same array
  });
  
  test('should not amplify silent audio', () => {
    // Create test audio data that's essentially silent
    const originalData = new Float32Array(1000).fill(0.0001);
    
    // Normalize
    const normalized = audioProcessor.normalizeAudio(originalData);
    
    expect(normalized).toBe(originalData); // Should return the same array
  });
  
  test('should extract features from audio data', () => {
    const audioData = new Float32Array(16000).fill(0.5);
    const features = audioProcessor.extractFeatures(audioData);
    
    expect(features).toHaveProperty('input_features');
    expect(features).toHaveProperty('sampling_rate');
    expect(features.sampling_rate).toBe(16000);
  });
  
  test('should clean up resources', async () => {
    await audioProcessor.initialize();
    expect(audioProcessor.audioContext).toBeTruthy();
    
    audioProcessor.cleanup();
    expect(audioProcessor.audioContext).toBeNull();
  });
});