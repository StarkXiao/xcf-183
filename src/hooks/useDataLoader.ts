import { useState, useCallback, useEffect } from 'react';
import { createModuleLogger } from '../utils/logger';

const logger = createModuleLogger('useDataLoader');

export interface DataLoaderState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDataLoader<T>(
  loader: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options?: {
    autoLoad?: boolean;
    initialData?: T | null;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
): DataLoaderState<T> {
  const { autoLoad = true, initialData = null, onSuccess, onError } = options || {};

  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(autoLoad);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('开始加载数据...');
      const result = await loader();

      if (result.success && result.data !== undefined) {
        setData(result.data);
        onSuccess?.(result.data);
        logger.debug('数据加载成功');
      } else {
        const errMsg = result.error || '数据加载失败';
        setError(errMsg);
        onError?.(errMsg);
        logger.warn('数据加载失败:', errMsg);
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : '未知错误';
      setError(errMsg);
      onError?.(errMsg);
      logger.error('数据加载异常:', err);
    } finally {
      setLoading(false);
    }
  }, [loader, onSuccess, onError]);

  useEffect(() => {
    if (autoLoad) {
      fetchData();
    }
  }, [autoLoad, fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  };
}
