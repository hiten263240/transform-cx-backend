import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConnectorModelName } from '../../database/schemas';
import { StorageService } from '../../infrastructure/storage.service';

@Injectable()
export class ConnectorsService {
  constructor(
    @InjectModel(ConnectorModelName)
    private readonly connectorModel: Model<any>,
    private readonly storageService: StorageService,
  ) {}

  async createConnector(requestData: any) {
    const { connectorType, connectionName, isActive } = requestData;

    let config;
    if (connectorType === 'aws') {
      const { roleArn, externalId, region, bucketName, folderPrefix, isInternal } =
        requestData;

      if (
        (isInternal && (!region || !bucketName || roleArn || externalId)) ||
        (!isInternal && (!roleArn || !externalId || !region || !bucketName))
      ) {
        throw new BadRequestException('Keys are invalid');
      }

      await this.storageService.listObjectsWithAssumedRole(
        roleArn,
        externalId,
        region,
        bucketName,
        folderPrefix,
      );

      config = { roleArn, externalId, region, bucketName, folderPrefix, isInternal };
    } else if (connectorType === 'gcp') {
      const { projectId, serviceAccountJson, bucketName, folderPrefix } =
        requestData;
      if (!projectId || !serviceAccountJson || !bucketName) {
        throw new BadRequestException('Keys are invalid');
      }
      config = { projectId, bucketName, folderPrefix };
    } else {
      throw new BadRequestException(
        `Unsupported connector type: ${connectorType}`,
      );
    }

    return this.connectorModel.create({
      connectorType,
      connectionName,
      config,
      isActive,
    });
  }

  async updateConnector(id: string | undefined, requestData: any) {
    if (!id) throw new BadRequestException('Please provide id');

    const { connectorType, connectionName, isActive } = requestData;
    let config;

    if (connectorType === 'aws') {
      const { roleArn, externalId, region, bucketName, folderPrefix } =
        requestData;
      if (!roleArn || !externalId || !region || !bucketName) {
        throw new BadRequestException('Keys are invalid');
      }

      await this.storageService.listObjectsWithAssumedRole(
        roleArn,
        externalId,
        region,
        bucketName,
        folderPrefix,
      );
      config = { roleArn, externalId, region, bucketName, folderPrefix };
    } else if (connectorType === 'gcp') {
      const { projectId, serviceAccountJson, bucketName, folderPrefix } =
        requestData;
      if (!projectId || !serviceAccountJson || !bucketName) {
        throw new BadRequestException('Keys are invalid');
      }
      config = { projectId, serviceAccountJson, bucketName, folderPrefix };
    } else {
      throw new BadRequestException(
        `Unsupported connector type: ${connectorType}`,
      );
    }

    return this.connectorModel.findOneAndUpdate(
      { _id: id },
      { connectorType, connectionName, config, isActive, updateAt: Date.now() },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
  }

  async getConnectors() {
    return this.connectorModel.find({});
  }

  async listFiles(connectorId?: string, folderPrefix?: string) {
    const connectorDetails = await this.connectorModel.findOne({ _id: connectorId });
    if (!connectorDetails) {
      throw new NotFoundException("Connector doesn't exists!");
    }

    const { roleArn, externalId, region, bucketName } = connectorDetails.config;
    return this.storageService.listObjectsWithAssumedRole(
      roleArn,
      externalId,
      region,
      bucketName,
      folderPrefix,
    );
  }
}
