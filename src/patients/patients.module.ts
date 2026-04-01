import { Module } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsController } from './patients.controller';
import { NationalIdService } from '../common/services/national-id.service';
import { TeleBirrService } from '../common/services/telebirr.service';

@Module({
  controllers: [PatientsController],
  providers: [PatientsService, NationalIdService, TeleBirrService],
  exports: [PatientsService],
})
export class PatientsModule {}
