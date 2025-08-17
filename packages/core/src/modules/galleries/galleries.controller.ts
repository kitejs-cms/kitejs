import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { GalleriesService } from './services/galleries.service';
import { CreateGalleryDto } from './dto/create-gallery.dto';

@Controller('galleries')
export class GalleriesController {
  constructor(private readonly galleriesService: GalleriesService) {}

  @Get()
  findAll() {
    return { data: this.galleriesService.findAll() };
  }

  @Post()
  create(@Body() dto: CreateGalleryDto) {
    return { data: this.galleriesService.create(dto) };
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    this.galleriesService.remove(id);
    return { data: true };
  }

  @Patch('order')
  reorder(@Body('order') order: string[]) {
    this.galleriesService.reorder(order);
    return { data: true };
  }
}
