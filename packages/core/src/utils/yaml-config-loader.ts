import { readFileSync, existsSync } from "fs";
import * as yaml from "js-yaml";

export function yamlConfigLoader(configPath: string): Record<string, any> {
  if (!existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  return yaml.load(readFileSync(configPath, "utf8")) as Record<string, any>;
}
