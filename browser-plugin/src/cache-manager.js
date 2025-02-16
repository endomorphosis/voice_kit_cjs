// Custom cache manager for extension resources
class ExtensionCacheManager {
  constructor() {
    this.modelCache = new Map();
  }

  async init() {
    try {
      const storage = await chrome.storage.local.get('modelCache');
      if (storage.modelCache) {
        this.modelCache = new Map(JSON.parse(storage.modelCache));
      }
    } catch (error) {
      console.error('Failed to initialize cache:', error);
    }
  }

  async saveToStorage() {
    try {
      await chrome.storage.local.set({
        modelCache: JSON.stringify(Array.from(this.modelCache.entries()))
      });
    } catch (error) {
      console.error('Failed to save cache:', error);
    }
  }

  async set(key, value) {
    this.modelCache.set(key, value);
    await this.saveToStorage();
  }

  async get(key) {
    return this.modelCache.get(key);
  }

  async has(key) {
    return this.modelCache.has(key);
  }

  async delete(key) {
    const result = this.modelCache.delete(key);
    await this.saveToStorage();
    return result;
  }

  async clear() {
    this.modelCache.clear();
    await this.saveToStorage();
  }
}

export const cacheManager = new ExtensionCacheManager();

// Initialize cache when module is imported
cacheManager.init().catch(console.error);