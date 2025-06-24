import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/config';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base-provider';

export interface GeminiAddModelOptions extends BaseAddModelOptions {
  modelId: string;
  apiKey: ConfigValue;
}

export interface GeminiLoadBalanceOptions extends BaseLoadBalanceOptions {
  modelId: string;
}

/**
 * Specialized builder for Google Gemini models
 */
export class GeminiBuilder extends ProviderBuilder {
  constructor(modelBuilder: ModelBuilder) {
    super(modelBuilder);
  }

  /**
   * Add a Gemini model with a single API key  
   */
  addModel(options: GeminiAddModelOptions): this {
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
   * Add a Gemini model with unified load balancing
   */
  addLoadBalancedModel(options: GeminiLoadBalanceOptions): this {
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = options;
    
    if (loadBalanceConfig.strategy !== 'cartesian') {
      throw new Error(`Gemini only supports cartesian load balancing strategy, got: ${loadBalanceConfig.strategy}`);
    }

    const {credentials = []} = loadBalanceConfig.dimensions;
    
    if (credentials.length === 0) {
      throw new Error('At least one API key must be specified for Gemini load balancing');
    }

    // Convert unified config to old LoadBalanceConfig format
    const oldLoadBalanceConfig: LoadBalanceConfig<ApiKeyCredential> = {
      parameterName: 'api_key',
      credentials: credentials.map(apiKey => ({apiKey})),
      credentialToParams: (credential) => ({api_key: credential.apiKey})
    };

    this.modelBuilder.addLoadBalancedModel({
      modelName: displayName,
      modelPath: `gemini/${modelId}`,
      loadBalanceConfig: oldLoadBalanceConfig,
      baseLitellmParams: litellmParams,
      baseRootParams: rootParams
    });

    return this;
  }

  /**
   * Convenience method: Add a Gemini model with load balancing across multiple API keys
   */
  addApiKeyLoadBalancedModel(options: {
    displayName: string;
    modelId: string;
    apiKeys: ConfigValue[];
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, apiKeys, litellmParams, rootParams} = options;

    return this.addLoadBalancedModel({
      displayName,
      modelId,
      loadBalanceConfig: {
        dimensions: {
          credentials: apiKeys
        },
        strategy: 'cartesian'
      },
      litellmParams,
      rootParams
    });
  }
}