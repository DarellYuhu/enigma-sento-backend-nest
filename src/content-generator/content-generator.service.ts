import { Injectable } from '@nestjs/common';
import { MinioService } from 'src/minio/minio.service';

@Injectable()
export class ContentGeneratorService {
  constructor(private readonly minio: MinioService) {}

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
        await this.minio.removeObject('generated-content', fileName);
        await this.minio.putObject('generated-content', fileName, buff);
      }),
    ).then(() => {
      console.log('Upload finished');
    });
  }
}
