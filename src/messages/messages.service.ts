import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMessageDto, senderId: number) {
    this.logger.log(
      `New message from ${dto.senderType} ${senderId} to ${dto.receiverId}`,
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

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId: dto.receiverId,
        senderType: dto.senderType,
        content: dto.content,
        patientId: dto.patientId,
        doctorId: dto.doctorId,
      },
    });
  }

  async findByPatient(patientId: number) {
    return this.prisma.message.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' },
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
