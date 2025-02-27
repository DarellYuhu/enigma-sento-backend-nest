import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { ContentGeneratorService } from './content-generator.service';
import { StoryService } from 'src/story/story.service';

@Injectable()
@Processor('script-queue')
export class ContentGeneratorConsumer extends WorkerHost {
  constructor(
    private readonly story: StoryService,
    private readonly generator: ContentGeneratorService,
  ) {
    super();
  }

  async process(job: Job, token?: string): Promise<any> {
    const { storyId: _, ...data }: GeneratorConfig & { storyId: string } =
      job.data;
    await this.generator.generate(data);
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job) {
    const data = job?.data;
    await this.story.update(data.storyId, {
      generatorStatus: 'FINISHED',
    });
    await Bun.$`rm -rf ${data.basePath}`;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error) {
    console.log(err);
    const data = job?.data;
    await this.story.update(data?.storyId, { generatorStatus: 'ERROR' });
    await Bun.$`rm -rf ${job?.data.basePath}`;
  }

  @OnWorkerEvent('error')
  onError(error: Error) {
    console.log(error);
  }

  @OnWorkerEvent('stalled')
  onStalled() {
    console.log('stalled');
  }
}
