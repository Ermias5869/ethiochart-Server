import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { VideoSessionsService } from './video-sessions.service';
import { CreateVideoSessionDto } from './dto/create-video-session.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('video-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VideoSessionsController {
  constructor(private readonly videoSessionsService: VideoSessionsService) {}

  @Post()
  @Roles('doctor', 'hospital_admin')
  async create(@Body() dto: CreateVideoSessionDto) {
    return this.videoSessionsService.create(dto);
  }

  @Get(':patientId')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.videoSessionsService.findByPatient(patientId);
  }
}
