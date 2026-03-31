import { Body, Controller, Post } from '@nestjs/common';
import { FilesService } from '../files/files.service';
import { RbacService } from '../rbac/rbac.service';
import { SqsService } from '../../infrastructure/sqs.service';

@Controller('internal')
export class SystemController {
  constructor(
    private readonly filesService: FilesService,
    private readonly sqsService: SqsService,
    private readonly rbacService: RbacService,
  ) {}

  @Post('events/s3')
  handleS3Event(@Body('Records') records: any[]) {
    return this.filesService.processFile(records ?? []);
  }

  @Post('events/sqs')
  handleSqsEvent(@Body('Records') records: any[]) {
    return this.sqsService.processConfirmationMessage(records ?? []);
  }

  @Post('cognito/trigger')
  handleCognitoTrigger(@Body() event: any) {
    return this.rbacService.handleCognitoUsers(event?.request?.userAttributes);
  }
}
