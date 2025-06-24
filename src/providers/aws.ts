import {ModelBuilder} from '../models/model-builder';
import {ConfigValue, LoadBalanceConfig, AwsCredential} from '../types/base';
import {ModelParams, CacheControlInjectionPoint} from '../types/config';
import {
  BedrockModelId,
  supportsCRIS,
  getRegionalModelId,
  parseModelId
} from '../types/models';
import {
  ProviderBuilder,
  UnifiedLoadBalanceConfig,
  AwsLoadBalanceCredential,
  BaseAddModelOptions,
  BaseLoadBalanceOptions
} from './base-provider';

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
export class AwsBedrockBuilder extends ProviderBuilder {
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
   * Add basic Bedrock model with AWS authentication
   */
  addModel(options: AwsAddModelOptions): this {
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
   * Add a model with region-based fallback
   */
  addRegionFallbackModel(options: {
    baseModelId: string;
    displayName: string;
    primaryRegion: AwsRegion;
    fallbackRegion: AwsRegion;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
    fallbackSuffix?: string;
  }): this {
    const {
      baseModelId,
      displayName,
      primaryRegion,
      fallbackRegion,
      litellmParams = {},
      rootParams = {},
      fallbackSuffix = '-fallback'
    } = options;

    // Create the primary region model
    const primaryModelId = getRegionalModelId(baseModelId, primaryRegion) || `${primaryRegion}.${baseModelId}`;
    const primaryRegionVar = this.options.defaultRegionMap[primaryRegion];

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `bedrock/${primaryModelId}`,
      litellmParams: this.buildAwsLitellmParams(primaryRegionVar, litellmParams),
      rootParams: rootParams
    });

    // Create the fallback region model
    const fallbackModelId = getRegionalModelId(baseModelId, fallbackRegion) || `${fallbackRegion}.${baseModelId}`;
    const fallbackRegionVar = this.options.defaultRegionMap[fallbackRegion];
    const fallbackModelName = `${displayName}${fallbackSuffix}`;

    this.modelBuilder.addModel({
      modelName: fallbackModelName,
      modelPath: `bedrock/${fallbackModelId}`,
      litellmParams: this.buildAwsLitellmParams(fallbackRegionVar, litellmParams),
      rootParams: rootParams
    });

    // Add to fallbacks array
    this.fallbacks.push({[displayName]: [fallbackModelName]});

    return this;
  }

  /**
   * Add multiple model variations with region fallback
   */
  addModelVariationsWithFallback(options: {
    baseModelId: string;
    baseDisplayName: string;
    primaryRegion: AwsRegion;
    fallbackRegion: AwsRegion;
    variations: Array<{
      suffix: string;
      litellmParams?: ModelParams;
      rootParams?: Record<string, any>;
    }>;
    fallbackSuffix?: string;
  }): this {
    const {
      baseModelId,
      baseDisplayName,
      primaryRegion,
      fallbackRegion,
      variations,
      fallbackSuffix = '-fallback'
    } = options;

    variations.forEach(variation => {
      const modelName = `${baseDisplayName}-${variation.suffix}`;

      this.addRegionFallbackModel({
        baseModelId,
        displayName: modelName,
        primaryRegion,
        fallbackRegion,
        litellmParams: variation.litellmParams,
        rootParams: variation.rootParams,
        fallbackSuffix
      });
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
   * Add multiple model variations with the same AWS authentication across regions
   */
  addMultiRegionModelVariations(options: {
    baseModelId: string;
    displayName: string;
    regions: AwsRegion[];
    variations: Array<{
      suffix: string;
      litellmParams?: ModelParams;
      rootParams?: Record<string, any>;
    }>;
    baseLitellmParams?: ModelParams;
    baseRootParams?: Record<string, any>;
  }): this {
    const {
      baseModelId,
      displayName,
      regions,
      variations,
      baseLitellmParams = {},
      baseRootParams = {}
    } = options;

    regions.forEach(region => {
      const regionVar = this.options.defaultRegionMap[region];
      const modelId = getRegionalModelId(baseModelId, region) || `${region}.${baseModelId}`;

      if (modelId) {
        variations.forEach(variation => {
          const modelName = `${displayName}-${variation.suffix}`;
          const litellmParams = variation.litellmParams || {};
          const rootParams = variation.rootParams || {};

          const params = this.buildAwsLitellmParams(regionVar, {
            ...baseLitellmParams,
            ...litellmParams
          });

          this.modelBuilder.addModel({
            modelName: modelName,
            modelPath: `bedrock/${modelId}`,
            litellmParams: params,
            rootParams: {...baseRootParams, ...rootParams}
          });
        });
      }
    });

    return this;
  }

  /**
   * Add a model with load balancing across multiple AWS credentials (single region)
   */
  addLoadBalancedModel(options: {
    displayName: string;
    modelId: BedrockModelId | string;
    region: AwsRegion;
    awsCredentials: AwsCredential[];
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, region, awsCredentials, litellmParams = {}, rootParams = {}} = options;
    
    const resolvedModelId = getRegionalModelId(modelId, region) || modelId;
    const regionVar = this.options.defaultRegionMap[region];

    const loadBalanceConfig: LoadBalanceConfig<AwsCredential> = {
      parameterName: 'aws_credentials',
      credentials: awsCredentials,
      credentialToParams: (credential) => ({
        aws_access_key_id: credential.accessKeyId,
        aws_secret_access_key: credential.secretAccessKey,
        aws_region_name: regionVar, // Use the specified region, not credential.region
        ...(credential.sessionToken && {aws_session_token: credential.sessionToken})
      })
    };

    this.modelBuilder.addLoadBalancedModel({
      modelName: displayName,
      modelPath: `bedrock/${resolvedModelId}`,
      loadBalanceConfig,
      baseLitellmParams: litellmParams,
      baseRootParams: rootParams
    });

    return this;
  }

  /**
   * Add a model with multi-axis load balancing across regions AND credentials
   * Creates models for every combination of region × credential
   */
  addMultiAxisLoadBalancedModel(options: {
    displayName: string;
    modelId: BedrockModelId | string;
    regions: AwsRegion[];
    awsCredentials: AwsLoadBalanceCredential[];
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {displayName, modelId, regions, awsCredentials, litellmParams = {}, rootParams = {}} = options;

    // Create models for every combination of region × credential
    regions.forEach(region => {
      const resolvedModelId = getRegionalModelId(modelId, region) || modelId;
      const regionVar = this.options.defaultRegionMap[region];

      awsCredentials.forEach(credential => {
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
}