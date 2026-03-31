import { Global, Module } from '@nestjs/common';
import { CognitoAwsService } from './cognito-aws.service';
import { CounterService } from './counter.service';
import { DataScienceService } from './data-science.service';
import { SqsService } from './sqs.service';
import { StorageService } from './storage.service';

@Global()
@Module({
  providers: [
    CounterService,
    DataScienceService,
    StorageService,
    SqsService,
    CognitoAwsService,
  ],
  exports: [
    CounterService,
    DataScienceService,
    StorageService,
    SqsService,
    CognitoAwsService,
  ],
})
export class InfrastructureModule {}
