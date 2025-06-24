import {ModelBuilder} from './model-builder';
import {ConfigValue} from '../types/base';
import type {GeminiBuilder} from '../providers/gemini';

/**
 * Gemini-specific fluent model builder with provider-specific convenience methods
 */
export class GeminiModelBuilder extends ModelBuilder<GeminiBuilder> {
  
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
   * Gemini-specific: Set rate limit variations (common use case)
   */
  withRateLimitVariations(rpms: number[] = [15, 30, 60]): GeminiBuilder {
    const variations = rpms.map(rpm => ({
      suffix: `rpm-${rpm}`,
      rootParams: { rpm }
    }));
    
    return this.withVariations(variations);
  }

  /**
   * Terminal method: Execute with current configuration and return to provider
   */
  execute(): GeminiBuilder {
    return this.build();
  }

  // Note: Gemini doesn't have regions, so withRegions is not implemented
  withRegions?(regions: string[]): this {
    throw new Error('Gemini provider does not support region-based load balancing');
  }
}