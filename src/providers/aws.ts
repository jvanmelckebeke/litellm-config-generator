import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig} from '../types/base';
import {ModelParams} from '../types/config';
import {
  BedrockModelId,
  supportsCRIS,
  getRegionalModelId,
  parseModelId
} from '../types/models';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base';
import {AwsModelBuilder} from '../builders/aws-model-builder';
import {ModelConfig} from '../builders/model-builder';

export interface AwsLoadBalanceCredential {
  accessKeyId: ConfigValue;
  secretAccessKey: ConfigValue;
  sessionToken?: ConfigValue;
}

export type AwsRegion = 'us' | 'eu';

export interface AwsAddModelOptions extends BaseAddModelOptions {
  modelId: BedrockModelId | string;
  region: AwsRegion;
}

export interface AwsLoadBalanceOptions extends BaseLoadBalanceOptions {
  modelId: BedrockModelId | string;
}

export interface AwsProviderOptions {
  accessKeyId: ConfigValue;
  secretAccessKey: ConfigValue;
  defaultRegionMap: Record<AwsRegion, ConfigValue>;
  sessionToken?: ConfigValue;
  detectCRIS?: boolean; // Auto-detect CRIS support
}


/**
 * Specialized builder for AWS Bedrock models with cross-region support
 */
export class AwsBedrockBuilder extends ProviderBuilder<AwsAddModelOptions, AwsLoadBalanceOptions> {
  private options: AwsProviderOptions;
  private fallbacks: Array<Record<string, string[]>> = [];
  private cacheControlRoles?: string[];

  constructor(modelBuilder: ModelBuilder, options: AwsProviderOptions) {
    super(modelBuilder);
    this.options = {
      detectCRIS: true, // Enable CRIS detection by default
      ...options
    };
  }

  /**
   * Configure cache control injection points for all models from this builder
   */
  withCacheControl(roles: string[]): this {
    this.cacheControlRoles = roles;
    return this;
  }

  /**
   * Build AWS litellm_params with authentication and cache control
   */
  private buildAwsLitellmParams(regionVar: ConfigValue, additionalParams: ModelParams = {}): ModelParams {
    const baseParams: ModelParams = {
      aws_access_key_id: this.options.accessKeyId,
      aws_secret_access_key: this.options.secretAccessKey,
      aws_region_name: regionVar,
      ...(this.options.sessionToken && {aws_session_token: this.options.sessionToken}),
    };

    if (this.cacheControlRoles) {
      baseParams.cache_control_injection_points = this.cacheControlRoles.map(role => ({
        location: "message" as const,
        role,
        index: 0
      }));
    }

    return {
      ...baseParams,
      ...additionalParams
    };
  }

  /**
   * Add a model with fluent interface - returns AWS-specific model builder
   */
  addModel(options: Pick<AwsAddModelOptions, 'displayName' | 'litellmParams' | 'rootParams'> & {modelId: string, region?: AwsRegion}): AwsModelBuilder {
    const config: ModelConfig & {modelId: string, region?: AwsRegion} = {
      displayName: options.displayName,
      litellmParams: options.litellmParams,
      rootParams: options.rootParams,
      modelId: options.modelId,
      region: options.region
    };
    
    return new AwsModelBuilder(this, config);
  }

  /**
   * Execute a simple model (called by ModelBuilder)
   */
  executeModel(config: ModelConfig & {modelId?: string, region?: AwsRegion}): this {
    if (!config.modelId) {
      throw new Error('modelId is required for AWS models');
    }
    
    const region = config.region || 'us' as AwsRegion;
    return this.addBasicModel({
      displayName: config.displayName,
      modelId: config.modelId,
      region,
      litellmParams: config.litellmParams,
      rootParams: config.rootParams
    });
  }

  /**
   * Execute a load-balanced model (called by ModelBuilder)
   */
  executeLoadBalancedModel(options: AwsLoadBalanceOptions): this {
    return this.addLoadBalancedModel(options);
  }

