/**
 * Model cache manager for browser extensions
 * Handles storing and retrieving models from IndexedDB
 */
export class ModelCache {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.storeName - Name of the IndexedDB store
   * @param {number} options.version - IndexedDB version
   * @param {number} options.maxSizeBytes - Maximum cache size in bytes (default: 500MB)
   */
  constructor(options = {}) {
    this.dbName = options.storeName || 'transformers-model-cache';
    this.dbVersion = options.version || 1;
    this.maxSizeBytes = options.maxSizeBytes || 500 * 1024 * 1024; // 500MB default
    this.db = null;
    this.isInitialized = false;
    this.modelMetadata = new Map();
  }

  /**
   * Initialize the cache database
   * @returns {Promise<boolean>} - Whether initialization was successful
   */
  async initialize() {
    if (this.isInitialized) return true;
    
    try {
      return new Promise((resolve, reject) => {
        // Check if IndexedDB is available
        if (!('indexedDB' in self)) {
          reject(new Error('IndexedDB is not available in this environment'));
          return;
        }
        
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = (event) => {
          console.error('Failed to open IndexedDB:', event.target.error);
          reject(new Error(`IndexedDB error: ${event.target.error.message}`));
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // Create object stores if they don't exist
          if (!db.objectStoreNames.contains('models')) {
            const modelStore = db.createObjectStore('models', { keyPath: 'id' });
            modelStore.createIndex('timestamp', 'timestamp', { unique: false });
            modelStore.createIndex('size', 'size', { unique: false });
          }
          
          if (!db.objectStoreNames.contains('metadata')) {
            db.createObjectStore('metadata', { keyPath: 'key' });
          }
        };
        
        request.onsuccess = async (event) => {
          this.db = event.target.result;
          this.isInitialized = true;
          
          // Load metadata on initialization
          await this._loadMetadata();
          
          console.log('Model cache database initialized successfully');
          resolve(true);
        };
      });
    } catch (error) {
      console.error('Failed to initialize model cache:', error);
      throw error;
    }
  }

  /**
   * Load metadata about cached models
   * @private
   * @returns {Promise<void>}
   */
  async _loadMetadata() {
    try {
      const transaction = this.db.transaction(['models', 'metadata'], 'readonly');
      const modelStore = transaction.objectStore('models');
      const metadataStore = transaction.objectStore('metadata');
      
      // Get current cache size
      const cachedSizeRequest = metadataStore.get('totalSize');
      
      // Get all model entries to build metadata
      const modelsRequest = modelStore.getAll();
      
      const [cachedSizeResult, modelsResult] = await Promise.all([
        this._promisifyRequest(cachedSizeRequest),
        this._promisifyRequest(modelsRequest)
      ]);
      
      // Update memory cache
      this.currentSizeBytes = (cachedSizeResult?.value) || 0;
      this.modelMetadata.clear();
      
      for (const model of modelsResult || []) {
        this.modelMetadata.set(model.id, {
          modelId: model.modelId,
          type: model.type,
          timestamp: model.timestamp,
          size: model.size
        });
      }
      
      console.log(`Model cache loaded: ${this.modelMetadata.size} models, ${this._formatSize(this.currentSizeBytes)}`);
    } catch (error) {
      console.error('Failed to load cache metadata:', error);
    }
  }

  /**
   * Save a model file to the cache
   * @param {string} modelId - The model identifier (e.g., 'Xenova/whisper-small')
   * @param {string} fileName - The file name within the model
   * @param {ArrayBuffer} data - The file data
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async saveFile(modelId, fileName, data, metadata = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const id = `${modelId}/${fileName}`;
    const size = data.byteLength;
    
    try {
      // Check if we need to make room in the cache
      if (this.currentSizeBytes + size > this.maxSizeBytes) {
        await this._evictOldEntries(size);
      }
      
      const transaction = this.db.transaction(['models', 'metadata'], 'readwrite');
      const modelStore = transaction.objectStore('models');
      const metadataStore = transaction.objectStore('metadata');
      
      // Save the model file
      const modelEntry = {
        id,
        modelId,
        fileName,
        data,
        size,
        type: metadata.type || 'unknown',
        timestamp: Date.now(),
        ...metadata
      };
      
      await this._promisifyRequest(modelStore.put(modelEntry));
      
      // Update total size in metadata
      this.currentSizeBytes += size;
      await this._promisifyRequest(metadataStore.put({
        key: 'totalSize',
        value: this.currentSizeBytes
      }));
      
      // Update in-memory metadata
      this.modelMetadata.set(id, {
        modelId,
        fileName, 
        size,
        timestamp: modelEntry.timestamp,
        type: modelEntry.type
      });
      
      console.log(`Saved model file to cache: ${id} (${this._formatSize(size)})`);
      return true;
    } catch (error) {
      console.error(`Failed to save model file ${id}:`, error);
      return false;
    }
  }

  /**
   * Get a model file from the cache
   * @param {string} modelId - The model identifier
   * @param {string} fileName - The file name within the model
   * @returns {Promise<ArrayBuffer|null>} - The file data or null if not found
   */
  async getFile(modelId, fileName) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const id = `${modelId}/${fileName}`;
    
