import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { FilesService } from './files.service';

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('file-upload')
  generateUploadUrl(@Body() body: Record<string, unknown>) {
    return this.filesService.generateUploadUrl(body);
  }

  @Get('job/files')
  listFiles(@Query('jobId') jobId?: string) {
    return this.filesService.listFiles(jobId);
  }
}
