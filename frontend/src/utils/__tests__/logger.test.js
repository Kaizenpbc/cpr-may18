import { vi, describe, it, expect, beforeEach } from 'vitest';
import logger from '../logger';

describe('Logger Utility', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug'),
      info: vi.spyOn(console, 'info'),
      warn: vi.spyOn(console, 'warn'),
      error: vi.spyOn(console, 'error'),
    };
  });

  describe('Development Environment', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', 'true');
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
      expect(consoleSpy.info).toHaveBeenCalledWith(
        '[INFO]',
        'Test message',
        { data: 'test' },
        123
      );
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      vi.stubEnv('DEV', 'false');
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

  describe('Error Formatting', () => {
    it('formats axios response errors', () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
          headers: { 'content-type': 'application/json' }
        }
      };

      const formattedError = logger.formatError(error);
      expect(formattedError).toEqual({
        status: 404,
        data: { message: 'Not found' },
        headers: { 'content-type': 'application/json' }
      });
    });

    it('formats network errors', () => {
      const error = {
        request: {
          method: 'GET',
          url: 'http://api.example.com'
        }
      };

      const formattedError = logger.formatError(error);
      expect(formattedError).toEqual({
        request: {
          method: 'GET',
          url: 'http://api.example.com'
        }
      });
    });

    it('formats general errors', () => {
      const error = new Error('Something went wrong');
      const formattedError = logger.formatError(error);
      expect(formattedError).toEqual({
        message: 'Something went wrong'
      });
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
      const circularObj = { a: 1 };
      circularObj.self = circularObj;

      logger.info('Circular object', circularObj);
      expect(consoleSpy.info).toHaveBeenCalled();
    });

    it('handles undefined and null values', () => {
      logger.info('Test with undefined', undefined);
      logger.info('Test with null', null);
      expect(consoleSpy.info).toHaveBeenCalledTimes(2);
    });

    it('handles special characters in messages', () => {
      logger.info('Special chars: !@#$%^&*()');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', 'Special chars: !@#$%^&*()');
    });
  });
}); 