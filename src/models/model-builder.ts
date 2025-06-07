import {ModelParams, ModelDefinition} from '../types/config';
import {LoadBalanceConfig, ConfigValue} from '../types/base';

/**
 * Core model builder that provides flexible methods to create model configurations
 */
export class ModelBuilder {
  private models: ModelDefinition[] = [];

  /**
   * Add a single model to the configuration
   */
  addModel(options: {
    modelName: string;
    modelPath: string;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
  }): this {
    const {modelName, modelPath, litellmParams = {}, rootParams = {}} = options;
    const modelDef: ModelDefinition = {
      model_name: modelName,
      litellm_params: {
        model: modelPath,
        ...litellmParams
      }
    };

    // Add root-level parameters
    for (const [key, value] of Object.entries(rootParams)) {
      modelDef[key] = value;
    }

    this.models.push(modelDef);
    return this;
  }


  /**
   * Add load-balanced models using a standardized configuration
   * All models will have the same name for LiteLLM load balancing
   */
  addLoadBalancedModel<T>(options: {
    modelName: string;
    modelPath: string;
    loadBalanceConfig: LoadBalanceConfig<T>;
    baseLitellmParams?: ModelParams;
    baseRootParams?: Record<string, any>;
  }): this {
    const {
      modelName,
      modelPath,
      loadBalanceConfig,
      baseLitellmParams = {},
      baseRootParams = {}
    } = options;

    loadBalanceConfig.credentials.forEach((credential) => {
      const credentialParams = loadBalanceConfig.credentialToParams(credential);
      const params = {...baseLitellmParams, ...credentialParams};

      // All load-balanced models use the same name
      this.addModel({
        modelName: modelName,
        modelPath: modelPath,
        litellmParams: params,
        rootParams: baseRootParams
      });
    });

    return this;
  }

  /**
   * Add load-balanced models by varying a specific parameter (legacy method)
   */
  addLoadBalancedModels<T>(options: {
    modelName: string;
    modelPath: string;
    loadBalanceOn: string;
    values: T[];
    valueToParam: (value: T) => any;
    litellmParams?: ModelParams;
    rootParams?: Record<string, any>;
    nameSuffix?: (value: T) => string;
  }): this {
    const {
      modelName,
      modelPath,
      loadBalanceOn,
      values,
      valueToParam,
      litellmParams = {},
      rootParams = {},
      nameSuffix
    } = options;

    const loadBalanceConfig: LoadBalanceConfig<T> = {
      parameterName: loadBalanceOn,
      credentials: values,
      credentialToParams: (value: T) => ({[loadBalanceOn]: valueToParam(value)})
    };

    return this.addLoadBalancedModel({
      modelName,
      modelPath,
      loadBalanceConfig,
      baseLitellmParams: litellmParams,
      baseRootParams: rootParams
    });
  }

  /**
   * Generate variations of a model by varying multiple parameters
   */
  addModelVariations(options: {
    baseModelName: string;
    baseModelPath: string;
    variations: Array<{
      suffix?: string;
      litellmParams?: ModelParams;
      rootParams?: Record<string, any>;
    }>;
    baseLitellmParams?: ModelParams;
    baseRootParams?: Record<string, any>;
  }): this {
    const {
      baseModelName, baseModelPath, variations,
      baseLitellmParams = {}, baseRootParams = {}
    } = options;

    variations.forEach(variation => {
      const modelName = variation.suffix ? `${baseModelName}-${variation.suffix}` : baseModelName;
      const litellmParams = {...baseLitellmParams, ...variation.litellmParams};
      const rootParams = {...baseRootParams, ...variation.rootParams};

      this.addModel({
        modelName: modelName,
        modelPath: baseModelPath,
        litellmParams: litellmParams,
        rootParams: rootParams
      });
    });

    return this;
  }

  /**
   * Get all defined models
   */
  getModels(): ModelDefinition[] {
    return this.models;
  }

}