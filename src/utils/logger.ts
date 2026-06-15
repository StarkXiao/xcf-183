import type { LogLevel } from '../types';
import { config, shouldLog, isDevelopment } from '../config';

type LogMethod = (...args: unknown[]) => void;

interface Logger {
  debug: LogMethod;
  info: LogMethod;
  warn: LogMethod;
  error: LogMethod;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

const getTimestamp = (): string => {
  const now = new Date();
  return now.toISOString();
};

const formatLog = (level: LogLevel, args: unknown[]): unknown[] => {
  const prefix = `[${level.toUpperCase()}] [${getTimestamp()}]`;
  return [prefix, ...args];
};

const createLogger = (): Logger => {
  const log = (level: LogLevel, ...args: unknown[]): void => {
    if (!shouldLog(level)) return;

    const formatted = formatLog(level, args);

    switch (level) {
      case 'debug':
        console.debug(...formatted);
        break;
      case 'info':
        console.info(...formatted);
        break;
      case 'warn':
        console.warn(...formatted);
        break;
      case 'error':
        console.error(...formatted);
        break;
      default:
        console.log(...formatted);
    }
  };

  return {
    debug: (...args) => log('debug', ...args),
    info: (...args) => log('info', ...args),
    warn: (...args) => log('warn', ...args),
    error: (...args) => log('error', ...args),

    group: (label: string) => {
      if (shouldLog('debug') && isDevelopment()) {
        console.group(label);
      }
    },

    groupEnd: () => {
      if (shouldLog('debug') && isDevelopment()) {
        console.groupEnd();
      }
    },

    time: (label: string) => {
      if (shouldLog('debug') && isDevelopment()) {
        console.time(label);
      }
    },

    timeEnd: (label: string) => {
      if (shouldLog('debug') && isDevelopment()) {
        console.timeEnd(label);
      }
    },
  };
};

export const logger = createLogger();

export const createModuleLogger = (moduleName: string): Logger => {
  const prefix = `[${moduleName}]`;

  return {
    debug: (...args) => logger.debug(prefix, ...args),
    info: (...args) => logger.info(prefix, ...args),
    warn: (...args) => logger.warn(prefix, ...args),
    error: (...args) => logger.error(prefix, ...args),
    group: (label: string) => logger.group(`${prefix} ${label}`),
    groupEnd: () => logger.groupEnd(),
    time: (label: string) => logger.time(`${prefix}:${label}`),
    timeEnd: (label: string) => logger.timeEnd(`${prefix}:${label}`),
  };
};

export const getLogLevel = (): LogLevel => config.logLevel;

export const setLogLevel = (level: LogLevel): void => {
  config.logLevel = level;
};
