import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { config } from './config';
import { WorkgroupModule } from './workgroup/workgroup.module';
import { LoggerMiddleware } from './logger/logger.middleware';
import { GroupDistributionModule } from './group-distribution/group-distribution.module';
import { CollectionModule } from './collection/collection.module';
import { ProjectModule } from './project/project.module';
import { StoryModule } from './story/story.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from './storage/storage.module';
import { AssetModule } from './asset/asset.module';
import { ContentGeneratorModule } from './content-generator/content-generator.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    AuthModule,
    UserModule,
    WorkgroupModule,
    GroupDistributionModule,
    CollectionModule,
    ProjectModule,
    StoryModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST'),
          port: config.get('REDIS_PORT'),
          password: config.get('REDIS_PASSWORD'),
        },
      }),
    }),
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
      load: [config],
      expandVariables: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        dbName: 'enigma-sento',
      }),
    }),
    StorageModule,
    AssetModule,
    ContentGeneratorModule,
  ],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
