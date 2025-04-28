// src/modules/moderation/smart-moderation.service.ts

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import OpenAI from 'openai';

@Injectable()
export class SmartModerationService {
  private readonly logger = new Logger(SmartModerationService.name);
  private readonly openai: OpenAI;

  constructor(private readonly httpService: HttpService) {
    this.openai = new OpenAI({
      baseURL: 'https://api.openai.com/v1/chat/completions',
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async moderateText(text: string): Promise<boolean> {
    const prompt = this.buildModerationPrompt(text);

    try {
      const result = await this.sendModerationRequest(prompt);
      this.logger.debug(`Moderation result: ${result}`);

      return this.isContentSafe(result);
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  private buildModerationPrompt(text: string): string {
    return `
    متن زیر را بررسی کن و اگر حاوی توهین، خشونت، فحاشی، کلاهبرداری، تبلیغات غیرمجاز یا هر محتوای نامناسب بود، فقط پاسخ بده "BAD".
    اگر متن مشکلی نداشت، فقط پاسخ بده "OK".

    متن:
    """${text}"""
    `;
  }

  private async sendModerationRequest(prompt: string): Promise<string> {

    const res=await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    })

 

    this.logger.debug(`DeepSeek API raw response: ${JSON.stringify(res)}`);

    const aiResponse = res?.choices?.[0]?.message?.content?.trim() ?? 'BAD';
    console.log(aiResponse);
    
    return aiResponse;
  }

  private isContentSafe(aiResponse: string): boolean {
    return aiResponse.toLowerCase() === 'ok';
  }

  private handleError(error: unknown): void {
    if (error instanceof AxiosError) {
      this.logger.error(
        `Moderation API Error: ${error.response?.status} ${JSON.stringify(error.response?.data)}`,
      );
    } else if (error instanceof Error) {
      this.logger.error(`Unexpected Error: ${error.message}`);
    } else {
      this.logger.error(`Unknown error during content moderation`);
    }
  }
}
