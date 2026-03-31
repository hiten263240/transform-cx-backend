import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CounterModelName } from '../database/schemas';

@Injectable()
export class CounterService {
  constructor(
    @InjectModel(CounterModelName)
    private readonly counterModel: Model<any>,
  ) {}

  async getNextJobId() {
    const counter = await this.counterModel.findOneAndUpdate(
      { _id: 'jobId' },
      { $inc: { seq: 1 } },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );

    const paddedSeq = String(counter.seq).padStart(3, '0');
    return `CXJ-${paddedSeq}`;
  }
}
