export class MessageEntity {}
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { ProductImage } from 'src/product/entities/product.entity';

export type MessageDocument = Message & Document;


// const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' }) 
  senderId: string;

  @Prop({ required: true })
  senderUsername: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' }) 
  receiverId: string;

  
  @Prop({ required: true })
  receiverUsername: string;

  @Prop()
  content?: string;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: [] })
  images?: ProductImage[];
}


export const MessageSchema = SchemaFactory.createForClass(Message);
