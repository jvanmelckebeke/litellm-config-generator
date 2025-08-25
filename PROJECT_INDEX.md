# LiteLLM Config Generator - Comprehensive Project Index

## 📋 Project Overview

**LiteLLM Config Generator** is a CDK-like TypeScript library for generating LiteLLM proxy configurations using a fluent builder pattern. It provides type-safe, intuitive configuration building with provider-specific optimizations and advanced features like cross-region inference (CRIS) and load balancing.

### Key Features
- 🏗️ **Fluent Builder Pattern**: CDK-inspired API for intuitive configuration building
- 🔒 **Type Safety**: Full TypeScript support with comprehensive type definitions
- 🌍 **Multi-Provider Support**: AWS Bedrock, Google Gemini, Anthropic with provider-specific optimizations
- 🔄 **Cross-Region Inference (CRIS)**: Automatic detection and configuration for AWS models
- 🔑 **Environment Variable Handling**: Clean abstraction for secrets and configuration
- 📝 **Enhanced YAML Output**: Generated configs with comments and logical grouping
- ⚖️ **Load Balancing**: Built-in support for API key rotation and regional fallbacks

## 🎯 Quick Reference

| Component | File | Purpose |
|-----------|------|---------|
| **Main Entry** | `src/index.ts` | Library exports and public API |
| **Config Builder** | `src/config/litellm-config-builder.ts` | Main orchestration class |
| **AWS Provider** | `src/providers/aws.ts` | AWS Bedrock integration |
| **Gemini Provider** | `src/providers/gemini.ts` | Google Gemini integration |
| **Anthropic Provider** | `src/providers/anthropic.ts` | Anthropic integration |
| **Model Builder** | `src/models/model-builder.ts` | Core model abstraction |
| **Fluent Builders** | `src/builders/` | New fluent API model builders |
| **YAML Generator** | `src/generators/yaml-generator.ts` | Enhanced YAML output |
| **Configuration** | `src/types/config.ts` | Type definitions for settings |
| **Base Types** | `src/types/base.ts` | Core type system |
| **Model Types** | `src/types/models.ts` | CRIS system and model definitions |

## 🏗️ Project Structure

```
litellm-config-generator/
├── 📁 src/                          # Source code
│   ├── 📁 config/                   # Main orchestration
│   │   └── litellm-config-builder.ts
│   ├── 📁 providers/                # Provider implementations
│   │   ├── base.ts                  # Base provider abstractions
│   │   ├── aws.ts                   # AWS Bedrock builder
│   │   ├── gemini.ts                # Google Gemini builder
│   │   └── anthropic.ts             # Anthropic provider
│   ├── 📁 builders/                 # Fluent API model builders
│   │   ├── model-builder.ts         # Abstract base builder
│   │   ├── aws-model-builder.ts     # AWS-specific fluent builder
│   │   ├── gemini-model-builder.ts  # Gemini-specific fluent builder
│   │   └── anthropic-model-builder.ts # Anthropic-specific fluent builder
│   ├── 📁 models/                   # Legacy model builder (deprecated)
│   │   └── model-builder.ts         # Legacy model definition builder
│   ├── 📁 generators/               # Output formatting
│   │   └── yaml-generator.ts        # Enhanced YAML generation
│   ├── 📁 types/                    # Type definitions
│   │   ├── base.ts                  # ConfigValue system & core utilities
│   │   ├── config.ts                # Configuration interfaces
│   │   └── models.ts                # CRIS and model type definitions
│   └── index.ts                     # Public API exports
├── 📁 examples/                     # Usage examples
│   ├── main.ts                      # Comprehensive configuration example
│   ├── fluent-test.ts               # Fluent API functionality test
│   └── anthropic-test.ts            # Anthropic provider example
├── 📁 output/                       # Generated configurations
├── 📁 scripts/                      # Build and utility scripts
├── 📁 dist/                         # Compiled JavaScript output
├── README.md                        # Main user documentation
├── CLAUDE.md                        # Claude Code development instructions
├── CONVENTIONS.md                   # Architectural guidelines
├── PROJECT_INDEX.md                 # This comprehensive index
└── package.json                     # Project configuration & dependencies
```

## Core Architecture

### 🏗️ Builder Pattern Hierarchy

