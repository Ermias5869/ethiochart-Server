import { IsNotEmpty, IsNumber, IsString, IsIn } from 'class-validator';

export class CreateMessageDto {
  @IsNumber()
  @IsNotEmpty()
  receiverId: number;

  @IsString()
  @IsIn(['doctor', 'patient'])
  senderType: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumber()
  @IsNotEmpty()
  patientId: number;

  @IsNumber()
  @IsNotEmpty()
  doctorId: number;
}
