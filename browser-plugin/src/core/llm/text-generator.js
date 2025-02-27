import { TransformerBase } from '../utils/transformer-base.js';
import { pipeline, env, AutoTokenizer, AutoModelForCausalLM } from '@xenova/transformers';

/**
 * Manager for text generation using LLM
 * Handles initialization, text generation, and cleanup of LLM models
 */
export class TextGenerator extends TransformerBase {
  /**
   * @param {Object} options - Configuration options
   * @param {string} options.modelId - The model ID (e.g., 'Xenova/gpt2-small')
   * @param {boolean} options.quantized - Whether to use quantized models
   * @param {Function} options.progressCallback - Callback for loading progress
   * @param {Object} options.defaultGenerationOptions - Default options for text generation
   */
  constructor(options = {}) {
    super({
      ...options,
      modelType: 'llm'
    });
    
    // LLM-specific options
    this.modelId = options.modelId || 'Xenova/gpt2-small';
    this.defaultGenerationOptions = {
      max_new_tokens: 50,
      temperature: 0.7,
      top_p: 0.9,
      do_sample: true,
      ...options.defaultGenerationOptions
    };
    
    // For advanced use cases (bypass pipeline)
    this.useAdvancedMode = options.useAdvancedMode === true;
  }

  /**
   * Load and initialize the text generation model
   * @private
   * @returns {Promise<void>}
   */
  async _loadModel() {
    try {
      if (this.useAdvancedMode) {
        // Advanced mode: load tokenizer and model separately
        console.log(`Advanced loading of LLM model: ${this.modelId}`);
        
        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId, {
          quantized: this.quantized,
          progress_callback: this.progressCallback
        });
        
        this.model = await AutoModelForCausalLM.from_pretrained(this.modelId, {
          quantized: this.quantized,
          progress_callback: this.progressCallback
        });
        
        if (!this.tokenizer || !this.model) {
          throw new Error(`Failed to initialize LLM model components: ${this.modelId}`);
        }
      } else {
        // Standard mode: use pipeline for simplicity
        const pipelineConfig = {
          quantized: this.quantized,
          progress_callback: this.progressCallback,
          revision: 'main'
        };
        
        console.log(`Loading LLM model: ${this.modelId}`);
        this.model = await pipeline('text-generation', this.modelId, pipelineConfig);
        
        if (!this.model) {
          throw new Error(`Failed to initialize LLM model: ${this.modelId}`);
        }
      }
      
      console.log(`LLM model loaded successfully: ${this.modelId}`);
    } catch (error) {
      console.error('Error loading LLM model:', error);
      throw error;
    }
  }

  /**
   * Generate text from a prompt
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options (overrides defaults)
   * @returns {Promise<Object>} - Generated text and metadata
   */
  async generate(prompt, options = {}) {
    if (!this.isReady()) {
      await this.initialize();
    }

    // Validate prompt
    if (!prompt || typeof prompt !== 'string') {
      throw new Error('Invalid prompt: must be a non-empty string');
    }

    const generationStart = performance.now();
    const mergedOptions = { ...this.defaultGenerationOptions, ...options };
    let result;

    try {
      if (this.useAdvancedMode) {
        // Advanced mode: manual tokenization and generation
        result = await this._generateAdvanced(prompt, mergedOptions);
      } else {
        // Standard mode: use pipeline
        result = await this._generateWithPipeline(prompt, mergedOptions);
      }
      
      const generationTime = performance.now() - generationStart;
      
      return {
        ...result,
        timing: {
          generationTimeMs: generationTime,
          tokensPerSecond: result.totalTokens ? (result.totalTokens / (generationTime / 1000)) : null
        }
      };
    } catch (error) {
      console.error('Text generation error:', error);
      throw new Error(`Text generation failed: ${error.message}`);
    }
  }

  /**
   * Generate text using the pipeline API
   * @private
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated text and metadata
   */
  async _generateWithPipeline(prompt, options) {
    const results = await this.model(prompt, options);
    
    if (!results || !Array.isArray(results) || results.length === 0) {
      throw new Error('Model returned empty results');
    }

    return {
      text: results[0]?.generated_text || '',
      allResults: results,
      totalTokens: null // Pipeline doesn't provide token count easily
    };
  }

  /**
   * Generate text using advanced manual tokenization and generation
   * @private
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} - Generated text and metadata 
   */
  async _generateAdvanced(prompt, options) {
    // Get tokenizer outputs - this includes encoding the prompt
    const tokenizer_output = await this.tokenizer(prompt);
    
    // Run generation with provided options
    const output = await this.model.generate(tokenizer_output.input_ids, {
      max_new_tokens: options.max_new_tokens,
      temperature: options.temperature,
      top_p: options.top_p,
      do_sample: options.do_sample,
      pad_token_id: this.tokenizer.pad_token_id,
      num_return_sequences: options.num_return_sequences || 1,
      ...options
    });
    
    // Get the sequence(s)
    const sequences = output.sequences;
    
    // Decode the sequences
    const decoded = await Promise.all(
      sequences.map(sequence => this.tokenizer.decode(sequence, { skip_special_tokens: true }))
    );
    
    // Calculate total tokens used
    const inputTokens = tokenizer_output.input_ids[0].length;
    const totalNewTokens = sequences[0].length - inputTokens;
    
    return {
      text: decoded[0] || '',
      allResults: decoded.map(text => ({ generated_text: text })),
      totalTokens: inputTokens + totalNewTokens,
      inputTokens,
      newTokens: totalNewTokens
    };
  }

  /**
   * Get estimated token count for a given text (without processing)
   * @param {string} text - The text to estimate tokens for
   * @returns {Promise<number>} - Estimated token count
   */
  async estimateTokenCount(text) {
    if (!this.tokenizer && !this.useAdvancedMode) {
      // For pipeline mode, use a rough estimate based on words
      return Math.ceil(text.split(/\s+/).length * 1.3);
    }
    
    try {
      if (!this.tokenizer) {
        this.tokenizer = await AutoTokenizer.from_pretrained(this.modelId, {
          quantized: this.quantized
        });
      }
      
      const encoded = await this.tokenizer(text);
      return encoded.input_ids[0].length;
    } catch (error) {
      console.warn('Failed to estimate token count:', error);
      return Math.ceil(text.split(/\s+/).length * 1.3); // Fallback to rough estimate
    }
  }
}