// examples/main.ts
import {LiteLLMConfigBuilder, env, BedrockModelId} from '../src';

// Create the main config builder
const builder = new LiteLLMConfigBuilder()
    .withLiteLLMSettings({
        drop_params: true,
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

// Create AWS Bedrock builder with CRIS detection
const awsBuilder = builder.createAwsBuilder({
    accessKeyId: env('AWS_ACCESS_KEY_ID'),
    secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
    defaultRegionMap: {
        'eu': env('AWS_REGION_NAME_EU'),
        'us': env('AWS_REGION_NAME_US')
    },
    detectCRIS: false // disable auto-detection
}).withCacheControl(['system', 'user', 'assistant']);

// Add AWS Bedrock models
// With CRIS detection, models that support both EU and US will be automatically
// created for both regions with load balancing

// Cohere Embedding
awsBuilder.addModel({
    displayName: 'cohere-embed-english-v3',
    modelId: 'cohere.embed-english-v3',
    region: 'eu' // Will auto-create for both regions if CRIS is supported
});

// Nova models automatically use CRIS
awsBuilder.addModel({
    displayName: 'nova-pro-v1',
    modelId: 'amazon.nova-pro-v1:0',
    region: 'eu'
});

awsBuilder.addModel({
    displayName: 'claude-3-7',
    modelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
    region: 'eu'
});

// Claude models with thinking capability using fluent API
awsBuilder.addModel({
    displayName: 'claude-3-7',
    modelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0'
})
.withRegions(['eu'])
.withThinkingVariations([1024, 16384]);

awsBuilder.addModel({
    displayName: 'claude-4-sonnet',
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0',
    region: 'us'
});

// Claude models with thinking capability using fluent API
awsBuilder.addModel({
    displayName: 'claude-4-sonnet',
    modelId: 'us.anthropic.claude-sonnet-4-20250514-v1:0'
})
.withRegions(['us'])
.withThinkingVariations([1024, 16384]);

awsBuilder.addModel({
    displayName: 'claude-4-opus',
    modelId: 'us.anthropic.claude-opus-4-20250514-v1:0',
    region: 'us'
});

// Claude models with thinking capability using fluent API
awsBuilder.addModel({
    displayName: 'claude-4-opus',
    modelId: 'us.anthropic.claude-opus-4-20250514-v1:0'
})
.withRegions(['us'])
.withThinkingVariations([1024, 16384]);
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
    displayName: 'gemini-2.0-flash',
    modelId: 'gemini-2.0-flash',
    rootParams: {rpm: 15}
})
.withApiKeys(gemini_api_keys)
.build();

geminiBuilder.addModel({
    displayName: 'gemini-2.0-flash-lite',
    modelId: 'gemini-2.0-flash-lite',
    rootParams: {rpm: 30}
})
.withApiKeys(gemini_api_keys)
.build();

geminiBuilder.addModel({
    displayName: 'gemini-2.5-flash',
    modelId: 'gemini-2.5-flash-preview-05-20',
    rootParams: {rpm: 10}
})
.withApiKeys(gemini_api_keys)
.build();

geminiBuilder.addModel({
    displayName: 'text-embedding-004',
    modelId: 'text-embedding-004'
})
.withApiKeys(gemini_api_keys)
.build();

// Generate the config
builder.writeToEnhancedFile('output/config.yaml');
console.log("Configuration generated successfully!");