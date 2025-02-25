import { Logger, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config';
import { WorkgroupModule } from './workgroup/workgroup.module';
import { LoggerMiddleware } from './logger/logger.middleware';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
      load: [config],
      expandVariables: true,
    }),

    WorkgroupModule,
  ],
  controllers: [AppController],
  providers: [Logger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
