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
- Creates provider-specific builders via `createAwsBuilder()`, `createGeminiBuilder()`
- Generates final config via `build()` or enhanced YAML via `generateEnhancedYaml()`

**Model Builder (`src/models/model-builder.ts`)**
- Core abstraction for model definitions
- Supports load balancing, variations, and flexible parameter configuration
- Used by all provider builders internally

**Provider Builders (`src/providers/`)**
- **AwsBedrockBuilder**: Handles AWS authentication, CRIS (Cross-Region Inference), regional fallbacks, cache control, and advanced load balancing
- **GeminiBuilder**: Manages API key load balancing across multiple keys

**CRIS System (`src/types/models.ts`)**
- Auto-detects models that support cross-region inference
- Maps base model IDs to region-specific variants (eu./us. prefixes)
- Enables automatic load balancing across AWS regions

**Enhanced YAML Generation (`src/generators/yaml-generator.ts`)**
- Groups models by provider and region with comments
- Processes ConfigValue objects (environment variables) to proper YAML format
- Adds thinking capability annotations and other metadata

### ConfigValue System (`src/types/base.ts`)

Environment variables and configuration values use a typed system:
- `env('VAR_NAME')` creates environment references
- Automatically converts to `os.environ/VAR_NAME` in YAML output
- Supports both direct strings and structured ConfigValue objects

### Advanced Features

**Cache Control Support**
- Configure cache control injection points with `withCacheControl(['system', 'user', 'assistant'])`
- Automatically injects cache control parameters for prompt caching
- Reduces latency and costs for repeated prompts

**Advanced Load Balancing (AWS)**
- `addLoadBalancedModel()`: Single-axis load balancing across multiple AWS credentials
- `addMultiAxisLoadBalancedModel()`: Multi-axis load balancing across regions × credentials
- Supports fault tolerance and rate limit distribution across accounts

### Usage Pattern

See `examples/main.ts` for the typical workflow:
1. Create LiteLLMConfigBuilder with settings
2. Create provider builders (AWS, Gemini)
3. Configure advanced features (cache control, load balancing)
4. Add models with provider-specific methods
5. Generate YAML with enhanced formatting via `writeToEnhancedFile()`