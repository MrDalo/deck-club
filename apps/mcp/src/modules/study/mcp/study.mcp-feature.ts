import type { McpServer } from '@modelcontextprotocol/server';
import { Inject, Injectable } from '@nestjs/common';
import { registerPrompt, registerResource } from '../../../common/mcp/content-registration.js';
import type { McpCaller } from '../../../common/mcp/mcp-caller.js';
import { McpFeature, type McpFeatureContributor } from '../../../common/mcp/mcp-feature.js';
import { registerTool } from '../../../common/mcp/tool-registration.js';
import { StudyService } from '../application/study.service.js';
import { STUDY_PROMPTS, STUDY_TOOLS, TODAY_RESOURCE } from './study-tool-specs.js';

/** Driving adapter: publishes the study tools, the today resource and the study prompts over MCP. */
@McpFeature()
@Injectable()
export class StudyMcpFeature implements McpFeatureContributor {
  constructor(@Inject(StudyService) private readonly study: StudyService) {}

  register(server: McpServer, caller: McpCaller): void {
    registerTool(server, caller, STUDY_TOOLS.getDueCards, (input) =>
      this.study.getDueCards(caller, input),
    );
    registerTool(server, caller, STUDY_TOOLS.submitReview, (input) =>
      this.study.submitReview(caller, input),
    );
    registerTool(server, caller, STUDY_TOOLS.getStats, (input) =>
      this.study.getStats(caller, input),
    );
    registerResource(server, TODAY_RESOURCE, () => this.study.readToday(caller));
    registerPrompt(server, STUDY_PROMPTS.quizMe, (args) => this.study.quizMePrompt(args));
    registerPrompt(server, STUDY_PROMPTS.findWeakSpots, (args) =>
      this.study.findWeakSpotsPrompt(args),
    );
  }
}
