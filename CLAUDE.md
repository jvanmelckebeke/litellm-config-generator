# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run build` - Compile TypeScript to dist/
- `npm run start` - Run src/index.ts with ts-node
- `npm test` - Run Jest tests
- `npm run example:main` - Execute the main example (examples/main.ts)

## Architecture

This is a CDK-like TypeScript library for generating LiteLLM proxy configurations using a fluent builder pattern.

### Core Design Pattern

The library follows a hierarchical builder pattern:
1. **LiteLLMConfigBuilder** - Main entry point, orchestrates settings and model builders
2. **Provider Builders** - Specialized builders for AWS Bedrock, Gemini, etc. 
3. **ModelBuilder** - Core model definition abstraction
4. **YamlGenerator** - Handles enhanced YAML output with comments and grouping

### Key Components

**Configuration Builder (`src/config/litellm-config-builder.ts`)**
- Main orchestrator that combines settings and models
- Creates provider-specific builders via `createAwsBuilder()`, `createGeminiBuilder()`, `createAnthropicBuilder()`, `createOpenRouterBuilder()`
- Generates final config via `build()` or enhanced YAML via `generateEnhancedYaml()`

**Model Builder (`src/models/model-builder.ts`)**
- Core abstraction for model definitions
- Supports load balancing, variations, and flexible parameter configuration
- Used by all provider builders internally

**Provider Builders (`src/providers/`)**
- **AwsBedrockBuilder**: Handles AWS authentication, CRIS (Cross-Region Inference), regional fallbacks, cache control, and advanced load balancing
- **GeminiBuilder**: Manages API key load balancing across multiple keys
- **AnthropicBuilder**: Fluent interface for Anthropic Claude models with API key load balancing
- **OpenRouterBuilder**: Strict typing with OpenRouter model IDs and standardized routing

**CRIS System (`src/types/models.ts`)**
- Auto-detects models that support cross-region inference
- Maps base model IDs to region-specific variants (eu./us. prefixes)
- Enables automatic load balancing across AWS regions

**Enhanced YAML Generation (`src/generators/yaml-generator.ts`)**
- Groups models by provider and region with comments
- Processes ConfigValue objects (environment variables) to proper YAML format
- Adds thinking capability annotations and other metadata

### Type System Architecture

The library uses a modular type system with specialized files:

**Core Types (`src/types/base.ts`)**
- `ConfigValue`: Environment variables and configuration values 
- `env('VAR_NAME')` creates environment references
- Automatically converts to `os.environ/VAR_NAME` in YAML output

**Model Types (`src/types/model.ts`)**
- `ModelDefinition`: Complete model configuration structure
- `ModelParams`: Model-specific parameters including cache control injection points
- Supports flexible parameter configuration with type safety

**Settings Types (`src/types/settings.ts`)**
- `LiteLLMSettings`: Core LiteLLM proxy settings (callbacks, caching, fallbacks)
- `GeneralSettings`: Database, authentication, and system settings
- `RouterSettings`: Load balancing, retry policies, and routing configuration

**Cache Types (`src/types/cache.ts`)**
- `CacheParams`: Comprehensive caching configuration (Redis, S3, semantic caching)
- `CacheControlInjectionPoint`: AWS Bedrock prompt caching injection points
- Supports local, Redis, Redis-semantic, Qdrant-semantic, and S3 cache types

**Model ID Types (`src/types/models.ts`)**
- `BedrockModelId`: Strictly typed AWS Bedrock model identifiers
- `OpenRouterModelId`: Enforced OpenRouter model slugs with compile-time validation
- CRIS (Cross-Region Inference) support with automatic region detection

### Advanced Features

**Cache Control Support**
- Configure cache control injection points with `withCacheControl(['system', 'user', 'assistant'])`
- Automatically injects cache control parameters for prompt caching
- Reduces latency and costs for repeated prompts

**Advanced Load Balancing (AWS)**
- `addLoadBalancedModel()`: Single-axis load balancing across multiple AWS credentials
- `addMultiAxisLoadBalancedModel()`: Multi-axis load balancing across regions × credentials
- Supports fault tolerance and rate limit distribution across accounts

### Usage Patterns

See `examples/main.ts` for comprehensive examples. The typical workflow:

1. **Create LiteLLMConfigBuilder with settings**
```typescript
const config = new LiteLLMConfigBuilder()
  .withGeneralSettings({master_key: env('LITELLM_MASTER_KEY')})
  .withLiteLLMSettings({set_verbose: true});
```

2. **Create provider builders**
```typescript
// AWS Bedrock with CRIS support
const aws = config.createAwsBuilder();

// Gemini with API key load balancing  
const gemini = config.createGeminiBuilder();

// Anthropic Claude models
const anthropic = config.createAnthropicBuilder();

// OpenRouter with strict typing
const openrouter = config.createOpenRouterBuilder();
```

3. **Configure models with provider-specific methods**
```typescript
// AWS Bedrock with cache control
aws.addModel({
  displayName: 'claude-3-5-sonnet',
  modelId: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
  awsAccessKeyId: env('AWS_ACCESS_KEY_ID'),
  awsSecretAccessKey: env('AWS_SECRET_ACCESS_KEY')
}).withCacheControl(['system', 'user']);

// OpenRouter with strict model ID typing
openrouter.addModel({
  displayName: 'claude-3.5-sonnet',
  modelId: 'anthropic/claude-3.5-sonnet:beta', // Compile-time validated
  apiKey: env('OPENROUTER_API_KEY')
});

// Anthropic direct API
anthropic.addModel({
  displayName: 'claude-3-haiku',
  modelId: 'claude-3-haiku-20240307',
  apiKey: env('ANTHROPIC_API_KEY')
});
```

4. **Advanced load balancing**
```typescript
// Multi-axis load balancing (AWS regions × credentials)
aws.addMultiAxisLoadBalancedModel({
  displayName: 'claude-3-opus-balanced',
  modelId: 'anthropic.claude-3-opus-20240229-v1:0',
  credentials: [
    {awsAccessKeyId: env('AWS_KEY_1'), awsSecretAccessKey: env('AWS_SECRET_1')},
    {awsAccessKeyId: env('AWS_KEY_2'), awsSecretAccessKey: env('AWS_SECRET_2')}
  ],
  regions: ['us-east-1', 'us-west-2']
});
```

5. **Generate enhanced YAML output**
```typescript
await config.writeToEnhancedFile('litellm_config.yaml');
```