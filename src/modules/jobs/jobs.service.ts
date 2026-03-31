import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class JobsService {
  getJobList() {
    return tcxResponse('jobs.getJobList', {
      sourceLambdaModule: 'modules/jobs/index.mjs#getJobList',
    });
  }

  createJob(body: Record<string, unknown>) {
    return tcxResponse('jobs.createJob', {
      sourceLambdaModule: 'modules/jobs/index.mjs#createJobV2',
      requestBody: body,
    });
  }

  deleteJob(jobId?: string) {
    return tcxResponse('jobs.deleteJob', {
      sourceLambdaModule: 'modules/jobs/index.mjs#deleteJob',
      jobId,
    });
  }

  getJob(jobId?: string) {
    return tcxResponse('jobs.getJob', {
      sourceLambdaModule: 'modules/jobs/index.mjs#getJobData',
      jobId,
    });
  }

  updateJob(body: Record<string, unknown>) {
    return tcxResponse('jobs.updateJob', {
      sourceLambdaModule: 'modules/jobs/index.mjs#updateJobData',
      requestBody: body,
    });
  }

  triggerIntentAnalysis(body: Record<string, unknown>) {
    return tcxResponse('jobs.triggerIntentAnalysis', {
      sourceLambdaModule: 'modules/jobs/index.mjs#triggerIntentAnalysis',
      requestBody: body,
    });
  }
}
