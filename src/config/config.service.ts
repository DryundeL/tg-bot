import { config, DotenvParseOutput } from "dotenv";
import { IConfigService } from "./config.interface";

export class ConfigService implements IConfigService {
  private config: DotenvParseOutput;

  constructor() {
    const { error, parsed } = config();

    if (error) {
      throw new Error(".env file not found");
    }

    if (!parsed) {
      throw new Error(".env file is empty");
    }

    this.config = parsed;
  }

  get(key: string, defaultValue?: string): string {
    const res = this.config[key];

    if (!res) {
      if (defaultValue !== undefined) {
        return defaultValue;
      }
      throw new Error(`Key "${key}" not found in .env configuration`);
    }

    return res;
  }
}
