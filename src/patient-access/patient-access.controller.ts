import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PatientAccessService } from './patient-access.service';
import { GrantAccessDto } from './dto/grant-access.dto';
import { RevokeAccessDto } from './dto/revoke-access.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('patient-access')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PatientAccessController {
  constructor(private readonly patientAccessService: PatientAccessService) {}

  @Post('grant')
  @Roles('hospital_admin', 'doctor')
  async grantAccess(@Body() dto: GrantAccessDto) {
    return this.patientAccessService.grantAccess(dto);
  }

  @Post('revoke')
  @Roles('hospital_admin', 'doctor')
  async revokeAccess(@Body() dto: RevokeAccessDto) {
    return this.patientAccessService.revokeAccess(dto);
  }
}
