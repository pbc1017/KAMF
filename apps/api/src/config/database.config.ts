import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    username: process.env.DB_USERNAME || 'kamf_user',
    password: process.env.DB_PASSWORD || 'kamf_password',
    database: process.env.DB_NAME || 'kamf_dev',
    // 🔧 타임존 설정 추가: DB와 서버 모두 UTC로 통일
    timezone: 'Z', // UTC 타임존 강제 설정
    extra: {
      connectionLimit: 10,
      // MySQL 서버와의 연결에서도 UTC 사용하도록 설정
      charset: 'utf8mb4_unicode_ci',
    },
    autoLoadEntities: true,
    synchronize: false,
    logging: process.env.NODE_ENV === 'development',
    entities: [join(__dirname, '/../entities/**/*.entity{.ts,.js}')],
    migrations: [join(__dirname, '/../migrations/**/*{.ts,.js}')],
    subscribers: [join(__dirname, '/../subscribers/**/*{.ts,.js}')],
  })
);
