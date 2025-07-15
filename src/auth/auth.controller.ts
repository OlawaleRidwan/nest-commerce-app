import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AcceptCodeDto, SignupDto,SigninDto, ForgotPasswordDto, AcceptForgotPasswordCodeDto, SendVerificationCodeDto} from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() createAuthDto: SignupDto) {
    return this.authService.signUp(createAuthDto);
  }

  @Post('signin')
  async signIn(@Body() signinDto: SigninDto, @Res({ passthrough: true }) res: Response) {
    const { token, ...result } = await this.authService.signin(signinDto);

    res.cookie('Authorization', `Bearer ${token}`, {
      expires: new Date(Date.now() + 8 * 3600000),
      httpOnly: process.env.NODE_ENV === 'production',
      secure: process.env.NODE_ENV === 'production',
    });

    return { ...result, token };
  }

  @Post('signout')
  signOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('Authorization');
    const result = this.authService.signOut();
    res.status(200).json(result);
  }

  @Patch('verify-verification-code')
  verifyVerificationCode(@Body() updateAuthDto: AcceptCodeDto) {
    return this.authService.verifyVerificationCode(updateAuthDto);
  }

  // auth.controller.ts


@Post('send-verification-code')
async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
  return this.authService.sendVerificationCode(dto);
}

@Post('send-forgot-password')
  async sendForgotPasswordCode(@Body() dto: ForgotPasswordDto) {
    return await this.authService.sendForgotPasswordCode(dto);
}

@Post('verify-forgot-password')
  async verifyForgotPasswordCode(@Body() dto: AcceptForgotPasswordCodeDto) {
    return this.authService.verifyForgotPasswordCode(dto);
  }


}
