import { Controller, Get, Param, Query, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';

import { RequestWithUser } from '../types/request-with-user.interface';
import { Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('summaries')
  async getChatSummaries(
    @Req() req: RequestWithUser,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const userId = req.user?.userId;


if (!userId) {
  throw new UnauthorizedException('User ID not found');
}
    return this.chatService.getChatSummaries(userId, +page, +limit);
  }

  @Get('conversation/:partnerId')
  async getConversation(
    @Req() req: RequestWithUser,
    @Param('partnerId') partnerId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    
    
const userId = req.user?.userId;
if (!userId) {
  throw new UnauthorizedException('User ID not found');
}
    return this.chatService.getConversation(userId, partnerId, +limit, +page);
  }
}
