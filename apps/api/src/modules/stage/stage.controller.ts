import { GetStagesResponse } from '@kamf/interface/types/api.js';
import { Controller, Get } from '@nestjs/common';

import { StageService } from './stage.service.js';

@Controller('stages')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @Get()
  async findAll(): Promise<GetStagesResponse> {
    const stages = await this.stageService.findAll();
    return { data: stages };
  }
}
