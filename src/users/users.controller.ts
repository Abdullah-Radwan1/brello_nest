import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
} from '@nestjs/common';
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

  @Get('/')
  async findAllUsers(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 6,
    @Query('search') search: string = '',
  ) {
    const current_user_id = req.user.id;
    return this.usersService.getAllUsers(page, limit, search, current_user_id);
  }
  @Get('/overview')
  overview(@Request() req) {
    const current_user_id = req.user.id;
    return this.usersService.overview(current_user_id);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneBy(id);
  }
}
