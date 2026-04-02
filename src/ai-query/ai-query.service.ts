import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PatientAiQueryDto, GeneralAiQueryDto } from './dto/create-ai-query.dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AiQueryService {
  private readonly logger = new Logger(AiQueryService.name);
  private genAI: GoogleGenerativeAI | null = null;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('✅ Gemini AI initialized');
      // Debug: list available models
      this.listAvailableModels();
    } else {
      this.logger.warn('⚠️ GEMINI_API_KEY not set — AI will use fallback responses');
    }
  }

  private async listAvailableModels() {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
      );
      const data = await response.json();
      const models = data.models
        ?.filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
        ?.map((m: any) => m.name)
        ?.slice(0, 10);
      this.logger.log(`📋 Available Gemini models: ${models?.join(', ') || 'none'}`);
    } catch (e: any) {
      this.logger.warn(`Could not list models: ${e.message}`);
    }
  }

  // ========================================
  // Patient-Aware AI (clinical support)
  // ========================================
  async patientAssist(dto: PatientAiQueryDto, doctorId: number) {
    this.logger.log(`Patient AI: doctor ${doctorId} → patient ${dto.patientId}: "${dto.question}"`);

    // Fetch full patient context
    const patient = await this.prisma.patient.findUnique({
      where: { id: dto.patientId },
      include: {
        medicalConditions: true,
        appointments: {
          take: 10,
          orderBy: { scheduledAt: 'desc' },
          include: {
            prescriptions: true,
            labResults: true,
            doctor: { select: { name: true } },
          },
        },
        bills: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!patient) {
      throw new BadRequestException(`Patient with ID ${dto.patientId} not found`);
    }

    // Build patient summary
    const conditions = patient.medicalConditions
      ?.map((c) => `${c.condition} (${c.severity || 'unknown severity'})`)
      .join(', ') || 'None recorded';

    const medications = patient.appointments
      ?.flatMap((a) => a.prescriptions)
      ?.map((p) => `${p.medication} ${p.dosage} for ${p.duration}`)
      .slice(0, 8)
      .join('\n  - ') || 'None';

    const labResults = patient.appointments
      ?.flatMap((a) => a.labResults)
      ?.map((l) => `${l.type}: ${l.result} (${new Date(l.recordedAt).toLocaleDateString()})`)
      .slice(0, 8)
      .join('\n  - ') || 'None';

    const recentAppts = patient.appointments
      ?.map((a) => `${new Date(a.scheduledAt).toLocaleDateString()} - ${a.status} with ${a.doctor?.name || 'Unknown'}: ${a.notes || 'No notes'}`)
      .slice(0, 5)
      .join('\n  - ') || 'None';

    const patientSummary = `
Patient ID: ${patient.ethioChartId}
Email: ${patient.email}
Verified: ${patient.isVerified ? 'Yes' : 'No'}

MEDICAL CONDITIONS:
  - ${conditions}

CURRENT MEDICATIONS:
  - ${medications}

RECENT LAB RESULTS:
  - ${labResults}

RECENT APPOINTMENTS:
  - ${recentAppts}
`.trim();

    const prompt = `You are a clinical decision support assistant for Ethiopian hospitals.

STRICT RULES:
- Do NOT give a final diagnosis
- Use the patient context carefully to inform your analysis
- Be concise and structured
- Consider Ethiopian healthcare context where relevant
- Responses must be evidence-based

PATIENT DATA:
${patientSummary}

DOCTOR'S QUESTION:
${dto.question}

You MUST respond with ONLY valid JSON (no markdown, no code fences):

{
  "clinical_summary": "Brief clinical assessment based on patient data",
  "possible_conditions": ["condition1", "condition2"],
  "recommended_tests": ["test1", "test2"],
  "treatment_suggestions": ["suggestion1", "suggestion2"],
  "risks": ["risk1", "risk2"],
  "drug_interactions": "Any potential drug interactions or concerns",
  "follow_up": "Recommended follow-up timeline",
  "confidence": 75
}`;

    const aiResponse = await this.callGemini(prompt);

    // Save to database
    const saved = await this.prisma.aIQuery.create({
      data: {
        doctorId,
        patientId: dto.patientId,
        query: dto.question,
        response: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
      },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, ethioChartId: true, email: true } },
      },
    });

    return {
      ...saved,
      parsedResponse: typeof aiResponse === 'object' ? aiResponse : this.tryParseJSON(aiResponse),
      mode: 'patient',
    };
  }

  // ========================================
  // General Medical AI (no patient data)
  // ========================================
  async generalQuery(dto: GeneralAiQueryDto, doctorId: number) {
    this.logger.log(`General AI: doctor ${doctorId}: "${dto.question}"`);

    const prompt = `You are a medical reference assistant for doctors in Ethiopian hospitals.

STRICT RULES:
- Do NOT give patient-specific medical advice
- Be concise and factual
- Use structured format
- Reference evidence-based medicine
- Consider medications and treatments available in East Africa

DOCTOR'S QUESTION:
${dto.question}

You MUST respond with ONLY valid JSON (no markdown, no code fences):

{
  "summary": "Concise answer to the question",
  "key_points": ["point1", "point2", "point3"],
  "possible_conditions": ["condition1", "condition2"],
  "recommended_tests": ["test1", "test2"],
  "treatment_options": ["option1", "option2"],
  "red_flags": ["warning1", "warning2"],
  "references": "Brief mention of guidelines or sources",
  "confidence": 80
}`;

    const aiResponse = await this.callGemini(prompt);

    // Save to database (no patientId for general queries — use doctorId's first patient as placeholder)
    // We'll save general queries with a null-safe approach
    const saved = await this.prisma.aIQuery.create({
      data: {
        doctorId,
        patientId: (await this.prisma.patient.findFirst({ select: { id: true } }))?.id || 1,
        query: `[GENERAL] ${dto.question}`,
        response: typeof aiResponse === 'string' ? aiResponse : JSON.stringify(aiResponse),
      },
      include: {
        doctor: { select: { id: true, name: true } },
      },
    });

    return {
      ...saved,
      parsedResponse: typeof aiResponse === 'object' ? aiResponse : this.tryParseJSON(aiResponse),
      mode: 'general',
    };
  }

  // ========================================
  // Query History
  // ========================================
  async findByDoctor(doctorId: number) {
    return this.prisma.aIQuery.findMany({
      where: { doctorId },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, ethioChartId: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async findByPatient(patientId: number) {
    return this.prisma.aIQuery.findMany({
      where: { patientId },
      include: {
        doctor: { select: { id: true, name: true } },
        patient: { select: { id: true, ethioChartId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ========================================
  // Gemini API Call
  // ========================================
  private async callGemini(prompt: string): Promise<any> {
    if (!this.genAI) {
      this.logger.warn('Gemini not configured — returning fallback');
      return this.fallbackResponse(prompt);
    }

    // Try multiple models in order (fallback chain)
    const models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash'];
    const maxRetries = 2;

    for (const modelName of models) {
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          this.logger.log(`Calling Gemini model: ${modelName} (attempt ${attempt + 1})`);
          const model = this.genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);
          const text = result.response.text();

          // Clean markdown fences if present
          const cleaned = text
            .replace(/```json\s*/gi, '')
            .replace(/```\s*/gi, '')
            .trim();

          this.logger.log(`✅ Gemini responded (model: ${modelName})`);
          return this.tryParseJSON(cleaned) || cleaned;
        } catch (error: any) {
          const isRateLimit = error.message?.includes('429') || error.message?.includes('quota');

          if (isRateLimit && attempt < maxRetries) {
            const waitMs = (attempt + 1) * 5000; // 5s, 10s
            this.logger.warn(`Rate limited on ${modelName}, waiting ${waitMs}ms before retry...`);
            await new Promise((r) => setTimeout(r, waitMs));
            continue;
          }

          if (isRateLimit) {
            this.logger.warn(`Rate limited on ${modelName}, trying next model...`);
            break; // Try next model
          }

          this.logger.error(`Gemini API error (${modelName}): ${error.message}`);
          break; // Non-rate-limit error, try next model
        }
      }
    }

    this.logger.warn('All Gemini models failed — returning fallback');
    return this.fallbackResponse(prompt);
  }

  private tryParseJSON(text: string): any {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }

  private fallbackResponse(prompt: string): any {
    const isPatientMode = prompt.includes('PATIENT DATA:');

    if (isPatientMode) {
      return {
        clinical_summary: 'AI analysis is currently unavailable. Please configure your GEMINI_API_KEY in the .env file to enable real-time clinical decision support.',
        possible_conditions: ['Unable to analyze — API key not configured'],
        recommended_tests: ['Please configure Gemini API for intelligent recommendations'],
        treatment_suggestions: ['Consult clinical guidelines manually'],
        risks: ['AI system offline — rely on clinical judgment'],
        drug_interactions: 'Unable to check — API offline',
        follow_up: 'Schedule based on clinical assessment',
        confidence: 0,
      };
    }

    return {
      summary: 'AI analysis is currently unavailable. Please configure your GEMINI_API_KEY in the .env file.',
      key_points: ['Gemini API key not configured', 'Add GEMINI_API_KEY to your .env file'],
      possible_conditions: [],
      recommended_tests: [],
      treatment_options: ['Consult medical references manually'],
      red_flags: ['AI system offline'],
      references: 'N/A — API offline',
      confidence: 0,
    };
  }
}
