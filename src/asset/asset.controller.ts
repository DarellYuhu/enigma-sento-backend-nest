import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { GetAllMusicResponseDto } from './dto/get-music.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AddFontRequestDto } from './dto/add-font.dto';
import { AddImageRequestDto } from './dto/add-image.dto';

@Controller('assets')
export class AssetController {
  constructor(private readonly assetService: AssetService) {}

  @Post('musics')
  @UseInterceptors(FilesInterceptor('files'))
  async addMusics(@UploadedFiles() files: Array<Express.Multer.File>) {
    await this.assetService.addMusics(files);
    return { message: 'success' };
  }

  @Get('musics')
  async findAllMusic(): Promise<GetAllMusicResponseDto> {
    const data = await this.assetService.findAllMusic();
    return { message: 'success', data };
  }

  @Post('fonts')
  async addFonts(@Body() payload: AddFontRequestDto) {
    const data = await this.assetService.addFonts(payload);
    return { message: 'success', data };
  }

  @Get('fonts')
  async findAllFont() {
    const data = await this.assetService.findAllFont();
    return { message: 'success', data };
  }

  @Delete('fonts/:id')
  async deleteFont(@Param('id') id: string) {
    await this.assetService.deleteFont(id);
    return { message: 'success' };
  }

  @Get('colors')
  async findAllColor() {
    const data = await this.assetService.findAllColor();
    return { message: 'success', data };
  }

  @Post('colors')
  @UseInterceptors(FileInterceptor('file'))
  async addColors(@UploadedFile() file: Express.Multer.File) {
    await this.assetService.addColors(file);
    return { message: 'success' };
  }

  @Post('repurpose/images')
  async addImages(@Body() addImageRequestDto: AddImageRequestDto) {
    const data = await this.assetService.addImages(addImageRequestDto);
    return { message: 'success', data: { created: data } };
  }

  @Get('repurpose/images')
  async getImages() {
    const data = await this.assetService.getImages();
    return { message: 'success', data };
  }
}
