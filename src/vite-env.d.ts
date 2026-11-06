/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_APP_ENV: 'local' | 'dev' | 'prod';
  readonly VITE_APP_AUDIENCE: 'host' | 'guest';
  readonly VITE_APP_NAME?: string;
  readonly VITE_RAZORPAY_ENABLED?: string;
}
interface ImportMeta { readonly env: ImportMetaEnv }
