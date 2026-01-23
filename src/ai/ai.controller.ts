import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { GenerateDescriptionDto } from './dto/generate_description_dto';
import { CustomThrottlerGuard } from '../lib/custom-throttler.guard';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}
  @UseGuards(CustomThrottlerGuard)
  @Post('generate-description')
  create(@Body() GenerateDescriptionDto: GenerateDescriptionDto) {
    return this.aiService.generateDescription(GenerateDescriptionDto);
  }
}
