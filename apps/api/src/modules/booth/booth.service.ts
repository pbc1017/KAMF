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

  private sortBooths(booths: Booth[]): Booth[] {
    return booths.sort((a, b) => {
      const aNum = this.parseBoothNumber(a.boothNumber);
      const bNum = this.parseBoothNumber(b.boothNumber);

      // 둘 다 숫자인 경우
      if (aNum !== null && bNum !== null) {
        return aNum - bNum;
      }

      // 하나만 숫자인 경우 (숫자가 먼저 오도록)
      if (aNum !== null && bNum === null) {
        return -1;
      }
      if (aNum === null && bNum !== null) {
        return 1;
      }

      // 둘 다 문자열인 경우
      return a.boothNumber.localeCompare(b.boothNumber);
    });
  }

  private parseBoothNumber(boothNumber: string): number | null {
    // 숫자로만 구성되어 있는지 확인
    if (/^\d+$/.test(boothNumber)) {
      const num = parseInt(boothNumber, 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  async findAll(): Promise<Booth[]> {
    const booths = await this.boothRepository.find();
    return this.sortBooths(booths);
  }

  async findByZone(zone: Zone): Promise<Booth[]> {
    const booths = await this.boothRepository.find({
      where: { zone },
    });
    return this.sortBooths(booths);
  }
}
