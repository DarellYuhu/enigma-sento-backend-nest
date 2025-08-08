import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WorkgroupModule } from './workgroup/workgroup.module';
import { LoggerMiddleware } from './core/logger/logger.middleware';
import { GroupDistributionModule } from './group-distribution/group-distribution.module';
import { CollectionModule } from './collection/collection.module';
import { ProjectModule } from './project/project.module';
import { StoryModule } from './story/story.module';
import { MongooseModule } from '@nestjs/mongoose';
import { StorageModule } from './storage/storage.module';
import { AssetModule } from './asset/asset.module';
import { ContentGeneratorModule } from './content-generator/content-generator.module';
import { BullModule } from '@nestjs/bullmq';
import { TaskModule } from './task/task.module';
import { AiModule } from './core/ai/ai.module';
import { QdrantModule } from './core/qdrant/qdrant.module';
import { ProposalModule } from './proposal/proposal.module';
import { LayoutModule } from './layout/layout.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { LayoutGroupModule } from './layout-group/layout-group.module';
import { ScheduleModule } from '@nestjs/schedule';
import { FolderModule } from './folder/folder.module';
import { BundleModule } from './bundle/bundle.module';
import { MinioS3Module } from './core/minio-s3/minio-s3.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    WorkgroupModule,
    GroupDistributionModule,
    CollectionModule,
    ProjectModule,
    StoryModule,
    StorageModule,
    AssetModule,
    ContentGeneratorModule,
    TaskModule,
    AiModule,
    QdrantModule,
    ProposalModule,
    LayoutModule,
    PrismaModule,
    LayoutGroupModule,
    FolderModule,
    BundleModule,
    MinioS3Module,
    ScheduleModule.forRoot(),
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
      envFilePath: ['.env.development', '.env.staging', '.env.production'],
      isGlobal: true,
      expandVariables: true,
      ignoreEnvFile: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
        dbName: 'enigma-sento',
      }),
    }),
  ],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
