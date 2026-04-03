import {
  Controller,
  Get,
  Post,
  Patch,
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

  @Get()
  async findAll() {
    return this.videoSessionsService.findAll();
  }

  @Get('patient/:patientId')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.videoSessionsService.findByPatient(patientId);
  }

  @Get('doctor/:doctorId')
  async findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.videoSessionsService.findByDoctor(doctorId);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: string,
  ) {
    return this.videoSessionsService.updateStatus(id, status);
  }
}
