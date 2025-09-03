import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryColumn, Column, ManyToMany, JoinTable, BeforeInsert } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

import { ModifiableEntity } from '../common/entities/base.entity.js';

import { Role } from './role.entity.js';

@Entity('users')
export class User extends ModifiableEntity {
  @PrimaryColumn('varchar', { length: 36, default: () => 'UUID()' })
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @BeforeInsert()
  generateUuid() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }

  @Column({ unique: true })
  @ApiProperty({ description: '이메일 주소' })
  email: string;

  @Column({ nullable: true })
  @ApiProperty({ description: '표시 이름', nullable: true })
  displayName: string | null;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  @ApiProperty({ description: '사용자 역할 목록', type: () => [Role] })
  roles: Role[];
}
