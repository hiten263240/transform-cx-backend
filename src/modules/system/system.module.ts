import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { RbacModule } from '../rbac/rbac.module';
import { SystemController } from './system.controller';

@Module({
  imports: [FilesModule, RbacModule],
  controllers: [SystemController],
})
export class SystemModule {}
