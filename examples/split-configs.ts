import { LiteLLMConfigBuilder, env } from '../src';

// AWS models config file
const awsConfigBuilder = new LiteLLMConfigBuilder();
const awsBuilder = awsConfigBuilder.createAwsBuilder({
  accessKeyId: env('AWS_ACCESS_KEY_ID'),
  secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
  defaultRegionMap: {
    'eu': env('AWS_REGION_NAME_EU'),
    'us': env('AWS_REGION_NAME_US')
  }
});

// Add cross-region AWS models
awsBuilder.addCrossRegionModel({
  baseModelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  displayName: 'claude-3-7',
  regions: ['eu', 'us']
});

awsBuilder.addMultiRegionModelVariations({
  baseModelId: 'anthropic.claude-3-7-sonnet-20250219-v1:0',
  displayName: 'claude-3-7',
  regions: ['eu', 'us'],
  variations: [
    {
      suffix: 'think-1024',
      params: { thinking: { type: "enabled", budget_tokens: 1024 } }
    },
    {
      suffix: 'think-16384',
      params: { thinking: { type: "enabled", budget_tokens: 16384 } }
    }
  ]
});

// Write AWS models to a separate file
awsConfigBuilder.writeToFile('aws_models.yaml');

// Gemini models config file
const geminiConfigBuilder = new LiteLLMConfigBuilder();
const geminiBuilder = geminiConfigBuilder.createGeminiBuilder();

// Add Gemini models with API key load balancing
geminiBuilder.addLoadBalancedModel(
  'gemini-2.5-pro',
  'gemini-2.5-pro-exp-03-25',
  [env('GEMINI_API_KEY_1'), env('GEMINI_API_KEY_2')],
  { temperature: 0.7 }
);

// Write Gemini models to a separate file
geminiConfigBuilder.writeToFile('gemini_models.yaml');

// Main config file that includes the others
const mainConfigBuilder = new LiteLLMConfigBuilder()
  .withLiteLLMSettings({
    drop_params: true,
    callbacks: ["prometheus"]
  })
  .withGeneralSettings({
    master_key: env('LITELLM_MASTER_KEY'),
    database_url: env('DATABASE_URL'),
    store_model_in_db: true
  })
  .withIncludeFiles([
    'aws_models.yaml',
    'gemini_models.yaml'
  ])
  .withRouterSettings({
    timeout: 120,
    num_retries: 2
  });

// Write the main config
mainConfigBuilder.writeToFile('main_config.yaml');
console.log("All configurations generated successfully!");