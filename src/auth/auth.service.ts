import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { SignupDto ,AcceptCodeDto, SigninDto, ForgotPasswordDto, AcceptForgotPasswordCodeDto, SendVerificationCodeDto} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from '../user/entities/user.entity';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserSignedUpEvent } from '../events/user-signed-up.event';
import { generateCode } from 'src/utils/generate-code';
import { doHash, doHashValidation , hmacProcess} from "../utils/hashing";
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventBus } from '@nestjs/cqrs';
import { UserService } from 'src/user/user.service';


@Injectable()
export class AuthService {
  constructor(

    // private eventEmitter: EventEmitter2,
    private eventBus: EventBus,
    private jwtService: JwtService,
    private configService: ConfigService,
    private userService: UserService
  ) {}

  async signUp(createAuthDto: SignupDto) {
    const { username, email_or_phone_number, password, role } = createAuthDto;

    // Determine whether input is an email
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email_or_phone_number);


  const orConditions: Record<string, any>[] = []; // generic and safe


if (isEmail && email_or_phone_number) {
  orConditions.push({ email: email_or_phone_number });
}

if (!isEmail && email_or_phone_number) {
  orConditions.push({ phone_number: email_or_phone_number });
}

if (username) {
  orConditions.push({ username });
}
    // Check if user already exists by email or phone number
    // const existingUser = await this.userService.getOneByQuery({
    //   $or: [
    //     { email: isEmail ? email_or_phone_number : undefined },
    //     { phone_number: !isEmail ? email_or_phone_number : undefined },
    //     { username },
    //   ],
    // });
  const existingUser = await this.userService.getOneByQuery({
  $or: orConditions,
});

    if (existingUser) {
      throw new BadRequestException('User with given credentials already exists');
    }

    const hashedPassword = await doHash(password, 10);

    const codeValue = generateCode().toString() // generate a unique code

    let message = `Hello ${username}, Here is your verification code ${codeValue}`

    // const newUser = {
    //   username,
    //   email: isEmail ? email_or_phone_number : undefined,
    //   phone_number: !isEmail ? email_or_phone_number : undefined,
    //   password: hashedPassword,
    //   role,
    // };

    const newUser: any = {
  username,
  password: hashedPassword,
  role
};

if (isEmail) {
  newUser.email = email_or_phone_number;
} else {
  newUser.phone_number = email_or_phone_number;
}
    const createdUser = await this.userService.createUser(newUser)

  //   this.eventEmitter.emit(
  //   'user.signed_up',
  //   new UserSignedUpEvent(newUser.email as string, message ),
  // );

  this.eventBus.publish(
    new UserSignedUpEvent(newUser.email as string, message)
  );
  const hashedCodeValue = hmacProcess(codeValue.toString())
  console.log({ hashedCodeValue })
  createdUser.verificationCode = hashedCodeValue;
  createdUser.verificationCodeValidation = Date.now() + 5 * 60 * 1000; // expires in 5 minutes
  const result = await createdUser.save();
  // Remove sensitive fields before returning
  result.password = "";

