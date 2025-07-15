import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { HttpStatus, ParseFilePipeBuilder, UploadedFiles } from '@nestjs/common';
import { AiService } from './ai.service';


export interface SimulatedFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private onlineUsers = new Map<string, Socket>();

  constructor(
    private readonly chatService: ChatService,
    private readonly aiService: AiService,
  ) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.onlineUsers.set(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = [...this.onlineUsers.entries()].find(
      ([, sock]) => sock.id === client.id,
    )?.[0];
    if (userId) {
      this.onlineUsers.delete(userId);
    }
  }

  // @SubscribeMessage('send_message')
  // async handleMessage(
  //   @MessageBody()
  //   data: {
  //     senderId: string;
  //     receiverId: string;
  //     content: string;
  //     senderUsername: string;
  //     receiverUsername: string;
  //   },
  //   @UploadedFiles(
  //         new ParseFilePipeBuilder()
  //         .addFileTypeValidator({
  //             fileType: /(jpg|jpeg|png)$/
  //         })
  //         .addMaxSizeValidator({
  //             maxSize: 10 * 1000,
  //             message: "File size must be less than 10kb"
  //         })
  //         .build({
  //             errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
  //             fileIsRequired: false,
  //         })
  //     ) files: Array<Express.Multer.File>
  // ) {
  //   const message = await this.chatService.sendMessage(
  //     data.senderId,
  //     data.receiverId,
  //     data.content,
  //     data.senderUsername,
  //     data.receiverUsername,
  //     files
  //   );

  //   const receiverSocket = this.onlineUsers.get(data.receiverId);
  //   if (receiverSocket) {
  //     receiverSocket.emit('new_message', message);
  //   }

  //   return message;
  // }

@SubscribeMessage('send_message')
async handleMessage(
  @MessageBody()
  data: {
    senderId: string;
    receiverId: string;
    content: string;
    senderUsername: string;
    receiverUsername: string;
    image?: string;
    imageMimeType?: string;
  },
) {
  let images: SimulatedFile[] = [];

  if (data.image && data.imageMimeType) {
    const buffer = Buffer.from(data.image.split(',')[1], 'base64');
    images.push({
      buffer,
      originalname: `chat-${Date.now()}.png`,
      mimetype: data.imageMimeType,
    });
  }

  // Step 1: Save user message
  const userMessage = await this.chatService.sendMessage(
    data.senderId,
    data.receiverId,
    data.content,
    data.senderUsername,
    data.receiverUsername,
    images,
  );

  const receiverSocket = this.onlineUsers.get(data.receiverId);
  if (receiverSocket) {
    receiverSocket.emit('new_message', userMessage);
  }

  // Step 2: Check if the receiver is AI (can be a fixed receiverId like "ai" or "AI")
  if (data.receiverId === '6875f8007d3f2d5da576d7b0') {
    const aiReplyText = await this.aiService.generateReply(data.content);

    const aiMessage = await this.chatService.sendMessage(
      data.receiverId,      // AI becomes the sender
      data.senderId,        // Original user becomes the receiver
      aiReplyText,
      data.receiverUsername, // "AI"
      data.senderUsername,
    );

    const senderSocket = this.onlineUsers.get(data.senderId);
    if (senderSocket) {
      senderSocket.emit('new_message', aiMessage);
    }
  }

  return userMessage;
}


  @SubscribeMessage('mark_as_read')
  async handleMarkAsRead(
    @MessageBody() data: { userId: string; chatPartnerId: string },
  ) {
    return await this.chatService.markAsRead(data.userId, data.chatPartnerId);
  }

  @SubscribeMessage('get_chat_summaries')
async handleChatSummaries(
  @MessageBody()
  data: {
    userId: string;
    page?: number;
    limit?: number;
  },
) {
  const { userId, page = 1, limit = 10 } = data;
  return await this.chatService.getChatSummaries(userId, page, limit);
}

@SubscribeMessage('get_conversation')
async handleConversation(
  @MessageBody()
  data: {
    userId: string;
    chatPartnerId: string;
    page?: number;
    limit?: number;
  },
) {
  const { userId, chatPartnerId, page = 1, limit = 50 } = data;
  return await this.chatService.getConversation(userId, chatPartnerId, limit, page);
}

}
