import {ModelBuilder} from '../models/model-builder';
import {AwsBedrockBuilder, AwsProviderOptions} from '../providers/aws';
import {GeminiBuilder} from '../providers/gemini';
import {ConfigValue, configValueToString} from '../types/base';
import {LiteLLMSettings, GeneralSettings, RouterSettings, LiteLLMConfig} from '../types/config';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import {YamlGenerator} from "../generators/yaml-generator";

/**
 * Main configuration builder for LiteLLM
 */
export class LiteLLMConfigBuilder {
  private modelBuilder = new ModelBuilder();
  private litellmSettings?: LiteLLMSettings;
  private generalSettings?: GeneralSettings;
  private routerSettings?: RouterSettings;
  private environmentVariables: Record<string, string> = {};
  private includeFiles: string[] = [];

  /**
   * Access the underlying model builder for direct model creation
   */
  getModelBuilder(): ModelBuilder {
    return this.modelBuilder;
  }

  /**
   * Create an AWS Bedrock provider builder
   */
  createAwsBuilder(options: AwsProviderOptions): AwsBedrockBuilder {
    return new AwsBedrockBuilder(this.modelBuilder, options);
  }

  /**
   * Create a Gemini provider builder
   */
  createGeminiBuilder(): GeminiBuilder {
    return new GeminiBuilder(this.modelBuilder);
  }

  /**
   * Set LiteLLM-specific settings
   */
  withLiteLLMSettings(settings: LiteLLMSettings): this {
    this.litellmSettings = settings;
    return this;
  }

  /**
   * Set general proxy settings
   */
  withGeneralSettings(settings: GeneralSettings): this {
    this.generalSettings = settings;
    return this;
  }

  /**
   * Set router settings
   */
  withRouterSettings(settings: RouterSettings): this {
    this.routerSettings = settings;
    return this;
  }

  /**
   * Set environment variables
   */
  withEnvironmentVariables(vars: Record<string, string>): this {
    this.environmentVariables = {...this.environmentVariables, ...vars};
    return this;
  }

  /**
   * Include external config files
   */
  withIncludeFiles(files: string[]): this {
    this.includeFiles = files;
    return this;
  }

  /**
   * Build the complete configuration
   */
  build(): LiteLLMConfig {
    // Convert ConfigValue objects to strings for output
    const processedGeneralSettings = this.generalSettings ?
      Object.fromEntries(
        Object.entries(this.generalSettings).map(([key, value]) => {
          if (typeof value === 'object' && value !== null && 'type' in value) {
            return [key, configValueToString(value)];
          }
          return [key, value];
        })
      ) : undefined;

    const config: LiteLLMConfig = {};

    if (this.includeFiles.length > 0) {
      config.include = this.includeFiles;
    }

    if (this.litellmSettings) {
      config.litellm_settings = this.litellmSettings;
    }

    if (processedGeneralSettings) {
      config.general_settings = processedGeneralSettings as any;
    }

    if (this.routerSettings) {
      config.router_settings = this.routerSettings;
    }

    if (Object.keys(this.environmentVariables).length > 0) {
      config.environment_variables = this.environmentVariables;
    }

    const models = this.modelBuilder.getModels();
    if (models.length > 0) {
      config.model_list = models;
    }

    return config;
  }

  /**
   * Generate nicely formatted YAML with comments
   */
  generateEnhancedYaml(): string {
    const generator = new YamlGenerator(this.build());
    return generator.generate();
  }

  /**
   * Add AWS provider fallbacks to router settings
   */
  withAwsRegionFallbacks(awsBuilder: AwsBedrockBuilder): this {
    const fallbacks = awsBuilder.getFallbacks();

    if (!this.routerSettings) {
      this.routerSettings = {};
    }

    if (!this.routerSettings.fallbacks) {
      this.routerSettings.fallbacks = [];
    }

    this.routerSettings.fallbacks = [
      ...this.routerSettings.fallbacks,
      ...fallbacks
    ];

    return this;
  }

  /**
   * Write configuration to a file with enhanced readability and comments
   */
  writeToEnhancedFile(filePath: string): void {
    const generator = new YamlGenerator(this.build());
    generator.writeToFile(filePath);
  }

  /**
   * Write configuration to a file, using enhanced format by default
   */
  writeToFile(filePath: string, enhanced = true): void {
    if (enhanced) {
      this.writeToEnhancedFile(filePath);
    } else {
      const yamlContent = yaml.dump(this.build(), {
        noRefs: true,
        lineWidth: -1
      });
      fs.writeFileSync(filePath, yamlContent, 'utf8');
      console.log(`Config written to ${filePath}`);
    }
  }

  /**
   * Validate the configuration
   */
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.build();

    if (!config.model_list || config.model_list.length === 0) {
      errors.push('Config must have at least one model defined');
    }

    // Add additional validation rules as needed

    return {
      valid: errors.length === 0,
      errors
    };
  }
}