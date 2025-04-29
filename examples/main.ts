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
    num_retries: 2,
    request_timeout: 10
  });

// Create AWS Bedrock builder with CRIS detection
const awsBuilder = builder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  defaultRegionMap: {
    'eu': env('AWS_REGION_NAME_EU'),
    'us': env('AWS_REGION_NAME_US')
  },
  detectCRIS: true // Enable auto-detection
});

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
  displayName: 'nova-lite-v1',
  modelId: 'amazon.nova-lite-v1:0',
  region: 'eu'
});

// Claude models automatically use CRIS
awsBuilder.addModel({
  displayName: 'claude-3-haiku',
  modelId: 'anthropic.claude-3-haiku-20240307-v1:0',
  region: 'eu'
});

awsBuilder.addModel({
  displayName: 'claude-3-5-v1',
  modelId: 'anthropic.claude-3-5-sonnet-20240620-v1:0',
  region: 'eu'
});

awsBuilder.addModel({
  displayName: 'claude-3-7',
  modelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  region: 'eu'
});

// Claude models with thinking capability
awsBuilder.addMultiRegionModelVariations({
  baseModelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  displayName: 'claude-3-7',
  regions: ['eu', 'us'],
  variations: [
    {
      suffix: 'think-1024',
      litellmParams: {thinking: {type: "enabled", budget_tokens: 1024}}
    },
    {
      suffix: 'think-16384',
      litellmParams: {thinking: {type: "enabled", budget_tokens: 16384}}
    }
  ]
});

// US-only model (doesn't support CRIS)
awsBuilder.addModel({
  displayName: 'claude-3-5-v2',
  modelId: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
  region: 'us'
});

awsBuilder.addModel({
  displayName: 'nova-canvas',
  modelId: 'amazon.nova-canvas-v1:0',
  region: 'us'
});

// Create the Gemini builder
const geminiBuilder = builder.createGeminiBuilder();

// Add Gemini models
geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.0-flash',
  modelId: 'gemini-2.0-flash',
  apiKeys: [env('GEMINI_API_KEY'), env('GEMINI_API_KEY_FALLBACK')],
  rootParams: {rpm: 15}
});

geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.0-flash-lite',
  modelId: 'gemini-2.0-flash-lite',
  apiKeys: [env('GEMINI_API_KEY'), env('GEMINI_API_KEY_FALLBACK')],
  rootParams: {rpm: 30}
});

geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.5-pro',
  modelId: 'gemini-2.5-pro-exp-03-25',
  apiKeys: [env('GEMINI_API_KEY'), env('GEMINI_API_KEY_FALLBACK')],
  rootParams: {rpm: 5}
});

geminiBuilder.addLoadBalancedModel({
  displayName: 'gemini-2.5-flash',
  modelId: 'gemini-2.5-flash-preview-04-17',
  apiKeys: [env('GEMINI_API_KEY'), env('GEMINI_API_KEY_FALLBACK')],
  rootParams: {rpm: 10}
});

geminiBuilder.addLoadBalancedModel({
  displayName: 'text-embedding-004',
  modelId: 'text-embedding-004',
  apiKeys: [env('GEMINI_API_KEY'), env('GEMINI_API_KEY_FALLBACK')]
});

// Generate the config
builder.writeToEnhancedFile('output/config.yaml');
console.log("Configuration generated successfully!");