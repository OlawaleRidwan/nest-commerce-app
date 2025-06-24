// src/mail/mail.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get('NODE_CODE_SENDING_EMAIL_ADDRESS'),
        pass: this.configService.get('NODE_CODE_SENDING_EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationMail(email: string,message: string) {
    
    this.transporter.verify(function (error, success) {
        if (error) {
            console.log("SMTP Connection Error:", error);
        } else {
            console.log("SMTP Connection Verified");
        }
    });
    
    await this.transporter.sendMail({
      from: `"My App" <${this.configService.get('NODE_CODE_SENDING_EMAIL_ADDRESS')}>`,
      to: email,
      subject: 'Email Verification',
      text: `${message}`,
      html: `<p>$${message}</p>`,
    });
  }
}
