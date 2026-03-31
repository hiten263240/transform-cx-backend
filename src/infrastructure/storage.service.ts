import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AWS from 'aws-sdk';
import { STORAGE_CONSTANTS } from '../common/tcx.constants';
import { formatFileSize, getMimeTypeFromKey } from '../common/tcx.utils';

@Injectable()
export class StorageService {
  constructor(private readonly configService: ConfigService) {}

  private getS3(creds?: any, region?: string) {
    return new AWS.S3({
      region: region ?? this.configService.get<string>('AWS_REGION') ?? 'us-east-1',
      ...(creds ? { credentials: creds } : {}),
    });
  }

  getUploadSignedUrl(filePath: string, contentType: string) {
    return this.getS3().getSignedUrlPromise('putObject', {
      Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
      Key: filePath,
      Expires: STORAGE_CONSTANTS.SIGNED_URL_EXPIRY,
      ContentType: contentType,
    });
  }

  getSignedUrl(filePath: string) {
    return this.getS3().getSignedUrlPromise('getObject', {
      Bucket: STORAGE_CONSTANTS.BUCKET_NAME,
      Key: filePath,
      Expires: 60 * 30,
    });
  }

  getFileFromS3(bucketName: string, filePath: string) {
    return this.getS3().getObject({ Bucket: bucketName, Key: filePath }).promise();
  }

  async assumeRole(
    roleArn = '',
    externalId = '',
    region?: string,
    durationSeconds = 1000,
  ) {
    const sts = new AWS.STS({ region });
    const assumedRole = await sts
      .assumeRole({
        RoleArn: roleArn,
        ExternalId: externalId,
        RoleSessionName: 'CrossAccountS3AccessSession',
        DurationSeconds: durationSeconds,
      })
      .promise();

    return {
      accessKeyId: assumedRole?.Credentials?.AccessKeyId ?? '',
      secretAccessKey: assumedRole?.Credentials?.SecretAccessKey ?? '',
      sessionToken: assumedRole?.Credentials?.SessionToken ?? '',
      expiration: assumedRole?.Credentials?.Expiration,
    };
  }

  private async structuredData(
    data: AWS.S3.ListObjectsV2Output,
    prefix: string,
  ) {
    const folders = (data.CommonPrefixes ?? []).map((cp) => ({
      name: cp.Prefix?.replace(prefix, '').replace(/\/$/, '').replace('/', ''),
      type: 'folder',
      path: `${cp.Prefix?.replace(/\/$/, '')}`,
    }));

    const files = (data.Contents ?? [])
      .filter((item) => item.Key !== prefix && !item.Key?.endsWith('/'))
      .map((item) => ({
        name: item.Key?.endsWith('/') ? item.Key?.split('/')[1] : item.Key,
        type: 'file',
        path: `${item.Key}`,
        size: formatFileSize(item.Size ?? 0),
        updatedAt: item.LastModified,
      }));

    return [...folders, ...files];
  }

  async listObjectsWithAssumedRole(
    roleArn = '',
    externalId = '',
    region: string,
    bucket: string,
    prefix = '',
  ) {
    let credentials: any;
    if (roleArn && externalId) {
      const creds = await this.assumeRole(roleArn, externalId, region);
      credentials = {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
      };
    }

    const data = await this.getS3(credentials, region)
      .listObjectsV2({
        Bucket: bucket,
        Delimiter: '/',
        Prefix: prefix === '' ? prefix : `${prefix}/`,
      })
      .promise();

    return { items: await this.structuredData(data, prefix) };
  }

  async listFilesRecursively(
    creds: any,
    bucket: string,
    region: string,
    prefix: string,
    maxFiles: number,
    collectedFiles: any[] = [],
  ) {
    let continuationToken: string | undefined;
    const s3 = this.getS3(creds, region);

    do {
      const response = await s3
        .listObjectsV2({
          Bucket: bucket,
          Delimiter: '/',
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      for (const obj of response.Contents ?? []) {
        if (obj.Key?.endsWith('/')) continue;

        collectedFiles.push({
          fileName: obj.Key?.split('/').pop(),
          fileType: getMimeTypeFromKey(obj.Key ?? ''),
          s3Key: `s3://${bucket}/${obj.Key}`,
          fileSize: obj.Size,
        });

        if (collectedFiles.length >= maxFiles) {
          return collectedFiles;
        }
      }

      continuationToken = response.IsTruncated
        ? response.NextContinuationToken
        : undefined;
    } while (continuationToken);

    return collectedFiles;
  }
}
