import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAiQueryDto } from './dto/create-ai-query.dto';

@Injectable()
export class AiQueryService {
  private readonly logger = new Logger(AiQueryService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAiQueryDto) {
    this.logger.log(
      `AI query from doctor ${dto.doctorId} about patient ${dto.patientId}`,
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
      include: {
        medicalConditions: true,
        appointments: {
          take: 5,
          orderBy: { scheduledAt: 'desc' },
          include: {
            prescriptions: true,
            labResults: true,
          },
        },
      },
    });
    if (!patient) {
      throw new BadRequestException(`Patient with ID ${dto.patientId} not found`);
    }

    // Mock OpenAI response — in production, this would call the OpenAI API
    const aiResponse = this.generateMockAIResponse(dto.query, patient);

    return this.prisma.aIQuery.create({
      data: {
        doctorId: dto.doctorId,
        patientId: dto.patientId,
        query: dto.query,
        response: aiResponse,
      },
      include: {
        doctor: {
          select: { id: true, name: true },
        },
        patient: {
          select: { id: true, ethioChartId: true },
        },
      },
    });
  }

  async findByPatient(patientId: number) {
    return this.prisma.aIQuery.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { id: true, name: true },
        },
        patient: {
          select: { id: true, ethioChartId: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Generate a mock AI response based on the query and patient context.
   * In production, this would integrate with OpenAI GPT-4 or similar.
   */
  private generateMockAIResponse(query: string, patient: any): string {
    const conditions = patient.medicalConditions
      ?.map((c: any) => c.condition)
      .join(', ') || 'No known conditions';

    const recentMeds = patient.appointments
      ?.flatMap((a: any) => a.prescriptions)
      ?.map((p: any) => p.medication)
      .slice(0, 3)
      .join(', ') || 'No recent medications';

    return JSON.stringify({
      analysis: `Based on the patient's medical history (conditions: ${conditions}, recent medications: ${recentMeds}), here is an AI-assisted analysis regarding your query: "${query}".`,
      recommendations: [
        'Consider reviewing the patient\'s latest lab results for any anomalies.',
        'A follow-up appointment in 2 weeks is recommended.',
        'Monitor vital signs and report any significant changes.',
      ],
      confidence: 0.85,
      disclaimer: 'This is an AI-generated response for clinical decision support only. Always apply clinical judgment.',
      generatedAt: new Date().toISOString(),
    });
  }
}
