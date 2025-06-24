import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from 'src/auth/enums/roles.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    trim: true,
    unique: true,
  })
  username: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
    lowercase: true,
    default: null,
    validate: {
      validator: function (value: string) {
        return !value || value.length >= 6;
      },
      message: 'Email must have at least 6 characters',
    },
  })
  email?: string;

  @Prop({
    trim: true,
    unique: true,
    sparse: true,
    default: null,
    validate: {
      validator: function (value: string) {
        return !value || /^[0-9]{10,11}$/.test(value);
      },
      message: 'Phone number must have 10-11 digits.',
    },
  })
  phone_number?: string;

  @Prop({
    required: true,
    trim: true,
    select: false,
  })
  password: string;

  @Prop({ default: false })
  verified?: boolean;

  @Prop({ select: false })
  verificationCode?: string;

  @Prop({ select: false })
  verificationCodeValidation?: number;

  @Prop({ select: false })
  forgotPasswordCode?: string;

  @Prop({ select: false })
  forgotPasswordCodeValidation?: number;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop()
  address?: string;

  @Prop({
    // type: {type: String, enum: Role},
    default: Role.User
}
)
role: "string"
}

export const UserEntity = SchemaFactory.createForClass(User);

// Custom validation logic
UserEntity.pre<UserDocument>('save', function (next) {
  if (!this.email && !this.phone_number) {
    this.invalidate('email', 'At least one contact method (email or phone number) is required.');
    this.invalidate('phone_number', 'At least one contact method (email or phone number) is required.');
  }
  next();
});
