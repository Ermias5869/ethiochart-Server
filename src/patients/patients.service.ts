import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { NationalIdService } from '../common/services/national-id.service';
import { TeleBirrService } from '../common/services/telebirr.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

@Injectable()
export class PatientsService {
  private readonly logger = new Logger(PatientsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nationalIdService: NationalIdService,
    private readonly teleBirrService: TeleBirrService,
  ) {}

  /**
   * ADMIN-ONLY patient registration flow.
   * Strict order:
   * 1. Validate DTO (handled by ValidationPipe)
   * 2. Verify National ID
   * 3. Process payment if required
   * 4. Generate EthioChart ID
   * 5. Hash password
   * 6. Create patient
   * 7. Link hospitalId + registeredById
   */
  async register(dto: RegisterPatientDto, adminId: number) {
    this.logger.log(`Patient registration initiated by admin ${adminId}`);

    // Step 1: DTO validation handled by ValidationPipe

    // Step 2: Verify National ID
    const idVerification = await this.nationalIdService.verify(dto.nationalId);
    if (!idVerification.verified) {
      throw new BadRequestException(
        `National ID verification failed: ${idVerification.message}`,
      );
    }
    this.logger.log(`National ID ${dto.nationalId} verified successfully`);

    // Check for duplicate national ID
    const existingPatient = await this.prisma.patient.findUnique({
      where: { nationalId: dto.nationalId },
    });
    if (existingPatient) {
      throw new ConflictException(
        `Patient with National ID ${dto.nationalId} already registered`,
      );
    }

    // Step 3: Process payment if required
    let teleBirrPaymentId: string | null = null;
    if (dto.paymentRequired) {
      if (!dto.amount || dto.amount <= 0) {
        throw new BadRequestException(
          'Amount is required and must be positive when payment is required',
        );
      }

      const paymentResult = await this.teleBirrService.initPayment(dto.amount);
      if (!paymentResult.success) {
        throw new BadRequestException(
          `Payment failed: ${paymentResult.message}`,
        );
      }

      teleBirrPaymentId = paymentResult.transactionId;
      this.logger.log(`Payment processed: ${teleBirrPaymentId}`);
    }

    // Step 4: Generate unique EthioChart ID
    const ethioChartId = this.generateEthioChartId();
    this.logger.log(`Generated EthioChart ID: ${ethioChartId}`);

    // Step 5: Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // Step 6 & 7: Create patient with hospital and admin links
    const patient = await this.prisma.patient.create({
      data: {
        nationalId: dto.nationalId,
        ethioChartId,
        email: dto.email,
        phone: dto.phone,
        hashedPassword,
        hospitalId: dto.hospitalId,
        registeredById: adminId,
        teleBirrPaymentId,
        isVerified: true,
      },
      include: {
        hospital: {
          select: { id: true, name: true },
        },
        registeredBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    this.logger.log(
      `Patient ${patient.ethioChartId} registered successfully by admin ${adminId}`,
    );

    return this.sanitizePatient(patient);
  }

  async findAll() {
    const patients = await this.prisma.patient.findMany({
      include: {
        hospital: {
          select: { id: true, name: true },
        },
        registeredBy: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            appointments: true,
            bills: true,
            medicalConditions: true,
          },
        },
      },
    });

    return patients.map((p) => this.sanitizePatient(p));
  }

  async findOne(id: number, requestingUser?: { role: string; id: number; type: string }) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
      include: {
        hospital: true,
        registeredBy: {
          select: { id: true, name: true, email: true },
        },
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            doctor: {
              select: { id: true, name: true },
            },
          },
        },
        bills: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        medicalConditions: true,
        _count: {
          select: {
            appointments: true,
            bills: true,
            messages: true,
            videoSessions: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    // Patients can only view their own data
    if (
      requestingUser &&
      requestingUser.role === 'patient' &&
      requestingUser.type === 'patient' &&
      requestingUser.id !== id
    ) {
      throw new ForbiddenException('You can only view your own data');
    }

    return this.sanitizePatient(patient);
  }

  async update(id: number, dto: UpdatePatientDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.password) {
      const salt = await bcrypt.genSalt(12);
      data.hashedPassword = await bcrypt.hash(dto.password, salt);
      delete data.password;
    }

    const patient = await this.prisma.patient.update({
      where: { id },
      data,
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });

    return this.sanitizePatient(patient);
  }

  async remove(id: number) {
    await this.findOne(id);

    await this.prisma.patient.delete({ where: { id } });

    return { message: `Patient with ID ${id} deleted successfully` };
  }

  /**
   * Generate a unique EthioChart ID
   * Format: EC-{timestamp}-{random}
   */
  private generateEthioChartId(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = randomUUID().slice(0, 6).toUpperCase();
    return `EC-${timestamp}-${random}`;
  }

  /**
   * Remove sensitive fields
   */
  private sanitizePatient(patient: any) {
    const { hashedPassword, ...sanitized } = patient;
    return sanitized;
  }
}
