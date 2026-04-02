import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AiQueryService } from './ai-query.service';
import {
  PatientAiQueryDto,
  GeneralAiQueryDto,
  CreateAiQueryDto,
} from './dto/create-ai-query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ai-query')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiQueryController {
  constructor(private readonly aiQueryService: AiQueryService) {}

  // ========================================
  // POST /ai-query/patient-assist
  // Patient-aware clinical AI
  // ========================================
  @Post('patient-assist')
  @Roles('doctor')
  async patientAssist(@Body() dto: PatientAiQueryDto, @Request() req: any) {
    const doctorProfileId = req.user?.doctorProfileId || req.user?.id;
    return this.aiQueryService.patientAssist(dto, doctorProfileId);
  }

  // ========================================
  // POST /ai-query/general-query
  // General medical AI (no patient data)
  // ========================================
  @Post('general-query')
  @Roles('doctor')
  async generalQuery(@Body() dto: GeneralAiQueryDto, @Request() req: any) {
    const doctorProfileId = req.user?.doctorProfileId || req.user?.id;
    return this.aiQueryService.generalQuery(dto, doctorProfileId);
  }

  // ========================================
  // Legacy endpoint
  // ========================================
  @Post()
  @Roles('doctor')
  async create(@Body() dto: CreateAiQueryDto) {
    if (!dto.patientId) {
      return this.aiQueryService.generalQuery(
        { question: dto.query },
        dto.doctorId,
      );
    }
    return this.aiQueryService.patientAssist(
      { patientId: dto.patientId, question: dto.query },
      dto.doctorId,
    );
  }

  // ========================================
  // GET /ai-query/history/:doctorId
  // ========================================
  @Get('history/:doctorId')
  @Roles('doctor')
  async findByDoctor(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.aiQueryService.findByDoctor(doctorId);
  }

  // ========================================
  // GET /ai-query/:patientId
  // ========================================
  @Get(':patientId')
  @Roles('doctor')
  async findByPatient(@Param('patientId', ParseIntPipe) patientId: number) {
    return this.aiQueryService.findByPatient(patientId);
  }
}
