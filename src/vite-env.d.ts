/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TARGET_URL: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_LOG_LEVEL: string;
  readonly VITE_MOCK_DELAY: string;
  readonly VITE_APP_TITLE: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
