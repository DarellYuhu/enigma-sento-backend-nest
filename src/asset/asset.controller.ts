import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { AssetService } from './asset.service';
import { GetAllMusicResponseDto } from './dto/get-music.dto';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AddFontRequestDto } from './dto/add-font.dto';
import { AddRepImageRequestDto } from './dto/add-rep-image.dto';
import { AddVideoRequestDto } from './dto/add-video.dto';
import { AddBannerRequestDto } from './dto/add-banner.dto';
import { AddImageRequestDto } from './dto/add-image.dto';
import { GetImagesDto } from './dto/get-images.dto';

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

  @Post('images')
  async addImages(@Body() addImageRequestDto: AddImageRequestDto) {
    const data = await this.assetService.addImages(addImageRequestDto);
    return { message: 'success', data: { created: data } };
  }

  @Get('images')
  async getImages(
    @Query('search') search: string,
    @Query('collectionId') collectionId: string,
  ): Promise<GetImagesDto> {
    const data = await this.assetService.getImages({
      query: search,
      collectionId,
    });
    return { message: 'success', data };
  }

  @Post('repurpose/images')
  async addRepImages(@Body() addRepImageRequestDto: AddRepImageRequestDto) {
    const data = await this.assetService.addRepImages(addRepImageRequestDto);
    return { message: 'success', data: { created: data } };
  }

  @Get('repurpose/images')
  async getRepImages() {
    const data = await this.assetService.getRepImages();
    return { message: 'success', data };
  }

  @Post('repurpose/videos')
  async addVideos(@Body() addVideoRequestDto: AddVideoRequestDto) {
    const data = await this.assetService.addVideos(addVideoRequestDto);
    return { message: 'success', data: { created: data } };
  }

  @Get('repurpose/videos')
  async getVideos() {
    const data = await this.assetService.getVideos();
    return { message: 'success', data };
  }

  @Post('repurpose/banners')
  async addBanners(@Body() addBannerRequestDto: AddBannerRequestDto) {
    const data = await this.assetService.addBanners(addBannerRequestDto);
    return { message: 'success', data: { created: data } };
  }

  @Get('repurpose/banners')
  async getBanners() {
    const data = await this.assetService.getBanners();
    return { message: 'success', data };
  }
}
