// examples/anthropic-test.ts
import {LiteLLMConfigBuilder, env} from '../src';

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

// Create Anthropic builder
const anthropicBuilder = builder.createAnthropicBuilder();

// Add a simple Claude model with rate limit
anthropicBuilder.addModel({
  displayName: 'claude-4',
  modelId: 'claude-opus-4-20250514',
  apiKey: env('ANTHROPIC_API_KEY')
})
.withRateLimit(15)
.build();

// Add a load-balanced Claude model with multiple API keys and rate limit
anthropicBuilder.addModel({
  displayName: 'claude-4-sonnet',
  modelId: 'claude-sonnet-4-20250514'
})
.withApiKeys([
  env('ANTHROPIC_API_KEY_1'),
  env('ANTHROPIC_API_KEY_2'),
  env('ANTHROPIC_API_KEY_3')
])
.withRateLimit(30)
.build();

// Add Claude model with thinking variations and rate limit
anthropicBuilder.addModel({
  displayName: 'claude-4-haiku',
  modelId: 'claude-haiku-4-20250514'
})
.withApiKeys([
  env('ANTHROPIC_API_KEY_1'),
  env('ANTHROPIC_API_KEY_2')
])
.withRateLimit(60)
.withThinkingVariations([1024, 8192]);

// Generate the config
builder.writeToEnhancedFile('output/anthropic-test.yaml');
console.log("Anthropic configuration generated successfully!");
console.log("Check output/anthropic-test.yaml for the generated configuration");