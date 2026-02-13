import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/model';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base';
import {OpenAICompatibleModelBuilder} from '../builders/openai-compatible-model-builder';
import {ModelConfig} from '../builders/model-builder';

export interface OpenAICompatibleAddModelOptions extends BaseAddModelOptions {
  modelId: string;
  apiKey?: ConfigValue;
  apiBase?: ConfigValue;
}

export interface OpenAICompatibleLoadBalanceOptions extends BaseLoadBalanceOptions {
  modelId: string;
}

// Define what can be defaulted (exclude modelId - must be per-model)
export type OpenAICompatibleDefaults = Partial<Omit<OpenAICompatibleAddModelOptions, 'modelId'>>;

export interface OpenAICompatibleProviderOptions {
  /** Model prefix for LiteLLM routing (default: 'openai') */
  modelPrefix?: string;
}

/**
 * Specialized builder for OpenAI-compatible endpoints (vLLM, Ollama, custom APIs, etc.)
 */
export class OpenAICompatibleBuilder extends ProviderBuilder<
  OpenAICompatibleAddModelOptions,
  OpenAICompatibleLoadBalanceOptions,
  OpenAICompatibleDefaults
> {
  private modelPrefix: string;

  constructor(modelBuilder: ModelBuilder, options?: OpenAICompatibleProviderOptions, defaults?: OpenAICompatibleDefaults) {
    super(modelBuilder, defaults);
    this.modelPrefix = options?.modelPrefix ?? 'openai';
  }

  /**
   * Add a model with fluent interface - returns OpenAI-compatible-specific model builder
   */
  addModel(options: OpenAICompatibleAddModelOptions): OpenAICompatibleModelBuilder {
    const config: ModelConfig & {modelId: string, apiKey?: ConfigValue, apiBase?: ConfigValue} = {
      displayName: options.displayName,
      litellmParams: options.litellmParams,
      rootParams: options.rootParams,
      modelId: options.modelId,
      apiKey: options.apiKey,
      apiBase: options.apiBase
    };

    return new OpenAICompatibleModelBuilder(this, config);
  }

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  executeModel(config: ModelConfig & {modelId?: string, apiKey?: ConfigValue, apiBase?: ConfigValue}): this {
    if (!config.modelId) {
      throw new Error('modelId is required for OpenAI-compatible models');
    }

    // Use apiKey/apiBase from config or defaults
    const apiKey = config.apiKey || this.defaults?.apiKey;
    const apiBase = config.apiBase || this.defaults?.apiBase;

    return this.addBasicModel({
      displayName: config.displayName,
      modelId: config.modelId,
      apiKey: apiKey,
      apiBase: apiBase,
      litellmParams: config.litellmParams,
      rootParams: config.rootParams
    });
  }

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  executeLoadBalancedModel(options: OpenAICompatibleLoadBalanceOptions): this {
    return this.addLoadBalancedModel(options);
  }

  /**
   * Add an OpenAI-compatible model with a single API key (internal method)
   */
  private addBasicModel(options: OpenAICompatibleAddModelOptions): this {
    // Apply defaults FIRST
    const mergedOptions = this.applyDefaults(options);
    const {displayName, modelId, apiKey, apiBase, litellmParams = {}, rootParams = {}} = mergedOptions;

    const params: ModelParams = {...litellmParams};
    if (apiKey) {
      params.api_key = apiKey;
    }
    if (apiBase) {
      params.api_base = apiBase;
    }

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `${this.modelPrefix}/${modelId}`,
      litellmParams: params,
      rootParams: rootParams
    });

    return this;
  }

  /**
   * Add an OpenAI-compatible model with unified load balancing (internal)
   */
  private addLoadBalancedModel(options: OpenAICompatibleLoadBalanceOptions): this {
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
      throw new Error(`OpenAI-compatible only supports cartesian load balancing strategy, got: ${loadBalanceConfig.strategy}`);
    }

    const {credentials = []} = loadBalanceConfig.dimensions;

    if (credentials.length === 0) {
      throw new Error('At least one API key must be specified for OpenAI-compatible load balancing');
    }

    // Include api_base from defaults in base params
    const baseLitellmParams: ModelParams = {...litellmParams};
    if (this.defaults?.apiBase) {
      baseLitellmParams.api_base = this.defaults.apiBase;
    }

    // Convert unified config to old LoadBalanceConfig format
    const oldLoadBalanceConfig: LoadBalanceConfig<ApiKeyCredential> = {
      parameterName: 'api_key',
      credentials: credentials.map(apiKey => ({apiKey})),
      credentialToParams: (credential) => ({api_key: credential.apiKey})
    };

    this.modelBuilder.addLoadBalancedModel({
      modelName: displayName,
      modelPath: `${this.modelPrefix}/${modelId}`,
      loadBalanceConfig: oldLoadBalanceConfig,
      baseLitellmParams: baseLitellmParams,
      baseRootParams: rootParams
    });

    return this;
  }
}
