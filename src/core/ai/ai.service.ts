import { HttpService } from '@nestjs/axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private TEIUri: string;
  private CLIPUri: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.TEIUri = this.config.get<string>('TEI_URI');
    this.CLIPUri = this.config.get<string>('CLIP_URI');
  }

  async embeddingText(txt: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<number[][]>(`${this.TEIUri}/embed`, {
          inputs: txt,
        }),
      );
      return data[0];
    } catch {
      throw new InternalServerErrorException('Text embedding error');
    }
  }

  async embeddingImage(payload: { uri?: string; text?: string }) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<CLIPResponse>(`${this.CLIPUri}/post`, {
          data: [payload],
          execEndpoint: '/',
        }),
      );
      return data.data[0].embedding;
    } catch {
      throw new InternalServerErrorException('Image embedding error');
    }
  }
}

type CLIPResponse = {
  data: { embedding: number[] }[];
};