  return { message: 'Signup successful, verification email sent.' };

  }


  async signin(dto: SigninDto) {
    const { email_or_phone_number, password } = dto;

    const user = await this.userService.getOneByQuery({
      $or: [
        { email: email_or_phone_number },
        { phone_number: email_or_phone_number },
      ],
    },'+password');

    if (!user) {
      throw new UnauthorizedException('User does not exist!');
    }

    const isValidPassword = await doHashValidation(password, user.password);

    if (!isValidPassword) {
      throw new UnauthorizedException('Incorrect password!');
    }

    const payload = {
      userId: user._id,
      user_name: user.username,
      verified: user.verified,
    };

    const token = this.jwtService.sign(payload, {
      secret: this.configService.get('TOKEN_SECRET'),
      expiresIn: '8h',
    });

    return {
      success: true,
      token,
      message: 'Logged in successfully',
    };
  }

  signOut(): { success: boolean; message: string } {
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }



  // auth.service.ts


  async verifyVerificationCode(acceptCodeDto: AcceptCodeDto) {
    const { email_or_phone_number, providedCode } = acceptCodeDto;

    const user = await this.userService.getOneByQuery({
      $or: [
        { email: email_or_phone_number },
        { phone_number: email_or_phone_number },
      ],
    },'+verificationCode +verificationCodeValidation +verified')

    if (!user) {
      throw new NotFoundException('User does not exist!');
    }

    if (user.verified) {
      throw new BadRequestException('You are already verified');
    }

    if (!user.verificationCode || !user.verificationCodeValidation) {
      throw new BadRequestException('Verification code not set');
    }

    const isExpired = Date.now() > user.verificationCodeValidation;
    if (isExpired ) {
      throw new BadRequestException('Code has expired');
    }

    const hashedCode = hmacProcess(providedCode.toString());
    console.log(hashedCode)
    if (hashedCode !== user.verificationCode) {
      throw new BadRequestException('Invalid verification code');
    }

    user.verified = true;
    user.verificationCode = undefined;
    user.verificationCodeValidation = undefined;

    await user.save();

    return {
      success: true,
      message: 'Your account has been verified',
    };
    
  }

  async sendForgotPasswordCode(dto: ForgotPasswordDto) {
    const { email_or_phone_number } = dto;

    const existingUser = await this.userService.getOneByQuery({
      $or: [
        { email: email_or_phone_number },
        { phone_number: email_or_phone_number },
      ],
    });

    if (!existingUser) {
      throw new NotFoundException('User does not exist!');
    }

    // const codeValue = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const codeValue = generateCode().toString()
    const message = `Hello ${existingUser.username} Here is your forgot password code: ${codeValue}`;

    this.eventBus.publish(
      new UserSignedUpEvent(existingUser.email as string, message)
    );


    
      const hashedCodeValue = hmacProcess(codeValue);
      existingUser.forgotPasswordCode = hashedCodeValue;
      existingUser.forgotPasswordCodeValidation = Date.now() + 5 * 60 * 1000;
      await existingUser.save();

      return { success: true, message: 'Code sent' };
    
  }

  async verifyForgotPasswordCode(dto: AcceptForgotPasswordCodeDto) {
    const { email_or_phone_number, providedCode, newPassword } = dto;
  
    const codeValue = providedCode.toString();

    const user = await this.userService.getOneByQuery(
      {
        $or: [
          { email: email_or_phone_number },
          { phone_number: email_or_phone_number },
        ],
      },
      'forgotPasswordCode forgotPasswordCodeValidation password'
    );

    if (!user) throw new UnauthorizedException('User does not exist!');

    if (!user.forgotPasswordCode || !user.forgotPasswordCodeValidation) {
      throw new BadRequestException('Something is wrong with the code');
    }

    if (Date.now() > user.forgotPasswordCodeValidation) {
      throw new BadRequestException('Code has expired');
    }

    const hashedCodeValue = hmacProcess(codeValue);

    if (hashedCodeValue !== user.forgotPasswordCode) {
      throw new BadRequestException('Unexpected error occurred!');
    }

    user.password = await doHash(newPassword, 10);
    user.forgotPasswordCode = undefined;
    user.forgotPasswordCodeValidation = undefined;

    await user.save();

    return { success: true, message: 'Password updated' };
  }


  async sendVerificationCode({ email_or_phone_number }: SendVerificationCodeDto) {
    
    const existingUser = await this.userService.getOneByQuery({
      $or: [{ email: email_or_phone_number }, { phone_number: email_or_phone_number }],
    });
  
    if (!existingUser) {
      throw new NotFoundException('User does not exist!');
    }
  
    if (existingUser.verified) {
      throw new BadRequestException('You are already verified!');
    }
  
    // const codeValue = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const codeValue = generateCode().toString()
    const message = `Hello ${existingUser.username} Here is your forgot password code: ${codeValue}`;

    this.eventBus.publish(
      new UserSignedUpEvent(existingUser.email as string, message)
    );
    
      const hashedCodeValue = hmacProcess(codeValue);
      existingUser.verificationCode = hashedCodeValue;
      existingUser.verificationCodeValidation = Date.now() + 5 * 60 * 1000;
      await existingUser.save();
      
      return { success: true, message: 'Code sent' };
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  

}
