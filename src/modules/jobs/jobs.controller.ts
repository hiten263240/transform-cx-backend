import { Body, Controller, Delete, Get, Post, Put, Query } from '@nestjs/common';
import { JobsService } from './jobs.service';

@Controller()
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Get('job-list')
  getJobList() {
    return this.jobsService.getJobList();
  }

  @Post('v2/create-job')
  createJob(@Body() body: Record<string, unknown>) {
    return this.jobsService.createJob(body);
  }

  @Delete('job')
  deleteJob(@Query('jobId') jobId?: string) {
    return this.jobsService.deleteJob(jobId);
  }

  @Get('job')
  getJob(@Query('jobId') jobId?: string) {
    return this.jobsService.getJob(jobId);
  }

  @Put('job')
  updateJob(@Body() body: Record<string, unknown>) {
    return this.jobsService.updateJob(body);
  }

  @Post('intent-analysis')
  triggerIntentAnalysis(@Body() body: Record<string, unknown>) {
    return this.jobsService.triggerIntentAnalysis(body);
  }

  @Post('agent-builder/generate-uml')
  triggerUmlGeneration(@Body() body: Record<string, unknown>) {
    return this.jobsService.triggerIntentAnalysis(body);
  }

  @Post('agent-builder/generate-api')
  triggerApiGeneration(@Body() body: Record<string, unknown>) {
    return this.jobsService.triggerIntentAnalysis(body);
  }

  @Post('agent-builder/generate-blueprint')
  triggerBlueprintGeneration(@Body() body: Record<string, unknown>) {
    return this.jobsService.triggerIntentAnalysis(body);
  }

  @Post('agent-builder/build-deploy-agent')
  triggerBuildDeploy(@Body() body: Record<string, unknown>) {
    return this.jobsService.triggerIntentAnalysis(body);
  }
}
