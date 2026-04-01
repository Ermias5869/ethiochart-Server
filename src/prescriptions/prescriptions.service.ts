import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreatePrescriptionDto) {
    this.logger.log(`Creating prescription for appointment ${dto.appointmentId}`);

    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: dto.appointmentId },
    });
    if (!appointment) {
      throw new BadRequestException(
        `Appointment with ID ${dto.appointmentId} not found`,
      );
    }

    return this.prisma.prescription.create({
      data: {
        appointmentId: dto.appointmentId,
        medication: dto.medication,
        dosage: dto.dosage,
        duration: dto.duration,
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
    // Verify appointment exists
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) {
      throw new NotFoundException(
        `Appointment with ID ${appointmentId} not found`,
      );
    }

    return this.prisma.prescription.findMany({
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
    });
  }
}
