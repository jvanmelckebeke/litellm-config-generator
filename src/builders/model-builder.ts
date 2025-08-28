import {ModelParams} from '../types/config';
import {UnifiedLoadBalanceConfig, LoadBalanceStrategy, FallbackConfig} from '../providers/base';

/**
 * Interface that defines what ModelBuilder expects from providers
 */
export interface FluentProvider {
  executeModel(config: ModelConfig): any;
  executeLoadBalancedModel(options: any): any;
}

export interface LoadBalanceDimensions {
  regions?: string[];
  credentials?: any[];
  [key: string]: any[] | undefined;
}

export interface VariationConfig {
  suffix: string;
  litellmParams?: ModelParams;
  rootParams?: Record<string, any>;
}

export interface ModelConfig {
  displayName: string;
  litellmParams?: ModelParams;
  rootParams?: Record<string, any>;
}

/**
 * Base fluent model builder with auto-execution for simple cases
 * Uses Template Method pattern for provider-specific implementations
 */
export abstract class ModelBuilder<TProvider extends FluentProvider> {
  protected provider: TProvider;
  protected config: ModelConfig;
  protected loadBalanceConfig?: UnifiedLoadBalanceConfig;
  protected autoExecuteTimer?: any;
  protected hasChained: boolean = false;

  constructor(provider: TProvider, config: ModelConfig) {
    this.provider = provider;
    this.config = config;
    
    // Schedule auto-execution for simple cases (cancelled if chaining occurs)
    this.scheduleAutoExecution();
  }

  /**
   * Schedule auto-execution in next microtask (cancelled by chaining)
   */
  private scheduleAutoExecution(): void {
    this.autoExecuteTimer = Promise.resolve().then(() => {
      if (!this.hasChained) {
        this.executeSimpleModel();
      }
    });
  }

  /**
   * Force execution of any pending auto-execution (for synchronous build operations)
   */
  public flushPendingExecution(): void {
    if (!this.hasChained && this.autoExecuteTimer) {
      this.executeSimpleModel();
      this.hasChained = true; // Prevent duplicate execution
    }
  }

  /**
   * Cancel auto-execution when chaining begins
   */
  protected cancelAutoExecution(): void {
    this.hasChained = true;
    if (this.autoExecuteTimer) {
      // Timer is a Promise, can't cancel, but hasChained flag prevents execution
    }
  }

  /**
   * Execute simple model (no load balancing, no variations)
   */
  protected executeSimpleModel(): TProvider {
    return this.provider.executeModel(this.config);
  }

  /**
   * Execute with current accumulated configuration
   */
  protected executeWithConfig(): TProvider {
    if (this.loadBalanceConfig) {
      return this.provider.executeLoadBalancedModel({
        ...this.config,
        loadBalanceConfig: this.loadBalanceConfig
      });
    } else {
      return this.executeSimpleModel();
    }
  }

  /**
   * Execute with variations (terminal method)
   */
  protected executeWithVariations(variations: VariationConfig[]): TProvider {
    this.cancelAutoExecution();
    
    variations.forEach(variation => {
      const variantConfig = {
        ...this.config, // Include all original config (including provider-specific fields)
        displayName: `${this.config.displayName}-${variation.suffix}`,
        litellmParams: {...this.config.litellmParams, ...variation.litellmParams},
        rootParams: {...this.config.rootParams, ...variation.rootParams}
      };

      if (this.loadBalanceConfig) {
        this.provider.executeLoadBalancedModel({
          ...variantConfig,
          loadBalanceConfig: this.loadBalanceConfig
        });
      } else {
        this.provider.executeModel(variantConfig);
      }
    });

    return this.provider;
  }

  /**
   * Add load balancing dimensions
   */
  withLoadBalancing(dimensions: LoadBalanceDimensions): this {
    this.cancelAutoExecution();
    
    this.loadBalanceConfig = {
      dimensions,
      strategy: 'cartesian' // Default strategy
    };
    
    return this;
  }

  /**
   * Set load balancing strategy
   */
  withStrategy(strategy: LoadBalanceStrategy): this {
    this.cancelAutoExecution();
    
    if (!this.loadBalanceConfig) {
      throw new Error('Must call withLoadBalancing() before withStrategy()');
    }
    
    this.loadBalanceConfig.strategy = strategy;
    return this;
  }

  /**
   * Set fallback configuration (for fallback strategy)
   */
  withFallbackConfig(config: FallbackConfig): this {
    this.cancelAutoExecution();
    
    if (!this.loadBalanceConfig) {
      throw new Error('Must call withLoadBalancing() before withFallbackConfig()');
    }
    
    this.loadBalanceConfig.fallbackConfig = config;
    return this;
  }

  /**
   * Add model variations (terminal method - executes immediately)
   */
  withVariations(variations: VariationConfig[]): TProvider {
    return this.executeWithVariations(variations);
  }

  /**
   * Explicit build method (terminal method - executes immediately)
   */
  build(): TProvider {
    this.cancelAutoExecution();
    return this.executeWithConfig();
  }

  /**
   * Provider-specific fluent methods should be implemented in subclasses
   */
  abstract withRegions?(regions: string[]): this;
  abstract withCredentials?(credentials: any[]): this;
}