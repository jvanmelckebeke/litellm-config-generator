// examples/fluent-test.ts - Test the new fluent API
import {LiteLLMConfigBuilder, env} from '../src';

// Create the main config builder
const builder = new LiteLLMConfigBuilder()
  .withLiteLLMSettings({ drop_params: true })
  .withGeneralSettings({
    master_key: env('LITELLM_MASTER_KEY'),
    database_url: env('DATABASE_URL')
  });

// Create AWS builder
const awsBuilder = builder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  defaultRegionMap: {
    'eu': env('AWS_REGION_NAME_EU'),
    'us': env('AWS_REGION_NAME_US')
  }
});

// Test simple case (should auto-execute)
console.log('Testing simple model...');
awsBuilder.addModel({
  displayName: 'simple-claude',
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
  region: 'us'
});

// Test fluent API with load balancing
console.log('Testing fluent API with regions...');
awsBuilder.addModel({
  displayName: 'load-balanced-claude',
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0'
})
.withRegions(['us', 'eu'])
.build();

// Test fluent API with thinking variations
console.log('Testing fluent API with thinking variations...');
awsBuilder.addModel({
  displayName: 'claude-with-thinking',
  modelId: 'anthropic.claude-3-sonnet-20240229-v1:0'
})
.withRegions(['us'])
.withThinkingVariations([1024, 16384]);

// Test Gemini fluent API
const geminiBuilder = builder.createGeminiBuilder();

console.log('Testing Gemini fluent API...');
geminiBuilder.addModel({
  displayName: 'gemini-load-balanced',
  modelId: 'gemini-pro'
})
.withApiKeys([env('GEMINI_API_KEY_1'), env('GEMINI_API_KEY_2')])
.build();

// Generate config
builder.writeToEnhancedFile('output/fluent-test.yaml');
console.log('Fluent API test completed successfully!');