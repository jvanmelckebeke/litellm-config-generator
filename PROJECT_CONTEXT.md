# LiteLLM Config Generator - Project Context

## Project Overview

**Name**: `litellm-config-generator`  
**Version**: `0.1.0`  
**Type**: TypeScript Library  
**Purpose**: CDK-like TypeScript library for generating LiteLLM proxy configurations  
**License**: MIT  
**Author**: Jari Van Melckebeke  

## Environment Setup

### Node.js Environment
- **Node.js Version**: `v24.4.0`
- **npm Version**: `11.4.2`
- **TypeScript Version**: `5.8.3`

### Build Configuration
- **Target**: ES2020
- **Module System**: CommonJS
- **Output Directory**: `./dist`
- **Source Directory**: `./src`
- **Strict Mode**: Enabled
- **Declaration Files**: Generated

## Dependencies

### Runtime Dependencies
```json
{
  "js-yaml": "^4.1.0"
}
```

### Development Dependencies
```json
{
  "@types/js-yaml": "^4.0.9",
  "@types/node": "^20.17.30",
  "ts-node": "^10.9.2",
  "typescript": "^5.8.3"
}
```

## Project Structure

```
litellm-config-generator/
├── 📁 src/                          # Source TypeScript files
│   ├── 📁 config/                   # Main configuration orchestration
│   │   └── litellm-config-builder.ts
│   ├── 📁 providers/                # Provider-specific implementations
│   │   ├── aws.ts                   # AWS Bedrock provider
│   │   ├── gemini.ts                # Google Gemini provider
│   │   └── base.ts                  # Base provider types
│   ├── 📁 models/                   # Core model abstractions
│   │   └── model-builder.ts
│   ├── 📁 builders/                 # Legacy builders (transitioning)
│   │   ├── aws-model-builder.ts
│   │   ├── gemini-model-builder.ts
│   │   └── model-builder.ts
│   ├── 📁 generators/               # Output formatting
│   │   └── yaml-generator.ts
│   ├── 📁 types/                    # Type definitions
│   │   ├── base.ts                  # ConfigValue system
│   │   ├── config.ts                # Configuration interfaces
│   │   └── models.ts                # Model definitions & CRIS
│   └── index.ts                     # Public API exports
├── 📁 examples/                     # Usage examples
│   ├── main.ts                      # Comprehensive example
│   └── fluent-test.ts               # Fluent API demonstration
├── 📁 dist/                         # Compiled JavaScript output
├── 📁 output/                       # Generated configuration files
│   ├── config.yaml                  # Main configuration
│   └── fluent-test.yaml             # Test configuration
├── 📁 scripts/                      # Build/utility scripts
│   └── bedrock-update-model-ids.ts
├── 📁 node_modules/                 # npm dependencies
├── package.json                     # npm configuration
├── tsconfig.json                    # TypeScript configuration
├── README.md                        # Main documentation
├── CLAUDE.md                        # Claude Code instructions
├── CONVENTIONS.md                   # Architecture guidelines
└── PROJECT_INDEX.md                 # Project documentation index
```

## Configuration System

### Environment Variables
The project uses a sophisticated environment variable system:

**Required Environment Variables:**
- `LITELLM_MASTER_KEY` - Master key for LiteLLM proxy
- `DATABASE_URL` - Database connection URL
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials
- `AWS_REGION_NAME_EU` - EU region name
- `AWS_REGION_NAME_US` - US region name
- `REDIS_HOST` - Redis server host
- `REDIS_PASSWORD` - Redis password
- `REDIS_PORT` - Redis port
- `GEMINI_API_KEY_1` - Primary Gemini API key
- `GEMINI_API_KEY_2` - Secondary Gemini API key
- `GEMINI_API_KEY_FALLBACK` - Fallback Gemini API key

**ConfigValue System:**
- `env('VAR_NAME')` → `os.environ/VAR_NAME` in YAML
- Direct strings remain as-is
- Type-safe environment variable handling

### Build Scripts
```json
{
  "build": "tsc",
  "start": "ts-node src/index.ts",
  "test": "jest",
  "example:main": "ts-node examples/main.ts",
  "example:fluent": "ts-node examples/fluent-test.ts"
}
```

## Architecture Analysis

### Core Components

#### 1. **Configuration Builder** (`src/config/litellm-config-builder.ts`)
- **Role**: Main orchestrator
- **Dependencies**: ModelBuilder, provider builders, YamlGenerator
- **Key Features**: Settings management, provider factories, YAML generation

#### 2. **Provider System** (`src/providers/`)
- **AWS Provider** (`aws.ts`): Bedrock integration, CRIS support, regional fallbacks
- **Gemini Provider** (`gemini.ts`): API key load balancing, rate limiting
- **Base Provider** (`base.ts`): Common provider interfaces

#### 3. **Model System** (`src/models/`)
- **ModelBuilder**: Core model abstraction
- **Features**: Parameter validation, model collection management

