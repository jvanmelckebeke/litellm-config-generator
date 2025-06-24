import {ModelBuilder} from '../models/model-builder';
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


export interface BaseAddModelOptions {
  displayName: string;
  litellmParams?: ModelParams;
  rootParams?: Record<string, any>;
}

export interface BaseLoadBalanceOptions extends BaseAddModelOptions {
  loadBalanceConfig: UnifiedLoadBalanceConfig;
}

/**
 * Abstract base class for provider builders with type-safe provider-specific extensions
 */
export abstract class ProviderBuilder<TAddModelOptions extends BaseAddModelOptions = BaseAddModelOptions, TLoadBalanceOptions extends BaseLoadBalanceOptions = BaseLoadBalanceOptions> {
  protected modelBuilder: ModelBuilder;

  constructor(modelBuilder: ModelBuilder) {
    this.modelBuilder = modelBuilder;
  }

  /**
   * Add a single model with provider-specific configuration
   */
  abstract addModel(options: TAddModelOptions): this;

  /**
   * Add a model with unified load balancing across multiple dimensions
   */
  abstract addLoadBalancedModel(options: TLoadBalanceOptions): this;
}