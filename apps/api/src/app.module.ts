import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import databaseConfig from './config/database.config.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { BoothModule } from './modules/booth/booth.module.js';
import { StageModule } from './modules/stage/stage.module.js';
import { UsersModule } from './modules/users/users.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => configService.get('database'),
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    BoothModule,
    StageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
