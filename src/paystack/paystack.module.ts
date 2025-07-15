// src/utils/paystack.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PaystackUtil } from './paystack.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [PaystackUtil],
  exports: [PaystackUtil], // Export so it can be used in other modules
})
export class PaystackModule {}
