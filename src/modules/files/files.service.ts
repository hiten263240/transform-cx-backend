import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  JOB_TYPES,
  LOG_EVENTS,
  STORAGE_CONSTANTS,
} from '../../common/tcx.constants';
import { isValidFilename } from '../../common/tcx.utils';
import { FileModelName, JobModelName } from '../../database/schemas';
import { CounterService } from '../../infrastructure/counter.service';
import { DataScienceService } from '../../infrastructure/data-science.service';
import { StorageService } from '../../infrastructure/storage.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectModel(JobModelName) private readonly jobModel: Model<any>,
    @InjectModel(FileModelName) private readonly fileModel: Model<any>,
    private readonly counterService: CounterService,
    private readonly storageService: StorageService,
    private readonly dataScienceService: DataScienceService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async generateUploadUrl(requestData: any) {
    const { oldJobId, fileType, jobType, fileName, metadata, createdBy } =
      requestData;

    if (!fileType || !fileName) {
      throw new BadRequestException('Missing fileType or fileName!');
    }
    if (!isValidFilename(fileName)) {
      throw new BadRequestException('Invalid fileName!');
    }

    const oldJobIdValid = oldJobId && oldJobId !== 'new';
    const jobId = oldJobIdValid
      ? oldJobId
      : await this.counterService.getNextJobId();

    const s3Folder =
      fileType === 'xlsx' ? 'excel' : fileType === 'zip' ? 'ivr' : 'audio';
    const s3Key = `${s3Folder}/${jobId}.${
      fileType === 'xlsx' ? 'xlsx' : fileType === 'zip' ? 'zip' : 'wav'
    }`;
    const contentType =
      fileType === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : fileType === 'zip'
          ? 'application/x-zip-compressed'
          : 'audio/wav';

    if (fileType === 'zip') {
      await this.dataScienceService.ivrValidation(
        jobId,
        'compressedfileLocation',
        s3Key,
      );
    }

    const uploadUrl = await this.storageService.getUploadSignedUrl(
      s3Key,
      contentType,
    );

    if (!oldJobIdValid) {
      await this.jobModel.create({
        jobId,
        fileType,
        fileName,
        fileLocation: `s3://${STORAGE_CONSTANTS.BUCKET_NAME}/${s3Key}`,
        metadata,
        createdBy,
        jobType,
      });

      await this.fileModel.create({
        jobId,
        fileType,
        filePath: s3Key,
        fileName,
      });

      await this.auditLogsService.loggingEvents({
        eventName: metadata?.expressModeEnabled
          ? metadata?.automatedSteps?.[metadata?.automatedSteps.length - 1]
          : LOG_EVENTS.UPLOADED,
        jobId,
        createdBy,
      });
    } else {
      await this.jobModel.findOneAndUpdate(
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

      await this.fileModel.findOneAndUpdate(
        { jobId },
        { fileType, filePath: s3Key, fileName, modifiedOn: Date.now() },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return { uploadUrl, jobId };
  }

  async processFile(eventRecords: any[]) {
    for (const record of eventRecords) {
      const key = decodeURIComponent(
        record.s3.object.key.replace(/\+/g, ' '),
      );
      const fileDetails = key.split('/');
      const fileType = fileDetails?.[0];
      const fileName = fileDetails?.[fileDetails.length - 1];
      const jobId = fileName.split('.')?.[0];

      if (!['audio', 'excel', 'csv'].includes(fileType?.toLowerCase())) {
        continue;
      }

      const transcriptLocation =
        fileType?.toLowerCase() === 'audio'
          ? `s3://${STORAGE_CONSTANTS.BUCKET_NAME}/text-transcripts/${jobId}.txt`
          : '';

      await this.jobModel.findOneAndUpdate(
        { jobId },
        {
          status: LOG_EVENTS.UPLOADED,
          transcriptLocation,
          modifiedOn: Date.now(),
          jobType: fileType === 'zip' ? JOB_TYPES.IVR : undefined,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      );
    }

    return { processed: eventRecords.length };
  }

  listFiles(jobId?: string) {
    return this.fileModel.find({ jobId });
  }
}
