import {ModelBuilder} from './model-builder';
import {ConfigValue} from '../types/base';
import type {OpenAICompatibleBuilder} from '../providers/openai-compatible';

/**
 * OpenAI-compatible-specific fluent model builder with provider-specific convenience methods
 */
export class OpenAICompatibleModelBuilder extends ModelBuilder<OpenAICompatibleBuilder> {

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
   * Terminal method: Execute with current configuration and return to provider
   */
  execute(): OpenAICompatibleBuilder {
    return this.build();
  }

  // OpenAI-compatible endpoints don't have regions
  withRegions?(regions: string[]): this {
    throw new Error('OpenAI-compatible provider does not support region-based load balancing');
  }
}
