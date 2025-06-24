import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Schema as MongooseSchema } from "mongoose";
import { Types } from 'mongoose';

// Enum for Product Categories
export enum ProductCategory {
  ELECTRONICS = "Electronics",
  CLOTHING = "Clothing",
  HOME_APPLIANCES = "Home Appliances",
  BEAUTY = "Beauty",
  SPORTS = "Sports",
  TOYS = "Toys",
  BOOKS = "Books",
  FOOD = "Food",
  AUTOMOTIVE = "Automotive",
}

// Subdocument schema for Image
@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  Bucket: string;

  @Prop({ required: true })
  Key: string;

  @Prop({ required: true })
  Location: string;
}

const ProductImageSchema = SchemaFactory.createForClass(ProductImage);

@Schema({ timestamps: true })
export class Product extends Document {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  totalPrice: number;

  @Prop({ required: true, min: 0 })
  quantity: number;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  color?: string;

  @Prop({ trim: true })
  size?: string;

  @Prop({ 
    type: String, 
    enum: Object.values(ProductCategory), 
    required: true 
  })
  category: ProductCategory;

  @Prop({ type: [ProductImageSchema], default: [] })
  images?: ProductImage[];

  // @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  // user?: MongooseSchema.Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;
}

export const ProductEntity = SchemaFactory.createForClass(Product);
