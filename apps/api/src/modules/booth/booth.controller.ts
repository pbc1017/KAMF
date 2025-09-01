import { GetBoothsResponse, GetBoothsByZoneResponse } from '@kamf/interface/dtos/festival.dto.js';
import { Zone } from '@kamf/interface/types/festival.type.js';
import { Controller, Get, Param, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';

import { Booth } from '../../entities/booth.entity.js';

import { BoothService } from './booth.service.js';

@ApiTags('부스 (Booths)')
@Controller('booths')
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @ApiOperation({
    summary: '전체 부스 목록 조회',
    description: '축제의 모든 부스 정보를 조회합니다.',
  })
  @ApiOkResponse({
    description: '부스 목록 조회 성공',
    type: [Booth],
  })
  @Get()
  async findAll(): Promise<GetBoothsResponse> {
    const booths = await this.boothService.findAll();
    return { data: booths };
  }

  @ApiOperation({
    summary: '구역별 부스 목록 조회',
    description: '특정 구역의 부스들을 조회합니다.',
  })
  @ApiParam({
    name: 'zone',
    description: '부스 구역',
    enum: Zone,
  })
  @ApiOkResponse({
    description: '구역별 부스 목록 조회 성공',
    type: [Booth],
  })
  @Get('zone/:zone')
  async findByZone(@Param('zone') zone: string): Promise<GetBoothsByZoneResponse> {
    // Validate zone parameter
    if (!Object.values(Zone).includes(zone as Zone)) {
      throw new BadRequestException(
        `Invalid zone: ${zone}. Valid zones are: ${Object.values(Zone).join(', ')}`
      );
    }

    const booths = await this.boothService.findByZone(zone as Zone);
    return { data: booths };
  }
}
