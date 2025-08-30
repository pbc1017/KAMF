import { UserRole } from '@kamf/interface/types/user.js';
import { ApiProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

import { BaseEntity } from '../common/entities/base.entity.js';

import { User } from './user.entity.js';

@Entity('roles')
export class Role extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({ description: '역할 ID' })
  id: string;

  @Column({ unique: true, type: 'enum', enum: UserRole })
  @ApiProperty({ description: '역할 이름', enum: UserRole })
  name: UserRole;

  @Column()
  @ApiProperty({ description: '역할 설명' })
  description: string;

  @ManyToMany(() => User, user => user.roles)
  @ApiProperty({ description: '이 역할을 가진 사용자 목록', type: () => [User] })
  users: User[];
}
