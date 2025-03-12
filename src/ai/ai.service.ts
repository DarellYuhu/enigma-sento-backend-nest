import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AiService {
  constructor(private readonly httpService: HttpService) {}
  o;
  async embeddingText(txt: string) {
    const { data } = await firstValueFrom(
      this.httpService.post<number[][]>('http://localhost:8080/embed', {
        inputs: txt,
      }),
    );
    return data[0];
  }

  async embeddingImage(payload: { uri?: string; text?: string }) {
    const { data } = await firstValueFrom(
      this.httpService.post<CLIPResponse>('http://localhost:5100/post', {
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
