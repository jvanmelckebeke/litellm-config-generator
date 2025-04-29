/**
 * Core types for representing configuration values
 */

export interface EnvironmentRef {
  type: 'environment';
  name: string;
}

export interface StringValue {
  type: 'string';
  value: string;
}

export type ConfigValue = EnvironmentRef | StringValue | string;

/**
 * Convert a string or ConfigValue to a standardized ConfigValue
 * This allows for convenient input like 'env:MY_VAR' to be converted to a proper EnvironmentRef
 */
export function toConfigValue(value: string | ConfigValue): ConfigValue {
  if (typeof value === 'string') {
    if (value.startsWith('env:')) {
      return {type: 'environment', name: value.substring(4)};
    }
    return value;
  }
  return value;
}

/**
 * Convert a ConfigValue to its string representation in YAML
 */
export function configValueToString(value: ConfigValue): string {
  if (typeof value === 'string') {
    return value;
  }

  if (value.type === 'environment') {
    return `os.environ/${value.name}`;
  }

  return value.value;
}

/**
 * Helper to create an environment variable reference
 */
export function env(name: string): EnvironmentRef {
  return {type: 'environment', name};
}