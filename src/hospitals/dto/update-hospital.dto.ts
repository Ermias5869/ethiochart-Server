import { IsString, IsOptional } from 'class-validator';

export class UpdateHospitalDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  address?: string;
}
