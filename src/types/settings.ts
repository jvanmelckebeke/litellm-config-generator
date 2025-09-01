import {ConfigValue} from './base';
import {CacheParams} from './cache';

/**
 * Settings-related type definitions for LiteLLM configuration
 */

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