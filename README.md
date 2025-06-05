# LiteLLM Config Generator

A CDK-like TypeScript library for generating LiteLLM proxy configurations with a fluent builder API. Simplifies the creation of complex LiteLLM configurations with type safety, environment variable handling, and provider-specific optimizations.

## Features

- 🏗️ **Fluent Builder Pattern**: CDK-inspired API for intuitive configuration building
- 🔒 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🌍 **Multi-Provider Support**: AWS Bedrock, Google Gemini with provider-specific optimizations
- 🔄 **Cross-Region Inference (CRIS)**: Automatic detection and configuration for AWS models
- 🔑 **Environment Variable Handling**: Clean abstraction for secrets and configuration
- 📝 **Enhanced YAML Output**: Generated configs with comments and logical grouping
- ⚖️ **Load Balancing**: Built-in support for API key rotation and regional fallbacks

## Installation

```bash
npm install litellm-config-generator
```

## Quick Start

```typescript
import { LiteLLMConfigBuilder, env } from 'litellm-config-generator';

// Create the main config builder
const builder = new LiteLLMConfigBuilder()
  .withLiteLLMSettings({
    drop_params: true,
  })
  .withGeneralSettings({
    master_key: env('LITELLM_MASTER_KEY'),
    database_url: env('DATABASE_URL'),
  })
  .withRouterSettings({
    routing_strategy: 'usage-based-routing-v2',
    num_retries: 2,
  });

// Add AWS Bedrock models with automatic CRIS detection
const awsBuilder = builder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  defaultRegionMap: {
    'eu': env('AWS_REGION_NAME_EU'),
    'us': env('AWS_REGION_NAME_US')
  },
  detectCRIS: true // Auto-detect cross-region inference support
});

awsBuilder.addModel({
  displayName: 'claude-4-sonnet',
  modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
  region: 'us'
});

// Add Gemini models with load balancing
const geminiBuilder = builder.createGeminiBuilder();

geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.0-flash',
  modelId: 'gemini-2.0-flash',
  apiKeys: [
    env('GEMINI_API_KEY_1'),
    env('GEMINI_API_KEY_2')
  ]
});

// Generate enhanced YAML configuration
builder.writeToEnhancedFile('config.yaml');
```

## Core Concepts

### Builder Pattern

The library uses a hierarchical builder pattern:

1. **LiteLLMConfigBuilder** - Main orchestrator for settings and providers
2. **Provider Builders** - Specialized builders for each LLM provider
3. **Model Builder** - Core abstraction for model definitions

### Configuration Values

Handle environment variables and secrets cleanly:

```typescript
import { env, ConfigValue } from 'litellm-config-generator';

// Environment variable reference
const apiKey = env('MY_API_KEY'); // → os.environ/MY_API_KEY in YAML

// Direct string value
const region = 'us-east-1';

// Mixed usage
const config = {
  master_key: env('MASTER_KEY'),    // From environment
  database_url: env('DB_URL'),      // From environment
  completion_model: 'gpt-4'         // Direct value
};
```

### Cross-Region Inference (CRIS)

Automatically detects AWS models that support cross-region inference and creates load-balanced configurations:

```typescript
const awsBuilder = builder.createAwsBuilder({
  // ... auth config
  detectCRIS: true // Enable auto-detection
});

// This model supports CRIS - automatically creates EU and US variants
awsBuilder.addModel({
  displayName: 'nova-pro',
  modelId: 'amazon.nova-pro-v1:0',
  region: 'eu' // Will create both eu.* and us.* variants
});
```

## Provider Support

### AWS Bedrock

```typescript
const awsBuilder = builder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  defaultRegionMap: {
    'eu': env('AWS_REGION_EU'),
    'us': env('AWS_REGION_US')
  },
  detectCRIS: true
});

// Single model
awsBuilder.addModel({
  displayName: 'claude-3-sonnet',
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  region: 'eu'
});

// Model variations (e.g., different thinking token budgets)
awsBuilder.addMultiRegionModelVariations({
  baseModelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  displayName: 'claude-3-sonnet',
  regions: ['eu', 'us'],
  variations: [
    {
      suffix: 'think-1024',
      litellmParams: { thinking: { type: "enabled", budget_tokens: 1024 }}
    },
    {
      suffix: 'think-16384', 
      litellmParams: { thinking: { type: "enabled", budget_tokens: 16384 }}
    }
  ]
});
```

### Google Gemini

```typescript
const geminiBuilder = builder.createGeminiBuilder();

// Load balanced across multiple API keys
geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.0-flash',
  modelId: 'gemini-2.0-flash',
  apiKeys: [
    env('GEMINI_API_KEY_1'),
    env('GEMINI_API_KEY_2'),
    env('GEMINI_API_KEY_FALLBACK')
  ],
  rootParams: { rpm: 15 }
});
```

## Advanced Features

### Model Variations

Create multiple variants of the same model with different parameters:

```typescript
// Create thinking-enabled variants
awsBuilder.addMultiRegionModelVariations({
  baseModelId: 'anthropic.claude-4-sonnet',
  displayName: 'claude-4-sonnet', 
  regions: ['us'],
  variations: [
    { suffix: 'think-1024', litellmParams: { thinking: { budget_tokens: 1024 }}},
    { suffix: 'think-16384', litellmParams: { thinking: { budget_tokens: 16384 }}}
  ]
});
```

### Fallback Configuration

```typescript
builder.withRouterSettings({
  fallbacks: [
    { "primary-model": ["fallback-model-1", "fallback-model-2"] }
  ]
});
```

### Enhanced YAML Output

The generated YAML includes:
- Comments explaining model capabilities
- Logical grouping by provider and region
- Proper formatting for readability

```yaml
# ========== AWS MODELS ==========

# ----- Region: US -----
# thinking enabled with 1024 token budget
- model_name: claude-4-sonnet-think-1024
  litellm_params:
    model: bedrock/us.anthropic.claude-sonnet-4-20250514-v1:0
    thinking:
      type: enabled
      budget_tokens: 1024
```

## API Reference

### LiteLLMConfigBuilder

Main configuration builder with fluent API.

#### Methods

- `withLiteLLMSettings(settings)` - Configure LiteLLM-specific settings
- `withGeneralSettings(settings)` - Configure general proxy settings  
- `withRouterSettings(settings)` - Configure routing and retry behavior
- `createAwsBuilder(options)` - Create AWS Bedrock provider builder
- `createGeminiBuilder()` - Create Gemini provider builder
- `build()` - Generate final configuration object
- `writeToEnhancedFile(path)` - Write formatted YAML with comments
- `validate()` - Validate configuration completeness

### AwsBedrockBuilder

Specialized builder for AWS Bedrock models.

#### Methods

- `addModel(options)` - Add single AWS Bedrock model
- `addMultiRegionModelVariations(options)` - Add model variants across regions
- `addCrossRegionModel(options)` - Explicitly add CRIS-enabled model
- `getFallbacks()` - Get configured fallback relationships

### GeminiBuilder

Specialized builder for Google Gemini models.

#### Methods

- `addModel(options)` - Add single Gemini model
- `addLoadBalancedModel(options)` - Add model with API key load balancing

## Development

```bash
# Install dependencies
npm install

# Build the library
npm run build

# Run examples
npm run example:main

# Run tests
npm test
```

## License

MIT

## Contributing

Contributions welcome! Please read the [conventions](CONVENTIONS.md) for architectural guidelines.