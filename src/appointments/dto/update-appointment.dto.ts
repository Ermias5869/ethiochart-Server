import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';

export class UpdateAppointmentDto {
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @IsString()
  @IsIn(['scheduled', 'completed', 'cancelled'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
