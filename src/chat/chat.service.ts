import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Message, MessageDocument } from './entities/message.entity';
import { uploadImages } from 'src/utils/aws';
import { SimulatedFile } from './chat.gateway';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async getChatSummaries(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const result = await this.messageModel.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            chatPartnerId: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverId',
                '$senderId',
              ],
            },
            chatPartnerUsername: {
              $cond: [
                { $eq: ['$senderId', userId] },
                '$receiverUsername',
                '$senderUsername',
              ],
            },
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', userId] },
                    { $eq: ['$read', false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          chatPartnerUsername: '$_id.chatPartnerUsername',
          lastMessage: {
            content: '$lastMessage.content',
            createdAt: '$lastMessage.createdAt',
            read: '$lastMessage.read',
          },
          unreadCount: 1,
        },
      },
      {
        $sort: { 'lastMessage.createdAt': -1 },
      },
      {
        $facet: {
          data: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: 'count' }],
        },
      },
    ]);

    const chats = result[0]?.data || [];
    const total = result[0]?.totalCount[0]?.count || 0;

    return {
      data: chats,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
  async getConversation(userId: string, chatPartnerId: string, limit = 50, page = 1) {
    const skip = (page - 1) * limit;

    console.log('userId:', typeof userId, userId);
    console.log('chatPartnerId:',typeof chatPartnerId, chatPartnerId);

    const messages = await this.messageModel
      .find({
        $or: [
          { senderId: new Types.ObjectId(userId), receiverId: new Types.ObjectId(chatPartnerId) },
          { senderId: new Types.ObjectId(chatPartnerId), receiverId: new Types.ObjectId(userId) },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    console.log(messages)
    return messages.reverse(); // optional: return in chronological order
  }

  async sendMessage(
    senderId: string, 
    receiverId: string, 
    content: string,
     senderUsername: string,
      receiverUsername: string,
    files: SimulatedFile[] = []
) {
let images;
console.log("files", files)

if (files?.length > 0) {
  images = await uploadImages(files,"chats"); // upload only if files exist
}
console.log("first console.log")
// Build the data to save to the database
const dataToSave: any = {
      senderId,
      receiverId,
      content,
      senderUsername,
      receiverUsername,
    }
console.log("second console.log")

if (images) {
  dataToSave.images = images; // add images only if they were uploaded
}
console.log("data", dataToSave)
    const message = new this.messageModel(dataToSave);

    await message.save();
    return message;
  }

  async markAsRead(userId: string, chatPartnerId: string) {
    const result = await this.messageModel.updateMany(
      {
        senderId: chatPartnerId,
        receiverId: userId,
        read: false,
      },
      { $set: { read: true } },
    );

    return { modified: result.modifiedCount };
  }
}
