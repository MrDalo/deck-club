import { Module } from '@nestjs/common';
import { DeckClubApiClient } from '../../infra/deck-club-api/deck-club-api-client.js';
import { STUDY_API } from './application/ports/study-api.js';
import { StudyService } from './application/study.service.js';
import { HttpStudyApi } from './infrastructure/http-study-api.js';
import { StudyMcpFeature } from './mcp/study.mcp-feature.js';

/** Studying through an AI assistant (spec 4.5, 9): due cards, reviews, stats and study prompts. */
@Module({
  providers: [
    StudyService,
    StudyMcpFeature,
    {
      provide: STUDY_API,
      inject: [DeckClubApiClient],
      useFactory: (api: DeckClubApiClient) => new HttpStudyApi(api),
    },
  ],
})
export class StudyModule {}
