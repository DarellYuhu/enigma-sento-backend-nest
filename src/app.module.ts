import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { config } from './config';

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
  ],
  controllers: [AppController],
  providers: [PrismaService],
})
export class AppModule {}