```
LiteLLMConfigBuilder (Main Entry)
├── AwsBedrockBuilder (AWS Provider)
├── GeminiBuilder (Google Provider)
└── ModelBuilder (Core Abstraction)
```

## 📚 Core Components & Architecture

### 🎯 Entry Points

#### [`src/index.ts`](./src/index.ts) - Main Library Exports
- **Purpose**: Exports all public APIs and types for library consumers
- **Provides**: Clean interface with central import point for all functionality
- **Key Exports**: Builders, types, utilities, CRIS system

### ⚙️ Configuration Layer

#### [`src/config/litellm-config-builder.ts`](./src/config/litellm-config-builder.ts) - LiteLLMConfigBuilder
- **Purpose**: Main orchestrator class that combines settings and model configurations
- **Features**: Provider-specific builder creation, enhanced YAML generation, validation
- **Key Methods**:
  - `withLiteLLMSettings()` - LiteLLM-specific settings
  - `withGeneralSettings()` - General proxy settings  
  - `withRouterSettings()` - Routing and retry behavior
  - `createAwsBuilder()` - AWS Bedrock provider builder factory
  - `createGeminiBuilder()` - Gemini provider builder factory
  - `createAnthropicBuilder()` - Anthropic provider builder factory
  - `generateEnhancedYaml()` - Enhanced YAML output with comments
  - `build()` - Generate final configuration object

### 🏢 Provider Layer

#### [`src/providers/base.ts`](./src/providers/base.ts) - Base Provider Abstractions
- **Purpose**: Abstract foundation for all provider implementations
- **Key Types**: `ProviderBuilder<T>`, `BaseAddModelOptions`, `BaseLoadBalanceOptions`
- **Features**: Load balance strategies, fallback configuration, unified interfaces

#### [`src/providers/aws.ts`](./src/providers/aws.ts) - AwsBedrockBuilder
- **Purpose**: AWS Bedrock provider with advanced CRIS and load balancing support
- **Advanced Features**:
  - **Cross-Region Inference (CRIS)**: Auto-detection and regional model creation
  - **Multi-Axis Load Balancing**: Regions × credentials matrix
  - **Cache Control**: Prompt caching parameter injection
  - **Regional Fallbacks**: Intelligent failover across regions
- **Key Methods**:
  - `addModel()` - Single model with CRIS auto-detection
  - `addMultiRegionModelVariations()` - Model variants across regions
  - `withCacheControl()` - Cache control injection configuration
  - `getFallbacks()` - Retrieve configured fallback relationships

#### [`src/providers/gemini.ts`](./src/providers/gemini.ts) - GeminiBuilder
- **Purpose**: Google Gemini provider with API key load balancing
- **Features**: Multi-key rotation, rate limiting, Gemini-specific parameters
- **Key Methods**:
  - `addModel()` - Single model configuration
  - `addLoadBalancedModel()` - Multi-key load balancing setup

#### [`src/providers/anthropic.ts`](./src/providers/anthropic.ts) - AnthropicBuilder
- **Purpose**: Direct Anthropic API integration
- **Features**: API key load balancing, Anthropic-specific model parameters
- **Key Methods**:
  - `addModel()` - Model configuration with Anthropic parameters
  - `addLoadBalancedModel()` - Multi-key load balancing

### 🔧 Fluent Builder Layer (New Architecture)

#### [`src/builders/model-builder.ts`](./src/builders/model-builder.ts) - Abstract ModelBuilder
- **Purpose**: Fluent API foundation for all provider-specific builders
- **Features**: Chainable methods, type safety, provider integration
- **Key Methods**:
  - `withRegions()` - Multi-region configuration
  - `withThinkingVariations()` - Thinking token budget variants
  - `withApiKeys()` - Load balancing across API keys
  - `build()` - Finalize and register model configuration

#### [`src/builders/aws-model-builder.ts`](./src/builders/aws-model-builder.ts) - AwsModelBuilder
- **Purpose**: AWS-specific fluent builder with CRIS integration
- **Features**: CRIS-aware region expansion, AWS parameter handling
- **Integration**: Inherits fluent API, adds AWS-specific functionality

#### [`src/builders/gemini-model-builder.ts`](./src/builders/gemini-model-builder.ts) - GeminiModelBuilder
- **Purpose**: Gemini-specific fluent builder
- **Features**: Gemini parameter optimization, API key rotation
- **Integration**: Fluent API with Gemini-specific enhancements

