import {ModelBuilder} from './model-builder';
import {ConfigValue} from '../types/base';
import type {OpenRouterBuilder} from '../providers/openrouter';

/**
 * OpenRouter-specific fluent model builder with provider-specific convenience methods
 */
export class OpenRouterModelBuilder extends ModelBuilder<OpenRouterBuilder> {
  
  /**
   * Add API keys to load balancing dimensions
   */
  withApiKeys(apiKeys: ConfigValue[]): this {
    this.cancelAutoExecution();
    
    if (!this.loadBalanceConfig) {
      this.loadBalanceConfig = {
        dimensions: {},
        strategy: 'cartesian'
      };
    }
    
    this.loadBalanceConfig.dimensions.credentials = apiKeys;
    return this;
  }

  /**
   * Alias for withApiKeys for better discoverability
   */
  withCredentials(apiKeys: ConfigValue[]): this {
    return this.withApiKeys(apiKeys);
  }

  /**
   * OpenRouter-specific: Set rate limit variations (common use case)
   */
  withRateLimitVariations(rpms: number[] = [15, 30, 60]): this {
    const variations = rpms.map(rpm => ({
      suffix: `rpm-${rpm}`,
      rootParams: { rpm }
    }));
    
    this.withVariations(variations);
    return this;
  }

  /**
   * Terminal method: Execute with current configuration and return to provider
   */
  execute(): OpenRouterBuilder {
    return this.build();
  }

  // Note: OpenRouter doesn't have regions, so withRegions is not implemented
  withRegions?(regions: string[]): this {
    throw new Error('OpenRouter provider does not support region-based load balancing');
  }
}