import {ModelDefinition} from './model';
import {LiteLLMSettings, GeneralSettings, RouterSettings} from './settings';

/**
 * Main LiteLLM configuration interface
 */

export interface LiteLLMConfig {
  litellm_settings?: LiteLLMSettings;
  general_settings?: GeneralSettings;
  model_list?: ModelDefinition[];
  router_settings?: RouterSettings;
  environment_variables?: Record<string, string>;
  include?: string[];
}