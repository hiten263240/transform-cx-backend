import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class QaService {
  getJobs(jobId?: string, agentJobId?: string) {
    return tcxResponse('qa.getJobs', {
      sourceLambdaModule: 'modules/qa/index.mjs#getQAJobsList',
      jobId,
      agentJobId,
    });
  }

  generateScenario(body: Record<string, unknown>) {
    return tcxResponse('qa.generateScenario', {
      sourceLambdaModule: 'manager/dataScienceServices.mjs#generateScenario',
      requestBody: body,
    });
  }

  processScenario(body: Record<string, unknown>) {
    return tcxResponse('qa.processScenario', {
      sourceLambdaModule: 'manager/dataScienceServices.mjs#processScenario',
      requestBody: body,
    });
  }

  getGoalsEntities(body: Record<string, unknown>) {
    return tcxResponse('qa.getGoalsEntities', {
      sourceLambdaModule: 'manager/dataScienceServices.mjs#getGoalsEntities',
      requestBody: body,
    });
  }
}