#### [`src/builders/anthropic-model-builder.ts`](./src/builders/anthropic-model-builder.ts) - AnthropicModelBuilder
- **Purpose**: Anthropic-specific fluent builder
- **Features**: Anthropic parameter handling, direct API configuration
- **Integration**: Fluent API with Anthropic-specific optimizations

### 🏭 Generation Layer

#### [`src/generators/yaml-generator.ts`](./src/generators/yaml-generator.ts) - YamlGenerator
- **Purpose**: Enhanced YAML output generator with intelligent formatting
- **Advanced Features**:
  - **Provider Grouping**: Organizes models by provider and region with comments
  - **Comment Annotations**: Adds explanatory comments for model capabilities
  - **ConfigValue Processing**: Converts environment references to proper YAML
  - **Regional Organization**: Logical grouping with section headers
- **Key Methods**:
  - `generateEnhanced()` - Create formatted YAML with comments
  - `processConfigValue()` - Handle environment variable references

### 🏛️ Legacy Components (Transitioning)

#### [`src/models/model-builder.ts`](./src/models/model-builder.ts) - Legacy ModelBuilder
- **Status**: Deprecated, being replaced by fluent builders in `src/builders/`
- **Purpose**: Original model definition abstraction
- **Migration**: New code should use provider-specific fluent builders

### 📋 Type System

#### [`src/types/base.ts`](./src/types/base.ts) - Core Types and Utilities
- **Purpose**: Foundation type system and configuration value abstraction
- **Key Types**:
  - `ConfigValue` - Union type for environment variables and direct values
  - `EnvironmentRef` - Environment variable references with metadata
  - `StringValue` - Direct string values with type safety
- **Key Functions**:
  - `env()` - Environment variable helper function
  - `toConfigValue()` - Convert values to ConfigValue objects
  - `configValueToString()` - YAML serialization helper

#### [`src/types/config.ts`](./src/types/config.ts) - Configuration Interfaces
- **Purpose**: Comprehensive type definitions for LiteLLM configuration
- **Key Interfaces**:
  - `LiteLLMSettings` - LiteLLM proxy-specific configuration
  - `GeneralSettings` - General proxy settings (auth, database, etc.)
  - `RouterSettings` - Routing strategy, retries, fallbacks
  - `ModelDefinition` - Complete model configuration structure
  - `ModelParams` - Model-specific parameters and settings
  - `CacheControlInjectionPoint` - Cache control configuration

#### [`src/types/models.ts`](./src/types/models.ts) - Model Definitions and CRIS
- **Purpose**: Model type definitions and Cross-Region Inference system
- **Key Features**:
  - `BedrockModelId` - Type-safe enumeration of AWS Bedrock models
  - `supportsCRIS()` - Determines if model supports cross-region inference
  - `getRegionalModelId()` - Generates region-specific model identifiers
  - Model capability mappings and validation logic
- **CRIS Models**: Nova series, Claude series, and other multi-region models

### 🔄 Configuration Value System

#### Environment Variable Abstraction
The library provides a clean abstraction for handling configuration values:

```typescript
// Environment variables (preferred for secrets)
env('VAR_NAME')  // → os.environ/VAR_NAME in YAML

// Direct values (for non-sensitive configuration)
'string-value'   // → string-value in YAML

// Mixed usage in configuration objects
{
  master_key: env('LITELLM_MASTER_KEY'),  // From environment
  routing_strategy: 'usage-based-routing-v2'  // Direct value
}
```

#### Benefits
- **Security**: Separates secrets from configuration code
- **Flexibility**: Easy switching between environments
- **Type Safety**: Compile-time validation of configuration structure
- **YAML Compatibility**: Proper serialization to LiteLLM format

### 🌍 CRIS (Cross-Region Inference) System

#### Automatic Model Detection and Configuration
Intelligent system for AWS models supporting cross-region inference:

- **Auto-Detection**: `detectCRIS: true` automatically identifies CRIS-capable models
- **Regional Variants**: Creates both `eu.*` and `us.*` model variants
- **Load Balancing**: Configures regional fallback chains automatically
- **Model Mapping**: Maps base model IDs to region-specific variants
- **Supported Models**: Nova series, Claude series, and expanding list

