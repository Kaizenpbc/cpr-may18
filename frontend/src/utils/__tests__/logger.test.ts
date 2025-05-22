import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import logger from '../logger';

describe('Logger Utility', () => {
  const originalEnv = process.env.NODE_ENV;
  let consoleSpy: {
    debug: jest.SpyInstance;
    info: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug'),
      info: vi.spyOn(console, 'info'),
      warn: vi.spyOn(console, 'warn'),
      error: vi.spyOn(console, 'error'),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = originalEnv;
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('logs debug messages in development', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).toHaveBeenCalledWith('[DEBUG]', 'Test debug message');
    });

    it('logs info messages in development', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'Test info message');
    });

    it('logs multiple arguments', () => {
      logger.info('Test message', { data: 'test' }, 123);
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'Test message', { data: 'test' }, 123);
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('does not log debug messages in production', () => {
      logger.debug('Test debug message');
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });

    it('does not log info messages in production', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).not.toHaveBeenCalled();
    });
  });

  describe('Warning and Error Logging', () => {
    it('logs warnings in all environments', () => {
      logger.warn('Test warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', 'Test warning message');
    });

    it('logs errors in all environments', () => {
      logger.error('Test error message');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', 'Test error message');
    });

    it('logs error objects with stack traces', () => {
      const error = new Error('Test error');
      logger.error(error);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', error);
    });
  });

  describe('Complex Logging Scenarios', () => {
    it('handles circular references in objects', () => {
      const circular: any = { a: 1 };
      circular.self = circular;
      logger.info('Circular object', circular);
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('handles undefined and null values', () => {
      logger.info('Test with undefined', undefined);
      logger.info('Test with null', null);
      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });

    it('handles special characters in messages', () => {
      logger.info('Special chars:', '!@#$%^&*()');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'Special chars:', '!@#$%^&*()');
    });
  });
}); 