  /**
   * Add basic Bedrock model with AWS authentication (internal method)
   */
  private addBasicModel(options: AwsAddModelOptions): this {
    const {displayName, modelId, region, litellmParams = {}, rootParams = {}} = options;
    const regionVar = this.options.defaultRegionMap[region];

    // Determine if we should use CRIS
    if (this.options.detectCRIS && supportsCRIS(modelId)) {
      this.addCrossRegionModel({
        baseModelId: parseModelId(modelId as BedrockModelId).id,
        displayName,
        regions: ['eu', 'us'],
        litellmParams,
        rootParams
      });
      return this;
    }

    // Try to get the appropriate region-specific model ID
    const resolvedModelId = getRegionalModelId(modelId, region) || modelId;

    const params = this.buildAwsLitellmParams(regionVar, litellmParams);

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `bedrock/${resolvedModelId}`,
      litellmParams: params,
      rootParams: rootParams
    });

    return this;
  }


  /**
   * Get all defined fallbacks
   */
  getFallbacks(): Array<Record<string, string[]>> {
    return this.fallbacks;
  }

  /**
   * Add a model that supports Cross-Region Inference (CRIS)
   */
  addCrossRegionModel(options: {
    baseModelId: string;
    displayName: string;
    regions: AwsRegion[];
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {baseModelId, displayName, regions, litellmParams = {}, rootParams = {}} = options;

    regions.forEach(region => {
      const modelId = getRegionalModelId(baseModelId, region) || `${region}.${baseModelId}`;
      if (modelId) {
        const regionVar = this.options.defaultRegionMap[region];

        const params = this.buildAwsLitellmParams(regionVar, litellmParams);

        this.modelBuilder.addModel({
          modelName: displayName,
          modelPath: `bedrock/${modelId}`,
          litellmParams: params,
          rootParams: rootParams
        });
      }
    });

    return this;
  }


  /**
   * Add a model with unified load balancing across multiple dimensions (internal)
   */
  private addLoadBalancedModel(options: AwsLoadBalanceOptions): this {
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = options;

    if (loadBalanceConfig.strategy === 'cartesian') {
      return this.addCartesianLoadBalancedModel({
        displayName,
        modelId,
        loadBalanceConfig,
        litellmParams,
        rootParams
      });
    } else if (loadBalanceConfig.strategy === 'fallback') {
      return this.addFallbackLoadBalancedModel({
        displayName,
        modelId,
        loadBalanceConfig,
        litellmParams,
        rootParams
      });
    }

    throw new Error(`Unsupported load balance strategy: ${loadBalanceConfig.strategy}`);
  }

  /**
   * Handle cartesian (cross-product) load balancing
   */
  private addCartesianLoadBalancedModel(options: {
    displayName: string;
    modelId: BedrockModelId | string;
    loadBalanceConfig: UnifiedLoadBalanceConfig<AwsLoadBalanceCredential>;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = options;
    const {credentials = [], regions = []} = loadBalanceConfig.dimensions;

    if (credentials.length === 0 && regions.length === 0) {
      throw new Error('At least one credential or region must be specified for cartesian load balancing');
    }

    // Handle credentials-only case (single region)
    if (credentials.length > 0 && regions.length === 0) {
      // Default to first available region if none specified
      const defaultRegion = Object.keys(this.options.defaultRegionMap)[0] as AwsRegion;
      const regionVar = this.options.defaultRegionMap[defaultRegion];
      const resolvedModelId = getRegionalModelId(modelId, defaultRegion) || modelId;

      const loadBalanceConfigOld: LoadBalanceConfig<AwsLoadBalanceCredential> = {
        parameterName: 'aws_credentials',
        credentials,
        credentialToParams: (credential) => ({
          aws_access_key_id: credential.accessKeyId,
          aws_secret_access_key: credential.secretAccessKey,
          aws_region_name: regionVar,
          ...(credential.sessionToken && {aws_session_token: credential.sessionToken})
        })
      };

      this.modelBuilder.addLoadBalancedModel({
        modelName: displayName,
        modelPath: `bedrock/${resolvedModelId}`,
        loadBalanceConfig: loadBalanceConfigOld,
        baseLitellmParams: litellmParams,
        baseRootParams: rootParams
      });

      return this;
    }

    // Handle regions-only case (single credential set)
    if (regions.length > 0 && credentials.length === 0) {
      regions.forEach(region => {
        const awsRegion = region as AwsRegion;
        const resolvedModelId = getRegionalModelId(modelId, awsRegion) || modelId;
        const regionVar = this.options.defaultRegionMap[awsRegion];
        const params = this.buildAwsLitellmParams(regionVar, litellmParams);

        this.modelBuilder.addModel({
          modelName: displayName,
          modelPath: `bedrock/${resolvedModelId}`,
          litellmParams: params,
          rootParams: rootParams
        });
      });

      return this;
    }

    // Handle multi-axis case (regions × credentials)
    if (regions.length > 0 && credentials.length > 0) {
      regions.forEach(region => {
        const awsRegion = region as AwsRegion;
        const resolvedModelId = getRegionalModelId(modelId, awsRegion) || modelId;
        const regionVar = this.options.defaultRegionMap[awsRegion];

        credentials.forEach(credential => {
          const params = {
            aws_access_key_id: credential.accessKeyId,
            aws_secret_access_key: credential.secretAccessKey,
            aws_region_name: regionVar,
            ...(credential.sessionToken && {aws_session_token: credential.sessionToken}),
            ...litellmParams
          };

          // Add cache control if configured
          if (this.cacheControlRoles) {
            params.cache_control_injection_points = this.cacheControlRoles.map(role => ({
              location: "message" as const,
              role,
              index: 0
            }));
          }

          this.modelBuilder.addModel({
            modelName: displayName,
            modelPath: `bedrock/${resolvedModelId}`,
            litellmParams: params,
            rootParams: rootParams
          });
        });
      });

      return this;
    }

    return this;
  }

  /**
   * Handle fallback load balancing (primary + fallback)
   */
  private addFallbackLoadBalancedModel(options: {
    displayName: string;
    modelId: BedrockModelId | string;
    loadBalanceConfig: UnifiedLoadBalanceConfig<AwsLoadBalanceCredential>;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, loadBalanceConfig, litellmParams = {}, rootParams = {}} = options;
    const {regions = []} = loadBalanceConfig.dimensions;
    const {fallbackConfig} = loadBalanceConfig;

    if (!fallbackConfig) {
      throw new Error('Fallback configuration is required when using fallback strategy');
    }

    if (regions.length === 0) {
      throw new Error('At least one region must be specified for fallback load balancing');
    }

    const primaryRegion = fallbackConfig.primary as AwsRegion;
    const fallbackSuffix = fallbackConfig.suffix || '-fallback';

    // Create primary model
    const resolvedModelId = getRegionalModelId(modelId, primaryRegion) || modelId;
    const primaryRegionVar = this.options.defaultRegionMap[primaryRegion];
    const primaryParams = this.buildAwsLitellmParams(primaryRegionVar, litellmParams);

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `bedrock/${resolvedModelId}`,
      litellmParams: primaryParams,
      rootParams: rootParams
    });

    // Create fallback models for other regions
    regions.filter(region => region !== primaryRegion).forEach(region => {
      const awsRegion = region as AwsRegion;
      const fallbackModelId = getRegionalModelId(modelId, awsRegion) || modelId;
      const fallbackRegionVar = this.options.defaultRegionMap[awsRegion];
      const fallbackModelName = `${displayName}${fallbackSuffix}`;
      const fallbackParams = this.buildAwsLitellmParams(fallbackRegionVar, litellmParams);

      this.modelBuilder.addModel({
        modelName: fallbackModelName,
        modelPath: `bedrock/${fallbackModelId}`,
        litellmParams: fallbackParams,
        rootParams: rootParams
      });

      // Add to fallbacks array
      this.fallbacks.push({[displayName]: [fallbackModelName]});
    });

    return this;
  }


}