import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../../entities/file.entity';
import { FilesService } from '../../services/files/files.service';
import { FilesController } from '../../controllers/files/files.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity])],
  providers: [FilesService],
  controllers: [FilesController],
  exports: [FilesService],
})
export class FilesModule {}
