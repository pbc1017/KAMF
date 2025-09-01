import { Zone } from '@kamf/interface/types/festival.type.js';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Booth } from '../../entities/booth.entity.js';

@Injectable()
export class BoothService {
  constructor(
    @InjectRepository(Booth)
    private readonly boothRepository: Repository<Booth>
  ) {}

  async findAll(): Promise<Booth[]> {
    return this.boothRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async findByZone(zone: Zone): Promise<Booth[]> {
    return this.boothRepository.find({
      where: { zone },
      order: {
        id: 'ASC',
      },
    });
  }
}
