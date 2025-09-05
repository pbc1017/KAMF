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
      const aHasF = this.isBoothWithF(a.boothNumber);
      const bHasF = this.isBoothWithF(b.boothNumber);

      // F 접두사 처리: F가 있는 것은 뒤로
      if (aHasF && !bHasF) return 1; // a가 F, b가 아니면 a를 뒤로
      if (!aHasF && bHasF) return -1; // b가 F, a가 아니면 b를 뒤로

      // 둘 다 F 접두사인 경우
      if (aHasF && bHasF) {
        const aFNum = this.parseBoothNumberWithF(a.boothNumber);
        const bFNum = this.parseBoothNumberWithF(b.boothNumber);
        if (aFNum !== null && bFNum !== null) {
          return aFNum - bFNum;
        }
        return a.boothNumber.localeCompare(b.boothNumber);
      }

      // 일반적인 정렬 (둘 다 F 접두사가 아닌 경우)
      if (aNum !== null && bNum !== null) {
        return aNum - bNum;
      }
      if (aNum !== null && bNum === null) {
        return -1;
      }
      if (aNum === null && bNum !== null) {
        return 1;
      }
      return a.boothNumber.localeCompare(b.boothNumber);
    });
  }

  private parseBoothNumber(boothNumber: string): number | null {
    // 순수 숫자만 파싱 (F 접두사 제외)
    if (/^\d+$/.test(boothNumber)) {
      const num = parseInt(boothNumber, 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  private parseBoothNumberWithF(boothNumber: string): number | null {
    // F+숫자 패턴에서 숫자만 추출
    const match = /^F(\d+)$/.exec(boothNumber);
    if (match) {
      const num = parseInt(match[1], 10);
      return isNaN(num) ? null : num;
    }
    return null;
  }

  private isBoothWithF(boothNumber: string): boolean {
    return boothNumber.startsWith('F');
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
