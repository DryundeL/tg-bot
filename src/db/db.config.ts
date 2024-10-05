import { Pool } from "pg";
import { ConfigService } from "../config/config.service";

const configService = new ConfigService();

const pool = new Pool({
  host: configService.get("DB_HOST", "localhost"),
  port: parseInt(configService.get("DB_PORT"), 5432),
  database: configService.get("DB_DATABASE", "test"),
  user: configService.get("DB_USERNAME", "postgres"),
  password: configService.get("DB_PASSWORD", "root"),
});

export default pool;
