import { UserRole, CreateUserRequest, UpdateUserRequest } from '@kamf/interface/types/user.type.js';
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { NicknameGenerator } from '../../common/utils/nickname-generator.js';
import { Role } from '../../entities/role.entity.js';
import { User } from '../../entities/user.entity.js';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  /**
   * 이메일로 사용자 조회
   * @param email 이메일 주소
   * @returns 사용자 또는 null
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      relations: ['roles'],
    });
  }

  /**
   * ID로 사용자 조회
   * @param id 사용자 ID
   * @returns 사용자 또는 null
   */
  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  /**
   * 새 사용자 생성
   * @param data 사용자 생성 데이터
   * @returns 생성된 사용자
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    // 이메일 중복 확인
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('이미 등록된 이메일입니다');
    }

    // 역할 조회 (기본값: USER)
    const roleNames = data.roles || [UserRole.USER];
    const roles = await this.roleRepository.find({
      where: roleNames.map(name => ({ name })),
    });

    if (roles.length !== roleNames.length) {
      throw new NotFoundException('유효하지 않은 역할이 포함되어 있습니다');
    }

    // 사용자 생성
    const user = this.userRepository.create({
      email: data.email,
      displayName: data.displayName || NicknameGenerator.generate(),
      roles,
    });

    return await this.userRepository.save(user);
  }

  /**
   * 사용자 이름 변경
   * @param userId 사용자 ID
   * @param displayName 새 이름
   * @returns 수정된 사용자
   */
  async updateDisplayName(userId: string, displayName: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    user.displayName = displayName;
    return await this.userRepository.save(user);
  }

  /**
   * 사용자 역할 관리 (ADMIN 전용)
   * @param userId 사용자 ID
   * @param roleNames 새 역할 목록
   * @returns 수정된 사용자
   */
  async updateUserRoles(userId: string, roleNames: UserRole[]): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 새 역할 조회
    const roles = await this.roleRepository.find({
      where: roleNames.map(name => ({ name })),
    });

    if (roles.length !== roleNames.length) {
      throw new NotFoundException('유효하지 않은 역할이 포함되어 있습니다');
    }

    user.roles = roles;
    return await this.userRepository.save(user);
  }

  /**
   * 전체 사용자 목록 조회 (ADMIN 전용)
   * @returns 사용자 목록
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 사용자 정보 업데이트 (통합)
   * @param userId 사용자 ID
   * @param data 업데이트 데이터
   * @returns 수정된 사용자
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 이름 변경
    if (data.displayName !== undefined) {
      user.displayName = data.displayName;
    }

    // 역할 변경 (관리자만 가능)
    if (data.roles !== undefined) {
      const roles = await this.roleRepository.find({
        where: data.roles.map(name => ({ name })),
      });

      if (roles.length !== data.roles.length) {
        throw new NotFoundException('유효하지 않은 역할이 포함되어 있습니다');
      }

      user.roles = roles;
    }

    return await this.userRepository.save(user);
  }

  /**
   * 특정 역할을 가진 사용자 조회
   * @param role 역할
   * @returns 해당 역할을 가진 사용자 목록
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'role')
      .where('role.name = :role', { role })
      .orderBy('user.createdAt', 'DESC')
      .getMany();
  }

  /**
   * 사용자 통계 정보
   * @returns 사용자 통계
   */
  async getUserStats() {
    const totalUsers = await this.userRepository.count();

    const roleStats = await this.userRepository
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .select('role.name', 'roleName')
      .addSelect('COUNT(DISTINCT user.id)', 'userCount')
      .groupBy('role.name')
      .getRawMany();

    return {
      totalUsers,
      roleStats: roleStats.reduce((acc, stat) => {
        acc[stat.roleName] = parseInt(stat.userCount);
        return acc;
      }, {}),
    };
  }
}
