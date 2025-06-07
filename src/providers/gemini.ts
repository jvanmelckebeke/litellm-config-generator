import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/config';

/**
 * Specialized builder for Google Gemini models
 */
export class GeminiBuilder {
  private modelBuilder: ModelBuilder;

  constructor(modelBuilder: ModelBuilder) {
    this.modelBuilder = modelBuilder;
  }

  /**
   * Add a Gemini model with a single API key
   */
  addModel(options: {
    displayName: string;
    modelId: string;
    apiKey: ConfigValue;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, apiKey, litellmParams = {}, rootParams = {}} = options;

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `gemini/${modelId}`,
      litellmParams: {
        api_key: apiKey,
        ...litellmParams
      },
      rootParams: rootParams
    });

    return this;
  }

  /**
   * Add a Gemini model with load balancing across multiple API keys
   */
  addLoadBalancedModel(options: {
    displayName: string;
    modelId: string;
    apiKeys: ConfigValue[];
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, apiKeys, litellmParams = {}, rootParams = {}} = options;

    const loadBalanceConfig: LoadBalanceConfig<ApiKeyCredential> = {
      parameterName: 'api_key',
      credentials: apiKeys.map(apiKey => ({apiKey})),
      credentialToParams: (credential) => ({api_key: credential.apiKey})
    };

    this.modelBuilder.addLoadBalancedModel({
      modelName: displayName,
      modelPath: `gemini/${modelId}`,
      loadBalanceConfig,
      baseLitellmParams: litellmParams,
      baseRootParams: rootParams
    });

    return this;
  }
}