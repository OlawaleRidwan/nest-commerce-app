// src/listeners/send-verification-email.listener.ts
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { UserSignedUpEvent } from '../events/user-signed-up.event';
import { MailService } from '../mail/mail.service';
import { OnEvent } from '@nestjs/event-emitter';

@EventsHandler(UserSignedUpEvent)
export class SendVerificationEmailListener
  implements IEventHandler<UserSignedUpEvent>
{
  constructor(private mailerService: MailService) {}

  // @OnEvent('user.signed_up')
  async handle(event: UserSignedUpEvent) {
    const { email, message } = event;
    console.log('📧 Event received:', event);
    await this.mailerService.sendVerificationMail(email,message);
  }
}
