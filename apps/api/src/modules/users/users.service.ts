import type {
  PaginationParams,
  PaginatedResponse,
  ApiResponse,
} from '@kamf/interface/types/common.js';
import type { CreateUserDto, UpdateUserDto } from '@kamf/interface/types/user.js';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findAll(params: PaginationParams): Promise<ApiResponse<PaginatedResponse<User>>> {
    const { page = 1, limit = 10 } = params;

    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { id: 'ASC' },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      success: true,
      data: {
        data: users,
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: number): Promise<ApiResponse<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return {
      success: true,
      data: user,
    };
  }

  async create(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const user = this.userRepository.create({
      email: createUserDto.email,
      username: createUserDto.username,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      role: createUserDto.role,
    });

    const savedUser = await this.userRepository.save(user);

    return {
      success: true,
      data: savedUser,
      message: 'User created successfully',
    };
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<ApiResponse<User>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    Object.assign(user, updateUserDto);
    const updatedUser = await this.userRepository.save(user);

    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }

  async remove(id: number): Promise<ApiResponse<void>> {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.userRepository.remove(user);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
