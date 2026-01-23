import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ContributorsService } from './contributors.service';
import { CreateContributorDto } from './dto/create-contributor.dto';
import { UpdateContributorDto } from './dto/update-contributor.dto';
import { RemoveContributorsDto } from './dto/delete-contributor.dto';
import { CurrentUser } from '../db/current-user.decoratororator';

@Controller('contributors')
export class ContributorsController {
  constructor(private readonly contributorsService: ContributorsService) {}

  @Post()
  create(@Body() createContributorDto: CreateContributorDto) {
    return this.contributorsService.create(createContributorDto);
  }

  @Get()
  findAll(@Query('project_id') project_id: string) {
    return this.contributorsService.getContributors(project_id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contributorsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateContributorDto: UpdateContributorDto,
  ) {
    return this.contributorsService.update(id, updateContributorDto);
  }

  @Delete()
  removeMany(
    @CurrentUser() user: { id: string },
    @Body() dto: RemoveContributorsDto,
  ) {
    return this.contributorsService.removeMany(user.id, dto);
  }
}
