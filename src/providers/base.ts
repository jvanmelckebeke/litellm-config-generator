import {ModelBuilder} from '../models/model-builder';
import {ModelParams} from '../types/model';
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
export abstract class ProviderBuilder<
  TAddModelOptions extends BaseAddModelOptions = BaseAddModelOptions,
  TLoadBalanceOptions extends BaseLoadBalanceOptions = BaseLoadBalanceOptions,
  TDefaults extends Partial<TAddModelOptions> = Partial<TAddModelOptions>
> {
  protected modelBuilder: ModelBuilder;
  protected defaults?: TDefaults;

  constructor(modelBuilder: ModelBuilder, defaults?: TDefaults) {
    this.modelBuilder = modelBuilder;
    this.defaults = defaults;
  }

  /**
   * Set or update provider-level defaults (fluent method)
   */
  withDefaults(defaults: TDefaults): this {
    this.defaults = this.mergeDefaults(this.defaults, defaults);
    return this;
  }

  /**
   * Deep merge defaults with model-specific options
   */
  protected applyDefaults<T extends TAddModelOptions>(options: T): T {
    if (!this.defaults) {
      return options;
    }

    return {
      ...this.defaults,
      ...options,
      // Deep merge for nested objects
      litellmParams: {
        ...this.defaults.litellmParams,
        ...options.litellmParams
      },
      rootParams: {
        ...this.defaults.rootParams,
        ...options.rootParams
      }
    } as T;
  }

  /**
   * Merge two defaults objects (for withDefaults() chaining)
   */
  private mergeDefaults(existing: TDefaults | undefined, updates: TDefaults): TDefaults {
    if (!existing) return updates;

    return {
      ...existing,
      ...updates,
      litellmParams: {
        ...existing.litellmParams,
        ...updates.litellmParams
      },
      rootParams: {
        ...existing.rootParams,
        ...updates.rootParams
      }
    } as TDefaults;
  }

  /**
   * Add a model with fluent interface - returns provider-specific model builder
   */
  abstract addModel(options: TAddModelOptions): any;

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  abstract executeModel(config: ModelConfig): this;

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  abstract executeLoadBalancedModel(options: TLoadBalanceOptions): this;

}