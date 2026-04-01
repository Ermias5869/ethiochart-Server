import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreatePrescriptionDto {
  @IsNumber()
  @IsNotEmpty()
  appointmentId: number;

  @IsString()
  @IsNotEmpty()
  medication: string;

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsString()
  @IsNotEmpty()
  duration: string;
}
