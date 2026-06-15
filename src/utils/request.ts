import { config, getApiUrl } from '../config';
import { createModuleLogger } from './logger';

const logger = createModuleLogger('request');

export interface RequestOptions extends RequestInit {
  timeout?: number;
  headers?: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

const DEFAULT_TIMEOUT = 10000;

const createRequest = <T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> => {
  const { timeout = DEFAULT_TIMEOUT, headers, ...restOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const fullUrl = getApiUrl(url);

  logger.debug(`Request: ${restOptions.method || 'GET'} ${fullUrl}`);

  return fetch(fullUrl, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    signal: controller.signal,
  })
    .then(async (response) => {
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.debug(`Response: ${restOptions.method || 'GET'} ${fullUrl}`, data);

      return data as ApiResponse<T>;
    })
    .catch((error) => {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        logger.error(`Request timeout: ${fullUrl}`);
        throw new Error('请求超时');
      }

      logger.error(`Request failed: ${fullUrl}`, error);
      throw error;
    });
};

export const request = {
  get: <T = unknown>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> =>
    createRequest<T>(url, { ...options, method: 'GET' }),

  post: <T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    createRequest<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    createRequest<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T = unknown>(url: string, options?: RequestOptions): Promise<ApiResponse<T>> =>
    createRequest<T>(url, { ...options, method: 'DELETE' }),

  patch: <T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> =>
    createRequest<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),
};

export const mockDelay = <T>(data: T, delay?: number): Promise<T> => {
  const delayTime = delay !== undefined ? delay : config.mockDelay;
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delayTime);
  });
};
