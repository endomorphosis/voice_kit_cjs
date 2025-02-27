/**
 * WebGPU Diagnostics Utility
 * Tests and diagnoses WebGPU capabilities with detailed logging
 */
import { getLogger } from './logger.js';

const logger = getLogger('WebGPUDiagnostics');

export class WebGPUDiagnostics {
  constructor() {
    this.supported = null;
    this.adapter = null;
    this.adapterInfo = null;
    this.device = null;
    this.features = null;
    this.limits = null;
    this.error = null;
  }

  /**
   * Check if WebGPU is supported
   * @returns {Promise<boolean>} Whether WebGPU is supported
   */
  async isSupported() {
    if (this.supported !== null) {
      return this.supported;
    }

    try {
      logger.info('Checking WebGPU support');
      
      if (!navigator.gpu) {
        logger.warn('WebGPU is not supported (navigator.gpu is undefined)');
        this.supported = false;
        this.error = 'WebGPU API not available';
        return false;
      }
      
      logger.info('WebGPU API is available, requesting adapter');
      const adapter = await navigator.gpu.requestAdapter();
      
      if (!adapter) {
        logger.warn('WebGPU is not supported (no adapter found)');
        this.supported = false;
        this.error = 'No WebGPU adapter found';
        return false;
      }
      
      this.adapter = adapter;
      this.supported = true;
      logger.info('WebGPU is supported');
      return true;
    } catch (error) {
      logger.error('Error checking WebGPU support:', error);
      this.supported = false;
      this.error = error.message;
      return false;
    }
  }

  /**
   * Run comprehensive WebGPU diagnostics
   * @returns {Promise<Object>} Diagnostics results
   */
  async runDiagnostics() {
    logger.info('Running WebGPU diagnostics');
    const startTime = performance.now();
    
    try {
      // Check if WebGPU is supported
      if (!await this.isSupported()) {
        return {
          supported: false,
          error: this.error || 'WebGPU not supported',
          duration: performance.now() - startTime
        };
      }
      
      // Get adapter info
      logger.info('Getting adapter info');
      this.adapterInfo = await this.adapter.requestAdapterInfo();
      
      // Get features
      logger.info('Checking adapter features');
      this.features = Array.from(this.adapter.features.keys());
      
      // Get device
      logger.info('Requesting WebGPU device');
      this.device = await this.adapter.requestDevice({
        requiredFeatures: this.features.includes('shader-f16') ? ['shader-f16'] : []
      });
      
      // Get limits
      logger.info('Getting device limits');
      this.limits = {};
      for (const [key, value] of Object.entries(this.device.limits)) {
        this.limits[key] = value;
      }
      
      // Run basic compute test
      logger.info('Running basic WebGPU compute test');
      const computeTestResult = await this.runBasicComputeTest();
      
      const duration = performance.now() - startTime;
      logger.info(`WebGPU diagnostics completed in ${duration.toFixed(2)}ms`);
      
      return {
        supported: true,
        adapterInfo: this.adapterInfo,
        features: this.features,
        limits: this.limits,
        computeTest: computeTestResult,
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`WebGPU diagnostics failed after ${duration.toFixed(2)}ms:`, error);
      
      return {
        supported: false,
        error: error.message,
        stack: error.stack,
        duration
      };
    }
  }

  /**
   * Run a basic WebGPU compute test to verify functionality
   * @returns {Promise<Object>} Test results
   */
  async runBasicComputeTest() {
    if (!this.device) {
      logger.warn('Cannot run compute test - device not initialized');
      return { success: false, error: 'Device not initialized' };
    }
    
    logger.info('Starting basic WebGPU compute test (vector addition)');
    const startTime = performance.now();
    
    try {
      // Create input data - simple vector addition test
      const inputData1 = new Float32Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const inputData2 = new Float32Array([8, 7, 6, 5, 4, 3, 2, 1]);
      const resultData = new Float32Array(8);
      
      // Create GPU buffers
      const gpuBufferInput1 = this.device.createBuffer({
        size: inputData1.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      
      const gpuBufferInput2 = this.device.createBuffer({
        size: inputData2.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST,
      });
      
      const gpuBufferResult = this.device.createBuffer({
        size: resultData.byteLength,
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
      });
      
      const gpuBufferReadback = this.device.createBuffer({
        size: resultData.byteLength,
        usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
      });
      
      // Write input data to GPU buffers
      this.device.queue.writeBuffer(gpuBufferInput1, 0, inputData1);
      this.device.queue.writeBuffer(gpuBufferInput2, 0, inputData2);
      
      // Create compute shader
      const computeShader = `
        @group(0) @binding(0) var<storage, read> input1: array<f32>;
        @group(0) @binding(1) var<storage, read> input2: array<f32>;
        @group(0) @binding(2) var<storage, read_write> output: array<f32>;
        
        @compute @workgroup_size(8)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          let idx = global_id.x;
          if (idx < arrayLength(&output)) {
            output[idx] = input1[idx] + input2[idx];
          }
        }
      `;
      
      // Create compute pipeline
      const shaderModule = this.device.createShaderModule({
        code: computeShader,
      });
      
      const computePipeline = await this.device.createComputePipelineAsync({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main',
        },
      });
      
      // Create binding group
      const bindGroup = this.device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
          {
            binding: 0,
            resource: { buffer: gpuBufferInput1 },
          },
          {
            binding: 1,
            resource: { buffer: gpuBufferInput2 },
          },
          {
            binding: 2,
            resource: { buffer: gpuBufferResult },
          },
        ],
      });
      
