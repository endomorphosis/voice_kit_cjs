/**
 * Feature Detector
 * Tests browser capabilities required for transformers.js and voice kit
 */
import { getLogger } from './logger.js';

const logger = getLogger('FeatureDetector');

class FeatureDetector {
  constructor() {
    this.features = {
      webGPU: null,
      webAudio: null,
      sharedArrayBuffer: null,
      crossOriginIsolation: null,
      webWorker: null,
      webAssembly: null,
      indexedDB: null,
      webGL2: null,
      webBluetooth: null,
      mediaDevices: null
    };
    
    logger.info('FeatureDetector initialized');
  }

  /**
   * Detect all features
   * @returns {Object} Object with feature support status
   */
  async detectAll() {
    logger.info('Detecting all browser features');
    
    // Detect each feature
    this.features.webGPU = this.detectWebGPU();
    this.features.webAudio = this.detectWebAudio();
    this.features.sharedArrayBuffer = this.detectSharedArrayBuffer();
    this.features.crossOriginIsolation = this.detectCrossOriginIsolation();
    this.features.webWorker = this.detectWebWorker();
    this.features.webAssembly = this.detectWebAssembly();
    this.features.indexedDB = this.detectIndexedDB();
    this.features.webGL2 = this.detectWebGL2();
    this.features.mediaDevices = this.detectMediaDevices();
    
    // Log detection results
    logger.info('Feature detection complete', this.features);
    
    // Log critical feature warnings
    const criticalFeatures = {
      'WebGPU': this.features.webGPU,
      'SharedArrayBuffer': this.features.sharedArrayBuffer,
      'Cross-Origin Isolation': this.features.crossOriginIsolation,
      'WebAssembly': this.features.webAssembly,
      'Web Workers': this.features.webWorker
    };
    
    Object.entries(criticalFeatures).forEach(([name, supported]) => {
      if (!supported) {
        logger.warn(`Critical feature ${name} is not supported. This may affect functionality.`);
      }
    });

    return this.features;
  }

  /**
   * Check if WebGPU is supported
   * @returns {boolean} Whether WebGPU is supported
   */
  detectWebGPU() {
    const supported = typeof navigator.gpu !== 'undefined';
    logger.info(`WebGPU support: ${supported}`);
    
    if (supported) {
      logger.debug('WebGPU API is available, check if adapter can be obtained');
    } else {
      logger.info('WebGPU API not available in this browser');
    }
    
    return supported;
  }

