import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import getCommonConfig from './common/configs/common';
import { UserEntity } from './users/user.entity';
import { FileEntity } from './files/file.entity';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [getCommonConfig] }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('database.url'),
        entities: [UserEntity, FileEntity],
        logging: true,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    FilesModule,
  ],
})
export class AppModule {}