      // Create and submit command encoder
      const commandEncoder = this.device.createCommandEncoder();
      const passEncoder = commandEncoder.beginComputePass();
      passEncoder.setPipeline(computePipeline);
      passEncoder.setBindGroup(0, bindGroup);
      passEncoder.dispatchWorkgroups(1);
      passEncoder.end();
      
      // Copy result to readback buffer
      commandEncoder.copyBufferToBuffer(
        gpuBufferResult,
        0,
        gpuBufferReadback,
        0,
        resultData.byteLength
      );
      
      const commands = commandEncoder.finish();
      this.device.queue.submit([commands]);
      
      // Read results
      await gpuBufferReadback.mapAsync(GPUMapMode.READ);
      const readbackData = new Float32Array(
        gpuBufferReadback.getMappedRange().slice()
      );
      gpuBufferReadback.unmap();
      
      // Verify results
      const expectedOutput = inputData1.map((val, i) => val + inputData2[i]);
      const correct = expectedOutput.every((val, i) => Math.abs(val - readbackData[i]) < 0.00001);
      
      // Calculate duration
      const duration = performance.now() - startTime;
      logger.info(`WebGPU compute test completed in ${duration.toFixed(2)}ms`);
      logger.info(`Test result: ${correct ? 'SUCCESS' : 'FAILURE'}`);
      
      if (!correct) {
        logger.error('Computation produced incorrect results', {
          expected: Array.from(expectedOutput),
          actual: Array.from(readbackData)
        });
      }
      
      return {
        success: correct,
        input1: Array.from(inputData1),
        input2: Array.from(inputData2),
        expected: Array.from(expectedOutput),
        actual: Array.from(readbackData),
        duration
      };
    } catch (error) {
      const duration = performance.now() - startTime;
      logger.error(`WebGPU compute test failed after ${duration.toFixed(2)}ms:`, error);
      
      return {
        success: false,
        error: error.message,
        stack: error.stack,
        duration
      };
    }
  }

  /**
   * Get memory limits information
   * @returns {Object} Memory information
   */
  getMemoryInfo() {
    if (!this.device || !this.limits) {
      return { available: false };
    }
    
    // Extract memory-related limits
    const memoryInfo = {
      maxBufferSize: this.formatBytes(this.limits.maxBufferSize || 0),
      maxStorageBufferBindingSize: this.formatBytes(this.limits.maxStorageBufferBindingSize || 0),
      maxUniformBufferBindingSize: this.formatBytes(this.limits.maxUniformBufferBindingSize || 0),
      maxComputeWorkgroupStorageSize: this.formatBytes(this.limits.maxComputeWorkgroupStorageSize || 0),
      maxComputeInvocationsPerWorkgroup: this.limits.maxComputeInvocationsPerWorkgroup || 0,
      maxComputeWorkgroupSizeX: this.limits.maxComputeWorkgroupSizeX || 0,
      maxComputeWorkgroupSizeY: this.limits.maxComputeWorkgroupSizeY || 0,
      maxComputeWorkgroupSizeZ: this.limits.maxComputeWorkgroupSizeZ || 0,
    };
    
    return memoryInfo;
  }

  /**
   * Check if the device supports key features needed for AI models
   * @returns {Object} Feature support information
   */
  getFeatureSupport() {
    if (!this.features) {
      return { available: false };
    }
    
    // Check for important AI features
    const featureSupport = {
      shaderF16: this.features.includes('shader-f16'),
      textureCompressionBC: this.features.includes('texture-compression-bc'),
      timestampQuery: this.features.includes('timestamp-query'),
      indirectFirstInstance: this.features.includes('indirect-first-instance'),
      dualSourceBlending: this.features.includes('dual-source-blending'),
      // Add any other relevant features
    };
    
    return featureSupport;
  }

  /**
   * Format bytes to a human-readable string
   * @private
   * @param {number} bytes The number of bytes
   * @returns {string} Human-readable string
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  }
}