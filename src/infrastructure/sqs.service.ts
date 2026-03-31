import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { LOG_EVENTS } from '../common/tcx.constants';
import { getFileExtension, getMimeTypeFromKey } from '../common/tcx.utils';
import { FileModelName, JobModelName } from '../database/schemas';
import { DataScienceService } from './data-science.service';

@Injectable()
export class SqsService {
  private readonly sqsClient = new SQSClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
  });

  constructor(
    @InjectModel(FileModelName) private readonly fileModel: Model<any>,
    @InjectModel(JobModelName) private readonly jobModel: Model<any>,
    private readonly dataScienceService: DataScienceService,
  ) {}

  async pushToSqs(jobId: string, file: any, bucketName: string) {
    getFileExtension(file?.fileName ?? '');
    const queueUrl = process.env.AUDIO_SQS_QUEUE_URL;
    if (!queueUrl) {
      throw new Error('AUDIO_SQS_QUEUE_URL is not configured');
    }

    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify({
          metadata: { jobId, fileId: file?.fileId },
          source_file_name: file?.s3Key,
          destination_transcript_file_name: `s3://${bucketName}/text-transcripts/${(file?.fileName ?? '').split('.')[0]}.txt`,
        }),
      }),
    );
  }

  async processConfirmationMessage(eventRecords: any[]) {
    for (const record of eventRecords) {
      const body = JSON.parse(record?.body ?? '{}');
      const { metadata, transcription_status, status_code } = body;

      if (transcription_status === 'success' && status_code === 200) {
        await this.fileModel.findOneAndUpdate(
          { jobId: metadata?.jobId, _id: metadata?.fileId },
          { status: LOG_EVENTS.FILE_PROCESSED, modifiedOn: Date.now() },
          { new: true },
        );
      } else if (status_code === 500) {
        await this.fileModel.findOneAndUpdate(
          { jobId: metadata?.jobId, _id: metadata?.fileId },
          { status: 'failed', modifiedOn: Date.now() },
          { new: true },
        );
      }

      const processingFile = await this.fileModel.findOne({
        jobId: metadata?.jobId,
        status: LOG_EVENTS.FILE_PROCESSING,
      });

      if (!processingFile) {
        await this.jobModel.findOneAndUpdate(
          { jobId: metadata?.jobId },
          { status: LOG_EVENTS.TRANSCRIPTS_PROCESSED },
          { new: true },
        );
      }
    }
  }

  async expandAndValidateFiles({
    files,
    bucketName,
    folderPrefix,
  }: {
    files: any[];
    bucketName: string;
    folderPrefix?: string;
    creds?: any;
    region: string;
  }) {
    const expandedFiles: any[] = [];
    for (const item of files) {
      if (item?.type === 'file') {
        if (getMimeTypeFromKey(item?.name ?? '') !== 'application/zip') {
          throw new Error('Invalid File Type- ZIP File Supported');
        }

        const s3Key = `s3://${bucketName}/${
          folderPrefix
            ? folderPrefix.endsWith('/')
              ? folderPrefix + item.name
              : `${folderPrefix}/${item.name}`
            : item.name
        }`;

        await this.dataScienceService.ivrValidation(
          '',
          'compressedfileLocation',
          s3Key,
        );

        expandedFiles.push({
          fileName: item?.name,
          fileType: getMimeTypeFromKey(item?.name ?? ''),
          fileSize: item?.fileSize,
          s3Key,
        });
      } else if (item?.type === 'folder') {
        const s3Key = `s3://${bucketName}/${item?.filePath}`;
        await this.dataScienceService.ivrValidation('', 'folderLocation', s3Key);
        expandedFiles.push({
          fileName: item?.name,
          fileType: 'folder',
          s3Key,
        });
      }
    }

    return expandedFiles;
  }
}
