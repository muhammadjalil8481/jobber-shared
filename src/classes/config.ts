import { ConfigType, validateEnvVariables } from '../utils/validateEnv';

export class Config<T extends readonly string[]> {
  private readonly config: Record<T[number], string>;

  constructor(configKeys: T) {
    this.config = configKeys.reduce(
      (acc: Record<T[number], string>, key: T[number]) => {
        acc[key] = process.env[key] || '';
        return acc;
      },
      {} as Record<T[number], string>
    );

    validateEnvVariables(this.config as unknown as ConfigType);

    Object.freeze(this);
  }
}
