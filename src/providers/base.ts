import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, AwsCredential, ApiKeyCredential} from '../types/base';
import {ModelParams} from '../types/config';

export type LoadBalanceStrategy = 'cartesian' | 'fallback';

export interface FallbackConfig {
  primary: string;
  suffix?: string;
}

export interface UnifiedLoadBalanceConfig<TCredential = any> {
  dimensions: {
    credentials?: TCredential[];
    regions?: string[];
    [key: string]: any[] | undefined;
  };
  strategy: LoadBalanceStrategy;
  fallbackConfig?: FallbackConfig;
}

export interface AwsLoadBalanceCredential {
  accessKeyId: ConfigValue;
  secretAccessKey: ConfigValue;
  sessionToken?: ConfigValue;
}

export interface BaseAddModelOptions {
  displayName: string;
  litellmParams?: ModelParams;
  rootParams?: Record<string, any>;
}

export interface BaseLoadBalanceOptions extends BaseAddModelOptions {
  loadBalanceConfig: UnifiedLoadBalanceConfig;
}

/**
 * Abstract base class for provider builders
 */
export abstract class ProviderBuilder {
  protected modelBuilder: ModelBuilder;

  constructor(modelBuilder: ModelBuilder) {
    this.modelBuilder = modelBuilder;
  }

  /**
   * Add a single model with provider-specific configuration
   */
  abstract addModel(options: BaseAddModelOptions & Record<string, any>): this;

  /**
   * Add a model with unified load balancing across multiple dimensions
   */
  abstract addLoadBalancedModel(options: BaseLoadBalanceOptions & Record<string, any>): this;
}