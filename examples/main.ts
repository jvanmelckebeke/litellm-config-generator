// examples/main.ts
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

// openrouter builder with defaults - no more repeated apiKey!
const openrouterBuilder = builder.createOpenRouterBuilder({
    apiKey: env('OPENROUTER_API_KEY')  // Set once as default
});

openrouterBuilder.addModel({
    displayName: 'grok-4',
    modelId: 'x-ai/grok-4'
})
    .build();

openrouterBuilder.addModel({
    displayName: 'grok-4.1-fast',
    modelId: 'x-ai/grok-4.1-fast'
})
    .build();

openrouterBuilder.addModel({
    displayName: 'grok-4-fast',
    modelId: 'x-ai/grok-4-fast'
})
    .build();

openrouterBuilder.addModel({
    displayName: 'nova-2-live',
    modelId: 'amazon/nova-2-lite-v1',
}).build();

// gemini models via openrouter

openrouterBuilder.addModel({
    displayName: 'gemini-3-pro',
    modelId: 'google/gemini-3-pro-preview'
}).build();

openrouterBuilder.addModel({
    displayName: 'gemini-2.5-flash',
    modelId: 'google/gemini-2.5-flash-preview-09-2025'
}).build();

openrouterBuilder.addModel({
    displayName: 'gemini-2.0-flash',
    modelId: 'google/gemini-2.0-flash-001'
}).build();


openrouterBuilder.addModel({
    displayName: 'gemini-2.0-flash-lite',
    modelId: 'google/gemini-2.0-flash-lite-001'
}).build();


// OpenAI-compatible proxy for Anthropic models
const anthropicProxy = builder.createOpenAICompatibleBuilder(
    {},
    { apiBase: 'http://cli-proxy-api:8317/v1', apiKey: env('CLI_PROXY_API_KEY') }
);

anthropicProxy.addModel({ displayName: 'claude-4.5-haiku', modelId: 'claude-haiku-4-5-20251001' }).build();
anthropicProxy.addModel({ displayName: 'claude-4.6-opus', modelId: 'claude-opus-4-6' }).build();
anthropicProxy.addModel({ displayName: 'claude-4.5-sonnet', modelId: 'claude-sonnet-4-5-20250929' }).build();
anthropicProxy.addModel({ displayName: 'claude-4.5-opus', modelId: 'claude-opus-4-5-20251101' }).build();

// Create the Gemini builder
const geminiBuilder = builder.createGeminiBuilder();

const gemini_api_keys = [
    env('GEMINI_API_KEY_1'),
    env('GEMINI_API_KEY_2'),
    // from different account
    env('GEMINI_API_KEY_FALLBACK')
]

// Add Gemini models using fluent API

geminiBuilder.addModel({
    displayName: 'text-embedding-004',
    modelId: 'text-embedding-004'
})
    .withApiKeys(gemini_api_keys)
    .build();



// Generate the config
builder.writeToEnhancedFile('output/config.yaml');
console.log("Configuration generated successfully!");