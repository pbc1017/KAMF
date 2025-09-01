import { GetStagesResponse } from '@kamf/interface/dtos/festival.dto.js';
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';

import { Stage } from '../../entities/stage.entity.js';

import { StageService } from './stage.service.js';

@ApiTags('무대 (Stages)')
@Controller('stages')
export class StageController {
  constructor(private readonly stageService: StageService) {}

  @ApiOperation({
    summary: '전체 무대 목록 조회',
    description: '축제의 모든 무대 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '무대 목록 조회 성공',
    type: [Stage],
  })
  @Get()
  async findAll(): Promise<GetStagesResponse> {
    const stages = await this.stageService.findAll();
    return { data: stages };
  }
}
