import { FestivalDay } from '@kamf/interface/types/festival.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Stage } from '../../entities/stage.entity.js';

@Injectable()
export class StageService {
  constructor(
    @InjectRepository(Stage)
    private readonly stageRepository: Repository<Stage>
  ) {}

  async findAll(): Promise<{ sat: Stage[]; sun: Stage[] }> {
    const satStages = await this.stageRepository.find({
      where: { day: FestivalDay.FRIDAY },
      order: {
        startTime: 'ASC',
      },
    });

    const sunStages = await this.stageRepository.find({
      where: { day: FestivalDay.SATURDAY },
      order: {
        startTime: 'ASC',
      },
    });

    return {
      sat: satStages,
      sun: sunStages,
    };
  }
}
