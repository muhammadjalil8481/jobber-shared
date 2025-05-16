export type ConfigType = Record<string, string | undefined>;

export function validateEnvVariables(config: ConfigType) {
  const missingVars: string[] = [];

  for (const key in config) {
    const value = config[key];
    if (!value) {
      missingVars.push(key);
    }
  }

  if (missingVars.length > 0) {
    console.error(`Missing environment variables: ${missingVars.join(', ')}`);
    process.exit(1);
  }
}
