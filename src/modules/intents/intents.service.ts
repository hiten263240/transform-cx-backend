import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class IntentsService {
  getJobsList(jobId?: string) {
    return tcxResponse('intents.getJobsList', {
      sourceLambdaModule: 'modules/intents/index.mjs#getProcessmapsByJobId',
      jobId,
    });
  }

  mergeClusters(body: Record<string, unknown>) {
    return tcxResponse('intents.mergeClusters', {
      sourceLambdaModule: 'modules/intents/index.mjs#mergeClustersforJobId',
      requestBody: body,
    });
  }

  getIntents(jobId?: string) {
    return tcxResponse('intents.getIntents', {
      sourceLambdaModule: 'modules/intents/index.mjs#getIntentsByJobId',
      jobId,
    });
  }

  triggerIntentUpdate(jobId: string | undefined, body: Record<string, unknown>) {
    return tcxResponse('intents.triggerIntentUpdate', {
      sourceLambdaModule: 'modules/jobs/index.mjs#triggerIntentAnalysis',
      jobId,
      requestBody: body,
    });
  }

  getIntentClusters(jobId?: string, version?: string) {
    return tcxResponse('intents.getIntentClusters', {
      sourceLambdaModule: 'modules/intents/index.mjs#getClustersByJobId',
      jobId,
      version,
    });
  }

  getProcessMaps(jobId?: string) {
    return tcxResponse('intents.getProcessMaps', {
      sourceLambdaModule: 'modules/intents/index.mjs#getProcessmapsByJobId',
      jobId,
    });
  }

  getAgenticTemplate(jobId?: string) {
    return tcxResponse('intents.getAgenticTemplate', {
      sourceLambdaModule: 'modules/intents/index.mjs#getAgenticTemplateByJobId',
      jobId,
    });
  }

  createAgenticTemplate(body: Record<string, unknown>) {
    return tcxResponse('intents.createAgenticTemplateVersion', {
      sourceLambdaModule: 'modules/intents/index.mjs#agenticVersioning',
      requestBody: body,
    });
  }

  getAgenticBlueprint(jobId?: string) {
    return tcxResponse('intents.getAgenticBlueprint', {
      sourceLambdaModule: 'modules/intents/index.mjs#getAgenticBlueprintByJobId',
      jobId,
    });
  }

  getGeneratedUml(jobId?: string) {
    return tcxResponse('intents.getGeneratedUml', {
      sourceLambdaModule: 'modules/intents/index.mjs#getGeneratedUMLByJobId',
      jobId,
    });
  }

  getBuildDeployAgent(jobId?: string) {
    return tcxResponse('intents.getBuildDeployAgent', {
      sourceLambdaModule: 'modules/intents/index.mjs#getBuildDeployAgentByJobId',
      jobId,
    });
  }

  getProcessStatus(taskId?: string) {
    return tcxResponse('intents.getProcessStatus', {
      sourceLambdaModule: 'manager/dataScienceServices.mjs#processStatusAgentBuilder',
      taskId,
    });
  }
}
