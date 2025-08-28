import { generatedAllowedBedrockModelIdentifiers, generatedAllowedEmbeddingModelIdentifiers } from "./generated/bedrock-model-ids";

export const bedrockModelIds = generatedAllowedBedrockModelIdentifiers;

export type BedrockModelId = typeof generatedAllowedBedrockModelIdentifiers[number];

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