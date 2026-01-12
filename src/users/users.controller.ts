import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Request,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service.js';

import { UpdateUserDto } from './dto/update-user.dto';
import { CurrentUser } from 'src/db/current-user.decorator';
import { SignupDto } from 'src/auth/dto/login.dto';
import { Public } from 'src/auth/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: SignupDto) {
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
  @Public()
  @Get('/check-name')
  checkname(@Query('name') name: string) {
    return this.usersService.isNameTaken(name);
  }

  @Patch('/updateUser')
  update(@CurrentUser() user, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(user.id, dto);
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOneBy(id);
  }
}
