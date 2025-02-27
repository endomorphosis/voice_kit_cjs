/**
 * WebAssembly module loader and manager
 * Handles loading, caching, and initialization of WASM modules
 */
export class WasmLoader {
  /**
   * @param {Object} options - Configuration options
   * @param {string[]} options.wasmFiles - List of WASM files to load
   * @param {string} options.wasmRoot - Root URL for WASM files
   * @param {boolean} options.useCache - Whether to cache loaded modules
   */
  constructor(options = {}) {
    this.wasmFiles = options.wasmFiles || [];
    this.wasmRoot = options.wasmRoot || '';
    this.useCache = options.useCache !== false;
    this.modules = new Map();
    this.isInitialized = false;
    this.initPromise = null;
    this.lastError = null;
  }

  /**
   * Initialize the WASM loader
   * @param {Function} progressCallback - Callback for loading progress
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize(progressCallback = null) {
    if (this.isInitialized) return true;
    
    // If initialization is already in progress, return the existing promise
    if (this.initPromise) return this.initPromise;

    this.lastError = null;
    this.initPromise = this._initializeInternal(progressCallback);
    return this.initPromise;
  }

  /**
   * Internal initialization logic
   * @private
   * @param {Function} progressCallback - Callback for loading progress
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async _initializeInternal(progressCallback) {
    try {
      console.log('WASM initialization started');
      let totalFiles = this.wasmFiles.length;
      let loadedFiles = 0;

      // Load all WASM files in parallel
      await Promise.all(this.wasmFiles.map(async (file) => {
        try {
          const url = this._getWasmUrl(file);
          const module = await this._fetchAndCompileWasm(url);
          this.modules.set(file, module);
          
          loadedFiles++;
          if (progressCallback) {
            progressCallback({
              file,
              progress: (loadedFiles / totalFiles) * 100,
              status: 'loaded'
            });
          }
          
          console.log(`WASM module loaded: ${file}`);
        } catch (error) {
          console.error(`Failed to load WASM module ${file}:`, error);
          throw error;
        }
      }));

      this.isInitialized = true;
      console.log('WASM initialization completed successfully');
      return true;
    } catch (error) {
      this.lastError = error;
      console.error('WASM initialization failed:', error);
      throw error;
    } finally {
      this.initPromise = null;
    }
  }

  /**
   * Fetch and compile a WASM module
   * @private
   * @param {string} url - URL of the WASM file
   * @returns {Promise<WebAssembly.Module>} - Compiled WASM module
   */
  async _fetchAndCompileWasm(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch WASM module: ${url}, status: ${response.status}`);
    }
    
    const buffer = await response.arrayBuffer();
    if (!buffer || buffer.byteLength === 0) {
      throw new Error(`Empty WASM module: ${url}`);
    }
    
    try {
      return await WebAssembly.compile(buffer);
    } catch (error) {
      throw new Error(`Failed to compile WASM module: ${url}, error: ${error.message}`);
    }
  }

  /**
   * Get the URL for a WASM file
   * @private
   * @param {string} filename - Name of the WASM file
   * @returns {string} - Full URL of the WASM file
   */
  _getWasmUrl(filename) {
    // Handle both browser extension and standard web URLs
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) {
      return chrome.runtime.getURL(`wasm/${filename}`);
    } else {
      return `${this.wasmRoot}${filename}`;
    }
  }

  /**
   * Get a WASM module by name
   * @param {string} name - Name of the WASM file
   * @returns {WebAssembly.Module|null} - The compiled WASM module
   */
  getModule(name) {
    return this.modules.get(name) || null;
  }

  /**
   * Get all WASM module URLs
   * @returns {Object} - Object mapping file names to URLs
   */
  getWasmPaths() {
    const paths = {};
    this.wasmFiles.forEach(file => {
      paths[file] = this._getWasmUrl(file);
    });
    return paths;
  }

  /**
   * Check if all WASM modules are loaded
   * @returns {boolean} - Whether all WASM modules are loaded
   */
  isReady() {
    return this.isInitialized && this.wasmFiles.every(file => this.modules.has(file));
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.modules.clear();
    this.isInitialized = false;
    this.lastError = null;
  }
}