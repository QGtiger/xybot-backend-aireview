import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [AiModule],
  providers: [AnalysisService],
  exports: [AnalysisService],
})
export class AnalysisModule {}

