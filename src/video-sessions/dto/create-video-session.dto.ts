import { IsNotEmpty, IsNumber, IsDateString, IsString, IsOptional, IsIn } from 'class-validator';

export class CreateVideoSessionDto {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @IsString()
  @IsIn(['scheduled', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;
}
