import type { AppConfig, AppEnv, LogLevel } from '../types';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4,
};

const getEnvVar = (key: string, defaultValue: string = ''): string => {
  const value = import.meta.env[key];
  return value !== undefined ? value : defaultValue;
};

const getEnvVarBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === '1';
};

const getEnvVarNumber = (key: string, defaultValue: number = 0): number => {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

const getAppEnv = (): AppEnv => {
  const env = getEnvVar('VITE_APP_ENV', 'development');
  if (env === 'production' || env === 'development' || env === 'test') {
    return env;
  }
  return 'development';
};

const getLogLevel = (): LogLevel => {
  const level = getEnvVar('VITE_LOG_LEVEL', 'info');
  if (['debug', 'info', 'warn', 'error', 'silent'].includes(level)) {
    return level as LogLevel;
  }
  return 'info';
};

export const config: AppConfig = {
  env: getAppEnv(),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', '/api'),
  useMock: getEnvVarBoolean('VITE_USE_MOCK', true),
  logLevel: getLogLevel(),
  mockDelay: getEnvVarNumber('VITE_MOCK_DELAY', 0),
  appTitle: getEnvVar('VITE_APP_TITLE', '应用'),
  appVersion: getEnvVar('VITE_APP_VERSION', '0.0.0'),
};

export const isDevelopment = (): boolean => config.env === 'development';

export const isProduction = (): boolean => config.env === 'production';

export const isTest = (): boolean => config.env === 'test';

export const shouldLog = (level: LogLevel): boolean => {
  return LOG_LEVELS[level] >= LOG_LEVELS[config.logLevel];
};

export const getApiUrl = (path: string): string => {
  const base = config.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
};
