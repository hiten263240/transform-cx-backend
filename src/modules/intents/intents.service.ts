import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { validateJson } from '../../common/tcx.utils';
import {
  AgenticApiModelName,
  AgenticBlueprintModelName,
  AgenticDeploymentModelName,
  AgenticGenerationModelName,
  ClusterModelName,
  IntentModelName,
  JobModelName,
  ProcessMapIvrModelName,
  ProcessMapModelName,
  UmlDiagramModelName,
} from '../../database/schemas';
import { DataScienceService } from '../../infrastructure/data-science.service';
import { StorageService } from '../../infrastructure/storage.service';

@Injectable()
export class IntentsService {
  constructor(
    @InjectModel(JobModelName) private readonly jobModel: Model<any>,
    @InjectModel(IntentModelName) private readonly intentModel: Model<any>,
    @InjectModel(ClusterModelName) private readonly clusterModel: Model<any>,
    @InjectModel(ProcessMapModelName)
    private readonly processMapModel: Model<any>,
    @InjectModel(ProcessMapIvrModelName)
    private readonly processMapIvrModel: Model<any>,
    @InjectModel(AgenticGenerationModelName)
    private readonly agenticGenerationModel: Model<any>,
    @InjectModel(AgenticApiModelName)
    private readonly agenticApiModel: Model<any>,
    @InjectModel(AgenticBlueprintModelName)
    private readonly agenticBlueprintModel: Model<any>,
    @InjectModel(AgenticDeploymentModelName)
    private readonly agenticDeploymentModel: Model<any>,
    @InjectModel(UmlDiagramModelName)
    private readonly umlDiagramModel: Model<any>,
    private readonly storageService: StorageService,
    private readonly dataScienceService: DataScienceService,
  ) {}

  getJobsList(jobId?: string) {
    return this.getProcessMaps(jobId);
  }

  async mergeClusters(body: any) {
    const { jobId, clustersToMerge, newClusterName, currentVersion } = body;
    if (!jobId || !clustersToMerge?.length || !newClusterName) {
      throw new BadRequestException('Invalid input: missing required fields.');
    }

    const docsToMerge = await this.clusterModel.find({
      jobId,
      version: currentVersion,
      'clusteringOutput.intent_name': { $in: clustersToMerge },
    });

    if (docsToMerge.length === 0) {
      return { insertedCount: 0, message: 'No matching documents found.' };
    }

    const newVersion = currentVersion + 1;
    const newDocs = docsToMerge.map((doc: any) => {
      const obj = doc.toObject();
      delete obj._id;
      obj.clusteringOutput.intent_name = newClusterName;
      obj.version = newVersion;
      obj.addedOn = Date.now();
      return obj;
    });

    const result = await this.clusterModel.insertMany(newDocs);
    return {
      insertedCount: result.length,
      newVersion,
      mergedCluster: newClusterName,
    };
  }

  getIntents(jobId?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');
    return this.intentModel.find({ jobId });
  }

  triggerIntentUpdate(jobId: string | undefined, body: Record<string, unknown>) {
    return { ...body, jobId };
  }

  async getIntentClusters(jobId?: string, version?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');

    const clusterList = await this.clusterModel.aggregate([
      { $match: { jobId } },
      {
        $addFields: {
          clusteringData: { $arrayElemAt: ['$clusteringOutput', 0] },
          complexity: '$intent_complexity',
        },
      },
      {
        $group: {
          _id: {
            clusterName: '$groupedSubIntentName',
            coreSubIntent: '$coreSubIntent',
          },
          count: { $sum: 1 },
          closestCluster: { $first: '$clusteringData.closest_other_cluster_name' },
          clusterId: { $first: '$clusteringData.cluster' },
          complexities: { $push: '$intent_complexity' },
        },
      },
      {
        $group: {
          _id: '$_id.clusterName',
          closestCluster: { $first: '$closestCluster' },
          clusterId: { $first: '$clusterId' },
          coreSubIntents: {
            $push: {
              coreSubIntent: '$_id.coreSubIntent',
              count: '$count',
            },
          },
          totalCount: { $sum: '$count' },
          complexities: { $push: '$complexities' },
        },
      },
    ]);

    const clusters = await this.clusterModel.find(
      version ? { jobId, version: Number(version) } : { jobId },
    );
    const spatialMapUrl = await this.storageService.getSignedUrl(
      `main_outputs/${jobId}/spatialMap.html`,
    );

    return { clusterList, clusters, spatialMapUrl };
  }

  async getProcessMaps(jobId?: string) {
    const jobDetails = await this.jobModel.findOne({ jobId });
    if (!jobDetails) {
      throw new NotFoundException("Job doesn't exists!");
    }

    const isIvr = jobDetails?.jobType === 'IVR';
    const ivrData = await this.processMapIvrModel.find({ jobId });
    if (ivrData.length > 0 && isIvr) {
      return ivrData;
    }

    return this.processMapModel.find({ jobId });
  }

  getAgenticTemplate(jobId?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');
    return this.agenticApiModel.find({ jobId });
  }

  async createAgenticTemplate(body: any) {
    const { jobId, intentGroupName, agentBuilderOutput } = body;
    validateJson(agentBuilderOutput);

    const latestRecord = await this.agenticGenerationModel
      .findOne({ jobId, intentGroupName })
      .sort({ version: -1 });

    if (!latestRecord) {
      throw new BadRequestException('Invalid Details');
    }

    if (latestRecord?.agentBuilderOutput === agentBuilderOutput) {
      throw new BadRequestException('Given Json already exists');
    }

    return this.agenticGenerationModel.create({
      ...body,
      transcriptIdList: latestRecord.transcriptIdList,
      version: latestRecord.version + 1,
      addedOn: Date.now(),
    });
  }

  getAgenticBlueprint(jobId?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');
    return this.agenticBlueprintModel.find({ jobId });
  }

  getGeneratedUml(jobId?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');
    return this.umlDiagramModel.find({ jobId });
  }

  getBuildDeployAgent(jobId?: string) {
    if (!jobId) throw new BadRequestException('Invalid JobId');
    return this.agenticDeploymentModel.find({ jobId });
  }

  getProcessStatus(taskId?: string) {
    if (!taskId) throw new BadRequestException('taskId is required');
    return this.dataScienceService.processStatusAgentBuilder(taskId);
  }
}
