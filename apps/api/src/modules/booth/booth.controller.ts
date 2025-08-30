import { GetBoothsResponse, GetBoothsByZoneResponse } from '@kamf/interface/types/api.js';
import { Zone } from '@kamf/interface/types/festival.js';
import { Controller, Get, Param, BadRequestException } from '@nestjs/common';

import { BoothService } from './booth.service.js';

@Controller('booths')
export class BoothController {
  constructor(private readonly boothService: BoothService) {}

  @Get()
  async findAll(): Promise<GetBoothsResponse> {
    const booths = await this.boothService.findAll();
    return { data: booths };
  }

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
