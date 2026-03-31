import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConnectorsModule } from './modules/connectors/connectors.module';
import { FilesModule } from './modules/files/files.module';
import { IntentsModule } from './modules/intents/intents.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { QaModule } from './modules/qa/qa.module';
import { RbacModule } from './modules/rbac/rbac.module';

@Module({
  imports: [
    JobsModule,
    FilesModule,
    ConnectorsModule,
    IntentsModule,
    RbacModule,
    QaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
