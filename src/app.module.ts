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

@Module({
  imports: [
    AuthModule,
    UserModule,
    WorkgroupModule,
    GroupDistributionModule,
    CollectionModule,
    ProjectModule,
    StoryModule,
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
  ],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
