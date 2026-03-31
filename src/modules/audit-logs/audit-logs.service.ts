import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLogModelName } from '../../database/schemas';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectModel(AuditLogModelName)
    private readonly auditLogModel: Model<any>,
  ) {}

  async loggingEvents({
    eventName,
    jobId,
    createdBy,
    payload = {},
  }: {
    eventName: string;
    jobId: string;
    createdBy?: string;
    payload?: Record<string, unknown>;
  }) {
    return this.auditLogModel.create({
      eventName,
      jobId,
      payload,
      addedBy: createdBy,
    });
  }

  async getLogsByJobId(jobId?: string) {
    if (!jobId) {
      throw new BadRequestException('Please provide jobId');
    }

    const data = await this.auditLogModel.find({ jobId });
    if (!data.length) {
      throw new NotFoundException(
        `No logs found for the provided jobId ${jobId}`,
      );
    }

    return data;
  }

  async addLogsToJob(requestData: any) {
    const { jobId, eventName } = requestData;
    const details = await this.auditLogModel.find({ jobId });

    if (!details.length) {
      throw new NotFoundException(`Job not found with Job Id: ${jobId}`);
    }

    return this.auditLogModel.create({
      eventName,
      jobId,
      payload: {},
      addedBy: 'SYSTEM',
    });
  }
}
