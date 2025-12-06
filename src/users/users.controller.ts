import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
// import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('/contributors')
  findAll(@Body('project_id') project_id: string) {
    return this.usersService.getContributors(project_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneBy(id);
  }
}
