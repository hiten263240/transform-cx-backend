import { BadGatewayException, Injectable } from '@nestjs/common';
import { DS_API_ENDPOINTS } from '../common/tcx.constants';

@Injectable()
export class DataScienceService {
  private isJobAutomated(jobDetails: any) {
    if (!jobDetails?.metadata?.expressModeEnabled) {
      return {};
    }

    return {
      isClusteringOptional:
        !jobDetails.metadata.automatedSteps.includes('INTENT_CLUSTERING'),
      isProcessMapsOptional:
        !jobDetails.metadata.automatedSteps.includes('PROCESS_MERGE'),
    };
  }

  private async postJson(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new BadGatewayException(`External API error: ${response.status}`);
    }

    return response.json();
  }

  async intentAnalysis(jobDetails: any) {
    const automation = this.isJobAutomated(jobDetails);
    const response = await this.postJson(
      Object.keys(automation).length
        ? DS_API_ENDPOINTS.EXPRESS_MODE
        : DS_API_ENDPOINTS.INTENT_ANALYSIS,
      {
        ...automation,
        jobId: jobDetails.jobId,
        fileLocation: jobDetails.fileLocation,
        selectedIdCol: 'transaction_id',
        selectedTranscriptCol: 'Transcript',
        BU: 'Transcript',
        Client: 'Transcript',
      },
    );

    return response?.message ?? 'Intent analysis started';
  }

  async intentAnalysisIvr(jobDetails: any, filePath: string) {
    const response = await this.postJson(DS_API_ENDPOINTS.INTENT_ANALYSIS_IVR, {
      jobId: jobDetails?.jobId,
      folderLocation: filePath,
      ivrType: 'ciscoivr',
    });
    return response?.message ?? 'Intent analysis started';
  }

  async intentClustering(jobDetails: any) {
    const response = await this.postJson(DS_API_ENDPOINTS.INTENT_CLUSTERING, {
      jobId: jobDetails?.jobId,
      fileLocation: jobDetails?.fileLocation,
      selectedIdCol: 'transaction_id',
      selectedTranscriptCol: 'Transcript',
      isClusteringOptional: false,
      isProcessMapsOptional: false,
      clusteringMethod: jobDetails?.metadata?.clusteringMethod,
      selectedCluster: jobDetails?.metadata?.selectedCluster,
      BU: 'Transcript',
      Client: 'Transcript',
    });
    return response?.message ?? 'Intent clustering started';
  }

  async processMap(jobDetails: any, clusterList: string[]) {
    const body: Record<string, unknown> = {
      jobId: jobDetails?.jobId,
      fileLocation: jobDetails?.fileLocation,
      selectedIdCol: 'transaction_id',
      selectedTranscriptCol: 'Transcript',
    };

    if (clusterList.length) {
      body.selectionFilterCol1 = 'groupedSubIntentName';
      body.selectionFilterCol2 = 'clusteringOutput.cluster';
      body.selectionFilterList = clusterList;
    }

    const response = await this.postJson(DS_API_ENDPOINTS.PROCESS_MAP, body);
    return response?.message ?? 'Process map started';
  }

  async processMapIvr(jobDetails: any, filePath: string) {
    const response = await this.postJson(DS_API_ENDPOINTS.PROCESS_MAP_IVR, {
      jobId: jobDetails?.jobId,
      folderLocation: filePath,
      ivrType: 'ciscoivr',
    });
    return response?.message ?? 'Process map started';
  }

  async agenticGeneration(jobDetails: any) {
    const response = await this.postJson(DS_API_ENDPOINTS.AGENTIC_GENERATION, {
      jobId: jobDetails?.jobId,
      fileLocation: jobDetails?.fileLocation,
      selectedIdCol: 'transaction_id',
      selectedTranscriptCol: 'Transcript',
    });
    return response?.message ?? 'Agentic generation started';
  }

  async ivrValidation(jobId: string, key: string, folderLocation: string) {
    await this.postJson(DS_API_ENDPOINTS.IVR_VALIDATION, {
      jobId,
      [key]: folderLocation,
      ivrtype: 'ciscoivr',
    });

    return 'Validation Successful';
  }

  generateScenario(body: Record<string, unknown>) {
    return this.postJson(DS_API_ENDPOINTS.GENERATE_SCENARIO, body);
  }

  processScenario(body: Record<string, unknown>) {
    return this.postJson(DS_API_ENDPOINTS.PROCESS_SCENARIO, body);
  }

  getGoalsEntities(body: Record<string, unknown>) {
    return this.postJson(DS_API_ENDPOINTS.GOALS_ENTITIES, body);
  }

  generateUml(
    jobId: string,
    message: string,
    mainIntent: string,
    groupedSubIntentName: string,
    workflowJsonFile: string,
  ) {
    return this.postJson(DS_API_ENDPOINTS.UML_GENERATION, {
      job_id: jobId,
      message,
      main_intent: mainIntent,
      grouped_sub_intent_name: groupedSubIntentName,
      workflow_json_file: workflowJsonFile,
    });
  }

  generateApi(
    jobId: string,
    message: string,
    mainIntent: string,
    groupedSubIntentName: string,
    umlCode: string,
  ) {
    return this.postJson(DS_API_ENDPOINTS.API_GENERATION, {
      job_id: jobId,
      message,
      main_intent: mainIntent,
      grouped_sub_intent_name: groupedSubIntentName,
      uml_code: umlCode,
    });
  }

  generateBlueprint(
    jobId: string,
    message: string,
    mainIntent: string,
    groupedSubIntentName: string,
    promptToolDefinitionJson: string,
    apiExplanationJson: string,
  ) {
    return this.postJson(DS_API_ENDPOINTS.BLUEPRINT_GENERATION, {
      job_id: jobId,
      message,
      main_intent: mainIntent,
      grouped_sub_intent_name: groupedSubIntentName,
      prompt_tool_defination_json: promptToolDefinitionJson,
      api_explanation_json: apiExplanationJson,
    });
  }

  buildDeployAgent(
    jobId: string,
    message: string,
    mainIntent: string,
    groupedSubIntentName: string,
    improvedBlueprintJson: string,
  ) {
    return this.postJson(DS_API_ENDPOINTS.BUILD_DEPLOY_AGENT, {
      job_id: jobId,
      message,
      main_intent: mainIntent,
      grouped_sub_intent_name: groupedSubIntentName,
      improved_blueprint_json: improvedBlueprintJson,
    });
  }

  async processStatusAgentBuilder(taskId: string) {
    const response = await fetch(
      `${DS_API_ENDPOINTS.CHECK_STATUS}/${encodeURIComponent(taskId)}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      },
    );

    if (!response.ok) {
      throw new BadGatewayException(`External API error: ${response.status}`);
    }

    return response.json();
  }
}
