import {ModelBuilder} from './model-builder';
import {ConfigValue} from '../types/base';
import type {AnthropicBuilder} from '../providers/anthropic';

/**
 * Anthropic-specific fluent model builder with provider-specific convenience methods
 */
export class AnthropicModelBuilder extends ModelBuilder<AnthropicBuilder> {
  
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
   * Anthropic-specific: Add thinking variations for Claude models
   */
  withThinkingVariations(budgets: number[] = [1024, 16384]): AnthropicBuilder {
    const variations = budgets.map(budget => ({
      suffix: `think-${budget}`,
      litellmParams: {
        thinking: {
          type: "enabled" as const,
          budget_tokens: budget
        }
      }
    }));
    
    return this.withVariations(variations);
  }

  /**
   * Anthropic-specific: Set rate limit for the model
   */
  withRateLimit(rpm: number): this {
    this.cancelAutoExecution();
    
    if (!this.config.rootParams) {
      this.config.rootParams = {};
    }
    
    this.config.rootParams.rpm = rpm;
    return this;
  }

  /**
   * Anthropic-specific: Add temperature variations for different use cases
   */
  withTemperatureVariations(temperatures: number[] = [0.1, 0.7, 1.0]): AnthropicBuilder {
    const variations = temperatures.map(temp => ({
      suffix: `temp-${temp}`,
      litellmParams: {
        temperature: temp
      }
    }));
    
    return this.withVariations(variations);
  }

  /**
   * Terminal method: Execute with current configuration and return to provider
   */
  execute(): AnthropicBuilder {
    return this.build();
  }

  // Note: Anthropic doesn't have regions, so withRegions is not implemented
  withRegions?(regions: string[]): this {
    throw new Error('Anthropic provider does not support region-based load balancing');
  }
}