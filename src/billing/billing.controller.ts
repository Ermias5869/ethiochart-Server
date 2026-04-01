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
import { BillingService } from './billing.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('billing')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  @Roles('hospital_admin')
  async create(@Body() dto: CreateBillingDto) {
    return this.billingService.create(dto);
  }

  @Get(':patientId')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    if (patientId === 0) {
      return this.billingService.findAll();
    }
    return this.billingService.findByPatient(patientId);
  }

  @Patch(':id/pay')
  @Roles('hospital_admin')
  async markAsPaid(@Param('id', ParseIntPipe) id: number) {
    return this.billingService.markAsPaid(id);
  }
}
