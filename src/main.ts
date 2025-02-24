import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import metadata from './metadata';

async function bootstrap() {
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

  await SwaggerModule.loadPluginMetadata(metadata);
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  console.log('huhi');
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

  await app.listen(envConfig.get('PORT') ?? 3000);
}
bootstrap();
