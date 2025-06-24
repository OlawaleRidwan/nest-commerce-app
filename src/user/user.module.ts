import { forwardRef, Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { AuthModule } from 'src/auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { UserEntity } from './entities/user.entity';

@Module({
  imports: [
    forwardRef(() => AuthModule),
     MongooseModule.forFeature([{name: 'User', schema:UserEntity}]),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [MongooseModule,UserService],
})
export class UserModule {}
