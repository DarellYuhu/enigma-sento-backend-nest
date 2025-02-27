import { Inject, Injectable } from '@nestjs/common';
import { S3Client } from 'bun';

@Injectable()
export class ContentGeneratorService {
  constructor(@Inject('S3_CLIENT') private minioS3: S3Client) {}

  async generate(config: GeneratorConfig) {
    await Bun.write(`${config.basePath}/config.json`, JSON.stringify(config));
    await Bun.$`python --version`;
    await Bun.$`python scripts/carousels.py ${config.basePath}/config.json`;
    console.log('Finished "scripts/carousels.py"');
    const outputFile = Bun.file(`${config.basePath}/out.json`);
    const { files }: { files: string[] } = await outputFile.json();
    await Promise.all(
      files.map(async (path) => {
        const bunFile = Bun.file(path);
        const arrBuff = await bunFile.arrayBuffer();
        const buff = Buffer.from(arrBuff);
        const fileName = path.replace(config.basePath, '');
        await this.minioS3.delete(fileName, { bucket: 'generated-content' });
        await this.minioS3.write(fileName, buff, {
          bucket: 'generated-content',
          type: bunFile.type,
        });
      }),
    ).then(() => {
      console.log('Upload finished');
    });
  }
}
