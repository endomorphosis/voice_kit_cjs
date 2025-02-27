# Transformers.js Browser Extension Testing Plan

## Overview

This document outlines a step-by-step approach to rebuild the browser plugin with proper unit testing to ensure each component works correctly. We'll follow a modular architecture where each feature can be tested independently.

## 1. Core Library Structure

First, create a modular core library that can be tested outside the Chrome extension context:

```
/src
  /core
    /asr
      whisper-manager.js     # ASR functionality
      audio-processor.js     # Audio processing utilities
    /tts
      tts-manager.js         # TTS functionality
    /llm
      text-generator.js      # LLM text generation
    /utils
      wasm-loader.js         # WebAssembly loading utilities
      model-cache.js         # Model caching functionality
      transformer-base.js    # Base class for transformer models
    /testing
      mock-audio.js          # Test audio data
      mock-models.js         # Mock model responses
```

## 2. Unit Testing Strategy

Set up a Jest testing environment with appropriate mocks:

```
/tests
  /unit
    /asr
      whisper-manager.test.js
      audio-processor.test.js
    /tts
      tts-manager.test.js
    /llm
      text-generator.test.js
    /utils
      wasm-loader.test.js
      model-cache.test.js
```

## 3. Feature Testing Steps

### Step 1: WASM Loading and Environment Setup

1. Create a minimal WASM loader that:
   - Can load WebAssembly modules from URLs or ArrayBuffers
   - Provides a clear success/failure indicator
   - Can be mocked during testing

2. Test cases:
   - Loading valid WASM modules
   - Handling network errors
   - Handling invalid WASM modules
   - Verifying proper environment configuration

### Step 2: Model Caching

1. Create a model cache manager that:
   - Stores models in IndexedDB
   - Provides clear cache hit/miss indicators
   - Has methods for cache invalidation
   
2. Test cases:
   - Saving model to cache
   - Loading model from cache
   - Handling cache misses
   - Managing cache size limits
   - Invalidating outdated models

### Step 3: Audio Processing

1. Create audio processing utilities that:
   - Convert between different audio formats
   - Handle resampling and audio normalization
   - Prepare audio features for ASR models

2. Test cases:
   - Converting audio file to appropriate format
   - Processing audio streams
   - Extracting features for ASR
   - Handling different sample rates and bit depths

### Step 4: ASR Pipeline

1. Create a whisper manager that:
   - Initializes the Whisper model with proper configuration
   - Processes audio input into text output
   - Handles errors gracefully

2. Test cases:
   - Model initialization
   - Transcription of known audio samples
   - Handling audio processing errors
   - Memory management during processing

### Step 5: LLM Pipeline

1. Create a text generator that:
   - Initializes text generation models
   - Handles text generation requests
   - Manages context and tokens efficiently

2. Test cases:
   - Model initialization
   - Text generation with different parameters
   - Handling token limits and truncation
   - Memory management during generation

### Step 6: TTS Pipeline

1. Create a TTS manager that:
   - Initializes text-to-speech models
   - Converts text to audio with proper formatting
   - Handles streaming output

2. Test cases:
   - Model initialization
   - Converting text to speech
   - Handling different voices and languages
   - Memory management during synthesis

### Step 7: Integration Testing

Create integration tests that:
   - Test ASR → LLM → TTS pipeline
   - Verify end-to-end functionality
   - Test performance and resource usage

## 4. Browser Extension Structure

Once core functionality is tested, integrate with the browser extension structure:

```
/src
  /core/             # Core library (from above)
  /extension
    background.js    # Service worker
    content.js       # Content script
    popup.js         # Popup UI
    worker.js        # Web worker for processing
    manifest.json    # Extension manifest
```

## 5. Extension-Specific Testing

1. Create a mock Chrome API for testing:
   - Simulate chrome.runtime messaging
   - Mock storage APIs
   - Emulate extension contexts

2. Test extension-specific features:
   - Communication between contexts
   - UI interaction
   - Background service worker behavior
   - Content script integration

## 6. End-to-End Testing

1. Use Puppeteer or similar to test the full extension:
   - Load the extension in a controlled browser environment
   - Automate UI interactions
   - Verify functionality across different websites

## 7. Performance Testing

1. Create performance benchmarks:
   - Model loading time
   - Inference speed
   - Memory usage
   - Battery impact

## Implementation Plan

### Phase 1: Core Library Development and Testing
- Implement WASM loading and model caching
- Set up testing framework
- Develop and test audio processing utilities

### Phase 2: ASR Implementation
- Implement Whisper model integration
- Develop audio input handling
- Test transcription functionality

### Phase 3: LLM Implementation
- Implement text generation models
- Test prompt handling and response generation
- Optimize for performance

### Phase 4: TTS Implementation
- Implement TTS model integration
- Test audio output quality
- Optimize for streaming capability

### Phase 5: Extension Integration
- Implement browser extension structure
- Integrate core functionality
- Test cross-context communication

### Phase 6: Deployment and Monitoring
- Package for Chrome Web Store
- Implement telemetry for error tracking
- Set up automatic regression testing