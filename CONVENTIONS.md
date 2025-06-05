# Architectural Conventions

This document outlines the architectural conventions used in the LiteLLM Config Generator library.

## Naming Conventions

### Classes & Builders
- `*Builder` suffix for all builder classes (`LiteLLMConfigBuilder`, `AwsBedrockBuilder`, `ModelBuilder`)
- `*Generator` suffix for output processors (`YamlGenerator`)
- PascalCase for all class names

### Methods
- `with*()` - Configuration setters that return `this` for chaining
- `add*()` - Entity builders (models, variations, etc.) that return `this`
- `create*()` - Factory methods that return new builder instances
- `get*()` - Data accessors that don't mutate state

### Types & Interfaces
- `*Settings` suffix for configuration interfaces (`LiteLLMSettings`, `GeneralSettings`)
- `*Options` suffix for method parameter objects (`AwsProviderOptions`)
- `*Params` suffix for parameter collections (`ModelParams`, `CacheParams`)
- `*Definition` suffix for data structures (`ModelDefinition`)

## Architectural Patterns

### Fluent Builder Pattern
- All builders return `this` to enable method chaining
- Hierarchical builders: Main → Provider → Model
- Immutable configuration building with final `build()` step

### Provider Abstraction
- Each provider (AWS, Gemini) has specialized builder with domain-specific methods
- Common interface through shared `ModelBuilder` dependency injection
- Provider-specific authentication and parameter handling

### Separation of Concerns
- **Types**: Pure type definitions in `/types`
- **Builders**: Business logic and fluent APIs in `/models`, `/providers`, `/config`
- **Generators**: Output formatting and serialization in `/generators`
- **Examples**: Usage demonstrations in `/examples`

### Configuration Value System
- Abstraction over environment variables vs direct values (`ConfigValue` type)
- Utility functions for easy creation (`env()`, `toConfigValue()`)
- Automatic transformation to target format (`configValueToString()`)

## Code Organization

### Directory Structure
```
src/
├── types/           # Pure type definitions, no logic
├── models/          # Core abstractions (ModelBuilder)
├── providers/       # Provider-specific implementations
├── config/          # Main orchestration (LiteLLMConfigBuilder)
├── generators/      # Output formatting
└── index.ts         # Public API surface
```

### Export Strategy
- Barrel export pattern in `index.ts` with selective re-exports
- Export both concrete classes AND their supporting types
- Group related exports with type annotations

### Method Organization
- Public API methods first
- Specialized/advanced methods second
- Internal/utility methods last
- Consistent parameter destructuring with defaults

### Type Safety
- Extensive use of TypeScript const assertions for enum-like behavior
- Union types for controlled vocabularies (`AwsRegion`, routing strategies)
- Generic methods with type constraints for flexibility

### Cross-Cutting Concerns
- CRIS (Cross-Region Inference) system with auto-detection logic
- Validation patterns (validate method returns structured results)
- Fallback configuration systems

## Implementation Guidelines

### Builder Classes
```typescript
export class ExampleBuilder {
  // Constructor takes dependencies
  constructor(private dependency: Dependency) {}
  
  // Configuration methods return this
  withSetting(value: ConfigValue): this {
    // Set configuration
    return this;
  }
  
  // Entity creation methods return this
  addEntity(options: EntityOptions): this {
    // Add to internal collection
    return this;
  }
  
  // Factory methods return new instances
  createSubBuilder(): SubBuilder {
    return new SubBuilder(this.dependency);
  }
}
```

### Type Definitions
```typescript
// Settings interfaces for configuration
export interface ExampleSettings {
  setting1?: ConfigValue;
  setting2?: boolean;
}

// Options interfaces for method parameters
export interface ExampleOptions {
  required: string;
  optional?: ConfigValue;
}

// Definition interfaces for data structures
export interface ExampleDefinition {
  name: string;
  params: Record<string, any>;
}
```

### Configuration Values
```typescript
// Use ConfigValue for all external configuration
interface Options {
  apiKey: ConfigValue;  // Can be string or env reference
  region: ConfigValue;
}

// Provide utility functions
const options = {
  apiKey: env('API_KEY'),  // Environment reference
  region: 'us-east-1'      // Direct string
};
```

These conventions ensure consistency, maintainability, and scalability across the codebase while providing a clean, type-safe API for users.