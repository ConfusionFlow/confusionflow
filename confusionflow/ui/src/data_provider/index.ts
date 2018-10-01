import { SwaggerDataProvider } from './SwaggerDataProvider';

export * from './api';

export function dataProviderFactory() {
  return new SwaggerDataProvider();
}
