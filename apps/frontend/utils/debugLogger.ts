/**
 * Debug Logger for React Native Release Builds
 * 
 * This utility helps debug white screen issues in production by:
 * 1. Providing console logging that works in release builds
 * 2. Writing logs to a file for later analysis
 * 3. Showing error messages in a user-friendly way
 */

// Import AsyncStorage conditionally to avoid web issues
let AsyncStorage: any = null;
try {
  if (typeof window === 'undefined' || (typeof window !== 'undefined' && !window.localStorage)) {
    // Only import AsyncStorage in React Native environment
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  }
} catch (error) {
  // AsyncStorage not available (web environment)
  console.warn('AsyncStorage not available, using localStorage fallback');
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class DebugLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 100; // Keep only last 100 logs
  private storageKey = '@debug_logs';
  private isWeb = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  private initialized = false;

  constructor() {
    // Don't call loadLogs in constructor - do it lazily
    this.initializeAsync();
  }

  private async initializeAsync() {
    if (this.initialized) return;
    
    try {
      await this.loadLogs();
      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize debug logger:', error);
      // Continue without logs rather than crashing
      this.initialized = true;
    }
  }

  private async loadLogs() {
    // Don't use AsyncStorage on web - use localStorage instead
    if (this.isWeb) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load debug logs from localStorage:', error);
      }
    } else if (AsyncStorage) {
      try {
        const stored = await AsyncStorage.getItem(this.storageKey);
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch (error) {
        console.warn('Failed to load debug logs:', error);
      }
    }
  }

  private async saveLogs() {
    // Don't try to save if not initialized yet
    if (!this.initialized) return;
    
    // Don't use AsyncStorage on web - use localStorage instead
    if (this.isWeb) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      } catch (error) {
        console.warn('Failed to save debug logs to localStorage:', error);
      }
    } else if (AsyncStorage) {
      try {
        await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.logs));
      } catch (error) {
        console.warn('Failed to save debug logs:', error);
      }
    }
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(entry);
    
    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save logs asynchronously (don't await to avoid blocking)
    this.saveLogs();

    // Always log to console in development
    if (__DEV__) {
      console[level](message, data || '');
    }
  }

  info(message: string, data?: any) {
    this.addLog('info', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('warn', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('error', message, data);
  }

  debug(message: string, data?: any) {
    this.addLog('debug', message, data);
  }

  // Get all logs for debugging
  async getLogs(): Promise<LogEntry[]> {
    // Ensure logs are loaded before returning
    if (!this.initialized) {
      await this.initializeAsync();
    }
    return this.logs;
  }

  // Get logs as a formatted string
  async getLogsAsString(): Promise<string> {
    const logs = await this.getLogs();
    return logs
      .map(log => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`)
      .join('\n\n');
  }

  // Clear all logs
  async clearLogs() {
    this.logs = [];
    if (this.isWeb) {
      localStorage.removeItem(this.storageKey);
    } else if (AsyncStorage) {
      await AsyncStorage.removeItem(this.storageKey);
    }
  }

  // Export logs for sharing
  async exportLogs(): Promise<string> {
    const logsString = await this.getLogsAsString();
    const timestamp = new Date().toISOString();
    return `Debug Logs Export - ${timestamp}\n\n${logsString}`;
  }
}

// Create singleton instance
const debugLogger = new DebugLogger();

// Override console methods in production to capture all logs
if (!__DEV__) {
  const originalConsole = {
    log: console.log,
    warn: console.warn,
    error: console.error,
    info: console.info,
    debug: console.debug
  };

  console.log = (...args) => {
    originalConsole.log(...args);
    debugLogger.info(args.join(' '));
  };

  console.warn = (...args) => {
    originalConsole.warn(...args);
    debugLogger.warn(args.join(' '));
  };

  console.error = (...args) => {
    originalConsole.error(...args);
    debugLogger.error(args.join(' '));
  };

  console.info = (...args) => {
    originalConsole.info(...args);
    debugLogger.info(args.join(' '));
  };

  console.debug = (...args) => {
    originalConsole.debug(...args);
    debugLogger.debug(args.join(' '));
  };
}

export default debugLogger;
