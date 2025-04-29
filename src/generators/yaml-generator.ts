import {LiteLLMConfig, ModelDefinition} from '../types/config';
import {configValueToString} from '../types/base';
import * as fs from 'fs';

export class YamlGenerator {
  constructor(private config: LiteLLMConfig) {
  }

  /**
   * Process ConfigValue objects to their string representation
   */
  private processValue(value: any): any {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'object' && 'type' in value && (value.type === 'environment' || value.type === 'string')) {
      return configValueToString(value);
    }

    return value;
  }

  /**
   * Format an object as YAML with proper indentation
   */
  private formatObject(obj: any, indent = 0, isRoot = true): string {
    if (obj === null || obj === undefined) {
      return 'null';
    }

    const spaces = ' '.repeat(indent);
    let result = '';

    if (Array.isArray(obj)) {
      for (const item of obj) {
        result += `${spaces}- ${this.formatValue(item, indent + 2)}\n`;
      }
      return result;
    }

    if (typeof obj === 'object') {
      const entries = Object.entries(obj);
      for (const [key, value] of entries) {
        if (value === undefined) continue;

        const formattedValue = this.formatValue(value, indent + 2);
        result += `${spaces}${key}: ${formattedValue}\n`;
      }
      return result;
    }

    return `${obj}`;
  }

  /**
   * Format a value based on its type
   */
  private formatValue(value: any, indent: number): string {
    const processedValue = this.processValue(value);

    if (processedValue === null || processedValue === undefined) {
      return 'null';
    }

    if (Array.isArray(processedValue)) {
      // Simple array formatting
      if (processedValue.length === 0) {
        return '[]';
      }

      const items = processedValue.map(item => this.formatValue(item, indent));
      return `[${items.join(', ')}]`;
    }

    if (typeof processedValue === 'object') {
      return '\n' + this.formatObject(processedValue, indent, false);
    }

    // Format strings, booleans, numbers
    if (typeof processedValue === 'string') {
      return processedValue;
    }

    return String(processedValue);
  }

  /**
   * Format a single model definition
   */
  private formatModel(model: ModelDefinition, indent = 2): string {
    let result = `${' '.repeat(indent)}- model_name: ${model.model_name}\n`;
    result += `${' '.repeat(indent)}  litellm_params:\n`;

    // Format model path
    result += `${' '.repeat(indent)}    model: ${this.processValue(model.litellm_params.model)}\n`;

    // Format other params
    for (const [key, value] of Object.entries(model.litellm_params)) {
      if (key === 'model') continue; // Already handled

      const processedValue = this.processValue(value);

      if (typeof processedValue === 'object' && processedValue !== null) {
        result += `${' '.repeat(indent)}    ${key}:\n`;
        for (const [subKey, subValue] of Object.entries(processedValue)) {
          result += `${' '.repeat(indent)}      ${subKey}: ${this.formatValue(subValue, indent + 8)}\n`;
        }
      } else if (processedValue !== undefined) {
        result += `${' '.repeat(indent)}    ${key}: ${processedValue}\n`;
      }
    }

    // Add root-level parameters (excluding the ones we've already handled)
    for (const [key, value] of Object.entries(model)) {
      if (key === 'model_name' || key === 'litellm_params' || key === 'model_info') {
        continue; // Skip already handled fields
      }

      const processedValue = this.processValue(value);

      if (typeof processedValue === 'object' && processedValue !== null) {
        result += `${' '.repeat(indent)}  ${key}:\n`;
        for (const [subKey, subValue] of Object.entries(processedValue)) {
          result += `${' '.repeat(indent)}    ${subKey}: ${this.formatValue(subValue, indent + 6)}\n`;
        }
      } else if (processedValue !== undefined) {
        result += `${' '.repeat(indent)}  ${key}: ${processedValue}\n`;
      }
    }

    // Add model_info if present
    if (model.model_info) {
      result += `${' '.repeat(indent)}  model_info:\n`;
      for (const [key, value] of Object.entries(model.model_info)) {
        const processedValue = this.processValue(value);
        result += `${' '.repeat(indent)}    ${key}: ${processedValue}\n`;
      }
    }

    return result;
  }

  /**
   * Generate a nicely formatted and commented YAML
   */
  generate(): string {
    let output = '';

    // Add settings sections
    if (this.config.litellm_settings) {
      output += 'litellm_settings:\n';
      output += this.formatObject(this.config.litellm_settings, 2);
      output += '\n';
    }

    if (this.config.general_settings) {
      output += 'general_settings:\n';
      for (const [key, value] of Object.entries(this.config.general_settings)) {
        const processedValue = this.processValue(value);
        output += `  ${key}: ${processedValue}\n`;
      }
      output += '\n';
    }

    if (this.config.router_settings) {
      output += 'router_settings:\n';
      output += this.formatObject(this.config.router_settings, 2);
      output += '\n';
    }

    // Add model list with grouping
    if (this.config.model_list && this.config.model_list.length > 0) {
      output += 'model_list:\n';

      // Group models
      const modelsByProvider: Record<string, Record<string, ModelDefinition[]>> = {};

      this.config.model_list.forEach(model => {
        const modelPath = model.litellm_params.model;
        let provider = 'other';
        let region = 'global';

        if (typeof modelPath === 'string') {
          if (modelPath.startsWith('bedrock/')) {
            provider = 'aws';
            const modelId = modelPath.substring('bedrock/'.length);
            if (modelId.startsWith('eu.')) {
              region = 'eu';
            } else if (modelId.startsWith('us.')) {
              region = 'us';
            } else {
              region = 'global';
            }
          } else if (modelPath.startsWith('gemini/')) {
            provider = 'gemini';
          } else if (modelPath.startsWith('openai/')) {
            provider = 'openai';
          } else if (modelPath.startsWith('anthropic/')) {
            provider = 'anthropic';
          }
        }

        if (!modelsByProvider[provider]) {
          modelsByProvider[provider] = {};
        }
        if (!modelsByProvider[provider][region]) {
          modelsByProvider[provider][region] = [];
        }

        modelsByProvider[provider][region].push(model);
      });

      // Format models by provider and region
      Object.entries(modelsByProvider).forEach(([provider, regionModels]) => {
        output += `\n  # ========== ${provider.toUpperCase()} MODELS ==========\n`;

        // First add global (non-region-specific) models if any
        if (regionModels['global'] && regionModels['global'].length > 0) {
          regionModels['global'].forEach((model, index) => {
            if (model.litellm_params.thinking) {
              const budget = (model.litellm_params.thinking as any).budget_tokens;
              output += `  # thinking enabled with ${budget} token budget\n`;
            }
            output += this.formatModel(model);

            // Add a newline after each model except the last one in this region
            output += '\n';
          });
        }

        // Then add region-specific models
        Object.entries(regionModels).forEach(([region, models]) => {
          if (region !== 'global' && models.length > 0) {
            output += `\n  # ----- Region: ${region.toUpperCase()} -----\n`;

            models.forEach((model, index) => {
              if (model.litellm_params.thinking) {
                const budget = (model.litellm_params.thinking as any).budget_tokens;
                output += `  # thinking enabled with ${budget} token budget\n`;
              }
              output += this.formatModel(model);

              // Add a newline after each model
              output += '\n';
            });
          }
        });
      });
    }

    // Add include files if present
    if (this.config.include && this.config.include.length > 0) {
      output += '\ninclude:\n';
      for (const file of this.config.include) {
        output += `  - ${file}\n`;
      }
    }

    return output;
  }

  writeToFile(filePath: string): void {
    const yamlContent = this.generate();
    fs.writeFileSync(filePath, yamlContent, 'utf8');
    console.log(`Enhanced readable config written to ${filePath}`);
  }
}