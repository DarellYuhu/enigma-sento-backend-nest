import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import metadata from './metadata';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  await Bun.$`pwd`;
  const app = await NestFactory.create(AppModule);

  const envConfig = app.get(ConfigService);
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enigma Sento API')
    .setVersion('1.0')
    .addSecurity('Bearer', {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
    .build();

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: envConfig.get('ALLOWED_ORIGINS').split(','),
    exposedHeaders: ['Content-Disposition'],
  });
  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  app.use(
    '/reference',
    apiReference({
      theme: 'saturn',
      layout: 'classic',
      spec: {
        url: '/api-json',
      },
    }),
  );

  await app.listen(envConfig.get('NEW_PORT') ?? 3000);
}
bootstrap().catch(console.error);
