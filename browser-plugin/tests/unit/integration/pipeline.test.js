import { WhisperManager } from '../../src/core/asr/whisper-manager';
import { TextGenerator } from '../../src/core/llm/text-generator';
import { TTSManager } from '../../src/core/tts/tts-manager';
import { AudioProcessor } from '../../src/core/asr/audio-processor';

// Mock the transformers.js library
jest.mock('@xenova/transformers', () => {
  const mockPipeline = jest.fn().mockImplementation((task, model) => {
    switch (task) {
      case 'automatic-speech-recognition':
        return jest.fn().mockImplementation((audio) => {
          return Promise.resolve({
            text: "This is a mock ASR transcription.",
            chunks: [{text: "This is a mock ASR transcription.", timestamp: [0, 3]}]
          });
        });
      
      case 'text-generation':
        return jest.fn().mockImplementation((prompt) => {
          return Promise.resolve([
            { generated_text: `${prompt} This is additional generated text.` }
          ]);
        });
      
      case 'text-to-speech':
        return jest.fn().mockImplementation((text) => {
          return Promise.resolve({
            audio: {
              data: new Float32Array(16000).fill(0.1),
              sampling_rate: 16000
            },
            metadata: { speaker_id: 0 }
          });
        });
      
      default:
        return jest.fn();
    }
  });

  return {
    pipeline: mockPipeline,
    env: {
      useBrowserCache: false,
      useCustomCache: true
    },
    AutoTokenizer: {
      from_pretrained: jest.fn().mockResolvedValue({})
    },
    AutoModelForCausalLM: {
      from_pretrained: jest.fn().mockResolvedValue({
        generate: jest.fn().mockResolvedValue({
          sequences: [[1, 2, 3, 4, 5]]
        })
      })
    }
  };
});

describe('Pipeline Integration', () => {
  let asr, llm, tts, audioProcessor;
  let progressCallback;
  
  beforeEach(() => {
    progressCallback = jest.fn();
    
    // Create instances with mocked progress callback
    asr = new WhisperManager({
      modelId: 'Xenova/whisper-small',
      progressCallback
    });
    
    llm = new TextGenerator({
      modelId: 'Xenova/gpt2-small',
      progressCallback
    });
    
    tts = new TTSManager({
      modelId: 'Xenova/speecht5_tts',
      progressCallback
    });
    
    audioProcessor = new AudioProcessor();
  });
  
  afterEach(() => {
    // Clean up
    asr.cleanup();
    llm.cleanup();
    tts.cleanup();
    audioProcessor.cleanup();
    jest.clearAllMocks();
  });
  
  test('should process audio through complete ASR → LLM → TTS pipeline', async () => {
    // Create mock audio data
    const mockAudioData = new Float32Array(16000).fill(0.1);
    
    // 1. Initialize all components
    await Promise.all([
      asr.initialize(),
      llm.initialize(),
      tts.initialize()
    ]);
    
    // 2. Process audio through ASR
    const transcription = await asr.transcribe(mockAudioData);
    expect(transcription).toHaveProperty('text');
    expect(typeof transcription.text).toBe('string');
    
    // 3. Process transcription through LLM
    const response = await llm.generate(transcription.text);
    expect(response).toHaveProperty('text');
    expect(typeof response.text).toBe('string');
    
    // 4. Process response through TTS
    const speech = await tts.synthesize(response.text);
    expect(speech).toHaveProperty('audio');
    expect(speech.audio).toBeInstanceOf(Float32Array);
    
    // Verify the complete pipeline worked
    expect(progressCallback).toHaveBeenCalled();
  });

  test('should handle errors in the pipeline gracefully', async () => {
    // Create mock audio data
    const mockAudioData = new Float32Array(16000).fill(0.1);
    
    // Mock ASR to throw an error
    jest.spyOn(asr, 'transcribe').mockImplementationOnce(() => {
      throw new Error('ASR error');
    });
    
    // Initialize all components
    await Promise.all([
      asr.initialize(),
      llm.initialize(),
      tts.initialize()
    ]);
    
    // Attempt to process through pipeline
    await expect(async () => {
      try {
        const transcription = await asr.transcribe(mockAudioData);
        const response = await llm.generate(transcription.text);
        await tts.synthesize(response.text);
      } catch (error) {
        // Verify error is thrown and contains correct message
        expect(error.message).toBe('ASR error');
        throw error;
      }
    }).rejects.toThrow('ASR error');
    
    // Reset the mock
    asr.transcribe.mockRestore();
    
    // Now let LLM throw an error
    jest.spyOn(llm, 'generate').mockImplementationOnce(() => {
      throw new Error('LLM error');
    });
    
    await expect(async () => {
      try {
        const transcription = await asr.transcribe(mockAudioData);
        const response = await llm.generate(transcription.text);
        await tts.synthesize(response.text);
      } catch (error) {
        expect(error.message).toBe('LLM error');
        throw error;
      }
    }).rejects.toThrow('LLM error');
  });
  
  test('should measure performance metrics throughout the pipeline', async () => {
    // Create mock audio data
    const mockAudioData = new Float32Array(16000).fill(0.1);
    
    // Initialize all components
    await Promise.all([
      asr.initialize(),
      llm.initialize(),
      tts.initialize()
    ]);
    
    // Execute full pipeline with timing
    const start = performance.now();
    
    // ASR
    const asrStart = performance.now();
    const transcription = await asr.transcribe(mockAudioData);
    const asrTime = performance.now() - asrStart;
    
    // LLM
    const llmStart = performance.now();
    const response = await llm.generate(transcription.text);
    const llmTime = performance.now() - llmStart;
    
    // TTS
    const ttsStart = performance.now();
    const speech = await tts.synthesize(response.text);
    const ttsTime = performance.now() - ttsStart;
    
    const totalTime = performance.now() - start;
    
    // Verify timings make sense
    expect(asrTime).toBeGreaterThan(0);
    expect(llmTime).toBeGreaterThan(0);
    expect(ttsTime).toBeGreaterThan(0);
    expect(totalTime).toBeGreaterThanOrEqual(asrTime + llmTime + ttsTime);
    
    // Verify timing metadata is included in results
    expect(transcription).toHaveProperty('timing');
    expect(response).toHaveProperty('timing');
    expect(speech).toHaveProperty('timing');
  });
});