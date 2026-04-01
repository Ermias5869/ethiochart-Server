import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateDoctorDto } from './dto/update-doctor.dto';

@Injectable()
export class DoctorsService {
  private readonly logger = new Logger(DoctorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.doctor.findMany({
      include: {
        hospital: {
          select: { id: true, name: true },
        },
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: {
            appointments: true,
            patientAccess: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        hospital: true,
        user: {
          select: { id: true, name: true, email: true, role: true },
        },
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            patient: {
              select: { id: true, ethioChartId: true, email: true },
            },
          },
        },
        _count: {
          select: {
            appointments: true,
            messages: true,
            videoSessions: true,
            aiQueries: true,
            patientAccess: true,
          },
        },
      },
    });

    if (!doctor) {
      throw new NotFoundException(`Doctor with ID ${id} not found`);
    }

    return doctor;
  }

  async update(id: number, dto: UpdateDoctorDto) {
    await this.findOne(id);

    return this.prisma.doctor.update({
      where: { id },
      data: dto,
      include: {
        hospital: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Check if doctor has a linked user account
    const linkedUser = await this.prisma.user.findFirst({
      where: { doctorProfileId: id },
    });

    if (linkedUser) {
      // Unlink the doctor profile from user first
      await this.prisma.user.update({
        where: { id: linkedUser.id },
        data: { doctorProfileId: null },
      });
    }

    await this.prisma.doctor.delete({ where: { id } });

    return { message: `Doctor with ID ${id} deleted successfully` };
  }
}
