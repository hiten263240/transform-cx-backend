import { Body, Controller, Get, Post, Put, Query } from '@nestjs/common';
import { ConnectorsService } from './connectors.service';

@Controller()
export class ConnectorsController {
  constructor(private readonly connectorsService: ConnectorsService) {}

  @Post('connector-storage')
  createConnector(@Body() body: Record<string, unknown>) {
    return this.connectorsService.createConnector(body);
  }

  @Put('connector-storage')
  updateConnector(
    @Query('id') id: string | undefined,
    @Body() body: Record<string, unknown>,
  ) {
    return this.connectorsService.updateConnector(id, body);
  }

  @Get('connector-storage')
  getConnectors() {
    return this.connectorsService.getConnectors();
  }

  @Get('list-files')
  listFiles(
    @Query('connectorId') connectorId?: string,
    @Query('folderPrefix') folderPrefix?: string,
  ) {
    return this.connectorsService.listFiles(connectorId, folderPrefix);
  }
}
