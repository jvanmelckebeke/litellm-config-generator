// examples/openai-compatible-test.ts
// Demonstrates configuring OpenAI-compatible endpoints (vLLM, Ollama, custom APIs)
import {LiteLLMConfigBuilder, env} from '../src';

const builder = new LiteLLMConfigBuilder()
    .withGeneralSettings({
        master_key: env('LITELLM_MASTER_KEY')
    });

// === vLLM endpoint ===
const vllm = builder.createOpenAICompatibleBuilder(
    {},  // use default 'openai' prefix
    {
        apiBase: env('VLLM_API_BASE'),  // e.g. http://vllm-server:8000/v1
        apiKey: env('VLLM_API_KEY')
    }
);

vllm.addModel({
    displayName: 'llama-3-70b',
    modelId: 'meta-llama/Llama-3-70B-Instruct'
}).build();

vllm.addModel({
    displayName: 'mistral-7b',
    modelId: 'mistralai/Mistral-7B-Instruct-v0.3'
}).build();

// === Ollama endpoint ===
const ollama = builder.createOpenAICompatibleBuilder(
    {modelPrefix: 'ollama'},  // use 'ollama' prefix for LiteLLM routing
    {
        apiBase: 'http://localhost:11434'
    }
);

ollama.addModel({
    displayName: 'codellama',
    modelId: 'codellama'
}).build();

// === Custom API with load-balanced API keys ===
const customApi = builder.createOpenAICompatibleBuilder(
    {},
    {apiBase: env('CUSTOM_API_BASE')}
);

customApi.addModel({
    displayName: 'custom-model',
    modelId: 'my-custom-model'
})
    .withApiKeys([
        env('CUSTOM_API_KEY_1'),
        env('CUSTOM_API_KEY_2')
    ])
    .build();

// === Per-model api_base override ===
const mixed = builder.createOpenAICompatibleBuilder();

mixed.addModel({
    displayName: 'endpoint-a-model',
    modelId: 'model-v1',
    apiBase: env('ENDPOINT_A_BASE'),
    apiKey: env('ENDPOINT_A_KEY')
}).build();

mixed.addModel({
    displayName: 'endpoint-b-model',
    modelId: 'model-v2',
    apiBase: env('ENDPOINT_B_BASE'),
    apiKey: env('ENDPOINT_B_KEY')
}).build();

// Generate the config
builder.writeToEnhancedFile('output/openai-compatible-config.yaml');
console.log('OpenAI-compatible configuration generated successfully!');
