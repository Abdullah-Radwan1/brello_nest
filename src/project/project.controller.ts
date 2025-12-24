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
    return this.projectService.findProjects(req.user.id);
  }
  @Get('/myProjects')
  findMyProjects(@Req() req) {
    return this.projectService.findMyProjects(req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectService.update(+id, updateProjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectService.remove(id);
  }
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user) {
    return this.projectService.findOne(id, user.id);
  }
}
