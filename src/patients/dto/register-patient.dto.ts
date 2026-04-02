import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsBoolean,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class RegisterPatientDto {
  @IsString()
  @IsNotEmpty()
  nationalId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  paymentRequired: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsNumber()
  @IsNotEmpty()
  hospitalId: number;

  @IsString()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsOptional()
  dateOfBirth?: string;
}
