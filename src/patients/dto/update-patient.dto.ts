import { IsString, IsOptional, IsEmail } from 'class-validator';

export class UpdatePatientDto {
  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
