import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './entities/auth.entity';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { SendVerificationEmailListener } from 'src/listeners/send-verification-email.listener';
import { MailService } from 'src/mail/mail.service';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtStrategy } from './jwt.strategy';
import { UserModule } from 'src/user/user.module';



@Module({

  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({defaultStrategy: 'jwt'}),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          secret: config.get('JWT_SECRET'),
          signOptions:{
            expiresIn: config.get<string | number>('JWT_EXPIRES')}
        }
      }
    }),
    // EventEmitterModule,
    CqrsModule

  ],
  
  controllers: [AuthController],
  providers: [AuthService,SendVerificationEmailListener, MailService, JwtStrategy],
  exports: [PassportModule, JwtModule]
})
export class AuthModule {}
