import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVideoSessionDto } from './dto/create-video-session.dto';

@Injectable()
export class VideoSessionsService {
  private readonly logger = new Logger(VideoSessionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVideoSessionDto) {
    this.logger.log(
      `Creating video session: patient ${dto.patientId} with doctor ${dto.doctorId}`,
    );

    // Verify patient exists
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
    });
    if (!patient) {
      throw new BadRequestException(`Patient with ID ${dto.patientId} not found`);
    }

    // Verify doctor exists
    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new BadRequestException(`Doctor with ID ${dto.doctorId} not found`);
    }

    // Generate unique session token
    const sessionToken = `VS-${randomUUID()}`;

    return this.prisma.videoSession.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        scheduledAt: new Date(dto.scheduledAt),
        sessionToken,
        status: dto.status || 'scheduled',
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

  async findByPatient(patientId: number) {
    return this.prisma.videoSession.findMany({
      where: { patientId },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, fullName: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: number) {
    return this.prisma.videoSession.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, fullName: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.videoSession.findMany({
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, fullName: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async updateStatus(id: number, status: string) {
    const data: any = { status };
    if (status === 'active') data.startedAt = new Date();
    if (status === 'ended') data.endedAt = new Date();

    return this.prisma.videoSession.update({
      where: { id },
      data,
      include: {
        patient: {
          select: { id: true, ethioChartId: true, email: true, fullName: true },
        },
        doctor: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
