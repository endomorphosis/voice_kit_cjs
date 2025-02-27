import { WasmLoader } from '../../src/core/utils/wasm-loader';

// Mock fetch and WebAssembly APIs
global.fetch = jest.fn();
global.WebAssembly = {
  compile: jest.fn()
};

describe('WasmLoader', () => {
  let wasmLoader;
  
  beforeEach(() => {
    // Reset mocks
    global.fetch.mockReset();
    global.WebAssembly.compile.mockReset();
    
    // Create a new instance for each test
    wasmLoader = new WasmLoader({
      wasmFiles: ['test1.wasm', 'test2.wasm'],
      wasmRoot: 'https://example.com/wasm/'
    });
  });
  
  test('should initialize successfully when all WASM modules load', async () => {
    // Mock successful responses
    const mockArrayBuffer1 = new ArrayBuffer(10);
    const mockArrayBuffer2 = new ArrayBuffer(10);
    const mockModule1 = {};
    const mockModule2 = {};
    
    global.fetch.mockImplementation((url) => {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => {
          return url.includes('test1.wasm') ? Promise.resolve(mockArrayBuffer1) : Promise.resolve(mockArrayBuffer2);
        }
      });
    });
    
    global.WebAssembly.compile.mockImplementation((buffer) => {
      return Promise.resolve(buffer === mockArrayBuffer1 ? mockModule1 : mockModule2);
    });
    
    // Call initialize with a mock progress callback
    const progressCallback = jest.fn();
    const result = await wasmLoader.initialize(progressCallback);
    
    // Assertions
    expect(result).toBe(true);
    expect(wasmLoader.isInitialized).toBe(true);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(global.WebAssembly.compile).toHaveBeenCalledTimes(2);
    expect(wasmLoader.getModule('test1.wasm')).toBe(mockModule1);
    expect(wasmLoader.getModule('test2.wasm')).toBe(mockModule2);
    expect(progressCallback).toHaveBeenCalledTimes(2);
  });
  
  test('should handle fetch errors gracefully', async () => {
    // Mock a failed fetch
    global.fetch.mockImplementation(() => {
      return Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });
    });
    
    // Call initialize
    await expect(wasmLoader.initialize()).rejects.toThrow('Failed to fetch WASM module');
    
    // Assertions
    expect(wasmLoader.isInitialized).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
    expect(global.WebAssembly.compile).not.toHaveBeenCalled();
  });
  
  test('should handle WebAssembly compilation errors', async () => {
    // Mock successful fetch but failed compilation
    global.fetch.mockImplementation(() => {
      return Promise.resolve({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(10))
      });
    });
    
    global.WebAssembly.compile.mockImplementation(() => {
      throw new Error('Invalid WASM module');
    });
    
    // Call initialize
    await expect(wasmLoader.initialize()).rejects.toThrow('Failed to compile WASM module');
    
    // Assertions
    expect(wasmLoader.isInitialized).toBe(false);
    expect(global.fetch).toHaveBeenCalled();
    expect(global.WebAssembly.compile).toHaveBeenCalled();
  });
  
  test('should return correct WASM paths', () => {
    const paths = wasmLoader.getWasmPaths();
    
    expect(paths).toEqual({
      'test1.wasm': 'https://example.com/wasm/test1.wasm',
      'test2.wasm': 'https://example.com/wasm/test2.wasm'
    });
  });
  
  test('should handle chrome.runtime context for extension environments', () => {
    // Mock chrome runtime API
    global.chrome = {
      runtime: {
        getURL: jest.fn((path) => `chrome-extension://abcdef/${path}`)
      }
    };
    
    wasmLoader = new WasmLoader({
      wasmFiles: ['test.wasm'],
      wasmRoot: 'ignored-in-extension/' // Should be ignored when chrome.runtime is available
    });
    
    const paths = wasmLoader.getWasmPaths();
    
    expect(paths).toEqual({
      'test.wasm': 'chrome-extension://abcdef/wasm/test.wasm'
    });
    
    // Clean up mock
    delete global.chrome;
  });
  
  test('should clean up resources correctly', () => {
    // Set up mock modules
    wasmLoader.modules.set('test1.wasm', {});
    wasmLoader.modules.set('test2.wasm', {});
    wasmLoader.isInitialized = true;
    
    // Call cleanup
    wasmLoader.cleanup();
    
    // Assertions
    expect(wasmLoader.modules.size).toBe(0);
    expect(wasmLoader.isInitialized).toBe(false);
  });
});