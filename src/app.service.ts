import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      service: 'transform-cx-backend',
      message: 'TCX Nest migration starter is running',
    };
  }
}
