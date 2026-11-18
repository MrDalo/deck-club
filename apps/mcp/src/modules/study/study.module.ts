import { Module } from '@nestjs/common';
import { StudyService } from './application/study.service.js';
import { StudyMcpFeature } from './mcp/study.mcp-feature.js';

/** Studying through an AI assistant (spec 4.5, 9): due cards, reviews, stats and study prompts. */
@Module({ providers: [StudyService, StudyMcpFeature] })
export class StudyModule {}
