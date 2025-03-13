import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  private readonly TEIUri: string;
  private readonly CLIPUri: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
  ) {
    this.TEIUri = this.config.get<string>('TEI_URI');
    this.CLIPUri = this.config.get<string>('CLIP_URI');
  }

  async embeddingText(txt: string) {
    const { data } = await firstValueFrom(
      this.httpService.post<number[][]>(`${this.TEIUri}/embed`, {
        inputs: txt,
      }),
    );
    return data[0];
  }

  async embeddingImage(payload: { uri?: string; text?: string }) {
    const { data } = await firstValueFrom(
      this.httpService.post<CLIPResponse>(`${this.CLIPUri}/post`, {
        data: [payload],
        execEndpoint: '/',
      }),
    );
    return data.data[0].embedding;
  }
}

type CLIPResponse = {
  data: { embedding: number[] }[];
};
