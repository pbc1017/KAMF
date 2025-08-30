import { DataSource } from 'typeorm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  username: process.env.DB_USERNAME || 'kamf_user',
  password: process.env.DB_PASSWORD || 'kamf_password',
  database: process.env.DB_NAME || 'kamf_dev',
  entities: [join(__dirname, '/../entities/**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '/../migrations/**/*{.ts,.js}')],
  subscribers: [join(__dirname, '/../subscribers/**/*{.ts,.js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;
