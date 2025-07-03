import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  })
  buyerEmail: string;

  @Prop({ required: true, trim: true })
  buyerName: string;

  @Prop({ required: true, unique: true })
  paymentId: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  seller: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending',
  })
  status: 'pending' | 'completed' | 'failed';

  @Prop({
    type: String,
    enum: ['card', 'paypal', 'crypto', 'bank_transfer'],
    required: true,
  })
  paymentMethod: 'card' | 'paypal' | 'crypto' | 'bank_transfer';
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
