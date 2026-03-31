import { Injectable } from '@nestjs/common';
import { tcxResponse } from '../../common/tcx-response';

@Injectable()
export class ConnectorsService {
  createConnector(body: Record<string, unknown>) {
    return tcxResponse('connectors.createConnector', {
      sourceLambdaModule: 'modules/connector/index.mjs#saveNewConnector',
      requestBody: body,
    });
  }

  updateConnector(id: string | undefined, body: Record<string, unknown>) {
    return tcxResponse('connectors.updateConnector', {
      sourceLambdaModule: 'modules/connector/index.mjs#updateConnector',
      id,
      requestBody: body,
    });
  }

  getConnectors() {
    return tcxResponse('connectors.getConnectors', {
      sourceLambdaModule: 'modules/connector/index.mjs#getConnectorsList',
    });
  }

  listFiles(connectorId?: string, folderPrefix?: string) {
    return tcxResponse('connectors.listFiles', {
      sourceLambdaModule: 'modules/connector/index.mjs#getFilesList',
      connectorId,
      folderPrefix,
    });
  }
}
