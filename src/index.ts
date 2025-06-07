// src/index.ts
// Export all key components for library users
export {ModelBuilder} from './models/model-builder';
export {
  AwsBedrockBuilder,
  type AwsRegion,
  type AwsProviderOptions
} from './providers/aws';
export {GeminiBuilder} from './providers/gemini';
export {LiteLLMConfigBuilder} from './config/litellm-config-builder';
export {toConfigValue, configValueToString, env} from './types/base';
export {
  bedrockModelIds,
  type BedrockModelId,
  supportsCRIS,
  getRegionalModelId
} from './types/models';
export type {ConfigValue, EnvironmentRef, StringValue} from './types/base';
export type {
  LiteLLMSettings,
  GeneralSettings,
  RouterSettings,
  ModelDefinition,
  ModelParams,
  CacheControlInjectionPoint,
  LiteLLMConfig
} from './types/config';