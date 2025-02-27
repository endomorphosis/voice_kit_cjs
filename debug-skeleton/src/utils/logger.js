/**
 * Enhanced logger with time tracking and hierarchical logging
 */
export class Logger {
  constructor(context) {
    this.context = context || 'App';
    this.timers = new Map();
    this.enabledLevels = {
      error: true,
      warn: true,
      info: true,
      debug: process.env.NODE_ENV !== 'production',
      trace: false
    };
    this.colors = {
      error: '#FF5252',
      warn: '#FFD740',
      info: '#2196F3',
      debug: '#9E9E9E',
      trace: '#BDBDBD',
      timer: '#00E676',
      timerEnd: '#69F0AE',
      context: '#7C4DFF',
      timestamp: '#B0BEC5'
    };
    this.showTimestamp = true;
  }

  /**
   * Format a message with context, level and timestamp
   */
  _format(level, message, data) {
    const timestamp = this.showTimestamp ? `[${new Date().toISOString()}]` : '';
    const prefix = `${timestamp} [${this.context}] [${level.toUpperCase()}]:`;
    
    // Convert any error objects to strings
    if (data instanceof Error) {
      data = {
        name: data.name,
        message: data.message,
        stack: data.stack
      };
    }
    
    return {
      prefix,
      message,
      data
    };
  }

  /**
   * Log with colors in browser console
   */
  _log(level, message, data) {
    if (!this.enabledLevels[level]) return;
    
    const { prefix, message: msg, data: formattedData } = this._format(level, message, data);
    
    // Create a styled prefix for better visibility in the console
    const styledPrefix = `%c${prefix}`;
    const prefixStyle = `color: ${this.colors[level]}; font-weight: bold;`;
    const contextStyle = `color: ${this.colors.context}; font-weight: bold;`;
    
    if (formattedData !== undefined) {
      // Log with data
      console[level === 'trace' ? 'debug' : level](
        styledPrefix, 
        prefixStyle, 
        msg, 
        formattedData
      );
    } else {
      // Log without data
      console[level === 'trace' ? 'debug' : level](
        styledPrefix, 
        prefixStyle, 
        msg
      );
    }
  }
  
  /**
   * Error level logging
   */
  error(message, data) {
    this._log('error', message, data);
    return this;
  }
  
  /**
   * Warn level logging
   */
  warn(message, data) {
    this._log('warn', message, data);
    return this;
  }
  
  /**
   * Info level logging
   */
  info(message, data) {
    this._log('info', message, data);
    return this;
  }
  
  /**
   * Debug level logging
   */
  debug(message, data) {
    this._log('debug', message, data);
    return this;
  }
  
  /**
   * Trace level logging
   */
  trace(message, data) {
    this._log('trace', message, data);
    return this;
  }
  
  /**
   * Start a timer
   */
  time(label) {
    const startTime = performance.now();
    this.timers.set(label, startTime);
    
    const styledPrefix = `%c[${this.context}] [TIMER]:`;
    const prefixStyle = `color: ${this.colors.timer}; font-weight: bold;`;
    
    console.debug(
      styledPrefix, 
      prefixStyle, 
      `Started timer: ${label}`
    );
    
    return startTime;
  }
  
  /**
   * End a timer and log the elapsed time
   */
  timeEnd(label, startTime) {
    const endTime = performance.now();
    const timerStartTime = startTime || this.timers.get(label);
    
    if (!timerStartTime) {
      this.warn(`Timer "${label}" doesn't exist`);
      return -1;
    }
    
    const elapsed = endTime - timerStartTime;
    this.timers.delete(label);
    
    const styledPrefix = `%c[${this.context}] [TIMER]:`;
    const prefixStyle = `color: ${this.colors.timerEnd}; font-weight: bold;`;
    
    console.debug(
      styledPrefix, 
      prefixStyle, 
      `${label}: ${elapsed.toFixed(2)}ms`
    );
    
    return elapsed;
  }
  
  /**
   * Create a child logger with a new context
   */
  child(context) {
    const childLogger = new Logger(`${this.context}:${context}`);
    childLogger.enabledLevels = { ...this.enabledLevels };
    childLogger.colors = { ...this.colors };
    childLogger.showTimestamp = this.showTimestamp;
    return childLogger;
  }
  
  /**
   * Set the enabled log levels
   */
  setEnabledLevels(levels) {
    this.enabledLevels = { ...this.enabledLevels, ...levels };
    return this;
  }
  
  /**
   * Enable all log levels
   */
  enableAllLevels() {
    Object.keys(this.enabledLevels).forEach(level => {
      this.enabledLevels[level] = true;
    });
    return this;
  }
  
  /**
   * Enable specific log levels
   */
  enableLevels(...levels) {
    levels.forEach(level => {
      if (this.enabledLevels.hasOwnProperty(level)) {
        this.enabledLevels[level] = true;
      }
    });
    return this;
  }
  
  /**
   * Disable specific log levels
   */
  disableLevels(...levels) {
    levels.forEach(level => {
      if (this.enabledLevels.hasOwnProperty(level)) {
        this.enabledLevels[level] = false;
      }
    });
    return this;
  }
}

// Create a root logger
const rootLogger = new Logger('VoiceKit');

// Cache loggers by context
const loggers = new Map();
loggers.set('root', rootLogger);

/**
 * Get a logger for a specific context
 */
export function getLogger(context) {
  if (!context) return rootLogger;
  
  // Check if we already have a logger for this context
  if (loggers.has(context)) {
    return loggers.get(context);
  }
  
  // Create a new logger for this context
  const contextLogger = new Logger(context);
  loggers.set(context, contextLogger);
  return contextLogger;
}

/**
 * Configure all loggers
 */
export function configureLoggers(config) {
  // Apply configuration to all existing loggers
  for (const logger of loggers.values()) {
    if (config.enabledLevels) {
      logger.setEnabledLevels(config.enabledLevels);
    }
    
    if (config.colors) {
      logger.colors = { ...logger.colors, ...config.colors };
    }
    
    if (config.showTimestamp !== undefined) {
      logger.showTimestamp = config.showTimestamp;
    }
  }
}

/**
 * Enable verbose debug logging across all loggers
 */
export function enableVerboseLogging() {
  for (const logger of loggers.values()) {
    logger.enableAllLevels();
  }
  
  rootLogger.info('Verbose logging enabled for all components');
}