/**
 * Cache-related type definitions for LiteLLM configuration
 */

export interface CacheControlInjectionPoint {
  location: "message";
  role: string;
  index: number;
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