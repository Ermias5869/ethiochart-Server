import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RevokeAccessDto } from './dto/revoke-access.dto';

@Injectable()
export class PatientAccessService {
  private readonly logger = new Logger(PatientAccessService.name);

  constructor(private readonly prisma: PrismaService) {}

  async grantAccess(dto: GrantAccessDto) {
    this.logger.log(
      `Granting doctor ${dto.doctorId} access to patient ${dto.patientId}`,
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

    // Check if active access already exists
    const existingAccess = await this.prisma.patientAccess.findFirst({
      where: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        revokedAt: null,
      },
    });
    if (existingAccess) {
      throw new ConflictException(
        'Doctor already has active access to this patient',
      );
    }

    return this.prisma.patientAccess.create({
      data: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
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

  async revokeAccess(dto: RevokeAccessDto) {
    this.logger.log(
      `Revoking doctor ${dto.doctorId} access to patient ${dto.patientId}`,
    );

    // Find active access record
    const access = await this.prisma.patientAccess.findFirst({
      where: {
        patientId: dto.patientId,
        doctorId: dto.doctorId,
        revokedAt: null,
      },
    });

    if (!access) {
      throw new NotFoundException(
        'No active access record found for this doctor-patient combination',
      );
    }

    return this.prisma.patientAccess.update({
      where: { id: access.id },
      data: {
        revokedAt: new Date(),
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
