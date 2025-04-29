// src/providers/aws.ts

import {ModelBuilder} from '../models/model-builder';
import {ConfigValue} from '../types/base';
import {ModelParams} from '../types/config';
import {
  BedrockModelId,
  supportsCRIS,
  getRegionalModelId,
  parseModelId
} from '../types/models';

export type AwsRegion = 'us' | 'eu';

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
export class AwsBedrockBuilder {
  private modelBuilder: ModelBuilder;
  private options: AwsProviderOptions;

  constructor(modelBuilder: ModelBuilder, options: AwsProviderOptions) {
    this.modelBuilder = modelBuilder;
    this.options = {
      detectCRIS: true, // Enable CRIS detection by default
      ...options
    };
  }

  /**
   * Add basic Bedrock model with AWS authentication
   */
  addModel(options: {
    displayName: string;
    modelId: BedrockModelId | string;
    region: AwsRegion;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
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

    const params = {
      aws_access_key_id: this.options.accessKeyId,
      aws_secret_access_key: this.options.secretAccessKey,
      aws_region_name: regionVar,
      ...(this.options.sessionToken && {aws_session_token: this.options.sessionToken}),
      ...litellmParams
    };

    this.modelBuilder.addModel({
      modelName: displayName,
      modelPath: `bedrock/${resolvedModelId}`,
      litellmParams: params,
      rootParams: rootParams
    });

    return this;
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

        const params = {
          aws_access_key_id: this.options.accessKeyId,
          aws_secret_access_key: this.options.secretAccessKey,
          aws_region_name: regionVar,
          ...(this.options.sessionToken && {aws_session_token: this.options.sessionToken}),
          ...litellmParams
        };

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

          const params = {
            aws_access_key_id: this.options.accessKeyId,
            aws_secret_access_key: this.options.secretAccessKey,
            aws_region_name: regionVar,
            ...(this.options.sessionToken && {aws_session_token: this.options.sessionToken}),
            ...baseLitellmParams,
            ...litellmParams
          };

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
}
