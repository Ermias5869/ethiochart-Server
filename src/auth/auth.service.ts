import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Admin login — validates against User model with role=hospital_admin
   */
  async adminLogin(dto: LoginDto) {
    this.logger.log(`Admin login attempt: ${dto.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { hospital: true },
    });

    if (!user || user.role !== 'hospital_admin') {
      throw new UnauthorizedException('Invalid credentials or insufficient privileges');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital.name,
      },
    };
  }

  /**
   * Doctor login — validates against User model with role=doctor
   */
  async doctorLogin(dto: LoginDto) {
    this.logger.log(`Doctor login attempt: ${dto.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        hospital: true,
        doctorProfile: true,
      },
    });

    if (!user || user.role !== 'doctor') {
      throw new UnauthorizedException('Invalid credentials or insufficient privileges');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.hashedPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      hospitalId: user.hospitalId,
      type: 'user',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospitalId,
        hospitalName: user.hospital.name,
        doctorProfileId: user.doctorProfileId,
      },
    };
  }

  /**
   * Patient login — validates against Patient model
   */
  async patientLogin(dto: LoginDto) {
    this.logger.log(`Patient login attempt: ${dto.email}`);

    const patient = await this.prisma.patient.findFirst({
      where: { email: dto.email },
      include: { hospital: true },
    });

    if (!patient) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(dto.password, patient.hashedPassword);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: patient.id,
      email: patient.email,
      role: 'patient',
      hospitalId: patient.hospitalId,
      type: 'patient',
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: patient.id,
        name: patient.email.split('@')[0],
        email: patient.email,
        role: 'patient' as const,
        hospitalId: patient.hospitalId,
        hospitalName: patient.hospital.name,
        patientProfileId: patient.id,
        ethioChartId: patient.ethioChartId,
        isVerified: patient.isVerified,
      },
    };
  }

  /**
   * Hash a plaintext password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
  }
}