  /**
   * Check if Web Audio API is supported
   * @returns {boolean} Whether Web Audio API is supported
   */
  detectWebAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const supported = typeof AudioContext !== 'undefined';
    logger.info(`Web Audio API support: ${supported}`);
    return supported;
  }

  /**
   * Check if SharedArrayBuffer is supported
   * @returns {boolean} Whether SharedArrayBuffer is supported
   */
  detectSharedArrayBuffer() {
    const supported = typeof SharedArrayBuffer !== 'undefined';
    logger.info(`SharedArrayBuffer support: ${supported}`);
    
    if (!supported) {
      logger.warn('SharedArrayBuffer is required for WASM multithreading');
      logger.info('To enable SharedArrayBuffer, the page must be cross-origin isolated');
    } else {
      try {
        // Test if we can actually create a SharedArrayBuffer
        // Some browsers expose the constructor but throw when instantiated
        new SharedArrayBuffer(1);
        logger.debug('SharedArrayBuffer creation successful');
      } catch (e) {
        logger.warn('SharedArrayBuffer constructor exists but cannot be instantiated:', e.message);
        return false;
      }
    }
    
    return supported;
  }

  /**
   * Check if the page is cross-origin isolated
   * @returns {boolean} Whether the page is cross-origin isolated
   */
  detectCrossOriginIsolation() {
    const supported = window.crossOriginIsolated === true;
    logger.info(`Cross-Origin Isolation: ${supported}`);
    
    if (!supported) {
      logger.warn('Cross-Origin Isolation is required for SharedArrayBuffer');
      logger.info('To enable, the server must send headers: ' +
                 'Cross-Origin-Embedder-Policy: require-corp and ' + 
                 'Cross-Origin-Opener-Policy: same-origin');
    }
    
    return supported;
  }

  /**
   * Check if Web Workers are supported
   * @returns {boolean} Whether Web Workers are supported
   */
  detectWebWorker() {
    const supported = typeof Worker !== 'undefined';
    logger.info(`Web Worker support: ${supported}`);
    return supported;
  }

  /**
   * Check if WebAssembly is supported
   * @returns {boolean} Whether WebAssembly is supported
   */
  detectWebAssembly() {
    const supported = typeof WebAssembly !== 'undefined';
    logger.info(`WebAssembly support: ${supported}`);
    
    if (supported) {
      // Check for SIMD support
      const simdSupported = WebAssembly.validate(new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 
        2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11
      ]));
      
      logger.info(`WebAssembly SIMD support: ${simdSupported}`);
    }
    
    return supported;
  }

  /**
   * Check if IndexedDB is supported
   * @returns {boolean} Whether IndexedDB is supported
   */
  detectIndexedDB() {
    const supported = typeof window.indexedDB !== 'undefined';
    logger.info(`IndexedDB support: ${supported}`);
    return supported;
  }

  /**
   * Check if WebGL2 is supported
   * @returns {boolean} Whether WebGL2 is supported
   */
  detectWebGL2() {
    try {
      const canvas = document.createElement('canvas');
      const supported = !!canvas.getContext('webgl2');
      logger.info(`WebGL2 support: ${supported}`);
      return supported;
    } catch (e) {
      logger.warn('Error detecting WebGL2:', e.message);
      return false;
    }
  }

  /**
   * Check if Media Devices API is supported
   * @returns {boolean} Whether Media Devices API is supported
   */
  detectMediaDevices() {
    const supported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    logger.info(`Media Devices API support: ${supported}`);
    return supported;
  }

  /**
   * Check if the system meets minimum requirements
   * @returns {boolean} Whether minimum requirements are met
   */
  meetsMinimumRequirements() {
    const minimumRequirements = [
      'webAudio',      // Required for audio input/output
      'webWorker',     // Required for background processing
      'webAssembly',   // Required for WASM fallback
      'mediaDevices'   // Required for microphone access
    ];
    
    const allMet = minimumRequirements.every(req => this.features[req]);
    
    if (allMet) {
      logger.info('System meets minimum requirements');
    } else {
      const missing = minimumRequirements.filter(req => !this.features[req]);
      logger.warn(`System does not meet minimum requirements. Missing: ${missing.join(', ')}`);
    }
    
    return allMet;
  }

  /**
   * Check if the system meets optimal requirements
   * @returns {boolean} Whether optimal requirements are met
   */
  meetsOptimalRequirements() {
    const optimalRequirements = [
      'webGPU',               // For GPU acceleration
      'sharedArrayBuffer',    // For multithreaded processing
      'crossOriginIsolation', // For SAB support
      'webAudio',             // For audio processing
      'webWorker',            // For background processing
      'webAssembly',          // For WASM fallback
      'mediaDevices'          // For microphone access
    ];
    
    const allMet = optimalRequirements.every(req => this.features[req]);
    
    if (allMet) {
      logger.info('System meets optimal requirements');
    } else {
      const missing = optimalRequirements.filter(req => !this.features[req]);
      logger.warn(`System does not meet optimal requirements. Missing: ${missing.join(', ')}`);
    }
    
    return allMet;
  }
  
  /**
   * Get diagnostic information about the browser
   * @returns {Object} Browser information
   */
  getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
      deviceMemory: navigator.deviceMemory || 'unknown',
      cookieEnabled: navigator.cookieEnabled
    };
  }
}

// Create singleton instance
export const featureDetector = new FeatureDetector();