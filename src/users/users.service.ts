import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a user (admin or doctor).
   * If role=doctor, automatically creates a linked Doctor profile.
   */
  async create(dto: CreateUserDto) {
    this.logger.log(`Creating user: ${dto.email} with role: ${dto.role}`);

    // Check for existing user
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException(`User with email ${dto.email} already exists`);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    // If role is doctor, create doctor profile first
    if (dto.role === 'doctor') {
      // Create doctor profile
      const doctorProfile = await this.prisma.doctor.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          hospitalId: dto.hospitalId,
        },
      });

      // Create user linked to doctor profile
      const user = await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          hashedPassword,
          role: dto.role,
          hospitalId: dto.hospitalId,
          doctorProfileId: doctorProfile.id,
        },
        include: {
          hospital: true,
          doctorProfile: true,
        },
      });

      return this.sanitizeUser(user);
    }

    // Create admin user (no doctor profile)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        hashedPassword,
        role: dto.role,
        hospitalId: dto.hospitalId,
      },
      include: {
        hospital: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: {
        hospital: {
          select: { id: true, name: true },
        },
        doctorProfile: {
          select: { id: true },
        },
      },
    });

    return users.map((u) => this.sanitizeUser(u));
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        hospital: true,
        doctorProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return this.sanitizeUser(user);
  }

  async update(id: number, dto: UpdateUserDto) {
    await this.findOne(id);

    const data: any = { ...dto };

    // Hash new password if provided
    if (dto.password) {
      const salt = await bcrypt.genSalt(12);
      data.hashedPassword = await bcrypt.hash(dto.password, salt);
      delete data.password;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        hospital: true,
        doctorProfile: true,
      },
    });

    return this.sanitizeUser(user);
  }

  async remove(id: number) {
    const user = await this.findOne(id);

    // If user has a doctor profile, delete it too
    if ((user as any).doctorProfileId) {
      await this.prisma.doctor.delete({
        where: { id: (user as any).doctorProfileId },
      });
    }

    await this.prisma.user.delete({ where: { id } });

    return { message: `User with ID ${id} deleted successfully` };
  }

  /**
   * Remove sensitive fields from user object
   */
  private sanitizeUser(user: any) {
    const { hashedPassword, ...sanitized } = user;
    return sanitized;
  }
}
