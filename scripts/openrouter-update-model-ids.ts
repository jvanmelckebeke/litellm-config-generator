#!/usr/bin/env node
/**
 * This script fetches model identifiers from OpenRouter API
 * and generates a TypeScript file containing the allowed model identifiers.
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration constants
const OPENROUTER_API_URL = 'https://openrouter.ai/api/frontend/models';
const OUTPUT_FILE_PATH = path.resolve(__dirname, '../src/types/generated/openrouter-model-ids.ts');

/**
 * Interface for OpenRouter API response
 */
interface OpenRouterResponse {
  data: OpenRouterModel[];
}

/**
 * Interface for OpenRouter model
 */
interface OpenRouterModel {
  slug: string;
  name?: string;
  description?: string;
  context_length?: number;
  pricing?: any;
  [key: string]: any;
}

/**
 * Validates a given identifier.
 * Returns true if the id is non-empty and contains no whitespace.
 */
function validateId(id: string): boolean {
  return id.trim().length > 0 && !/\s/.test(id);
}

/**
 * Fetches model identifiers from OpenRouter API.
 */
async function fetchOpenRouterModels(): Promise<string[]> {
  console.log('Fetching models from OpenRouter API...');
  
  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'litellm-config-generator/0.1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    const models = data.data || [];

    console.log(`Fetched ${models.length} models from OpenRouter API`);

    // Extract and filter valid model slugs
    return models
      .map(model => model.slug)
      .filter((slug): slug is string => typeof slug === 'string' && validateId(slug))
      .sort();

  } catch (error) {
    console.error('Error fetching models from OpenRouter API:', error);
    return [];
  }
}

/**
 * Generates the TypeScript file with model identifiers.
 */
async function generateModelIdentifiersFile(modelIdentifiers: string[]): Promise<void> {
  // Remove duplicates and sort the identifiers
  const uniqueIds = Array.from(new Set(modelIdentifiers)).sort();

  if (uniqueIds.length === 0) {
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
// Source: OpenRouter API (${OPENROUTER_API_URL})

export const generatedAllowedOpenRouterModelIdentifiers = [
${uniqueIds.map(id => `  '${id}',`).join('\n')}
] as const;
`;

  try {
    fs.writeFileSync(OUTPUT_FILE_PATH, fileContent, 'utf8');
    console.log(`Successfully generated model identifiers at: ${OUTPUT_FILE_PATH}`);
    console.log(`Found ${uniqueIds.length} OpenRouter models`);
  } catch (error) {
    console.error('Error writing model identifiers file:', error);
    process.exit(1);
  }
}

/**
 * Updates OpenRouter model identifiers by fetching from API and generating TypeScript types.
 */
async function updateModelIdentifiers(): Promise<void> {
  try {
    // Fetch model identifiers from OpenRouter API
    const modelIdentifiers = await fetchOpenRouterModels();

    // Generate the TypeScript file
    await generateModelIdentifiersFile(modelIdentifiers);

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