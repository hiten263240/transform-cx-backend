import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  JOB_STATUS,
  JOB_STATUS_ORDER,
  JOB_TYPES,
  LOG_EVENTS,
  MAX_FILES,
  expectedPreviousIVRStatus,
  expectedPreviousStatus,
} from '../../common/tcx.constants';
import { getMimeTypeFromKey, isAudioFile } from '../../common/tcx.utils';
import {
  ClusterModelName,
  ConnectorModelName,
  FileModelName,
  IntentModelName,
  JobModelName,
  ProcessMapModelName,
} from '../../database/schemas';
import { CounterService } from '../../infrastructure/counter.service';
import { DataScienceService } from '../../infrastructure/data-science.service';
import { SqsService } from '../../infrastructure/sqs.service';
import { StorageService } from '../../infrastructure/storage.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class JobsService {
  constructor(
    @InjectModel(JobModelName) private readonly jobModel: Model<any>,
    @InjectModel(FileModelName) private readonly fileModel: Model<any>,
    @InjectModel(IntentModelName) private readonly intentModel: Model<any>,
    @InjectModel(ClusterModelName) private readonly clusterModel: Model<any>,
    @InjectModel(ProcessMapModelName) private readonly processMapModel: Model<any>,
    @InjectModel(ConnectorModelName)
    private readonly connectorModel: Model<any>,
    private readonly counterService: CounterService,
    private readonly auditLogsService: AuditLogsService,
    private readonly dataScienceService: DataScienceService,
    private readonly sqsService: SqsService,
    private readonly storageService: StorageService,
  ) {}

  createJob(requestData: any) {
    const { fileType, jobId, s3Key, fileName, metadata, createdBy, jobType } =
      requestData;
    return this.jobModel.create({
      jobId,
      fileType,
      fileName,
      fileLocation: `s3://${
        process.env.STORAGE_BUCKET_NAME ?? 'tcx-transcripts-dev'
      }/${s3Key}`,
      metadata,
      createdBy,
      jobType,
    });
  }

  async createJobV2(requestData: any) {
    const { jobType, connectorId, files, createdBy } = requestData;
    if (!files?.length) throw new BadRequestException('No files provided');
    if (!createdBy) throw new BadRequestException('createdBy is required');
    if (!connectorId) throw new BadRequestException('connectorId is required');

    const connector = await this.connectorModel.findOne({ _id: connectorId });
    if (!connector) {
      throw new NotFoundException('Connector not found');
    }

    const { roleArn, externalId, bucketName, region, folderPrefix, isInternal } =
      connector?.config ?? {};

    let jobStatus: string = LOG_EVENTS.UPLOADED;
    let jobId = await this.counterService.getNextJobId();

    if (jobType === JOB_TYPES.IVR) {
      const expandedFiles = await this.sqsService.expandAndValidateFiles({
        files,
        bucketName,
        folderPrefix,
        region,
      });

      expandedFiles.forEach((file: any) => {
        file.jobId = jobId;
        file.createdBy = createdBy;
        file.filePath = `${file.s3Key}`;
        file.status = LOG_EVENTS.FILE_PROCESSED;
      });

      await this.fileModel.insertMany(expandedFiles);
    } else {
      let creds;
      if (!isInternal) {
        const assumed = await this.storageService.assumeRole(
          roleArn,
          externalId,
          region,
        );
        creds = {
          accessKeyId: assumed.accessKeyId,
          secretAccessKey: assumed.secretAccessKey,
          sessionToken: assumed.sessionToken,
        };
      }

      const expandedFiles: any[] = [];
      const audioFiles: any[] = [];

      for (const item of files) {
        if (expandedFiles.length >= MAX_FILES) break;

        if (item?.type === 'file') {
          const s3Key = `s3://${bucketName}/${
            folderPrefix
              ? folderPrefix.endsWith('/')
                ? folderPrefix + item.name
                : `${folderPrefix}/${item.name}`
              : item.name
          }`;
          const fileMeta = {
            fileName: item?.name,
            fileType: getMimeTypeFromKey(item?.name ?? ''),
            fileSize: item?.fileSize,
            s3Key,
          };
          expandedFiles.push(fileMeta);
          if (isAudioFile(fileMeta)) {
            audioFiles.push(fileMeta);
          }
        } else if (item?.type === 'folder') {
          const prefix = `${folderPrefix || ''}${item.name || ''}${
            item.name.endsWith('/') ? '' : '/'
          }`;
          const remainingSlots = MAX_FILES - expandedFiles.length;
          const folderFiles = await this.storageService.listFilesRecursively(
            creds,
            bucketName,
            region,
            prefix,
            remainingSlots,
          );

          for (const file of folderFiles) {
            if (expandedFiles.length >= MAX_FILES) break;
            expandedFiles.push(file);
            if (isAudioFile(file)) {
              audioFiles.push(file);
            }
          }
        } else {
          throw new BadRequestException('Unsupported type');
        }
      }

      expandedFiles.forEach((file: any) => {
        file.jobId = jobId;
        file.createdBy = createdBy;
        file.filePath = `${file.s3Key}`;
        file.status = isAudioFile(file)
          ? LOG_EVENTS.FILE_PROCESSING
          : LOG_EVENTS.FILE_PROCESSED;
      });

      const insertedFiles = await this.fileModel.insertMany(expandedFiles);
      insertedFiles.forEach((insertedFile: any, index: number) => {
        const audioFile = audioFiles[index];
        if (audioFile) audioFile.fileId = insertedFile?._id.toString();
      });

      for (const audioFile of audioFiles) {
        await this.sqsService.pushToSqs(jobId, audioFile, bucketName);
      }

      jobStatus = audioFiles.length
        ? LOG_EVENTS.TRANSCRIPTS_PROCESSING
        : LOG_EVENTS.TRANSCRIPTS_PROCESSED;
    }

    await this.jobModel.create({
      jobId,
      createdBy,
      connectorId,
      status: jobStatus,
      jobType:
        jobType === JOB_TYPES.IVR ? JOB_TYPES.IVR : JOB_TYPES.CONVERSATIONAL,
    });
    await this.auditLogsService.loggingEvents({
      eventName: jobStatus,
      jobId,
      createdBy,
    });

    return { jobId, status: jobStatus };
  }

  async deleteJob(jobId?: string) {
    if (!jobId) throw new BadRequestException('jobId is required');

    const jobDetails = await this.jobModel.findOne({ jobId });
    if (!jobDetails) throw new NotFoundException("Job doesn't exists!");

    const deletedJob = await this.jobModel.deleteOne({ jobId });
    const deletedFile = await this.fileModel.deleteOne({ jobId });
    const deletedIntents = await this.intentModel.deleteOne({ jobId });
    const deletedClusters = await this.clusterModel.deleteOne({ jobId });
    const deletedProcessMaps = await this.processMapModel.deleteOne({ jobId });

    return {
      deletedJob,
      deletedFile,
      deletedIntents,
      deletedClusters,
      deletedProcessMaps,
    };
  }

  updateJobOnNewFileUpload(
    jobId: string,
    { fileType, s3Key, fileName, metadata, createdBy, jobType }: any,
  ) {
    return this.jobModel.findOneAndUpdate(
      { jobId },
      {
        fileType,
        s3Key,
        fileName,
        metadata,
        createdBy,
        jobType,
        modifiedOn: Date.now(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  updateJobOnUpload({ jobId, transcriptLocation }: any) {
    return this.jobModel.findOneAndUpdate(
      { jobId },
      {
        status: LOG_EVENTS.UPLOADED,
        transcriptLocation,
        modifiedOn: Date.now(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async updateJobData(requestData: any) {
    const { jobId, jobName } = requestData;
    if (!jobId || !jobName) {
      throw new BadRequestException('Invalid or missing data');
    }

    const jobDetails = await this.jobModel.findOne({ jobId });
    if (!jobDetails) throw new NotFoundException("Job doesn't exists!");

    return this.jobModel.findOneAndUpdate(
      { jobId },
      { jobName, modifiedOn: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  getJobList() {
    return this.jobModel.find({});
  }

  getJob(jobId?: string) {
    return this.jobModel.findOne({ jobId });
  }

  async triggerIntentAnalysis(body: any) {
    let {
      jobId,
      newStatus,
      clusterList = [],
      message = '',
      main_intent = '',
      grouped_sub_intent_name = '',
      workflow_json_file = '',
      createdBy,
      improved_blueprint_json = '',
      uml_code = '',
      prompt_tool_defination_json = '',
      api_explanation_json = '',
    } = body;

    if (!jobId) jobId = body.job_id;

    const jobDetails = await this.jobModel.findOne({ jobId });
    if (!jobDetails) throw new NotFoundException("Job doesn't exists!");

    const isIvr = jobDetails?.jobType === 'IVR';
    const currentStatus = jobDetails?.status;
    const files = await this.fileModel.find({ jobId });
    const filePath = files[0]?.filePath;

    const expectedStatus = !isIvr
      ? expectedPreviousStatus[newStatus]
      : expectedPreviousIVRStatus[newStatus];
    if (!expectedStatus) {
      throw new BadRequestException(`Invalid new_status: ${newStatus}`);
    }

    const skipStrictCheck = [
      'PROCESS_FLOW_GENERATION_PENDING',
      'UML_GENERATION_PENDING',
      'AGENTIC_API_GENERATION_PENDING',
      'AGENTIC_JSON_GENERATION_PENDING',
      'BUILD_DEPLOY_AGENT_PENDING',
    ];

    if (
      jobDetails?.jobType !== 'IVR' &&
      jobDetails?.status !== expectedStatus &&
      !skipStrictCheck.includes(newStatus)
    ) {
      throw new BadRequestException(
        `Invalid request: previous status must be '${expectedStatus}' to update to '${newStatus}'`,
      );
    }

    let apiResponse;
    switch (newStatus) {
      case JOB_STATUS.INTENT_ANALYSIS_PENDING:
        apiResponse = !isIvr
          ? await this.dataScienceService.intentAnalysis(jobDetails)
          : await this.dataScienceService.intentAnalysisIvr(jobDetails, filePath);
        break;
      case JOB_STATUS.INTENT_CLUSTERING_PENDING:
        apiResponse = await this.dataScienceService.intentClustering(jobDetails);
        break;
      case JOB_STATUS.PROCESS_FLOW_GENERATION_PENDING:
        apiResponse = !isIvr
          ? await this.dataScienceService.processMap(jobDetails, clusterList)
          : await this.dataScienceService.processMapIvr(jobDetails, filePath);
        break;
      case JOB_STATUS.UML_GENERATION_PENDING:
        apiResponse = await this.dataScienceService.generateUml(
          jobId,
          message,
          main_intent,
          grouped_sub_intent_name,
          workflow_json_file,
        );
        break;
      case JOB_STATUS.AGENTIC_API_GENERATION_PENDING:
        apiResponse = await this.dataScienceService.generateApi(
          jobId,
          message,
          main_intent,
          grouped_sub_intent_name,
          uml_code,
        );
        break;
      case JOB_STATUS.AGENTIC_JSON_GENERATION_PENDING:
        apiResponse = await this.dataScienceService.generateBlueprint(
          jobId,
          message,
          main_intent,
          grouped_sub_intent_name,
          prompt_tool_defination_json,
          api_explanation_json,
        );
        break;
      case JOB_STATUS.BUILD_DEPLOY_AGENT_PENDING:
        apiResponse = await this.dataScienceService.buildDeployAgent(
          jobId,
          message,
          main_intent,
          grouped_sub_intent_name,
          improved_blueprint_json,
        );
        break;
      default:
        apiResponse = null;
    }

    if ((JOB_STATUS_ORDER[newStatus] ?? -1) > (JOB_STATUS_ORDER[currentStatus] ?? -1)) {
      await this.jobModel.findOneAndUpdate(
        { jobId },
        { status: newStatus },
        { new: true },
      );
      await this.auditLogsService.loggingEvents({
        eventName: newStatus,
        jobId,
        createdBy,
      });
    }

    return { jobId, status: newStatus, apiResponse };
  }
}
