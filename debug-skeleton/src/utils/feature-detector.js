/**
 * Utility for detecting browser capabilities relevant to the voice kit
 */
import { getLogger } from './logger.js';

const logger = getLogger('FeatureDetector');

export class FeatureDetector {
  constructor() {
    this.features = {
      webGPU: null,
      webGPUShaderFloat16: null,
      webAudio: null,
      webWorker: null,
      sharedArrayBuffer: null,
      crossOriginIsolation: null,
      storage: null,
      speechRecognition: null,
      speechSynthesis: null
    };

    this.detected = false;
  }

  /**
   * Detect all features
   */
  async detectAll() {
    logger.info('Detecting browser features...');
    const startTime = logger.time('feature-detection');

    try {
      this.features.webGPU = await this.detectWebGPU();
      this.features.webGPUShaderFloat16 = await this.detectWebGPUShaderFloat16();
      this.features.webAudio = this.detectWebAudio();
      this.features.webWorker = this.detectWebWorker();
      this.features.sharedArrayBuffer = this.detectSharedArrayBuffer();
      this.features.crossOriginIsolation = this.detectCrossOriginIsolation();
      this.features.storage = this.detectStorage();
      this.features.speechRecognition = this.detectSpeechRecognition();
      this.features.speechSynthesis = this.detectSpeechSynthesis();
      
      this.detected = true;
      logger.timeEnd('feature-detection', startTime);
      
      // Log a summary of detected features
      logger.info('Feature detection summary:', JSON.stringify(this.features, null, 2));
      
      return this.features;
    } catch (error) {
      logger.error('Error during feature detection:', error);
      throw error;
    }
  }

