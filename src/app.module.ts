import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { InfrastructureModule } from './infrastructure/infrastructure.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { FilesModule } from './modules/files/files.module';
import { IntentsModule } from './modules/intents/intents.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { QaModule } from './modules/qa/qa.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { SystemModule } from './modules/system/system.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    InfrastructureModule,
    AuditLogsModule,
    JobsModule,
    FilesModule,
    ConnectorsModule,
    IntentsModule,
    RbacModule,
    QaModule,
    SystemModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
