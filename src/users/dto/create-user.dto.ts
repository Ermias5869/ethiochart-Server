import { IsString, IsNotEmpty, IsEmail, IsIn } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsIn(['hospital_admin', 'doctor'])
  role: string;

  @IsNotEmpty()
  hospitalId: number;
}
