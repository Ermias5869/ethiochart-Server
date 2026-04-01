import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateBillingDto {
  @IsString()
  @IsIn(['pending', 'paid'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
