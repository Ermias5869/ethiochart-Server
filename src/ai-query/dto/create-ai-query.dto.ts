import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateAiQueryDto {
  @IsNumber()
  @IsNotEmpty()
  doctorId: number;

  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsString()
  @IsNotEmpty()
  query: string;
}
