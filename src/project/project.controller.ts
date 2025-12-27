import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  Request,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { CurrentUser } from 'src/db/current-user.decorator';

@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Request() req, @Body() createProjectDto: CreateProjectDto) {
    const currentUserId = req.user.id;
    const currnetUsername = req.user.name;
    return this.projectService.createProject(
      createProjectDto,
      currentUserId,
      currnetUsername,
    );
  }

  @Get()
  findProjects(@Req() req) {
    return this.projectService.findAllMyProjects(req.user.id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user,
    @Param('id') proejct_id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(user.id, proejct_id, updateProjectDto);
  }

  @Delete(':id')
  remove(@CurrentUser() user, @Param('id') id: string) {
    return this.projectService.remove(user.id, id);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.projectService.findOne(id, user.id);
  }
}
