export type AppConfig = {
  env: string;
  observabilityEnabled: boolean;
  analyticsEndpoint: string;
};

export const appConfig: AppConfig = {
  env: import.meta.env.MODE,
  observabilityEnabled: import.meta.env.VITE_ENABLE_OBSERVABILITY === 'true',
  analyticsEndpoint: import.meta.env.VITE_ANALYTICS_URL ?? '',
};
