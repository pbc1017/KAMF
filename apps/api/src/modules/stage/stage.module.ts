import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Stage } from '../../entities/stage.entity.js';

import { StageController } from './stage.controller.js';
import { StageService } from './stage.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Stage])],
  controllers: [StageController],
  providers: [StageService],
  exports: [StageService],
})
export class StageModule {}
