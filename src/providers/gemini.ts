import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/model';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base';
import {GeminiModelBuilder} from '../builders/gemini-model-builder';
import {ModelConfig} from '../builders/model-builder';

export interface GeminiAddModelOptions extends BaseAddModelOptions {
  modelId: string;
  apiKey?: ConfigValue;  // Optional in fluent API, can be added later
}

export interface GeminiLoadBalanceOptions extends BaseLoadBalanceOptions {
  modelId: string;
}

// Define what can be defaulted (exclude modelId - must be per-model)
export type GeminiDefaults = Partial<Omit<GeminiAddModelOptions, 'modelId'>>;

/**
 * Specialized builder for Google Gemini models
 */
export class GeminiBuilder extends ProviderBuilder<
  GeminiAddModelOptions,
  GeminiLoadBalanceOptions,
  GeminiDefaults
> {
  constructor(modelBuilder: ModelBuilder, defaults?: GeminiDefaults) {
    super(modelBuilder, defaults);
  }

  /**
   * Add a model with fluent interface - returns Gemini-specific model builder
   */
  addModel(options: GeminiAddModelOptions): GeminiModelBuilder {
    const config: ModelConfig & {modelId: string, apiKey?: ConfigValue} = {
      displayName: options.displayName,
      litellmParams: options.litellmParams,
      rootParams: options.rootParams,
      modelId: options.modelId,
      apiKey: options.apiKey
    };
    
    return new GeminiModelBuilder(this, config);
  }

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  executeModel(config: ModelConfig & {modelId?: string, apiKey?: ConfigValue}): this {
    if (!config.modelId) {
      throw new Error('modelId is required for Gemini models');
    }

    // Use apiKey from config or defaults
    const apiKey = config.apiKey || this.defaults?.apiKey;

    if (!apiKey) {
      throw new Error('apiKey is required for simple Gemini models');
    }

    return this.addBasicModel({
      displayName: config.displayName,
      modelId: config.modelId,
      apiKey: apiKey,
      litellmParams: config.litellmParams,
      rootParams: config.rootParams
    });
  }

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  executeLoadBalancedModel(options: GeminiLoadBalanceOptions): this {
    return this.addLoadBalancedModel(options);
  }

  /**
   * Add a Gemini model with a single API key (internal method)
   */
  private addBasicModel(options: GeminiAddModelOptions): this {
    // Apply defaults FIRST
    const mergedOptions = this.applyDefaults(options);
    const {displayName, modelId, apiKey, litellmParams = {}, rootParams = {}} = mergedOptions;
    
    if (!apiKey) {
      throw new Error('apiKey is required for Gemini models');
    }

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
   * Add a Gemini model with unified load balancing (internal)
   */
  private addLoadBalancedModel(options: GeminiLoadBalanceOptions): this {
    // For load-balanced models, manually merge litellmParams and rootParams from defaults
    const mergedOptions = {
      ...options,
      litellmParams: {
        ...this.defaults?.litellmParams,
        ...options.litellmParams
      },
      rootParams: {
        ...this.defaults?.rootParams,
        ...options.rootParams
      }
    };
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = mergedOptions;
    
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

}