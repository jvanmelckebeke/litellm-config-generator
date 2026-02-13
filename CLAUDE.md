# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build & Test**
- `npm run build` - Compile TypeScript to dist/
- `npm run start` - Run src/index.ts with ts-node
- `npm test` - Run Jest tests

**Examples**
- `npm run example:main` - Comprehensive example (examples/main.ts)
- `npm run example:fluent` - Fluent API patterns (examples/fluent-test.ts)
- `npm run example:anthropic` - Anthropic provider usage (examples/anthropic-test.ts)
- `npm run example:openrouter` - OpenRouter integration (examples/openrouter-test.ts)
- `npm run example:openai-compatible` - OpenAI-compatible endpoints (examples/openai-compatible-test.ts)

**Model ID Updates**
- `npm run update:bedrock` - Fetch latest AWS Bedrock model IDs from API
- `npm run update:openrouter` - Fetch latest OpenRouter model IDs from API

These update scripts regenerate the type-safe model ID lists in `src/types/generated/`.

## Architecture

This is a CDK-like TypeScript library for generating LiteLLM proxy configurations using a fluent builder pattern.

### Code Organization

The codebase is organized into distinct layers:

**`/src/types/`** - Pure type definitions with no runtime logic
- `base.ts` - Core types (ConfigValue, environment variable helpers)
- `model.ts` - Model definition interfaces
- `settings.ts` - LiteLLM, general, and router settings
- `cache.ts` - Cache configuration types
- `models.ts` - CRIS detection logic and model utilities
- `generated/` - Auto-generated model ID types (never edit manually)

**`/src/providers/`** - Provider-specific builder implementations
- Each provider (AWS, Gemini, Anthropic, OpenRouter, OpenAI-compatible) has its own builder class
- Providers delegate to `ModelBuilder` for core model construction
- Contains provider-specific authentication, regions, and parameter handling

**`/src/builders/`** - Specialized model builders (deprecated structure)
Note: Some builder files exist in both `/src/builders/` and `/src/providers/`. The `/src/providers/` location is the canonical one.

**`/src/config/`** - Main orchestration layer
- `LiteLLMConfigBuilder` is the entry point that coordinates all provider builders
- Handles settings aggregation and final YAML generation

**`/src/generators/`** - Output formatting
- `YamlGenerator` handles enhanced YAML with comments and grouping

**`/examples/`** - Working examples demonstrating usage patterns

See `CONVENTIONS.md` for detailed naming and architectural patterns.

### Core Design Pattern

The library follows a hierarchical builder pattern:
1. **LiteLLMConfigBuilder** - Main entry point, orchestrates settings and model builders
2. **Provider Builders** - Specialized builders for AWS Bedrock, Gemini, etc. 
3. **ModelBuilder** - Core model definition abstraction
4. **YamlGenerator** - Handles enhanced YAML output with comments and grouping

### Key Components

**Configuration Builder (`src/config/litellm-config-builder.ts`)**
- Main orchestrator that combines settings and models
- Creates provider-specific builders via `createAwsBuilder()`, `createGeminiBuilder()`, `createAnthropicBuilder()`, `createOpenRouterBuilder()`, `createOpenAICompatibleBuilder()`
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
- **OpenAICompatibleBuilder**: Generic builder for any OpenAI-compatible endpoint (vLLM, Ollama, custom APIs) with customizable model prefix and `api_base` support

**CRIS System (`src/types/models.ts`)**
- Auto-detects AWS Bedrock models that support cross-region inference (CRIS)
- Detects CRIS by checking model IDs that start with region prefixes (e.g., `us.anthropic.claude-*`, `eu.anthropic.claude-*`)
- When CRIS is enabled, automatically creates load-balanced variants across regions
- Key function: `getCRISBaseModelId()` strips region prefixes to get the base model ID
- Used by `AwsBedrockBuilder.addModel()` when `detectCRIS` option is enabled

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

**Model ID Types (`src/types/generated/`)**
- `BedrockModelId`: Auto-generated from AWS Bedrock API (see `npm run update:bedrock`)
- `OpenRouterModelId`: Auto-generated from OpenRouter API (see `npm run update:openrouter`)
- Both provide compile-time validation and IDE autocomplete
- CRIS (Cross-Region Inference) support with automatic region detection in `src/types/models.ts`

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

// OpenAI-compatible endpoint (vLLM, Ollama, etc.)
const openaiCompat = config.createOpenAICompatibleBuilder(
  {modelPrefix: 'openai'},  // optional, defaults to 'openai'
  {apiBase: env('VLLM_API_BASE'), apiKey: env('VLLM_API_KEY')}
);
openaiCompat.addModel({
  displayName: 'llama-3-70b',
  modelId: 'meta-llama/Llama-3-70B-Instruct'
}).build();

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

## Development Workflows

### Adding a New Provider

To add support for a new LLM provider:

1. **Create provider builder** in `src/providers/[provider-name].ts`
   - Extend pattern from existing providers (AWS, Gemini, Anthropic, OpenRouter)
   - Inject `ModelBuilder` dependency for core model construction
   - Implement provider-specific authentication and parameters

2. **Add types** to `src/types/models.ts` if needed
   - Define provider-specific model ID types (or create generated types)
   - Add provider-specific parameter interfaces

3. **Add factory method** to `LiteLLMConfigBuilder`
   - Add `create[Provider]Builder()` method in `src/config/litellm-config-builder.ts`
   - Follow pattern: create provider builder with `ModelBuilder` injection

4. **Export from index** in `src/index.ts`
   - Export provider builder class and related types

5. **Create example** in `examples/[provider]-test.ts`
   - Demonstrate provider usage patterns

### Updating Model IDs

**AWS Bedrock**: `npm run update:bedrock`
- Fetches model IDs from AWS Bedrock API across regions (eu-central-1, us-east-1)
- Queries foundation models and inference profiles
- Generates `src/types/generated/bedrock-model-ids.ts` with union type
- Script location: `scripts/bedrock-update-model-ids.ts`

**OpenRouter**: `npm run update:openrouter`
- Fetches model list from OpenRouter API
- Generates `src/types/generated/openrouter-model-ids.ts` with union type
- Script location: `scripts/openrouter-update-model-ids.ts`

**Important**: Never manually edit files in `src/types/generated/` - always use the update scripts.

### Understanding the Builder Chain

The library uses dependency injection and hierarchical builders:

```
LiteLLMConfigBuilder (orchestrator)
  ↓ creates
ProviderBuilder (AWS/Gemini/etc.)
  ↓ injects ModelBuilder
ModelBuilder (core model abstraction)
  ↓ produces
ModelDefinition[] (data structures)
  ↓ consumed by
YamlGenerator (output formatter)
```

When debugging, trace this chain:
1. User calls `config.create[Provider]Builder()` → creates provider builder with ModelBuilder
2. User calls `providerBuilder.addModel()` → delegates to ModelBuilder
3. ModelBuilder constructs `ModelDefinition` with provider-specific parameters
4. `config.build()` collects all ModelDefinitions
5. `YamlGenerator.generateEnhancedYaml()` formats the output