import { User as UserInterface } from '@kamf/interface/types/user.js';

import { User as UserEntity } from '../../entities/user.entity.js';

/**
 * UserEntity를 UserInterface로 변환
 * @param userEntity TypeORM User 엔티티
 * @returns 인터페이스 형태의 User 객체
 */
export function mapUserEntityToInterface(userEntity: UserEntity): UserInterface {
  return {
    id: userEntity.id,
    phoneNumber: userEntity.phoneNumber,
    displayName: userEntity.displayName,
    roles: userEntity.roles.map(role => role.name),
    createdAt: userEntity.createdAt,
    updatedAt: userEntity.updatedAt,
  };
}

/**
 * 여러 UserEntity를 UserInterface 배열로 변환
 * @param userEntities TypeORM User 엔티티 배열
 * @returns 인터페이스 형태의 User 객체 배열
 */
export function mapUserEntitiesToInterfaces(userEntities: UserEntity[]): UserInterface[] {
  return userEntities.map(mapUserEntityToInterface);
}
