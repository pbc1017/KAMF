import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Booth } from '../../entities/booth.entity.js';

import { BoothController } from './booth.controller.js';
import { BoothService } from './booth.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Booth])],
  controllers: [BoothController],
  providers: [BoothService],
  exports: [BoothService],
})
export class BoothModule {}
