import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { LabResultsService } from './lab-results.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('lab-results')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post()
  @Roles('doctor', 'hospital_admin')
  async create(@Body() dto: CreateLabResultDto) {
    return this.labResultsService.create(dto);
  }

  @Get(':appointmentId')
  async findByAppointment(@Param('appointmentId', ParseIntPipe) appointmentId: number) {
    return this.labResultsService.findByAppointment(appointmentId);
  }
}
