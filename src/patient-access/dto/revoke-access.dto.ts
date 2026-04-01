import { IsNotEmpty, IsNumber } from 'class-validator';

export class RevokeAccessDto {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  doctorId: number;
}
