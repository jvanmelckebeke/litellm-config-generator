#!/usr/bin/env node
/**
 * This script fetches foundation model and inference profile identifiers
 * from AWS Bedrock for specified regions, then generates a TypeScript file
 * containing the allowed model identifiers.
 */

import {
  BedrockClient,
  ListFoundationModelsCommand,
  ListInferenceProfilesCommand,
  ModelModality,
} from '@aws-sdk/client-bedrock';
import * as fs from 'fs';
import * as path from 'path';

// Configuration constants
const REGIONS = ['eu-central-1', 'us-east-1'];
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../src/types/generated/bedrock-model-ids.ts');

/**
 * Validates a given identifier.
 * Returns true if the id is non-empty and contains no whitespace.
 */
function validateId(id: string): boolean {
  return id.trim().length > 0 && !/\s/.test(id);
}

/**
 * Fetches foundation model identifiers for a given region.
 */
async function fetchFoundationModels(region: string, outputModality: ModelModality = 'TEXT'): Promise<string[]> {
  console.log(`Fetching ${outputModality.toLowerCase()} models for region: ${region}`);
  const client = new BedrockClient({ region });
  try {
    const command = new ListFoundationModelsCommand({
      byOutputModality: outputModality,
      byInferenceType: 'ON_DEMAND',
    });
    const response = await client.send(command);
    const summaries = response.modelSummaries ?? [];

    // Extract and filter valid modelIds
    return summaries
      .map(summary => summary.modelId)
      .filter((id): id is string => typeof id === 'string' && validateId(id));
  } catch (error) {
    console.error(`Error fetching ${outputModality.toLowerCase()} models for region ${region}:`, error);
    return [];
  }
}

/**
 * Fetches inference profile identifiers for a given region.
 */
async function fetchInferenceProfiles(region: string): Promise<string[]> {
  console.log(`Fetching inference profiles for region: ${region}`);
  const client = new BedrockClient({ region });
  try {
    const command = new ListInferenceProfilesCommand({});
    const response = await client.send(command);
    const summaries = response.inferenceProfileSummaries ?? [];

    // Extract and filter valid inferenceProfileIds
    return summaries
      .map(summary => summary.inferenceProfileId)
      .filter((id): id is string => typeof id === 'string' && validateId(id));
  } catch (error) {
    console.error(`Error fetching inference profiles for region ${region}:`, error);
    return [];
  }
}

/**
 * Combines identifiers, removes duplicates, and generates the TypeScript file.
 */
async function generateModelIdentifiersFile(
  llmModelIdentifiers: string[],
  embeddingModelIdentifiers: string[],
): Promise<void> {
  // Remove duplicates and sort the identifiers
  const uniqueLlmIds = Array.from(new Set(llmModelIdentifiers)).sort();
  const uniqueEmbeddingIds = Array.from(new Set(embeddingModelIdentifiers)).sort();

  if (uniqueLlmIds.length === 0 && uniqueEmbeddingIds.length === 0) {
    console.error('No valid model identifiers found. Exiting.');
    process.exit(1);
  }

  // Create directory if it doesn't exist
  const dir = path.dirname(OUTPUT_FILE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Prepare the TypeScript file content
  const fileContent = `// Auto-generated file. Do not edit manually.
// Generated on ${new Date().toISOString()}
// Source: AWS Bedrock API from regions: ${REGIONS.join(', ')}

export const generatedAllowedBedrockModelIdentifiers = [
${uniqueLlmIds.map(id => `  '${id}',`).join('\n')}
] as const;

export const generatedAllowedEmbeddingModelIdentifiers = [
${uniqueEmbeddingIds.map(id => `  '${id}',`).join('\n')}
] as const;
`;

  try {
    fs.writeFileSync(OUTPUT_FILE_PATH, fileContent, 'utf8');
    console.log(`Successfully generated model identifiers at: ${OUTPUT_FILE_PATH}`);
    console.log(`Found ${uniqueLlmIds.length} LLM models and ${uniqueEmbeddingIds.length} embedding models`);
  } catch (error) {
    console.error('Error writing model identifiers file:', error);
    process.exit(1);
  }
}

/**
 * Updates Bedrock model identifiers by fetching from AWS and generating TypeScript types.
 */
async function updateModelIdentifiers(): Promise<void> {
  try {
    let llmModelIdentifiers: string[] = [];
    let embeddingModelIdentifiers: string[] = [];

    // Process each region
    for (const region of REGIONS) {
      // Fetch LLM foundation models
      const llmIds = await fetchFoundationModels(region, 'TEXT');
      llmModelIdentifiers = llmModelIdentifiers.concat(llmIds);

      // Fetch inference profiles for LLMs
      const inferenceIds = await fetchInferenceProfiles(region);
      llmModelIdentifiers = llmModelIdentifiers.concat(inferenceIds);

      // Fetch embedding models
      const embeddingIds = await fetchFoundationModels(region, 'EMBEDDING');
      embeddingModelIdentifiers = embeddingModelIdentifiers.concat(embeddingIds);
    }

    // Generate the TypeScript file
    await generateModelIdentifiersFile(llmModelIdentifiers, embeddingModelIdentifiers);

  } catch (error) {
    console.error('Unexpected error during model identifier update:', error);
    process.exit(1);
  }
}

// Run the function when script is executed directly
if (require.main === module) {
  updateModelIdentifiers();
}

// Export for programmatic usage
export { updateModelIdentifiers };
