// examples/openrouter-test.ts
import { LiteLLMConfigBuilder, env } from '../src';

// Create the main config builder
const builder = new LiteLLMConfigBuilder()
    .withLiteLLMSettings({
        drop_params: true,
        success_callback: ["langfuse"]
    })
    .withGeneralSettings({
        master_key: env('LITELLM_MASTER_KEY'),
        database_url: env('DATABASE_URL'),
        store_model_in_db: true,
        store_prompts_in_spend_logs: false
    })
    .withRouterSettings({
        num_retries: 1,
        request_timeout: 100,
        routing_strategy: 'usage-based-routing-v2',
        redis_host: env('REDIS_HOST'),
        redis_password: env('REDIS_PASSWORD'),
        redis_port: env('REDIS_PORT'),
        enable_pre_call_checks: true
    });

// Create OpenRouter builder
const openRouterBuilder = builder.createOpenRouterBuilder();

// Add OpenRouter models using fluent API
openRouterBuilder.addModel({
    displayName: 'claude-3-5-sonnet',
    modelId: 'anthropic/claude-3.5-sonnet',
    apiKey: env('OPENROUTER_API_KEY')
}).build();

openRouterBuilder.addModel({
    displayName: 'gpt-4-turbo',
    modelId: 'openai/gpt-4-turbo',
    apiKey: env('OPENROUTER_API_KEY'),
    rootParams: { rpm: 30 }
}).build();

// Add model with load balancing across multiple API keys
const openrouter_api_keys = [
    env('OPENROUTER_API_KEY_1'),
    env('OPENROUTER_API_KEY_2'),
    env('OPENROUTER_API_KEY_FALLBACK')
];

openRouterBuilder.addModel({
    displayName: 'llama-3.1-405b',
    modelId: 'meta-llama/llama-3.1-405b-instruct',
    rootParams: { rpm: 10 }
})
.withApiKeys(openrouter_api_keys)
.build();

// Add with rate limit variations
openRouterBuilder.addModel({
    displayName: 'gemini-pro',
    modelId: 'google/gemini-pro-1.5',
    apiKey: env('OPENROUTER_API_KEY')
})
.withRateLimitVariations([15, 30, 60])
.build();

// Generate the config
builder.writeToEnhancedFile('output/openrouter-test.yaml');
console.log("OpenRouter configuration generated successfully!");