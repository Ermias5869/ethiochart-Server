import { Module } from '@nestjs/common';
import { VideoSessionsService } from './video-sessions.service';
import { VideoSessionsController } from './video-sessions.controller';

@Module({
  controllers: [VideoSessionsController],
  providers: [VideoSessionsService],
  exports: [VideoSessionsService],
})
export class VideoSessionsModule {}
