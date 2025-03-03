async function builder() {
  await Bun.build({
    entrypoints: ['./src/main.ts'],
    format: 'esm',
    outdir: './dist',
    target: 'bun',
    packages: 'bundle',
    sourcemap: 'linked',
    env: 'disable',
    external: [
      '@nestjs/microservices',
      '@nestjs/websockets/socket-module',
      'mock-aws-s3',
      'aws-sdk',
      'nock',
      'class-transformer',
      '@prisma/client',
    ],
  });
}

builder();
