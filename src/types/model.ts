import {CacheControlInjectionPoint} from './cache';

/**
 * Model-related type definitions for LiteLLM configuration
 */

export interface ModelParams {
  /**
   * requests per minute
   */
  rpm?: number;

  /**
   * Cache control injection points for AWS Bedrock
   */
  cache_control_injection_points?: CacheControlInjectionPoint[];

  [key: string]: any;
}

export interface ModelDefinition {
  model_name: string;
  litellm_params: {
    model: string;
    [key: string]: any;
  };
  model_info?: {
    [key: string]: any;
  };

  // Allow for additional properties at the root level
  [key: string]: any;
}