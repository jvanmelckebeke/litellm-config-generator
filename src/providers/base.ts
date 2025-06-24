import {ModelBuilder} from '../models/model-builder';
import {ModelParams} from '../types/config';
import type {ModelConfig} from '../builders/model-builder';

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
   * Add a model with fluent interface - returns provider-specific model builder
   */
  abstract addModel(options: Pick<TAddModelOptions, 'displayName' | 'litellmParams' | 'rootParams'> & Record<string, any>): any;

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  abstract executeModel(config: ModelConfig): this;

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  abstract executeLoadBalancedModel(options: TLoadBalanceOptions): this;

  /**
   * Add a model with unified load balancing across multiple dimensions (legacy)
   */
  abstract addLoadBalancedModel(options: TLoadBalanceOptions): this;
}