import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLabResultDto } from './dto/create-lab-result.dto';

@Injectable()
export class LabResultsService {
  private readonly logger = new Logger(LabResultsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateLabResultDto) {
    this.logger.log(`Creating lab result for appointment ${dto.appointmentId}`);

    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });
    if (!appointment) {
      throw new BadRequestException(
        `Appointment with ID ${dto.appointmentId} not found`,
      );
    }

    return this.prisma.labResult.create({
      data: {
        appointmentId: dto.appointmentId,
        type: dto.type,
        result: dto.result,
      },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            patient: {
              select: { id: true, ethioChartId: true },
            },
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });
  }

  async findByAppointment(appointmentId: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    return this.prisma.labResult.findMany({
      where: { appointmentId },
      include: {
        appointment: {
          select: {
            id: true,
            scheduledAt: true,
            status: true,
            patient: {
              select: { id: true, ethioChartId: true },
            },
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
