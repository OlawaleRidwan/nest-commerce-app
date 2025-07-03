import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', unique: true, required: true })
  user: Types.ObjectId;

  @Prop({ type: Number, default: 0, min: 0 })
  balance: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Transaction' }] })
  transactions: Types.ObjectId[];

  @Prop({
    type: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountHolderName: { type: String, required: true },
    },
    required: true,
  })
  accountDetails: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