#### 4. **Type System** (`src/types/`)
- **Base Types** (`base.ts`): ConfigValue system, environment references
- **Config Types** (`config.ts`): LiteLLM configuration interfaces
- **Model Types** (`models.ts`): CRIS system, Bedrock model definitions

#### 5. **YAML Generator** (`src/generators/yaml-generator.ts`)
- **Purpose**: Enhanced YAML output with comments
- **Features**: Provider grouping, regional organization, ConfigValue processing

### Advanced Features

#### CRIS (Cross-Region Inference) System
- **Auto-Detection**: Identifies models supporting cross-region inference
- **Regional Variants**: Automatically creates EU/US variants
- **Load Balancing**: Configures regional fallback chains
- **Supported Models**: Nova, Claude models with regional prefixes

#### Load Balancing
- **AWS Multi-Axis**: Regions × Credentials load balancing
- **Gemini API Keys**: Multiple API key rotation
- **Fallback Chains**: Regional and credential fallbacks

#### Cache Control
- **Injection Points**: System, user, assistant message locations
- **Token Budgets**: Configurable thinking token limits
- **Performance**: Reduces latency for repeated prompts

## Generated Configuration Analysis

### Current Configuration (`output/config.yaml`)
- **Models**: 15 total models configured
- **AWS Models**: 8 models (Claude variants with thinking)
- **Gemini Models**: 7 models (different flash variants + embedding)
- **Features**: Cache control, thinking tokens, load balancing
- **Environment Integration**: All credentials via environment variables

### Model Distribution
- **Claude 3-7 Sonnet**: EU region, thinking variants (1024, 16384 tokens)
- **Claude 4 Sonnet**: US region, thinking variants (1024, 16384 tokens)
- **Claude 4 Opus**: US region, thinking variants (1024, 16384 tokens)
- **Gemini 2.0 Flash**: 3 API keys, 15 RPM
- **Gemini 2.0 Flash Lite**: 3 API keys, 30 RPM
- **Gemini 2.5 Flash**: 3 API keys, 10 RPM
- **Text Embedding 004**: 3 API keys

## Development Workflow

### Build Process
1. **TypeScript Compilation**: `npm run build` (✅ Successful)
2. **Example Execution**: `npm run example:main` (✅ Successful)
3. **Output Generation**: Automatically creates `output/config.yaml`

### Testing Strategy
- **Examples**: Comprehensive usage examples in `/examples`
- **Manual Testing**: Via npm scripts
- **Configuration Validation**: Built-in validation methods

## Integration Points

### Environment Integration
- **12-Factor App**: Environment-based configuration
- **Secrets Management**: No hardcoded credentials
- **Configuration Flexibility**: Type-safe environment handling

### LiteLLM Integration
- **Proxy Configuration**: Complete LiteLLM proxy setup
- **Model Routing**: Usage-based routing strategy
- **Rate Limiting**: Per-model RPM configuration
- **Fallback Strategies**: Regional and credential fallbacks

### Cloud Provider Integration
- **AWS Bedrock**: Full integration with regional support
- **Google Gemini**: Multi-key load balancing
- **Extensible**: Provider system supports additional providers

## Quality Assurance

### Type Safety
- **Full TypeScript**: 100% TypeScript codebase
- **Strict Mode**: Enabled for maximum type safety
- **Interface Definitions**: Comprehensive type definitions

### Code Quality
- **Architecture**: Clean separation of concerns
- **Documentation**: Comprehensive documentation
- **Conventions**: Established coding conventions
- **Examples**: Working examples demonstrate usage

### Configuration Validation
- **Build Validation**: TypeScript compilation passes
- **Runtime Validation**: Examples execute successfully
- **Output Validation**: Generated YAML is valid

## Performance Characteristics

### Build Performance
- **Compilation**: Fast TypeScript compilation
- **Bundle Size**: Minimal runtime dependencies
- **Startup Time**: Quick initialization

### Runtime Performance
- **Memory Usage**: Efficient builder pattern
- **CPU Usage**: Minimal processing overhead
- **I/O Operations**: Efficient YAML generation

## Future Considerations

### Extensibility
- **New Providers**: Easy to add new LLM providers
- **New Features**: Modular architecture supports extensions
- **Configuration Options**: Flexible configuration system

### Maintenance
- **Dependency Updates**: Regular dependency updates needed
- **Type Definitions**: Keep types synchronized with LiteLLM
- **Documentation**: Maintain comprehensive documentation

## Context Cache Summary

✅ **Project Structure**: Analyzed and mapped  
✅ **Dependencies**: Loaded and validated  
✅ **Configuration**: Parsed and validated  
✅ **Build System**: Tested and working  
✅ **Examples**: Executed successfully  
✅ **Environment**: Fully characterized  
✅ **Architecture**: Documented and understood  

**Cache Status**: Ready for efficient future access  
**Last Updated**: Generated from current project state  
**Validation**: All systems operational