import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class AiService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in your env
    });
  }

  async generateReply(prompt: string): Promise<string> {
  try {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });

    return response.choices[0].message?.content || '';
  } catch (error: any) {
    if (error.code === 'insufficient_quota') {
      return 'AI quota exceeded. Please try again later.';
    }
    console.error('AI Error:', error);
    return ' AI error occurred.';
  }
}


}
