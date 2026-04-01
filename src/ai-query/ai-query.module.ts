import { Module } from '@nestjs/common';
import { AiQueryService } from './ai-query.service';
import { AiQueryController } from './ai-query.controller';

@Module({
  controllers: [AiQueryController],
  providers: [AiQueryService],
  exports: [AiQueryService],
})
export class AiQueryModule {}
