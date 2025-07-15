import { Controller, Get, Post, Body, Patch, Param, Delete, Res, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { UpdateUserDetailsDto} from './dto/create-user.dto';

import { AuthGuard } from '@nestjs/passport';


@Controller('auth')
export class UserController {
  constructor(private readonly authService: UserService) {}

 

  // auth.controller.ts
@UseGuards(AuthGuard('jwt'))
@Patch('update-user-details')
async updateUserDetails(
  @Req() req: any,
  @Body() dto: UpdateUserDetailsDto
) {
  const { userId, verified } = req.user;
  return this.authService.updateUserDetails(userId, verified, dto);
}



}
