import {ModelBuilder, LoadBalanceDimensions} from './model-builder';
import {ConfigValue} from '../types/base';
import type {AwsBedrockBuilder, AwsRegion, AwsLoadBalanceCredential} from '../providers/aws';

/**
 * AWS-specific fluent model builder with provider-specific convenience methods
 */
export class AwsModelBuilder extends ModelBuilder<AwsBedrockBuilder> {
  
  /**
   * Add AWS regions to load balancing dimensions
   */
  withRegions(regions: AwsRegion[]): this {
    this.cancelAutoExecution();
    
    if (!this.loadBalanceConfig) {
      this.loadBalanceConfig = {
        dimensions: {},
        strategy: 'cartesian'
      };
    }
    
    this.loadBalanceConfig.dimensions.regions = regions;
    return this;
  }

  /**
   * Add AWS credentials to load balancing dimensions
   */
  withCredentials(credentials: AwsLoadBalanceCredential[]): this {
    this.cancelAutoExecution();
    
    if (!this.loadBalanceConfig) {
      this.loadBalanceConfig = {
        dimensions: {},
        strategy: 'cartesian'
      };
    }
    
    this.loadBalanceConfig.dimensions.credentials = credentials;
    return this;
  }

  /**
   * AWS-specific: Set up fallback between two regions
   */
  withRegionFallback(primary: AwsRegion, fallback: AwsRegion, suffix = '-fallback'): this {
    this.cancelAutoExecution();
    
    this.loadBalanceConfig = {
      dimensions: {
        regions: [primary, fallback]
      },
      strategy: 'fallback',
      fallbackConfig: {
        primary,
        suffix
      }
    };
    
    return this;
  }

  /**
   * AWS-specific: Enable multi-axis load balancing (regions × credentials)
   */
  withMultiAxis(regions: AwsRegion[], credentials: AwsLoadBalanceCredential[]): this {
    this.cancelAutoExecution();
    
    this.loadBalanceConfig = {
      dimensions: {
        regions,
        credentials
      },
      strategy: 'cartesian'
    };
    
    return this;
  }

  /**
   * AWS-specific: Add thinking variations (common use case)
   */
  withThinkingVariations(budgets: number[] = [1024, 16384]): AwsBedrockBuilder {
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
   * Terminal method: Execute with current configuration and return to provider
   */
  execute(): AwsBedrockBuilder {
    return this.build();
  }
}