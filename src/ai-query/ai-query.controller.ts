import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AiQueryService } from './ai-query.service';
import { CreateAiQueryDto } from './dto/create-ai-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai-query')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiQueryController {
  constructor(private readonly aiQueryService: AiQueryService) {}

  @Post()
  @Roles('doctor')
  async create(@Body() dto: CreateAiQueryDto) {
    return this.aiQueryService.create(dto);
  }

  @Get(':patientId')
  @Roles('doctor')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.aiQueryService.findByPatient(patientId);
  }
}
