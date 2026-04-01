import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBillingDto } from './dto/create-billing.dto';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBillingDto) {
    this.logger.log(`Creating bill for patient ${dto.patientId}`);

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new BadRequestException(`Patient with ID ${dto.patientId} not found`);
    }

    return this.prisma.billing.create({
      data: {
        patientId: dto.patientId,
        amount: dto.amount,
        status: 'pending',
        description: dto.description || null,
      },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.billing.findMany({
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByPatient(patientId: number) {
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });
    if (!patient) {
      throw new NotFoundException(`Patient with ID ${patientId} not found`);
    }

    return this.prisma.billing.findMany({
      where: { patientId },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsPaid(id: number) {
    const bill = await this.prisma.billing.findUnique({
      where: { id },
    });

    if (!bill) {
      throw new NotFoundException(`Billing record with ID ${id} not found`);
    }

    if (bill.status === 'paid') {
      throw new BadRequestException('This bill has already been paid');
    }

    return this.prisma.billing.update({
      where: { id },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true },
        },
      },
    });
  }
}
