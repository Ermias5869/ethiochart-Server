import { IsInt, IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateAiQueryDto {
  @IsInt()
  doctorId: number;

  @IsOptional()
  @IsInt()
  patientId?: number;

  @IsString()
  query: string;
}

export class PatientAiQueryDto {
  @IsInt()
  patientId: number;

  @IsString()
  question: string;
}

export class GeneralAiQueryDto {
  @IsString()
  question: string;
}
