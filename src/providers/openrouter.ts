import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/config';
import {OpenRouterModelId} from '../types/models';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base';
import {OpenRouterModelBuilder} from '../builders/openrouter-model-builder';
import {ModelConfig} from '../builders/model-builder';

// OpenRouter uses standardized model slugs, so we enforce strict typing
export interface OpenRouterAddModelOptions extends BaseAddModelOptions {
  modelId: OpenRouterModelId;
  apiKey?: ConfigValue;  // Optional in fluent API, can be added later
}

// OpenRouter uses standardized model slugs, so we enforce strict typing
export interface OpenRouterLoadBalanceOptions extends BaseLoadBalanceOptions {
  modelId: OpenRouterModelId;
}

/**
 * Specialized builder for OpenRouter models
 */
export class OpenRouterBuilder extends ProviderBuilder<OpenRouterAddModelOptions, OpenRouterLoadBalanceOptions> {
  constructor(modelBuilder: ModelBuilder) {
    super(modelBuilder);
  }

  /**
   * Add a model with fluent interface - returns OpenRouter-specific model builder
   */
  addModel(options: OpenRouterAddModelOptions): OpenRouterModelBuilder {
    const config: ModelConfig & {modelId: OpenRouterModelId | string, apiKey?: ConfigValue} = {
      displayName: options.displayName,
      litellmParams: options.litellmParams,
      rootParams: options.rootParams,
      modelId: options.modelId,
      apiKey: options.apiKey
    };
    
    return new OpenRouterModelBuilder(this, config);
  }

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  executeModel(config: ModelConfig & {modelId?: OpenRouterModelId, apiKey?: ConfigValue}): this {
    if (!config.modelId) {
      throw new Error('modelId is required for OpenRouter models');
    }
    
    if (!config.apiKey) {
      throw new Error('apiKey is required for simple OpenRouter models');
    }
    
    return this.addBasicModel({
      displayName: config.displayName,
      modelId: config.modelId,
      apiKey: config.apiKey,
      litellmParams: config.litellmParams,
      rootParams: config.rootParams
    });
  }

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  executeLoadBalancedModel(options: OpenRouterLoadBalanceOptions): this {
    return this.addLoadBalancedModel(options);
  }

  /**
   * Add an OpenRouter model with a single API key (internal method)
   */
  private addBasicModel(options: OpenRouterAddModelOptions): this {
    const {displayName, modelId, apiKey, litellmParams = {}, rootParams = {}} = options;
    
    if (!apiKey) {
      throw new Error('apiKey is required for OpenRouter models');
    }

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `openrouter/${modelId}`,
      litellmParams: {
        api_key: apiKey,
        ...litellmParams
      },
      rootParams: rootParams
    });

    return this;
  }

  /**
   * Add an OpenRouter model with unified load balancing (internal)
   */
  private addLoadBalancedModel(options: OpenRouterLoadBalanceOptions): this {
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = options;
    
    if (loadBalanceConfig.strategy !== 'cartesian') {
      throw new Error(`OpenRouter only supports cartesian load balancing strategy, got: ${loadBalanceConfig.strategy}`);
    }

    const {credentials = []} = loadBalanceConfig.dimensions;
    
    if (credentials.length === 0) {
      throw new Error('At least one API key must be specified for OpenRouter load balancing');
    }

    // Convert unified config to old LoadBalanceConfig format
    const oldLoadBalanceConfig: LoadBalanceConfig<ApiKeyCredential> = {
      parameterName: 'api_key',
      credentials: credentials.map(apiKey => ({apiKey})),
      credentialToParams: (credential) => ({api_key: credential.apiKey})
    };

    this.modelBuilder.addLoadBalancedModel({
      modelName: displayName,
      modelPath: `openrouter/${modelId}`,
      loadBalanceConfig: oldLoadBalanceConfig,
      baseLitellmParams: litellmParams,
      baseRootParams: rootParams
    });

    return this;
  }
}