  /**
   * Check if WebGPU is supported
   */
  async detectWebGPU() {
    try {
      logger.debug('Checking for WebGPU support...');
      
      // Check if navigator.gpu exists
      if (!navigator.gpu) {
        logger.warn('WebGPU is not supported (navigator.gpu is undefined)');
        return false;
      }
      
      // Try to request an adapter
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        logger.warn('WebGPU is not supported (no adapter found)');
        return false;
      }

      // Get adapter info
      const info = await adapter.requestAdapterInfo();
      logger.info(`WebGPU is supported! Adapter: ${info.vendor} - ${info.architecture}`);
      
      return true;
    } catch (error) {
      logger.error('Error detecting WebGPU:', error);
      return false;
    }
  }

  /**
   * Check if WebGPU shader float16 extension is supported
   */
  async detectWebGPUShaderFloat16() {
    try {
      logger.debug('Checking for WebGPU shader float16 support...');
      
      if (!navigator.gpu) {
        return false;
      }
      
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) {
        return false;
      }
      
      const hasFloat16 = adapter.features.has('shader-f16');
      
      if (hasFloat16) {
        logger.info('WebGPU shader float16 is supported!');
      } else {
        logger.warn('WebGPU shader float16 is not supported');
      }
      
      return hasFloat16;
    } catch (error) {
      logger.error('Error detecting WebGPU shader float16:', error);
      return false;
    }
  }

  /**
   * Check if Web Audio API is supported
   */
  detectWebAudio() {
    try {
      logger.debug('Checking for Web Audio API support...');
      
      const hasAudioContext = typeof AudioContext !== 'undefined' || 
                            typeof webkitAudioContext !== 'undefined';
      
      if (hasAudioContext) {
        logger.info('Web Audio API is supported!');
      } else {
        logger.warn('Web Audio API is not supported');
      }
      
      return hasAudioContext;
    } catch (error) {
      logger.error('Error detecting Web Audio API:', error);
      return false;
    }
  }

  /**
   * Check if Web Workers are supported
   */
  detectWebWorker() {
    try {
      logger.debug('Checking for Web Worker support...');
      
      const hasWebWorker = typeof Worker !== 'undefined';
      
      if (hasWebWorker) {
        logger.info('Web Workers are supported!');
      } else {
        logger.warn('Web Workers are not supported');
      }
      
      return hasWebWorker;
    } catch (error) {
      logger.error('Error detecting Web Workers:', error);
      return false;
    }
  }

  /**
   * Check if SharedArrayBuffer is supported
   */
  detectSharedArrayBuffer() {
    try {
      logger.debug('Checking for SharedArrayBuffer support...');
      
      const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined';
      
      if (hasSharedArrayBuffer) {
        logger.info('SharedArrayBuffer is supported!');
      } else {
        logger.warn('SharedArrayBuffer is not supported');
      }
      
      return hasSharedArrayBuffer;
    } catch (error) {
      logger.error('Error detecting SharedArrayBuffer:', error);
      return false;
    }
  }

  /**
   * Check if the page is cross-origin isolated
   */
  detectCrossOriginIsolation() {
    try {
      logger.debug('Checking for cross-origin isolation...');
      
      const isIsolated = typeof crossOriginIsolated !== 'undefined' ? 
                        crossOriginIsolated : 
                        (self.crossOriginIsolated || false);
      
      if (isIsolated) {
        logger.info('Page is cross-origin isolated!');
      } else {
        logger.warn('Page is not cross-origin isolated');
        logger.info('To enable SharedArrayBuffer, you need these headers:');
        logger.info('Cross-Origin-Embedder-Policy: require-corp');
        logger.info('Cross-Origin-Opener-Policy: same-origin');
      }
      
      return isIsolated;
    } catch (error) {
      logger.error('Error detecting cross-origin isolation:', error);
      return false;
    }
  }

  /**
   * Check if storage (IndexedDB) is supported
   */
  detectStorage() {
    try {
      logger.debug('Checking for IndexedDB support...');
      
      const hasIndexedDB = typeof indexedDB !== 'undefined';
      
      if (hasIndexedDB) {
        logger.info('IndexedDB is supported!');
      } else {
        logger.warn('IndexedDB is not supported');
      }
      
      return hasIndexedDB;
    } catch (error) {
      logger.error('Error detecting IndexedDB:', error);
      return false;
    }
  }

  /**
   * Check if Speech Recognition API is supported
   */
  detectSpeechRecognition() {
    try {
      logger.debug('Checking for Speech Recognition API support...');
      
      const hasSpeechRecognition = typeof SpeechRecognition !== 'undefined' || 
                                 typeof webkitSpeechRecognition !== 'undefined';
      
      if (hasSpeechRecognition) {
        logger.info('Speech Recognition API is supported!');
      } else {
        logger.warn('Speech Recognition API is not supported');
      }
      
      return hasSpeechRecognition;
    } catch (error) {
      logger.error('Error detecting Speech Recognition API:', error);
      return false;
    }
  }

  /**
   * Check if Speech Synthesis API is supported
   */
  detectSpeechSynthesis() {
    try {
      logger.debug('Checking for Speech Synthesis API support...');
      
      const hasSpeechSynthesis = typeof SpeechSynthesisUtterance !== 'undefined' && 
                                typeof speechSynthesis !== 'undefined';
      
      if (hasSpeechSynthesis) {
        logger.info('Speech Synthesis API is supported!');
      } else {
        logger.warn('Speech Synthesis API is not supported');
      }
      
      return hasSpeechSynthesis;
    } catch (error) {
      logger.error('Error detecting Speech Synthesis API:', error);
      return false;
    }
  }

  /**
   * Check if all requirements for the voice kit are met
   */
  meetsMinimumRequirements() {
    if (!this.detected) {
      logger.warn('Cannot check requirements - features not yet detected');
      return false;
    }
    
    // Check critical requirements
    const hasWebGPU = this.features.webGPU;
    const hasWebAudio = this.features.webAudio;
    const hasWebWorker = this.features.webWorker;
    
    const meetsRequirements = hasWebGPU && hasWebAudio && hasWebWorker;
    
    if (meetsRequirements) {
      logger.info('Browser meets minimum requirements for voice kit');
    } else {
      logger.error('Browser does not meet minimum requirements for voice kit');
      logger.error('Required: WebGPU, Web Audio API, Web Workers');
      logger.error(`Current status: WebGPU: ${hasWebGPU}, Web Audio: ${hasWebAudio}, Web Workers: ${hasWebWorker}`);
    }
    
    return meetsRequirements;
  }

  /**
   * Check if optimal requirements for the voice kit are met
   */
  meetsOptimalRequirements() {
    if (!this.detected) {
      logger.warn('Cannot check requirements - features not yet detected');
      return false;
    }
    
    const meetsMinimum = this.meetsMinimumRequirements();
    const hasSharedArrayBuffer = this.features.sharedArrayBuffer;
    const isCrossOriginIsolated = this.features.crossOriginIsolation;
    const hasStorage = this.features.storage;
    
    const meetsOptimal = meetsMinimum && hasSharedArrayBuffer && 
                       isCrossOriginIsolated && hasStorage;
    
    if (meetsOptimal) {
      logger.info('Browser meets optimal requirements for voice kit');
    } else if (meetsMinimum) {
      logger.warn('Browser meets minimum but not optimal requirements');
      logger.warn('For best performance, enable cross-origin isolation and SharedArrayBuffer');
    }
    
    return meetsOptimal;
  }
}

// Create singleton instance
export const featureDetector = new FeatureDetector();