import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { QaService } from './qa.service';

@Controller()
export class QaController {
  constructor(private readonly qaService: QaService) {}

  @Get('qa-analysis/jobs')
  getJobs(@Query('jobId') jobId?: string, @Query('agentJobId') agentJobId?: string) {
    return this.qaService.getJobs(jobId, agentJobId);
  }

  @Post('qa-analysis/generate-scenario')
  generateScenario(@Body() body: Record<string, unknown>) {
    return this.qaService.generateScenario(body);
  }

  @Post('qa-analysis/process-scenario')
  processScenario(@Body() body: Record<string, unknown>) {
    return this.qaService.processScenario(body);
  }

  @Post('qa-analysis/goal-entities')
  getGoalsEntities(@Body() body: Record<string, unknown>) {
    return this.qaService.getGoalsEntities(body);
  }
}
