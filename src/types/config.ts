import {ConfigValue} from './base';

/**
 * Type definitions for LiteLLM configuration
 */

export interface CacheControlInjectionPoint {
  location: "message";
  role: string;
  index: number;
}

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

/**
 * Configuration parameters for caching.
 */
export interface CacheParams {
  /**
   * Time-to-live (TTL) for cache entries, in seconds.
   * @default undefined
   */
  ttl?: number; // Optional[float] - ttl

  /**
   * Default TTL for in-memory cache entries, in seconds.
   * @default undefined
   */
  default_in_memory_ttl?: number; // Optional[float]

  /**
   * similarity threshold for semantic cache.
   */
  similarity_threshold?: number;

  /**
   * Redis semantic cache embedding model.
   */
  redis_semantic_cache_embedding_model?: string


  /**
   * Default TTL for Redis cache entries, in seconds.
   * @default undefined
   */
  default_in_redis_ttl?: number; // Optional[float]

  /**
   * The type of cache to use.
   * @example "s3"
   */
  type: "local" | "redis" | "redis-semantic" | "qdrant-semantic" | "s3";

  /**
   * List of LitellM call types to cache for.
   * @example ["acompletion", "aembedding"]
   */
  supported_call_types?: ("completion" | "acompletion" | "embedding" | "aembedding" | "atext_completion" | "atranscription")[]; // List of litellm call types

  /**
   * Redis cache parameters.
   */
  // Redis cache parameters
  /**
   * Redis server hostname or IP address.
   * @default "localhost"
   */
  host?: string; // Redis server hostname or IP address
  /**
   * Redis server port.
   * @default "6379"
   */
  port?: string; // Redis server port (as a string)
  /**
   * Redis server password.
   * @default undefined
   */
  password?: string; // Redis server password
  /**
   * Redis namespace for keys.
   * @default undefined
   */
  namespace?: string | null;

  /**
   * S3 cache parameters.
   */
  // S3 cache parameters
  /**
   * Name of the S3 bucket.
   * @default undefined
   */
  s3_bucket_name?: string; // Name of the S3 bucket
  /**
   * AWS region of the S3 bucket.
   * @default "us-west-2"
   */
  s3_region_name?: string; // AWS region of the S3 bucket
  /**
   * AWS S3 API version.
   * @default "2006-03-01"
   */
  s3_api_version?: string; // AWS S3 API version
  /**
   * Whether to use SSL for S3 connections.
   * @default true
   */
  s3_use_ssl?: boolean; // Use SSL for S3 connections (options: true, false)
  /**
   * Whether to verify SSL certificates for S3 connections.
   * @default true
   */
  s3_verify?: boolean; // SSL certificate verification for S3 connections (options: true, false)
  /**
   * S3 endpoint URL.
   * @default "https://s3.amazonaws.com"
   */
  s3_endpoint_url?: string; // S3 endpoint URL
  /**
   * AWS Access Key ID for S3.
   * @default undefined
   */
  s3_aws_access_key_id?: string; // AWS Access Key ID for S3
  /**
   * AWS Secret Access Key for S3.
   * @default undefined
   */
  s3_aws_secret_access_key?: string; // AWS Secret Access Key for S3
  /**
   * AWS Session Token for temporary credentials.
   * @default undefined
   */
  s3_aws_session_token?: string; // AWS Session Token for temporary credentials
}

export interface LiteLLMSettings {
  drop_params?: boolean;
  modify_params?: boolean;
  set_verbose?: boolean;
  callbacks?: string[];
  success_callback?: string[];
  failure_callback?: string[];
  cache?: boolean;
  cache_params?: CacheParams;
  service_callbacks?: string[];
  redact_user_api_key_info?: boolean;
  langfuse_default_tags?: string[];
  turn_off_message_logging?: boolean;
  json_logs?: boolean;
  default_fallbacks?: string[];
  content_policy_fallbacks?: Array<Record<string, string[]>>;
  context_window_fallbacks?: Array<Record<string, string[]>>;
  request_timeout?: number;
  force_ipv4?: boolean;
  enable_preview_features?: boolean;
}

export interface GeneralSettings {
  master_key?: ConfigValue;
  database_url?: ConfigValue;
  store_model_in_db?: boolean;
  store_prompts_in_spend_logs?: boolean;
  completion_model?: string;
  disable_spend_logs?: boolean;
  disable_master_key_return?: boolean;
  disable_retry_on_max_parallel_request_limit_error?: boolean;
  disable_reset_budget?: boolean;
  disable_adding_master_key_hash_to_db?: boolean;
  enable_jwt_auth?: boolean;
  enforce_user_param?: boolean;
  allowed_routes?: string[];
  key_management_system?: string;
  database_connection_pool_limit?: number;
  database_connection_timeout?: number;
  allow_requests_on_db_unavailable?: boolean;
  custom_auth?: string;
  max_parallel_requests?: number;
  global_max_parallel_requests?: number;
  infer_model_from_keys?: boolean;
  background_health_checks?: boolean;
  health_check_interval?: number;
  alerting?: string[];
  alerting_threshold?: number;
  use_client_credentials_pass_through_routes?: boolean;
}

export interface RouterSettings {
  routing_strategy?: "simple-shuffle" | "least-busy" | "usage-based-routing" | "latency-based-routing" | "usage-based-routing-v2";
  redis_host?: ConfigValue;
  redis_password?: ConfigValue;
  redis_port?: ConfigValue;
  enable_pre_call_checks?: boolean;
  allowed_fails?: number;
  cooldown_time?: number;
  disable_cooldowns?: boolean;
  enable_tag_filtering?: boolean;
  retry_policy?: Record<string, number>;
  allowed_fails_policy?: Record<string, number>;
  content_policy_fallbacks?: Array<Record<string, string[]>>;
  fallbacks?: Array<Record<string, string[]>>;
  timeout?: number;
  num_retries?: number;
  request_timeout?: number;
  debug_level?: "DEBUG" | "INFO";
}

export interface LiteLLMConfig {
  litellm_settings?: LiteLLMSettings;
  general_settings?: GeneralSettings;
  model_list?: ModelDefinition[];
  router_settings?: RouterSettings;
  environment_variables?: Record<string, string>;
  include?: string[];
}