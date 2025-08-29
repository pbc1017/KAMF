import type {
  PaginationParams,
  PaginatedResponse,
  ApiResponse as ApiResponseType,
} from '@kamf/interface/types/common.js';
import type { CreateUserDto, UpdateUserDto } from '@kamf/interface/types/user.js';
import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiQuery } from '@nestjs/swagger';

import { User } from '../../entities/user.entity.js';

import { UsersService } from './users.service.js';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Get paginated users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query() query: PaginationParams
  ): Promise<ApiResponseType<PaginatedResponse<User>>> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Get user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id') id: string): Promise<ApiResponseType<User>> {
    return this.usersService.findOne(+id);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponseType<User>> {
    return this.usersService.create(createUserDto);
  }

  @Put(':id')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<ApiResponseType<User>> {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string): Promise<ApiResponseType<void>> {
    return this.usersService.remove(+id);
  }
}
