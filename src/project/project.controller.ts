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
import { CurrentUser } from '../db/current-user.decorator';

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
  findProjects(@CurrentUser() user) {
    return this.projectService.findAllMyProjects(user.id);
  }
  @Get('/lastProject')
  lastProject(@CurrentUser() user) {
    return this.projectService.lastProject(user.id);
  }
  @Patch(':project_id')
  update(
    @CurrentUser() user,
    @Param('project_id') project_id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(user.id, project_id, updateProjectDto);
  }

  @Delete(':project_id')
  removeProject(@CurrentUser() user, @Param('project_id') project_id: string) {
    return this.projectService.removeProject(user.id, project_id);
  }
  @Delete(':project_id/contributors')
  removeSelf(@CurrentUser() user, @Param('project_id') project_id: string) {
    return this.projectService.removeSelf(user.id, project_id);
  }
  @Get(':project_id')
  findOne(@CurrentUser() user, @Param('project_id') project_id: string) {
    return this.projectService.findOne(user.id, project_id);
  }
}
