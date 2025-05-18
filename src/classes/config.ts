import { ConfigType, validateEnvVariables } from "../utils/validateEnv";


export function createConfig<T extends readonly string[]>(configKeys: T) {
  const config = configKeys.reduce((acc: Record<T[number], string>, key: T[number]) => {
    acc[key] = process.env[key] || "";
    return acc;
  }, {} as Record<T[number], string>);

  validateEnvVariables(config as unknown as ConfigType);

  return Object.freeze(config);
}