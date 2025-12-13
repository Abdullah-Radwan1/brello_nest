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
    @Body('ids') ids: string[],
    manager_id: string,
    project_id: string,
  ) {
    return this.contributorsService.removeMany(ids, manager_id, project_id);
  }
}
