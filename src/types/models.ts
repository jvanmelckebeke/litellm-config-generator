export const bedrockModelIds = [
    'amazon.nova-lite-v1:0',
    'amazon.nova-micro-v1:0',
    'amazon.nova-pro-v1:0',
    'amazon.rerank-v1:0',
    'amazon.titan-text-express-v1',
    'amazon.titan-text-lite-v1',
    'amazon.titan-text-premier-v1:0',
    'amazon.titan-tg1-large',
    'anthropic.claude-3-5-sonnet-20240620-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0',
    'anthropic.claude-instant-v1',
    'anthropic.claude-v2',
    'anthropic.claude-v2:1',
    'cohere.command-light-text-v14',
    'cohere.command-r-plus-v1:0',
    'cohere.command-r-v1:0',
    'cohere.command-text-v14',
    'cohere.rerank-v3-5:0',
    'eu.amazon.nova-lite-v1:0',
    'eu.amazon.nova-micro-v1:0',
    'eu.amazon.nova-pro-v1:0',
    'eu.anthropic.claude-3-5-sonnet-20240620-v1:0',
    'eu.anthropic.claude-3-7-sonnet-20250219-v1:0',
    'eu.anthropic.claude-3-haiku-20240307-v1:0',
    'eu.anthropic.claude-3-sonnet-20240229-v1:0',
    'eu.meta.llama3-2-1b-instruct-v1:0',
    'eu.meta.llama3-2-3b-instruct-v1:0',
    'eu.mistral.pixtral-large-2502-v1:0',
    'meta.llama3-70b-instruct-v1:0',
    'meta.llama3-8b-instruct-v1:0',
    'mistral.mistral-7b-instruct-v0:2',
    'mistral.mistral-large-2402-v1:0',
    'mistral.mistral-small-2402-v1:0',
    'mistral.mixtral-8x7b-instruct-v0:1',
    'us.amazon.nova-lite-v1:0',
    'us.amazon.nova-micro-v1:0',
    'us.amazon.nova-pro-v1:0',
    'us.anthropic.claude-3-5-haiku-20241022-v1:0',
    'us.anthropic.claude-3-5-sonnet-20240620-v1:0',
    'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
    'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    'us.anthropic.claude-3-haiku-20240307-v1:0',
    'us.anthropic.claude-3-opus-20240229-v1:0',
    'us.anthropic.claude-3-sonnet-20240229-v1:0',
    'us.anthropic.claude-sonnet-4-20250514-v1:0',
    'us.anthropic.claude-opus-4-20250514-v1:0',
    'us.deepseek.r1-v1:0',
    'us.meta.llama3-2-90b-instruct-v1:0',
    'us.meta.llama3-3-70b-instruct-v1:0',
    'us.mistral.pixtral-large-2502-v1:0',
] as const;

export type BedrockModelId = typeof bedrockModelIds[number];

/**
 * Utility type that extracts the base model ID without the region prefix
 */
export type BaseModelId =
    | { id: string, prefixed: false } // Regular model IDs without region prefix
    | { id: string, prefixed: true }; // Models with region prefix

/**
 * Determine if a model ID has a region prefix
 */
export function parseModelId(modelId: BedrockModelId): BaseModelId {
    if (modelId.startsWith('eu.') || modelId.startsWith('us.')) {
        return {id: modelId.substring(3), prefixed: true};
    }
    return {id: modelId, prefixed: false};
}

/**
 * CRIS Model Map - Maps base model IDs to their regionally available variants
 */
export const crisModelMap: Record<string, { eu?: BedrockModelId, us?: BedrockModelId }> = {};

// Initialize the CRIS model map
bedrockModelIds.forEach(modelId => {
    const parsed = parseModelId(modelId);
    if (parsed.prefixed) {
        const region = modelId.startsWith('eu.') ? 'eu' : 'us';
        if (!crisModelMap[parsed.id]) {
            crisModelMap[parsed.id] = {};
        }
        crisModelMap[parsed.id][region] = modelId;
    }
});

/**
 * Check if a model supports CRIS (Cross-Region Inference Support)
 */
export function supportsCRIS(modelId: string): boolean {
    const parsed = parseModelId(modelId as BedrockModelId);
    const baseId = parsed.prefixed ? parsed.id : modelId;

    return (
        !!crisModelMap[baseId] &&
        !!crisModelMap[baseId].eu &&
        !!crisModelMap[baseId].us
    );
}

/**
 * Get the region-specific model ID for a given base model ID
 */
export function getRegionalModelId(baseId: string, region: 'eu' | 'us'): BedrockModelId | null {
    // If the model ID already has the correct prefix, return it
    if (baseId.startsWith(`${region}.`)) {
        return baseId as BedrockModelId;
    }

    // If it's an unprefixed ID
    const parsed = parseModelId(baseId as BedrockModelId);
    const lookupId = parsed.prefixed ? parsed.id : baseId;

    // If CRIS is supported, return the regional variant
    if (supportsCRIS(lookupId)) {
        return crisModelMap[lookupId][region] || null;
    }

    // If it's already prefixed with a different region, attempt to change the prefix
    if (parsed.prefixed) {
        const newId = `${region}.${parsed.id}`;
        if (bedrockModelIds.includes(newId as any)) {
            return newId as BedrockModelId;
        }
    }

    // If no region-specific variant is found, return null
    return null;
}