#### Implementation Details
```typescript
// Enable CRIS auto-detection
const awsBuilder = builder.createAwsBuilder({
  detectCRIS: true,
  defaultRegionMap: {
    'eu': 'eu-west-1',
    'us': 'us-east-1'
  }
});

// This model supports CRIS - automatically creates both variants
awsBuilder.addModel({
  displayName: 'nova-pro',
  modelId: 'amazon.nova-pro-v1:0',
  region: 'eu'  // Creates: eu.amazon.nova-pro-v1:0 + us.amazon.nova-pro-v1:0
});
```

## API Reference

### Public Exports (`src/index.ts`)

```typescript
// Main builder
export { LiteLLMConfigBuilder }

// Provider builders
export { AwsBedrockBuilder, GeminiBuilder }

// Model builder
export { ModelBuilder }

// Configuration utilities
export { env, toConfigValue, configValueToString }

// CRIS system
export { bedrockModelIds, supportsCRIS, getRegionalModelId }

// Types
export type { ConfigValue, LiteLLMSettings, GeneralSettings, ModelDefinition }
```

### Core Classes

#### **LiteLLMConfigBuilder**
Main configuration orchestrator with fluent API.

**Configuration Methods:**
- `withLiteLLMSettings(settings: LiteLLMSettings): this`
- `withGeneralSettings(settings: GeneralSettings): this`
- `withRouterSettings(settings: RouterSettings): this`

**Provider Factories:**
- `createAwsBuilder(options: AwsProviderOptions): AwsBedrockBuilder`
- `createGeminiBuilder(): GeminiBuilder`

**Output Methods:**
- `build(): LiteLLMConfig`
- `generateEnhancedYaml(): string`
- `writeToEnhancedFile(path: string): void`

#### **AwsBedrockBuilder**
AWS Bedrock provider with CRIS support.

**Model Configuration:**
- `addModel(options: AwsModelOptions): this`
- `addMultiRegionModelVariations(options: MultiRegionOptions): this`

**Advanced Features:**
- `withCacheControl(points: CacheControlInjectionPoint[]): this`
- `getFallbacks(): FallbackDefinition[]`

#### **GeminiBuilder**
Google Gemini provider with load balancing.

**Model Configuration:**
- `addModel(options: GeminiModelOptions): this`
- `addLoadBalancedModel(options: LoadBalancedModelOptions): this`

## Usage Examples

### Basic Configuration

```typescript
import { LiteLLMConfigBuilder, env } from 'litellm-config-generator';

const builder = new LiteLLMConfigBuilder()
  .withGeneralSettings({
    master_key: env('LITELLM_MASTER_KEY'),
    database_url: env('DATABASE_URL')
  })
  .withRouterSettings({
    routing_strategy: 'usage-based-routing-v2',
    num_retries: 2
  });

// Generate YAML
builder.writeToEnhancedFile('config.yaml');
```

### AWS Bedrock with CRIS

```typescript
const awsBuilder = builder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  detectCRIS: true
});

awsBuilder.addModel({
  displayName: 'nova-pro',
  modelId: 'amazon.nova-pro-v1:0',
  region: 'eu'  // Auto-creates both EU and US variants
});
```

### Gemini with Load Balancing

```typescript
const geminiBuilder = builder.createGeminiBuilder();

geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.0-flash',
  modelId: 'gemini-2.0-flash',
  apiKeys: [
    env('GEMINI_API_KEY_1'),
    env('GEMINI_API_KEY_2')
  ]
});
```

## Development

### Commands

```bash
npm run build      # Compile TypeScript
npm run start      # Run main example
npm test          # Run tests
npm run example:main    # Execute main example
npm run example:fluent  # Execute fluent API example
```

### Architecture Guidelines

See [CONVENTIONS.md](./CONVENTIONS.md) for detailed architectural guidelines including:
- Naming conventions
- Builder pattern implementation
- Type safety practices
- Code organization principles

## File References

| Documentation | Purpose |
|---------------|---------|
| `README.md` | Main user documentation |
| `CLAUDE.md` | Claude Code development instructions |
| `CONVENTIONS.md` | Architectural guidelines |
| `examples/main.ts` | Comprehensive usage example |
| `examples/fluent-test.ts` | Fluent API demonstration |

## License

MIT - See package.json for details.