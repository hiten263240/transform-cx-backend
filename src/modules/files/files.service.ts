import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class FilesService {
  generateUploadUrl(body: Record<string, unknown>) {
    return tcxResponse('files.generateUploadUrl', {
      sourceLambdaModule: 'modules/files/index.mjs#generateFileUploadURL',
      requestBody: body,
    });
  }

  listFiles(jobId?: string) {
    return tcxResponse('files.listFiles', {
      sourceLambdaModule: 'modules/files/index.mjs#listFiles',
      jobId,
    });
  }
}
