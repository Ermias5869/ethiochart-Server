import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLabResultDto {
  @IsNumber()
  @IsNotEmpty()
  appointmentId: number;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  result: string;
}