    try {
      const transaction = this.db.transaction('models', 'readonly');
      const modelStore = transaction.objectStore('models');
      
      const result = await this._promisifyRequest(modelStore.get(id));
      
      if (!result) {
        return null;
      }
      
      // Update timestamp to mark as recently used
      await this._updateAccessTimestamp(id);
      
      return result.data;
    } catch (error) {
      console.error(`Failed to get model file ${id}:`, error);
      return null;
    }
  }

  /**
   * Check if a model file exists in the cache
   * @param {string} modelId - The model identifier
   * @param {string} fileName - The file name within the model
   * @returns {Promise<boolean>} - Whether the file exists in the cache
   */
  async hasFile(modelId, fileName) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const id = `${modelId}/${fileName}`;
    return this.modelMetadata.has(id);
  }

  /**
   * Check if all required files for a model exist in the cache
   * @param {string} modelId - The model identifier
   * @param {string[]} requiredFiles - List of required file names
   * @returns {Promise<boolean>} - Whether all required files exist
   */
  async hasCompleteModel(modelId, requiredFiles) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    if (!requiredFiles || requiredFiles.length === 0) {
      return false;
    }
    
    try {
      for (const fileName of requiredFiles) {
        const id = `${modelId}/${fileName}`;
        if (!this.modelMetadata.has(id)) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error(`Failed to check model completeness for ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Delete a model file from the cache
   * @param {string} modelId - The model identifier
   * @param {string} fileName - The file name within the model
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async deleteFile(modelId, fileName) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    const id = `${modelId}/${fileName}`;
    
    try {
      const transaction = this.db.transaction(['models', 'metadata'], 'readwrite');
      const modelStore = transaction.objectStore('models');
      const metadataStore = transaction.objectStore('metadata');
      
      // Check if the file exists and get its size
      const entry = await this._promisifyRequest(modelStore.get(id));
      if (!entry) {
        return false;
      }
      
      // Delete the file
      await this._promisifyRequest(modelStore.delete(id));
      
      // Update total size
      this.currentSizeBytes -= entry.size;
      await this._promisifyRequest(metadataStore.put({
        key: 'totalSize',
        value: this.currentSizeBytes
      }));
      
      // Update in-memory metadata
      this.modelMetadata.delete(id);
      
      console.log(`Deleted model file from cache: ${id}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete model file ${id}:`, error);
      return false;
    }
  }

  /**
   * Delete all files for a model from the cache
   * @param {string} modelId - The model identifier
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async deleteModel(modelId) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const transaction = this.db.transaction(['models', 'metadata'], 'readwrite');
      const modelStore = transaction.objectStore('models');
      const metadataStore = transaction.objectStore('metadata');
      
      // Find all files for this model
      const modelFiles = Array.from(this.modelMetadata.entries())
        .filter(([id]) => id.startsWith(`${modelId}/`))
        .map(([id, metadata]) => ({ id, size: metadata.size }));
      
      if (modelFiles.length === 0) {
        return false;
      }
      
      // Delete all files
      let totalSizeDeleted = 0;
      for (const { id, size } of modelFiles) {
        await this._promisifyRequest(modelStore.delete(id));
        totalSizeDeleted += size;
        this.modelMetadata.delete(id);
      }
      
      // Update total size
      this.currentSizeBytes -= totalSizeDeleted;
      await this._promisifyRequest(metadataStore.put({
        key: 'totalSize',
        value: this.currentSizeBytes
      }));
      
      console.log(`Deleted model from cache: ${modelId}, ${modelFiles.length} files, ${this._formatSize(totalSizeDeleted)}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Get information about the cache
   * @returns {Promise<Object>} - Cache statistics
   */
  async getStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    // Group files by model ID
    const modelStats = {};
    for (const [id, metadata] of this.modelMetadata.entries()) {
      const modelId = metadata.modelId;
      
      if (!modelStats[modelId]) {
        modelStats[modelId] = {
          files: 0,
          size: 0,
          lastAccessed: 0,
          type: metadata.type
        };
      }
      
      modelStats[modelId].files++;
      modelStats[modelId].size += metadata.size;
      modelStats[modelId].lastAccessed = Math.max(modelStats[modelId].lastAccessed, metadata.timestamp);
    }
    
    return {
      totalSize: this.currentSizeBytes,
      totalSizeFormatted: this._formatSize(this.currentSizeBytes),
      maxSize: this.maxSizeBytes,
      maxSizeFormatted: this._formatSize(this.maxSizeBytes),
      usage: this.currentSizeBytes / this.maxSizeBytes,
      modelCount: Object.keys(modelStats).length,
      fileCount: this.modelMetadata.size,
      models: modelStats
    };
  }

  /**
   * Clear the entire cache
   * @returns {Promise<boolean>} - Whether the operation was successful
   */
  async clearCache() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    try {
      const transaction = this.db.transaction(['models', 'metadata'], 'readwrite');
      const modelStore = transaction.objectStore('models');
      const metadataStore = transaction.objectStore('metadata');
      
      await Promise.all([
        this._promisifyRequest(modelStore.clear()),
        this._promisifyRequest(metadataStore.clear())
      ]);
      
      // Reset metadata
      this.modelMetadata.clear();
      this.currentSizeBytes = 0;
      
      // Add zero total size
      await this._promisifyRequest(metadataStore.put({
        key: 'totalSize',
        value: 0
      }));
      
      console.log('Model cache cleared');
      return true;
    } catch (error) {
      console.error('Failed to clear cache:', error);
      return false;
    }
  }

  /**
   * Update the access timestamp for a file
   * @private
   * @param {string} id - The file ID
   * @returns {Promise<void>}
   */
  async _updateAccessTimestamp(id) {
    try {
      const transaction = this.db.transaction('models', 'readwrite');
      const modelStore = transaction.objectStore('models');
      
      const entry = await this._promisifyRequest(modelStore.get(id));
      if (entry) {
        entry.timestamp = Date.now();
        await this._promisifyRequest(modelStore.put(entry));
        
        // Update in-memory metadata
        if (this.modelMetadata.has(id)) {
          const metadata = this.modelMetadata.get(id);
          metadata.timestamp = entry.timestamp;
        }
      }
    } catch (error) {
      console.warn(`Failed to update timestamp for ${id}:`, error);
    }
  }

  /**
   * Evict old entries to make room for new ones
   * @private
   * @param {number} requiredBytes - How many bytes need to be freed
   * @returns {Promise<void>}
   */
  async _evictOldEntries(requiredBytes) {
    try {
      // If we need more than what's available even after clearing everything, it won't fit
      if (requiredBytes > this.maxSizeBytes) {
        throw new Error(`File size ${this._formatSize(requiredBytes)} exceeds maximum cache size ${this._formatSize(this.maxSizeBytes)}`);
      }
      
      // Calculate how much space we need to free
      const bytesToFree = Math.max(0, this.currentSizeBytes + requiredBytes - this.maxSizeBytes);
      if (bytesToFree === 0) {
        return;
      }
      
      console.log(`Need to free ${this._formatSize(bytesToFree)} for new model files`);
      
      // Sort entries by timestamp (oldest first)
      const sortedEntries = Array.from(this.modelMetadata.entries())
        .map(([id, metadata]) => ({
          id,
          ...metadata
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      
      let freedBytes = 0;
      const transaction = this.db.transaction(['models', 'metadata'], 'readwrite');
      const modelStore = transaction.objectStore('models');
      
      // Delete old entries until we free enough space
      for (const entry of sortedEntries) {
        if (freedBytes >= bytesToFree) {
          break;
        }
        
        await this._promisifyRequest(modelStore.delete(entry.id));
        freedBytes += entry.size;
        this.modelMetadata.delete(entry.id);
        console.log(`Evicted ${entry.id} from cache (${this._formatSize(entry.size)})`);
      }
      
      // Update total size
      this.currentSizeBytes -= freedBytes;
      const metadataStore = transaction.objectStore('metadata');
      await this._promisifyRequest(metadataStore.put({
        key: 'totalSize',
        value: this.currentSizeBytes
      }));
      
      console.log(`Freed ${this._formatSize(freedBytes)} by evicting ${sortedEntries.length} files`);
    } catch (error) {
      console.error('Failed to evict entries from cache:', error);
      throw error;
    }
  }

  /**
   * Promisify an IndexedDB request
   * @private
   * @param {IDBRequest} request - The IndexedDB request
   * @returns {Promise<any>} - The result of the request
   */
  _promisifyRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = (event) => reject(event.target.error);
    });
  }

  /**
   * Format a size in bytes as a human-readable string
   * @private
   * @param {number} bytes - The size in bytes
   * @returns {string} - Human-readable size
   */
  _formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Close the database connection
   */
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}