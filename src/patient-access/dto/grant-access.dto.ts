import { IsNotEmpty, IsNumber } from 'class-validator';

export class GrantAccessDto {
  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  doctorId: number;
}
