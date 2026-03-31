import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AgenticApiModelName,
  AgenticApiSchema,
  AgenticBlueprintModelName,
  AgenticBlueprintSchema,
  AgenticDeploymentModelName,
  AgenticDeploymentSchema,
  AgenticGenerationModelName,
  AgenticGenerationSchema,
  AuditLogModelName,
  AuditLogSchema,
  ClusterModelName,
  ClusterSchema,
  CognitoUserModelName,
  CognitoUserSchema,
  ConnectorModelName,
  ConnectorSchema,
  CounterModelName,
  CounterSchema,
  FileModelName,
  FileSchema,
  IntentModelName,
  IntentSchema,
  JobModelName,
  JobSchema,
  PageModelName,
  PageSchema,
  ProcessMapIvrModelName,
  ProcessMapIvrSchema,
  ProcessMapModelName,
  ProcessMapSchema,
  QaJobModelName,
  QaJobSchema,
  RoleModelName,
  RoleSchema,
  UmlDiagramModelName,
  UmlDiagramSchema,
} from './schemas';

@Global()
@Module({
  imports: [
    ConfigModule,
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const uri =
          configService.get<string>('MONGO_URI') ??
          'mongodb://127.0.0.1:27017/tcx';
        const tls = configService.get<string>('MONGO_TLS') === 'true';
        const tlsCAFile = configService.get<string>('MONGO_TLS_CA_FILE');
        const authMechanism = configService.get<string>('MONGO_AUTH_MECHANISM');

        return {
          uri,
          ...(tls ? { tls: true } : {}),
          ...(tls && tlsCAFile ? { tlsCAFile } : {}),
          ...(authMechanism ? { authMechanism: authMechanism as any } : {}),
        };
      },
    }),
    MongooseModule.forFeature([
      { name: CounterModelName, schema: CounterSchema },
      { name: JobModelName, schema: JobSchema },
      { name: FileModelName, schema: FileSchema },
      { name: ConnectorModelName, schema: ConnectorSchema },
      { name: IntentModelName, schema: IntentSchema },
      { name: ClusterModelName, schema: ClusterSchema },
      { name: ProcessMapModelName, schema: ProcessMapSchema },
      { name: ProcessMapIvrModelName, schema: ProcessMapIvrSchema },
      { name: AgenticGenerationModelName, schema: AgenticGenerationSchema },
      { name: AgenticApiModelName, schema: AgenticApiSchema },
      { name: AgenticBlueprintModelName, schema: AgenticBlueprintSchema },
      { name: AgenticDeploymentModelName, schema: AgenticDeploymentSchema },
      { name: UmlDiagramModelName, schema: UmlDiagramSchema },
      { name: RoleModelName, schema: RoleSchema },
      { name: PageModelName, schema: PageSchema },
      { name: CognitoUserModelName, schema: CognitoUserSchema },
      { name: AuditLogModelName, schema: AuditLogSchema },
      { name: QaJobModelName, schema: QaJobSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
