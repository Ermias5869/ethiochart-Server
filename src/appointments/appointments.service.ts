import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAppointmentDto) {
    this.logger.log(
      `Creating appointment: patient ${dto.patientId} with doctor ${dto.doctorId}`,
    );

    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new BadRequestException(`Doctor with ID ${dto.doctorId} not found`);
    }

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new BadRequestException(`Patient with ID ${dto.patientId} not found`);
    }

    return this.prisma.appointment.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
        status: 'scheduled',
        notes: dto.notes || null,
      },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findAll(user?: { role: string; id: number; type: string }) {
    const where: any = {};

    // Filter based on role
    if (user) {
      if (user.role === 'doctor' && user.type === 'user') {
        // Doctors see only their appointments — find their doctor profile
        const doctorUser = await this.prisma.user.findUnique({
          where: { id: user.id },
          select: { doctorProfileId: true },
        });
        if (doctorUser?.doctorProfileId) {
          where.doctorId = doctorUser.doctorProfileId;
        }
      } else if (user.role === 'patient') {
        where.patientId = user.id;
      }
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
        prescriptions: true,
        labResults: true,
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, phone: true },
        },
        doctor: {
          select: { id: true, name: true, email: true, phone: true },
        },
        prescriptions: true,
        labResults: true,
      },
    });

    if (!appointment) {
      throw new NotFoundException(`Appointment with ID ${id} not found`);
    }

    return appointment;
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    const existing = await this.findOne(id);

    // Validate status transitions
    if (dto.status) {
      const validTransitions: Record<string, string[]> = {
        scheduled: ['completed', 'cancelled'],
        completed: [],
        cancelled: [],
      };

      const allowed = validTransitions[existing.status] || [];
      if (!allowed.includes(dto.status)) {
        throw new BadRequestException(
          `Cannot transition from '${existing.status}' to '${dto.status}'`,
        );
      }
    }

    return this.prisma.appointment.update({
      where: { id },
      data: {
        ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
        ...(dto.status && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
