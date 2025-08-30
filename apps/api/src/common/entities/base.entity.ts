import { ApiProperty } from '@nestjs/swagger';
import { CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntity {
  @CreateDateColumn()
  @ApiProperty({ description: '생성 일시' })
  createdAt: Date;
}

export abstract class ModifiableEntity extends BaseEntity {
  @UpdateDateColumn()
  @ApiProperty({ description: '최종 수정 일시' })
  updatedAt: Date;
}
