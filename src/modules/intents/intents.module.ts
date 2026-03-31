import { Module } from '@nestjs/common';
import { IntentsController } from './intents.controller';
import { IntentsService } from './intents.service';

@Module({
  controllers: [IntentsController],
  providers: [IntentsService],
})
export class IntentsModule {}
