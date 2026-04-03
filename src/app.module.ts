import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Feature modules
import { HospitalsModule } from './hospitals/hospitals.module';
import { UsersModule } from './users/users.module';
import { DoctorsModule } from './doctors/doctors.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { LabResultsModule } from './lab-results/lab-results.module';
import { BillingModule } from './billing/billing.module';
import { MessagesModule } from './messages/messages.module';
import { VideoSessionsModule } from './video-sessions/video-sessions.module';
import { AiQueryModule } from './ai-query/ai-query.module';
import { PatientAccessModule } from './patient-access/patient-access.module';
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // Core
    PrismaModule,
    AuthModule,

    // Feature modules
    HospitalsModule,
    UsersModule,
    DoctorsModule,
    PatientsModule,
    AppointmentsModule,
    PrescriptionsModule,
    LabResultsModule,
    BillingModule,
    MessagesModule,
    VideoSessionsModule,
    AiQueryModule,
    PatientAccessModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
