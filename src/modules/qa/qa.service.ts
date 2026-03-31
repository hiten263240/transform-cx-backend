import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QaJobModelName } from '../../database/schemas';
import { DataScienceService } from '../../infrastructure/data-science.service';

@Injectable()
export class QaService {
  constructor(
    @InjectModel(QaJobModelName) private readonly qaJobModel: Model<any>,
    private readonly dataScienceService: DataScienceService,
  ) {}

  getJobs(jobId?: string, agentJobId?: string) {
    if (jobId) {
      return this.qaJobModel.findOne({ _id: jobId });
    }
    if (agentJobId) {
      return this.qaJobModel
        .find({ job_id: agentJobId })
        .select('_id job_id status created_at bot_intent');
    }
    return this.qaJobModel
      .find({})
      .select('_id job_id status created_at bot_intent metadata');
  }

  generateScenario(body: Record<string, unknown>) {
    return this.dataScienceService.generateScenario(body);
  }

  processScenario(body: Record<string, unknown>) {
    return this.dataScienceService.processScenario(body);
  }

  getGoalsEntities(body: Record<string, unknown>) {
    return this.dataScienceService.getGoalsEntities(body);
  }
}
