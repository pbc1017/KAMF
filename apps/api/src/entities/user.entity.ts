import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';

import { ModifiableEntity } from '../common/entities/base.entity.js';

import { Role } from './role.entity.js';

@Entity('users')
export class User extends ModifiableEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '사용자 ID' })
  id: string;

  @Column({ unique: true })
  @ApiProperty({ description: '전화번호' })
  phoneNumber: string;

  @Column()
  @ApiProperty({ description: '표시 이름' })
  displayName: string;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'userId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'roleId', referencedColumnName: 'id' },
  })
  @ApiProperty({ description: '사용자 역할 목록', type: () => [Role] })
  roles: Role[];
}
