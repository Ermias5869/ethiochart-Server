import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Post('register')
  @Roles('hospital_admin')
  async register(
    @Body() dto: RegisterPatientDto,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.register(dto, user.id);
  }

  @Get()
  @Roles('hospital_admin', 'doctor')
  async findAll() {
    return this.patientsService.findAll();
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles('hospital_admin')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('hospital_admin')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.patientsService.remove(id);
  }
}
