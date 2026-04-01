import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHospitalDto } from './dto/create-hospital.dto';
import { UpdateHospitalDto } from './dto/update-hospital.dto';

@Injectable()
export class HospitalsService {
  private readonly logger = new Logger(HospitalsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHospitalDto) {
    this.logger.log(`Creating hospital: ${dto.name}`);

    return this.prisma.hospital.create({
      data: {
        name: dto.name,
        address: dto.address,
      },
    });
  }

  async findAll() {
    return this.prisma.hospital.findMany({
      include: {
        _count: {
          select: {
            doctors: true,
            patients: true,
            users: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      include: {
        doctors: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            patients: true,
            doctors: true,
          },
        },
      },
    });

    if (!hospital) {
      throw new NotFoundException(`Hospital with ID ${id} not found`);
    }

    return hospital;
  }

  async update(id: number, dto: UpdateHospitalDto) {
    await this.findOne(id);

    return this.prisma.hospital.update({
      where: { id },
      data: dto,
    });
  }
}
