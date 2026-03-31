import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { IntentsService } from './intents.service';

@Controller()
export class IntentsController {
  constructor(private readonly intentsService: IntentsService) {}

  @Get('jobs-list')
  getJobsList(@Query('jobId') jobId?: string) {
    return this.intentsService.getJobsList(jobId);
  }

  @Post('merge-clusters')
  mergeClusters(@Body() body: Record<string, unknown>) {
    return this.intentsService.mergeClusters(body);
  }

  @Get('intent')
  getIntents(@Query('jobId') jobId?: string) {
    return this.intentsService.getIntents(jobId);
  }

  @Put('intent')
  updateIntent(
    @Query('jobId') jobId: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.intentsService.triggerIntentUpdate(jobId, body);
  }

  @Get('intent-clusters')
  getIntentClusters(
    @Query('jobId') jobId?: string,
    @Query('version') version?: string,
  ) {
    return this.intentsService.getIntentClusters(jobId, version);
  }

  @Get('process-maps')
  getProcessMaps(@Query('jobId') jobId?: string) {
    return this.intentsService.getProcessMaps(jobId);
  }

  @Get('agentic-template')
  getAgenticTemplate(@Query('jobId') jobId?: string) {
    return this.intentsService.getAgenticTemplate(jobId);
  }

  @Post('agentic-template')
  createAgenticTemplate(@Body() body: Record<string, unknown>) {
    return this.intentsService.createAgenticTemplate(body);
  }

  @Get('agentic-blueprint')
  getAgenticBlueprint(@Query('jobId') jobId?: string) {
    return this.intentsService.getAgenticBlueprint(jobId);
  }

  @Get('agent-builder/generate-uml')
  getGeneratedUml(@Query('jobId') jobId?: string) {
    return this.intentsService.getGeneratedUml(jobId);
  }

  @Get('agent-builder/build-deploy-agent')
  getBuildDeployAgent(@Query('jobId') jobId?: string) {
    return this.intentsService.getBuildDeployAgent(jobId);
  }

  @Get('agent-builder/process-status')
  getProcessStatus(@Query('taskId') taskId?: string) {
    return this.intentsService.getProcessStatus(taskId);
  }
}
