import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async upsertUser(clerkId: string, fullName: string, imageUrl: string): Promise<UserDocument> {
    return this.userModel.findOneAndUpdate(
      { clerkId },
      { $set: { fullName, imageUrl } },
      { upsert: true, new: true },
    ).exec();
  }

  async findByClerkId(clerkId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ clerkId }).exec();
  }
}

