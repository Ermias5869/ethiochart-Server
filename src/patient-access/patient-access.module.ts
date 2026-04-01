import { Module } from '@nestjs/common';
import { PatientAccessService } from './patient-access.service';
import { PatientAccessController } from './patient-access.controller';

@Module({
  controllers: [PatientAccessController],
  providers: [PatientAccessService],
  exports: [PatientAccessService],
})
export class PatientAccessModule {}
